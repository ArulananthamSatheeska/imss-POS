import api from './api';

const getStoredUser = () => {
    const localUser = localStorage.getItem('user');
    const sessionUser = sessionStorage.getItem('user');
    return JSON.parse(localUser || sessionUser || 'null');
};

const setStoredUser = (user, rememberMe = true) => {
    const userData = JSON.stringify(user);
    if (rememberMe) {
        localStorage.setItem('user', userData);
    } else {
        sessionStorage.setItem('user', userData);
    }
};

const removeStoredUser = () => {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
};

const login = async (credentials) => {
    const response = await api.post('/login', credentials);
    if (response.data.token && response.data.user) {
        const user = {
            ...response.data.user,
            token: response.data.token
        };
        setStoredUser(user, credentials.rememberMe);
    }
    return response.data;
};

const register = async (userData) => {
    const response = await api.post('/register', userData);
    if (response.data.token && response.data.user) {
        const user = {
            ...response.data.user,
            token: response.data.token
        };
        setStoredUser(user, true); // default: remember new user
    }
    return response.data;
};

const logout = async () => {
    const user = getStoredUser();
    try {
        if (user?.token) {
            await api.post('/logout', {}, {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            });
        }
    } catch (error) {
        console.error('Logout error:', error?.response || error);
    }
    removeStoredUser();
};

const getCurrentUser = async () => {
    const user = getStoredUser();
    if (!user?.token) return null;

    try {
        const response = await api.get('/me', {
            headers: {
                Authorization: `Bearer ${user.token}`
            }
        });
        return response.data;
    } catch (error) {
        if (error.response?.status === 401) {
            removeStoredUser();
        }
        return null;
    }
};

const refreshToken = async () => {
    const user = getStoredUser();
    if (!user?.token) throw new Error('No token to refresh');

    try {
        const response = await api.post('/refresh-token', { token: user.token });

        if (response.data.access_token) {
            user.token = response.data.access_token;
            setStoredUser(user, !!localStorage.getItem('user'));
            return user.token;
        } else {
            throw new Error('Invalid refresh response');
        }
    } catch (error) {
        console.error('Token refresh failed:', error);
        removeStoredUser();
        throw error;
    }
};

export default {
    login,
    register,
    logout,
    getCurrentUser,
    refreshToken,
    getStoredUser
};
