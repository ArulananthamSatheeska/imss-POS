// models/CloseRegisterModal.jsx
import React, { useState } from "react";
import logo from "./LOGO-01.png";
import { X, Check } from "lucide-react";

const CloseRegisterModal = ({
    isOpen,
    onClose,
    closingDetails = {},
    onConfirmClose,
    user,
}) => {
    const closingTime = new Date().toLocaleString();
    const [inCashierAmount, setInCashierAmount] = useState(closingDetails.inCashierAmount ?? '');
    const [otherAmount, setOtherAmount] = useState(closingDetails.otherAmount ?? '');

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (isNaN(inCashierAmount) || isNaN(otherAmount)) {
            alert("Please enter valid amounts");
            return;
        }
        onConfirmClose({
            ...closingDetails,
            inCashierAmount: parseFloat(inCashierAmount),
            otherAmount: parseFloat(otherAmount)
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md z-40 flex justify-center items-center p-2 sm:p-4">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 rounded-xl shadow-2xl max-w-md w-full border-4 border-purple-600">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Close Register</h2>
                    <button
                        onClick={onClose}
                        className="p-1 sm:p-2 bg-gray-200 rounded-full hover:bg-gray-300"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    {/* Cashier Info */}
                    <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-bold">{user?.name?.charAt(0) || "?"}</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800">Cashier: {user?.name || "N/A"}</h3>
                                <p className="text-xs sm:text-sm text-gray-500">Closing Time: {closingTime}</p>
                            </div>
                        </div>
                    </div>

                    {/* Amounts */}
                    <div className="bg-white p-3 sm:p-4 rounded-lg shadow space-y-3">
                        <div>
                            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
                                Total Sales Qty
                            </label>
                            <input
                                type="text"
                                value={closingDetails.totalSalesQty}
                                readOnly
                                className="w-full p-2 sm:p-3 border rounded-lg bg-gray-100 text-sm sm:text-base"
                            />
                        </div>

                        <div>
                            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
                                Sales Amount
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">LKR</span>
                                <input
                                    type="text"
                                    value={closingDetails.salesAmount}
                                    readOnly
                                    className="w-full pl-10 p-2 sm:p-3 border rounded-lg bg-gray-100 text-sm sm:text-base"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
                                Cash on Hand (Starting)
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">LKR</span>
                                <input
                                    type="text"
                                    value={closingDetails.cashOnHand}
                                    readOnly
                                    className="w-full pl-10 p-2 sm:p-3 border rounded-lg bg-gray-100 text-sm sm:text-base"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
                                In Cashier Amount
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">LKR</span>
                                <input
                                    type="number"
                                    value={inCashierAmount}
                                    onChange={(e) => setInCashierAmount(e.target.value)}
                                    className="w-full pl-10 p-2 sm:p-3 border rounded-lg text-sm sm:text-base"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
                                Other Amount
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">LKR</span>
                                <input
                                    type="number"
                                    value={otherAmount}
                                    onChange={(e) => setOtherAmount(e.target.value)}
                                    className="w-full pl-10 p-2 sm:p-3 border rounded-lg text-sm sm:text-base"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            className="flex-1 flex items-center justify-center gap-2 p-2 sm:p-3 bg-gray-300 text-gray-800 rounded-lg shadow hover:bg-gray-400 text-sm sm:text-base font-medium"
                            onClick={onClose}
                        >
                            <X size={18} /> Cancel
                        </button>
                        <button
                            className="flex-1 flex items-center justify-center gap-2 p-2 sm:p-3 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 text-sm sm:text-base font-medium"
                            onClick={handleConfirm}
                        >
                            <Check size={18} /> Confirm Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CloseRegisterModal;
