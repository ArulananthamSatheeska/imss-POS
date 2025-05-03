// contexts/RegisterContext.jsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Set axios base URL explicitly to localhost
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

    // Generate or retrieve terminalId from localStorage
    const getTerminalId = useCallback(() => {
        let terminalId = localStorage.getItem('terminalId');
        if (!terminalId) {
            terminalId = uuidv4();
            localStorage.setItem('terminalId', terminalId);
        }
        return terminalId;
    }, []);

    const terminalId = getTerminalId();

    // In RegisterContext.jsx

const fetchRegisterStatus = useCallback(async () => {
    setLoading(true);
    try {
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (!storedUser) {
            setRegisterStatus({
                isOpen: false,
                cashOnHand: 0,
                openedAt: null,
                closedAt: null,
                userId: null,
                registerId: null,
                terminalId: null,
            });
            setLoading(false);
            return;
        }

        const user = JSON.parse(storedUser);
        const userId = user.id;

        const response = await axios.get('/api/register/status', {
            params: { user_id: userId },
            headers: {
                Authorization: user.token ? `Bearer ${user.token}` : '',
            },
        });

        if (response.data.status === 'open' && response.data.register) {
            const register = response.data.register;
            setRegisterStatus({
                isOpen: true,
                cashOnHand: register.cash_on_hand,
                openedAt: new Date(register.opened_at),
                closedAt: register.closed_at ? new Date(register.closed_at) : null,
                userId: register.user_id,
                registerId: register.id,
                terminalId: register.terminal_id,
            });
            localStorage.setItem('registerStatus', JSON.stringify({
                isOpen: true,
                cashOnHand: register.cash_on_hand,
                openedAt: register.opened_at,
                userId: register.user_id,
                registerId: register.id,
                terminalId: register.terminal_id,
            }));
        } else {
            // Clear any stale register status
            setRegisterStatus({
                isOpen: false,
                cashOnHand: 0,
                openedAt: null,
                closedAt: null,
                userId: null,
                registerId: null,
                terminalId: null,
            });
            localStorage.removeItem('registerStatus');
        }
    } catch (error) {
        console.error('Failed to fetch register status:', error);
        // Fallback to localStorage if API fails
        const savedStatus = localStorage.getItem('registerStatus');
        if (savedStatus) {
            const parsed = JSON.parse(savedStatus);
            setRegisterStatus({
                ...parsed,
                openedAt: new Date(parsed.openedAt),
            });
        }
    } finally {
        setLoading(false);
    }
}, []);

    const openRegister = async (amount, userId) => {
        setLoading(true);
        try {
            const response = await axios.post('/api/register/open', {
                user_id: userId,
                terminal_id: terminalId,
                opening_cash: amount,
            });
            if (response.status === 201) {
                const register = response.data.register;
                setRegisterStatus({
                    isOpen: true,
                    cashOnHand: register.cash_on_hand,
                    openedAt: new Date(register.opened_at),
                    closedAt: null,
                    userId: register.user_id,
                    registerId: register.id,
                    terminalId: register.terminal_id,
                });
                localStorage.setItem('registerStatus', JSON.stringify({
                    isOpen: true,
                    cashOnHand: register.cash_on_hand,
                    openedAt: register.opened_at,
                    userId: register.user_id,
                    registerId: register.id,
                    terminalId: register.terminal_id,
                }));
            }
        } catch (error) {
            if (error.response && error.response.status === 409) {
                alert('A register session is already open for this user and terminal.');
                return;
            } else {
                console.error('Failed to open register:', error);
                alert('Failed to open register. Please try again.');
                throw error;
            }
        } finally {
            setLoading(false);
        }
    };

    const closeRegister = async (closingDetails) => {
        setLoading(true);
        try {
            if (!registerStatus.registerId) {
                throw new Error('No open register session to close.');
            }
            console.log("closeRegister - closingDetails.inCashierAmount:", closingDetails.inCashierAmount);
            const response = await axios.post('/api/register/close', {
                register_id: registerStatus.registerId,
                closing_cash: closingDetails.inCashierAmount,
                closing_details: {
                    ...closingDetails,
                    otherAmount: closingDetails.otherAmount
                }
            });
            if (response.status === 200) {
                setRegisterStatus({
                    isOpen: false,
                    cashOnHand: 0,
                    openedAt: null,
                    closedAt: new Date(),
                    userId: null,
                    registerId: null,
                    terminalId: null,
                });
                localStorage.removeItem('registerStatus');
            }
        } catch (error) {
            if (error.response && error.response.status === 422) {
                console.error('Validation errors:', error.response.data.errors);
                alert('Failed to close register: Validation error. Please check the input values.');
            } else {
                console.error('Failed to close register:', error);
                alert('Failed to close register. Please try again.');
            }
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Expose a method to refresh register status on demand
    const refreshRegisterStatus = () => {
        fetchRegisterStatus();
    };

    useEffect(() => {
        fetchRegisterStatus();
    }, [fetchRegisterStatus]);

    return (
        <RegisterContext.Provider value={{ registerStatus, openRegister, closeRegister, loading, refreshRegisterStatus }} >
            {children}
        </RegisterContext.Provider>
    );
};

export const useRegister = () => useContext(RegisterContext);
