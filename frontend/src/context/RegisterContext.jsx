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

    const getTerminalId = useCallback(() => {
        let terminalId = localStorage.getItem('terminalId');
        if (!terminalId) {
            terminalId = `TERM-${uuidv4().substr(0, 8)}`;
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
                setLoading(false);
                return;
            }

            const user = JSON.parse(storedUser);
            const response = await axios.get('/api/register/status', {
                params: { user_id: user.id },
                headers: {
                    Authorization: user.token ? `Bearer ${user.token}` : '',
                },
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
                    terminalId: terminalId // Keep terminalId for reopening
                }));
                localStorage.removeItem('registerStatus');
            }
        } catch (error) {
            console.error('Failed to fetch register status:', error);
            const savedStatus = localStorage.getItem('registerStatus');
            if (savedStatus) {
                setRegisterStatus(JSON.parse(savedStatus));
            }
        } finally {
            setLoading(false);
        }
    }, []);
    const openRegister = async (amount, userId) => {
        setLoading(true);
        try {
            console.log('openRegister called with:', { amount, userId, terminalId });
            const response = await axios.post('/api/register/open', {
                user_id: userId,
                terminal_id: terminalId,
                opening_cash: amount,
            });
            console.log('openRegister response:', response);

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
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to open register:', error);
            if (error.response) {
                console.error('Error response data:', error.response.data);
            }

            let errorMessage = 'Failed to open register. Please try again.';
            if (error.response) {
                if (error.response.status === 409) {
                    errorMessage = 'A register session is already open for this user and terminal.';
                } else if (error.response.status === 422) {
                    errorMessage = 'Validation failed: Please ensure your user account exists and the data is correct.';
                } else if (error.response.data?.message) {
                    errorMessage = error.response.data.message;
                }
            }

            alert(errorMessage);
            return false;
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
