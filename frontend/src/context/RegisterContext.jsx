// contexts/RegisterContext.jsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Set axios base URL (should be in environment variable)
axios.defaults.baseURL = 'http://localhost:8000';

const RegisterContext = createContext();

export const RegisterProvider = ({ children }) => {
    const [registerStatus, setRegisterStatus] = useState({
        isOpen: false,
        cashOnHand: 0,
        openedAt: null,
        closedAt: null,
        userId: null,
        registerId: null,
        terminalId: null,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getTerminalId = useCallback(() => {
        let terminalId = localStorage.getItem('terminalId');
        if (!terminalId) {
            terminalId = `TERM-${uuidv4().substr(0, 8)}`;
            localStorage.setItem('terminalId', terminalId);
        }
        return terminalId;
    }, []);

    const terminalId = getTerminalId();

    const getAuthHeaders = useCallback(() => {
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (!storedUser) return {};

        const user = JSON.parse(storedUser);

        // Check if token is expired (optional)
        const isTokenExpired = (token) => {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const exp = payload.exp;
                if (!exp) return false;
                return Date.now() >= exp * 1000;
            } catch (e) {
                return false;
            }
        };

        if (isTokenExpired(user.token)) {
            // Token expired, clear storage and redirect to login
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
            window.location.href = '/login';
            return {};
        }

        return {
            headers: {
                Authorization: `Bearer ${user.token}`,
                'Content-Type': 'application/json',
            }
        };
    }, []);

    // Add axios interceptor to handle 401 errors globally
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            response => response,
            error => {
                if (error.response && error.response.status === 401) {
                    // Unauthorized, clear storage and redirect to login
                    localStorage.removeItem('user');
                    sessionStorage.removeItem('user');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    const fetchRegisterStatus = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
            if (!storedUser) {
                setRegisterStatus(prev => ({
                    ...prev,
                    isOpen: false,
                    cashOnHand: 0,
                    openedAt: null,
                    closedAt: null,
                    userId: null,
                    registerId: null,
                    terminalId: null
                }));
                return;
            }

            const user = JSON.parse(storedUser);
            const response = await axios.get('/api/register/status', {
                params: { user_id: user.id },
                ...getAuthHeaders()
            });

            if (response.data.status === 'open' && response.data.register) {
                const register = response.data.register;
                const newStatus = {
                    isOpen: true,
                    cashOnHand: register.cash_on_hand,
                    openedAt: new Date(register.opened_at),
                    closedAt: register.closed_at ? new Date(register.closed_at) : null,
                    userId: register.user_id,
                    registerId: register.id,
                    terminalId: register.terminal_id,
                    totalSales: Number(register.total_sales) || 0,
                    totalSalesQty: Number(register.total_sales_qty) || 0,
                    openingCash: Number(register.opening_cash) || 0,
                };

                setRegisterStatus(newStatus);
                localStorage.setItem('registerStatus', JSON.stringify(newStatus));
            } else {
                setRegisterStatus(prev => ({
                    ...prev,
                    isOpen: false,
                    cashOnHand: 0,
                    openedAt: null,
                    closedAt: null,
                    userId: null,
                    registerId: null,
                    terminalId: terminalId
                }));
                localStorage.removeItem('registerStatus');
            }
        } catch (error) {
            console.error('Failed to fetch register status:', error);
            setError(error.response?.data?.message || 'Failed to fetch register status');

            // Fallback to local storage if API fails
            const savedStatus = localStorage.getItem('registerStatus');
            if (savedStatus) {
                setRegisterStatus(JSON.parse(savedStatus));
            }
        } finally {
            setLoading(false);
        }
    }, [getAuthHeaders, terminalId]);

    const openRegister = async ({ user_id, terminal_id, opening_cash }) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post('/api/register/open', {
                user_id: user_id,
                terminal_id: terminal_id,
                opening_cash: opening_cash,
            }, getAuthHeaders());

            if (response.status === 201) {
                const register = response.data.register;
                const newStatus = {
                    isOpen: true,
                    cashOnHand: register.cash_on_hand,
                    openedAt: new Date(register.opened_at),
                    closedAt: null,
                    userId: register.user_id,
                    registerId: register.id,
                    terminalId: register.terminal_id,
                };

                setRegisterStatus(newStatus);
                localStorage.setItem('registerStatus', JSON.stringify(newStatus));
                return { success: true, register: newStatus };
            }
            return { success: false };
        } catch (error) {
            let errorMessage = 'Failed to open register. Please try again.';

            if (error.response) {
                if (error.response.status === 409) {
                    errorMessage = 'A register session is already open for this user and terminal.';
                } else if (error.response.status === 422) {
                    errorMessage = Object.values(error.response.data.errors).join(' ');
                } else if (error.response.data?.message) {
                    errorMessage = error.response.data.message;
                }
            }

            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const closeRegister = async (closingDetails) => {
        setLoading(true);
        setError(null);
        try {
            if (!registerStatus.registerId) {
                throw new Error('No open register session to close.');
            }

            const response = await axios.post('/api/register/close', {
                register_id: registerStatus.registerId,
                closing_balance: closingDetails.inCashierAmount,
                actual_cash: closingDetails.inCashierAmount,
            }, getAuthHeaders());

            if (response.status === 200) {
                const register = response.data.register;
                const totalSales = response.data.total_sales;
                const totalSalesQty = response.data.total_sales_qty;
                const openingCash = response.data.opening_cash;
                const closingTime = response.data.closing_time;
                const notes = response.data.notes;

                setRegisterStatus({
                    isOpen: false,
                    cashOnHand: 0,
                    openedAt: null,
                    closedAt: closingTime ? new Date(closingTime) : null,
                    userId: null,
                    registerId: null,
                    terminalId: null,
                    totalSales: totalSales,
                    totalSalesQty: totalSalesQty,
                    openingCash: openingCash,
                    notes: notes,
                });
                localStorage.removeItem('registerStatus');
                return { success: true, totalSales, totalSalesQty, openingCash, closingTime, notes };
            }
            return { success: false };
        } catch (error) {
            let errorMessage = 'Failed to close register. Please try again.';

            if (error.response) {
                if (error.response.status === 422) {
                    errorMessage = Object.values(error.response.data.errors).join(' ');
                } else if (error.response.data?.message) {
                    errorMessage = error.response.data.message;
                }
            }

            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const refreshRegisterStatus = useCallback(() => {
        fetchRegisterStatus();
    }, [fetchRegisterStatus]);

    useEffect(() => {
        fetchRegisterStatus();
    }, [fetchRegisterStatus]);

    return (
        <RegisterContext.Provider value={{
            registerStatus,
            openRegister,
            closeRegister,
            loading,
            error,
            refreshRegisterStatus,
            terminalId,
            getAuthHeaders
        }}>
            {children}
        </RegisterContext.Provider>
    );
};

export const useRegister = () => useContext(RegisterContext);
