// contexts/RegisterContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
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

    // Generate or retrieve terminalId from localStorage
    const getTerminalId = () => {
        let terminalId = localStorage.getItem('terminalId');
        if (!terminalId) {
            terminalId = uuidv4();
            localStorage.setItem('terminalId', terminalId);
        }
        return terminalId;
    };

    const terminalId = getTerminalId();

    const openRegister = async (amount, userId) => {
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
                // Do not throw error to prevent unhandled promise rejection
                return;
            } else {
                console.error('Failed to open register:', error);
                alert('Failed to open register. Please try again.');
                throw error;
            }
        }
    };

    const closeRegister = async (closingDetails) => {
        try {
            if (!registerStatus.registerId) {
                throw new Error('No open register session to close.');
            }
            const response = await axios.post('/api/register/close', {
                register_id: registerStatus.registerId,
                closing_cash: closingDetails.inCashierAmount,
                closing_details: Array.isArray(closingDetails) ? closingDetails : [],
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
                alert('Failed to close register: Validation error. Please check the input values.');
            } else {
                console.error('Failed to close register:', error);
                alert('Failed to close register. Please try again.');
            }
            throw error;
        }
    };

    useEffect(() => {
        const fetchRegisterStatus = async () => {
            try {
                // Fetch user info from API instead of localStorage
                const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
                const token = storedUser ? JSON.parse(storedUser).token : null;
                const userResponse = await axios.get('/api/me', {
                    headers: {
                        Authorization: token ? `Bearer ${token}` : '',
                    },
                });
                console.log('User API response:', userResponse.data);
                // Adjust userId extraction if nested inside 'user' object
                const userId = userResponse.data?.user?.id ?? userResponse.data?.id;
                console.log('Extracted userId:', userId);
                if (!userId) {
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
                    return;
                }
                console.log('Terminal ID:', terminalId);
                console.log('Register status request params:', { user_id: userId, terminal_id: terminalId });
                const response = await axios.get('/api/register/status', {
                    params: {
                        user_id: userId,
                        terminal_id: terminalId,
                    },
                    headers: {
                        Authorization: token ? `Bearer ${token}` : '',
                    },
                });
                if (response.status === 200) {
                    const data = response.data;
                    if (data.status === 'open' && data.register) {
                        setRegisterStatus({
                            isOpen: true,
                            cashOnHand: data.register.cash_on_hand,
                            openedAt: new Date(data.register.opened_at),
                            closedAt: data.register.closed_at ? new Date(data.register.closed_at) : null,
                            userId: data.register.user_id,
                            registerId: data.register.id,
                            terminalId: data.register.terminal_id,
                        });
                        localStorage.setItem('registerStatus', JSON.stringify({
                            isOpen: true,
                            cashOnHand: data.register.cash_on_hand,
                            openedAt: data.register.opened_at,
                            userId: data.register.user_id,
                            registerId: data.register.id,
                            terminalId: data.register.terminal_id,
                        }));
                    } else {
                        // If no open register from API, fallback to localStorage
                        const savedStatus = localStorage.getItem('registerStatus');
                        if (savedStatus) {
                            const parsed = JSON.parse(savedStatus);
                            if (parsed.isOpen) {
                                setRegisterStatus({
                                    ...parsed,
                                    openedAt: new Date(parsed.openedAt),
                                });
                                return;
                            }
                        }
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
                }
            } catch (error) {
                console.error('Failed to fetch register status:', error);
                // fallback to localStorage
                const savedStatus = localStorage.getItem('registerStatus');
                if (savedStatus) {
                    const parsed = JSON.parse(savedStatus);
                    setRegisterStatus({
                        ...parsed,
                        openedAt: new Date(parsed.openedAt),
                    });
                }
            }
        };

        fetchRegisterStatus();
    }, [terminalId]);

    return (
        <RegisterContext.Provider value={{ registerStatus, openRegister, closeRegister }}>
            {children}
        </RegisterContext.Provider>
    );
};

export const useRegister = () => useContext(RegisterContext);
