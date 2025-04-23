import React, { useEffect, useRef } from "react";
import logo from "./LOGO-01.png";

const RegisterModal = ({
    isOpen,
    onClose,
    onConfirm,
    cashOnHand,
    setCashOnHand,
    user,
}) => {
    const inputRef = useRef(null); // Ref for the input field

    // Focus on the input field when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Handle Enter key press to confirm
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            onConfirm(); // Trigger the confirm action when Enter is pressed
        }
    };

    if (!isOpen) return null; // Hide modal if not open

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-lg z-50">
            {/* Modal Content */}
            <div className="bg-slate-50/80 rounded-lg p-6 w-full max-w-md backdrop-blur-lg shadow-xl">
                {/* Company Logo */}
                <div className="text-center mb-4">
                    <img src={logo} alt="Company Logo" className="w-24 mx-auto" />
                    <h2 className="text-xl font-bold text-gray-800">Cash Register</h2>
                </div>

                {/* User Details */}
                <div className="mb-4">
                    <p className="text-gray-700">
                        <strong>Cashier:</strong> {user?.name || "Rusaith"}
                    </p>
                    <p className="text-gray-700">
                        <strong>User ID:</strong> {user?.id || "12345"}
                    </p>
                </div>

                {/* Cash on Hand Input */}
                <div className="mb-4">
                    <label className="block font-medium text-gray-800">Cash on Hand:</label>
                    <input
                        type="number"
                        ref={inputRef} // Focus on this input when modal is open
                        className="w-full text-black p-2 border rounded focus:ring-2 focus:ring-blue-400"
                        value={cashOnHand}
                        onChange={(e) => setCashOnHand(e.target.value)}
                        onKeyDown={handleKeyDown} // Enable Enter key to trigger confirmation
                        placeholder="Enter cash amount"
                    />
                </div>

                {/* Buttons */}
                <div className="flex justify-between mt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                        Open POS
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegisterModal;
