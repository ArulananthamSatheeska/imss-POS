// models/registerModel.jsx
import React, { useEffect, useRef, useState } from "react";
import logo from "./LOGO-01.png";

const RegisterModal = ({
    isOpen,
    onClose,
    onConfirm,
    cashOnHand,
    setCashOnHand,
    user,
    isClosing = false
}) => {
    const inputRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && inputRef.current && !isClosing) {
            inputRef.current.focus();
        }
    }, [isOpen, isClosing]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleConfirm();
        }
    };

    const handleConfirm = async () => {
        if (!isClosing && (!cashOnHand || isNaN(parseFloat(cashOnHand)))) {
            alert("Please enter a valid cash amount");
            return;
        }

        setIsLoading(true);
        try {
            await onConfirm();
            onClose();
        } catch (error) {
            console.error("Error in register operation:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-lg z-50">
            <div className="bg-slate-50/80 rounded-lg p-6 w-full max-w-md backdrop-blur-lg shadow-xl">
                <div className="text-center mb-4">
                    <img src={logo} alt="Company Logo" className="w-24 mx-auto" />
                    <h2 className="text-xl font-bold text-gray-800">
                        {isClosing ? "Close Register" : "Open Register"}
                    </h2>
                </div>

                <div className="mb-4">
                    <p className="text-gray-700">
                        <strong>Cashier:</strong> {user?.name || "N/A"}
                    </p>
                    <p className="text-gray-700">
                        <strong>User ID:</strong> {user?.id || "N/A"}
                    </p>
                </div>

                {!isClosing && (
                    <div className="mb-4">
                        <label className="block font-medium text-gray-800">
                            Cash on Hand:
                        </label>
                        <input
                            type="number"
                            ref={inputRef}
                            className="w-full text-black p-2 border rounded focus:ring-2 focus:ring-blue-400"
                            value={cashOnHand}
                            onChange={(e) => setCashOnHand(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter cash amount"
                            disabled={isLoading}
                        />
                    </div>
                )}

                <div className="flex justify-between mt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                        disabled={isLoading || (!isClosing && !cashOnHand)}
                    >
                        {isLoading ? (
                            "Processing..."
                        ) : isClosing ? (
                            "Close Register"
                        ) : (
                            "Open Register"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegisterModal;