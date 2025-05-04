import React, { useState, useEffect, useRef } from "react";
import { X, Check, Lock, LockOpen, Coins, Wallet, Receipt } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const RegisterModal = ({
    isOpen,
    onClose,
    onConfirm,
    cashOnHand,
    setCashOnHand,
    user,
    isClosing = false,
    closingDetails = {},
    registerStatus = 'closed' // New prop for register status
}) => {
    const [inputAmount, setInputAmount] = useState(isClosing ? '' : cashOnHand);
    const [otherAmount, setOtherAmount] = useState(closingDetails.otherAmount || '');
    const [localIsOpen, setLocalIsOpen] = useState(isOpen);
    const inputRef = useRef(null);

    // Sync modal state with register status
    useEffect(() => {
        if (registerStatus === 'open' && localIsOpen) {
            setLocalIsOpen(false);
            onClose();
        } else if (registerStatus === 'closed' && !localIsOpen && !isClosing) {
            setLocalIsOpen(true);
        }
    }, [registerStatus, localIsOpen, onClose, isClosing]);

    // Handle external isOpen changes
    useEffect(() => {
        setLocalIsOpen(isOpen);
    }, [isOpen]);

    useEffect(() => {
        if (localIsOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 300);
        }
    }, [localIsOpen]);

    useEffect(() => {
        if (isClosing && closingDetails) {
            setInputAmount(closingDetails.inCashierAmount || '');
            setOtherAmount(closingDetails.otherAmount || '');
        }
    }, [isClosing, closingDetails]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleConfirm();
        }
    };

    const handleConfirm = () => {
        const amount = parseFloat(inputAmount);
        const other = parseFloat(otherAmount || 0);

        console.log("RegisterModal handleConfirm - amount:", amount, "other:", other);

        if (isNaN(amount) || amount < 0) {
            alert("Please enter a valid non-negative amount");
            return;
        }

        if (isClosing && (isNaN(other) || other < 0)) {
            alert("Please enter a valid non-negative other amount");
            return;
        }

        if (isClosing) {
            onConfirm({ inCashierAmount: amount, otherAmount: other });
        } else {
            onConfirm(amount);
        }
        onClose();
    };

    // Don't render if register is open and we're not closing
    if (registerStatus === 'open' && !isClosing) {
        return null;
    }

    return (
        <AnimatePresence>
            {localIsOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center p-4"
                >
                    <motion.div
                        initial={{ y: 50, scale: 0.95, opacity: 0 }}
                        animate={{ y: 0, scale: 1, opacity: 1 }}
                        exit={{ y: 50, scale: 0.95, opacity: 0 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-2xl max-w-md w-full border border-blue-100 dark:border-gray-700 relative overflow-hidden"
                    >
                        {/* Floating decorative elements */}
                        <motion.div
                            animate={{
                                x: [0, 5, -5, 0],
                                y: [0, -5, 5, 0],
                                rotate: [0, 5, -5, 0]
                            }}
                            transition={{
                                duration: 15,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            className="absolute -top-20 -right-20 w-40 h-40 bg-blue-200 dark:bg-blue-900 rounded-full opacity-20"
                        ></motion.div>
                        <motion.div
                            animate={{
                                x: [0, -5, 5, 0],
                                y: [0, 5, -5, 0],
                                rotate: [0, -5, 5, 0]
                            }}
                            transition={{
                                duration: 20,
                                repeat: Infinity,
                                ease: "linear",
                                delay: 2
                            }}
                            className="absolute -bottom-20 -left-20 w-40 h-40 bg-indigo-200 dark:bg-indigo-900 rounded-full opacity-20"
                        ></motion.div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <motion.div
                                        animate={{
                                            rotateY: isClosing ? 180 : 0,
                                            scale: [1, 1.1, 1]
                                        }}
                                        transition={{
                                            rotateY: { duration: 0.5 },
                                            scale: { duration: 0.3, delay: 0.2 }
                                        }}
                                        className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full shadow-inner"
                                    >
                                        {isClosing ? (
                                            <Lock className="text-blue-600 dark:text-blue-300" size={24} />
                                        ) : (
                                            <LockOpen className="text-blue-600 dark:text-blue-300" size={24} />
                                        )}
                                    </motion.div>
                                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                                        {isClosing ? "Close Register" : "Open Register"}
                                    </h2>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onClose}
                                    className="p-2 bg-white dark:bg-gray-700 rounded-full shadow hover:bg-gray-50 dark:hover:bg-gray-600"
                                >
                                    <X size={20} className="text-gray-600 dark:text-gray-300" />
                                </motion.button>
                            </div>

                            <div className="space-y-6">
                                {isClosing ? (
                                    <>
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                            className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600"
                                        >
                                            <h3 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 mb-3">
                                                <Receipt className="text-blue-500 dark:text-blue-400" size={18} />
                                                Closing Summary
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="text-gray-600 dark:text-gray-400">Total Sales:</div>
                                                <div className="font-medium text-right dark:text-white">LKR {closingDetails.totalSales?.toFixed(2) || '0.00'}</div>
                                                <div className="text-gray-600 dark:text-gray-400">Total Quantity:</div>
                                                <div className="font-medium text-right dark:text-white">{closingDetails.totalSalesQty || '0'}</div>
                                                <div className="text-gray-600 dark:text-gray-400">Opening Cash:</div>
                                                <div className="font-medium text-right dark:text-white">LKR {closingDetails.openingCash?.toFixed(2) || '0.00'}</div>
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                <Coins className="text-blue-500 dark:text-blue-400" size={16} />
                                                Cash in Register (LKR)
                                            </label>
                                            <input
                                                ref={inputRef}
                                                type="number"
                                                value={inputAmount}
                                                onChange={(e) => setInputAmount(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-400 transition-all bg-white dark:bg-gray-800 dark:text-white"
                                                placeholder="Enter cash amount"
                                            />
                                            <button
                                                onClick={() => window.print()}
                                                className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                            >
                                                Print Mini Report
                                            </button>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                        >
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                <Wallet className="text-blue-500 dark:text-blue-400" size={16} />
                                                Other Amount (LKR)
                                            </label>
                                            <input
                                                type="number"
                                                value={otherAmount}
                                                onChange={(e) => setOtherAmount(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-400 transition-all bg-white dark:bg-gray-800 dark:text-white"
                                                placeholder="Enter other amount"
                                            />
                                        </motion.div>
                                    </>
                                ) : (
                                    <>
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                            className="text-center"
                                        >
                                            <motion.div
                                                animate={{
                                                    scale: [1, 1.05, 1],
                                                    rotate: [0, 5, -5, 0]
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    repeatDelay: 3
                                                }}
                                                className="inline-flex items-center justify-center p-4 bg-blue-100 dark:bg-blue-900 rounded-full mb-4 shadow-inner"
                                            >
                                                <LockOpen className="text-blue-600 dark:text-blue-300" size={28} />
                                            </motion.div>
                                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                                                Register is currently closed
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400">
                                                Please enter the opening cash amount to start transactions
                                            </p>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                <Coins className="text-blue-500 dark:text-blue-400" size={16} />
                                                Opening Cash Amount (LKR)
                                            </label>
                                            <input
                                                ref={inputRef}
                                                type="number"
                                                value={inputAmount}
                                                onChange={(e) => setInputAmount(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-400 transition-all bg-white dark:bg-gray-800 dark:text-white"
                                                placeholder="Enter opening cash amount"
                                            />
                                        </motion.div>
                                    </>
                                )}

                                <motion.div
                                    className="flex gap-3 pt-2"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <motion.button
                                        whileHover={{ scale: 1.02, x: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex-1 flex items-center justify-center gap-2 p-3 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 shadow-sm"
                                        onClick={onClose}
                                    >
                                        <X size={18} /> Cancel
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02, x: 2 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex-1 flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:opacity-90 disabled:opacity-50 shadow-md"
                                        onClick={handleConfirm}
                                    >
                                        <Check size={18} />
                                        {isClosing ? "Close Register" : "Open Register"}
                                    </motion.button>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default RegisterModal;