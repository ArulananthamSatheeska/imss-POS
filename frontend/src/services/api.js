import axios from "axios";

class ApiError extends Error {
    constructor(message, status, code, details) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }

    toJSON() {
        return {
            error: {
                message: this.message,
                status: this.status,
                code: this.code,
                details: this.details,
                timestamp: this.timestamp,
            },
        };
    }
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Configuration constants
const API_URL = "http://localhost:8000/api";
const DEFAULT_TIMEOUT = 10000;

console.log('API Configuration:', {
    API_URL,
    DEFAULT_TIMEOUT,
    ENV: process.env.NODE_ENV
});

const createApiInstance = (refreshToken) => {
    const api = axios.create({
        baseURL: API_URL,
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest"
        },
        timeout: DEFAULT_TIMEOUT,
    });

    api.interceptors.request.use(
        (config) => {
            if (config.url.includes('/login')) {
                return config;
            }

            const userData = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
            console.debug('User data for request:', {
                url: config.url,
                hasToken: !!userData?.token,
                storage: localStorage.getItem('user') ? 'local' : sessionStorage.getItem('user') ? 'session' : 'none'
            });
            if (userData?.token) {
                config.headers.Authorization = `Bearer ${userData.token}`;
                console.debug('Request headers:', config.headers);
            }
            return config;
        },
        (error) => {
            return Promise.reject(new ApiError("Request configuration failed", 500, "REQUEST_CONFIG_ERROR", { originalError: error.message }));
        }
    );

    api.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                console.log('Attempting token refresh for 401 error...');

                try {
                    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
                    if (storedUser) {
                        const user = JSON.parse(storedUser);

                        if (user?.is_active === false) {
                            throw new Error('User account is inactive');
                        }

                        if (user?.token) {
                            const newToken = await refreshToken(user.token);
                            user.token = newToken;

                            if (localStorage.getItem('user')) {
                                localStorage.setItem('user', JSON.stringify(user));
                            } else {
                                sessionStorage.setItem('user', JSON.stringify(user));
                            }
                            console.log('Token updated in storage');

                            originalRequest.headers.Authorization = `Bearer ${newToken}`;
                            return api(originalRequest);
                        }
                    }
                } catch (refreshError) {
                    console.error('Token refresh failed:', refreshError);
                    localStorage.removeItem('user');
                    sessionStorage.removeItem('user');

                    const errorMessage = refreshError.message.includes('inactive')
                        ? 'Your account is inactive. Please contact an administrator.'
                        : 'Session expired, please login again';

                    window.location.href = `/login?error=${encodeURIComponent(errorMessage)}`;
                    return Promise.reject(new ApiError(errorMessage, 401, 'AUTH_ERROR'));
                }

                localStorage.removeItem('user');
                sessionStorage.removeItem('user');
                window.location.href = '/login?error=Session expired, please login again';
                return Promise.reject(new ApiError('Session expired, please login again', 401, 'SESSION_EXPIRED'));
            }

            if (!error.response) {
                console.error('Network error details:', {
                    message: error.message,
                    code: error.code,
                    config: {
                        url: error.config?.url,
                        method: error.config?.method,
                        baseURL: error.config?.baseURL
                    }
                });
                return Promise.reject(new ApiError("Network error, please check your connection", 0, "NETWORK_ERROR", {
                    originalError: error.message,
                    code: error.code
                }));
            }

            const { status, data } = error.response;
            let errorMessage = "An error occurred";
            let errorCode = "UNKNOWN_ERROR";
            let errorDetails = {};

            if (status >= 500) {
                errorMessage = "Server error, please try again later";
                errorCode = "SERVER_ERROR";
            } else if (status === 400) {
                errorMessage = data.message || "Invalid request";
                errorCode = "VALIDATION_ERROR";
                errorDetails = data.errors || {};
            } else if (status === 403) {
                errorMessage = "You don't have permission to perform this action";
                errorCode = "PERMISSION_DENIED";
            } else if (status === 404) {
                errorMessage = "The requested resource was not found";
                errorCode = "NOT_FOUND";
            }

            return Promise.reject(new ApiError(errorMessage, status, errorCode, errorDetails));
        }
    );

    return api;
};

const requestWithRetry = async (api, requestFn, endpoint, data = null) => {
    let retryCount = 0;
    let lastError = null;

    while (retryCount < MAX_RETRIES) {
        try {
            const response = await (data ? requestFn(endpoint, data) : requestFn(endpoint));
            return response.data;
        } catch (error) {
            lastError = error;

            if (error.status && [400, 401, 403, 404].includes(error.status)) {
                break;
            }

            retryCount++;
            if (retryCount < MAX_RETRIES) {
                console.warn(`Retrying request (${retryCount}/${MAX_RETRIES}) to ${endpoint}`);
                await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * retryCount));
            }
        }
    }

    console.error(`API request failed after ${retryCount} retries to ${endpoint}:`, lastError);
    throw lastError;
};

export const createApiClient = (refreshToken) => {
    const api = createApiInstance(refreshToken);

    return {
        getData: async (endpoint) => requestWithRetry(api, api.get, endpoint),
        postData: async (endpoint, data) => requestWithRetry(api, api.post, endpoint, data),
        putData: async (endpoint, data) => requestWithRetry(api, api.put, endpoint, data),
        deleteData: async (endpoint) => requestWithRetry(api, api.delete, endpoint),
        api
    };
};

let defaultApiClient = null;

export const initializeApi = (refreshToken) => {
    defaultApiClient = createApiClient(refreshToken);
    return defaultApiClient;
};

export const getData = (endpoint) => {
    if (!defaultApiClient) throw new Error('API not initialized. Call initializeApi first.');
    return defaultApiClient.getData(endpoint);
};

export const postData = (endpoint, data) => {
    if (!defaultApiClient) throw new Error('API not initialized. Call initializeApi first.');
    return defaultApiClient.postData(endpoint, data);
};

export const putData = (endpoint, data) => {
    if (!defaultApiClient) throw new Error('API not initialized. Call initializeApi first.');
    return defaultApiClient.putData(endpoint, data);
};

export const deleteData = (endpoint) => {
    if (!defaultApiClient) throw new Error('API not initialized. Call initializeApi first.');
    return defaultApiClient.deleteData(endpoint);
};

export const getApi = () => {
    if (!defaultApiClient) throw new Error('API not initialized. Call initializeApi first.');
    return defaultApiClient.api;
};
