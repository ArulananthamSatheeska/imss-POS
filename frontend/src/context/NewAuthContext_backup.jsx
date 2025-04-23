import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { initializeApi, getApi } from '../services/api';

export const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize API and load user on app start
    useEffect(() => {
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
        }

        // Initialize API with refreshToken function
        initializeApi(refreshToken);
        setIsLoading(false);
    }, []);

    const login = async (credentials) => {
        try {
            console.log('Attempting login with credentials:', {
                email: credentials.email,
                password: '***REDACTED***'
            });

            const apiClient = getApi();
            const response = await apiClient.post('login', {
                email: credentials.email,
                password: credentials.password
            });

            if (!response.data?.access_token || !response.data?.user) {
                throw new Error('Invalid response from server');
            }

            if (!response.data.user.is_active) {
                throw new Error('Your account is inactive. Please contact an administrator.');
            }

            const userData = {
                ...response.data.user,
                token: response.data.access_token,
                is_active: response.data.user.is_active
            };

            if (credentials.rememberMe) {
                localStorage.setItem('user', JSON.stringify(userData));
            } else {
                sessionStorage.setItem('user', JSON.stringify(userData));
            }

            setUser(userData);
            return userData;

        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
    };

    const refreshToken = useCallback(async (oldToken) => {
        try {
            const apiClient = getApi();
            const response = await apiClient.post('refresh-token', { token: oldToken });

            if (!response.data || !response.data.access_token) {
                throw new Error('Token refresh failed');
            }

            const newToken = response.data.access_token;

            // Update user token in state and storage
            const updatedUser = { ...user, token: newToken };
            setUser(updatedUser);

            if (localStorage.getItem('user')) {
                localStorage.setItem('user', JSON.stringify(updatedUser));
            } else {
                sessionStorage.setItem('user', JSON.stringify(updatedUser));
            }

            return newToken;
        } catch (error) {
            console.error('Token refresh error:', error);
            throw error;
        }
    }, [user]);

    const value = {
        user,
        login,
        logout,
        refreshToken,
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
