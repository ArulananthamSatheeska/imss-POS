// hooks/useRegister.js
import { useState, useEffect } from "react";
import axios from "axios";

export const useRegister = (user) => {
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [isClosingRegister, setIsClosingRegister] = useState(false);
    const [cashOnHand, setCashOnHand] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Check register status on initial load from backend API
    useEffect(() => {
        const fetchRegisterStatus = async () => {
            setLoading(true);
            try {
                const response = await axios.get("/api/register/current");
                if (response.data && response.data.isOpen) {
                    setIsRegisterOpen(true);
                    setCashOnHand(response.data.cashOnHand || "");
                    setShowRegisterModal(false);
                } else {
                    setIsRegisterOpen(false);
                    setShowRegisterModal(true);
                }
            } catch (err) {
                console.error("Error fetching register status:", err);
                setError("Failed to fetch register status");
                setShowRegisterModal(true);
            } finally {
                setLoading(false);
            }
        };
        fetchRegisterStatus();
    }, []);

    const openRegister = async () => {
        setLoading(true);
        setError(null);
        try {
            const payload = {
                userId: user?.id || "unknown",
                openingCash: parseFloat(cashOnHand),
                notes: notes || ""
            };
            const response = await axios.post("/api/register/open", payload);
            if (response.data && response.data.success) {
                setIsRegisterOpen(true);
                setShowRegisterModal(false);
                return true;
            } else {
                setError(response.data.message || "Failed to open register");
                return false;
            }
        } catch (err) {
            console.error("Error opening register:", err);
            setError("Error opening register");
            return false;
        } finally {
            setLoading(false);
        }
    };
    const closeRegister = async (closingDetails) => {
        setLoading(true);
        setError(null);
        try {
            const payload = {
                userId: user?.id || "unknown",
                terminalId: "T-1", // Should be dynamic
                openingCash: parseFloat(cashOnHand),
                closingCash: parseFloat(closingDetails.inCashierAmount),
                salesTotal: parseFloat(closingDetails.salesAmount),
                cashInOut: parseFloat(closingDetails.otherAmount),
                notes: closingDetails.notes || "",
                discrepancy: parseFloat(closingDetails.inCashierAmount) -
                    (parseFloat(cashOnHand) + parseFloat(closingDetails.salesAmount))
            };

            const response = await axios.post("/api/register/close", payload);

            if (response.data?.success) {
                // Generate printable receipt
                generateRegisterReceipt(response.data.register);

                setIsRegisterOpen(false);
                setShowRegisterModal(false);
                setIsClosingRegister(false);
                return true;
            } else {
                setError(response.data?.message || "Failed to close register");
                return false;
            }
        } catch (err) {
            console.error("Error closing register:", err);
            setError(err.response?.data?.message || "Error closing register");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const generateRegisterReceipt = (registerData) => {
        // This would open a print dialog with formatted receipt
        const receiptContent = `
    Register Summary Receipt
    ----------------------------
    Date: ${new Date(registerData.closed_at).toLocaleString()}
    User: ${user?.name || 'Unknown'}
    Terminal: ${registerData.terminal_id || 'POS-01'}
    
    Opening Cash: LKR ${formatNumberWithCommas(registerData.opening_cash)}
    Sales Total: LKR ${formatNumberWithCommas(registerData.sales_total)}
    Cash In/Out: LKR ${formatNumberWithCommas(registerData.cash_in_out)}
    ----------------------------
    Expected Cash: LKR ${formatNumberWithCommas(
            registerData.opening_cash + registerData.sales_total + registerData.cash_in_out
        )}
    Actual Cash: LKR ${formatNumberWithCommas(registerData.closing_cash)}
    Discrepancy: LKR ${formatNumberWithCommas(registerData.discrepancy)}
    
    Status: ${registerData.discrepancy === 0 ? '✅ Balanced' : '⚠️ Discrepancy'}
    Closed At: ${new Date(registerData.closed_at).toLocaleTimeString()}
  `;

        // In a real implementation, this would open a print dialog
        console.log("RECEIPT:\n", receiptContent);
        // window.printReceipt(receiptContent);
    };

    const handleLogoutClick = () => {
        if (isRegisterOpen) {
            setIsClosingRegister(true);
            setShowRegisterModal(true);
            return false; // Prevent logout
        }
        return true; // Allow logout
    };

    return {
        isRegisterOpen,
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
