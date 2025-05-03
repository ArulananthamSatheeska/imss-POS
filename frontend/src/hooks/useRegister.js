// hooks/useRegister.js
import { useState, useEffect } from "react";
import axios from "axios";

export const useRegister = (user) => {
    const [registerStatus, setRegisterStatus] = useState('checking'); // 'open', 'closed', 'checking'
    const [registerData, setRegisterData] = useState(null);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [isClosingRegister, setIsClosingRegister] = useState(false);
    const [cashOnHand, setCashOnHand] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Check register status on initial load and when user changes
    useEffect(() => {
        const fetchRegisterStatus = async () => {
            if (!user?.id) return;

            setLoading(true);
            try {
                const response = await axios.get("/api/register/status", {
                    params: {
                        user_id: user.id,
                        terminal_id: "T-1" // Should be dynamic in real implementation
                    }
                });

                if (response.data.status === 'open') {
                    setRegisterStatus('open');
                    setRegisterData(response.data.register);
                    setCashOnHand(response.data.register.cash_on_hand || "");
                    setShowRegisterModal(false);
                } else {
                    setRegisterStatus('closed');
                    setRegisterData(null);
                    setShowRegisterModal(true);
                }
            } catch (err) {
                console.error("Error fetching register status:", err);
                setError("Failed to fetch register status");
                setRegisterStatus('error');
                setShowRegisterModal(true);
            } finally {
                setLoading(false);
            }
        };

        fetchRegisterStatus();
    }, [user]);

    const openRegister = async (amount) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post("/api/register/open", {
                user_id: user?.id,
                terminal_id: "T-1", // Should be dynamic
                opening_cash: parseFloat(amount)
            });

            if (response.data?.register) {
                setRegisterStatus('open');
                setRegisterData(response.data.register);
                setCashOnHand(response.data.register.cash_on_hand);
                setShowRegisterModal(false);
                return true;
            }
            return false;
        } catch (err) {
            console.error("Error opening register:", err);
            setError(err.response?.data?.message || "Error opening register");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const closeRegister = async ({ inCashierAmount, otherAmount }) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post("/api/register/close", {
                register_id: registerData?.id,
                closing_cash: parseFloat(inCashierAmount),
                closing_details: {
                    other_amount: parseFloat(otherAmount || 0),
                    notes: notes || ""
                }
            });

            if (response.data?.success) {
                generateRegisterReceipt(response.data.register);
                setRegisterStatus('closed');
                setRegisterData(null);
                setShowRegisterModal(false);
                setIsClosingRegister(false);
                return true;
            }
            return false;
        } catch (err) {
            console.error("Error closing register:", err);
            setError(err.response?.data?.message || "Error closing register");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const generateRegisterReceipt = (registerData) => {
        // Implementation remains the same
    };

    const handleLogoutClick = () => {
        if (registerStatus === 'open') {
            setIsClosingRegister(true);
            setShowRegisterModal(true);
            return false;
        }
        return true;
    };

    return {
        registerStatus,
        registerData,
        showRegisterModal,
        isClosingRegister,
        setShowRegisterModal,
        openRegister,
        closeRegister,
        handleLogoutClick,
        cashOnHand,
        setCashOnHand,
        notes,
        setNotes,
        loading,
        error,
    };
};