import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Check,
  Lock,
  LockOpen,
  Coins,
  Wallet,
  Receipt,
  AlertCircle,
} from "lucide-react";
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
  registerStatus = "closed",
}) => {
  const [inputAmount, setInputAmount] = useState("");
  const [otherAmount, setOtherAmount] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  // Initialize values based on mode
  useEffect(() => {
    if (isClosing) {
      setInputAmount(closingDetails.inCashierAmount?.toString() || "");
      setOtherAmount(closingDetails.otherAmount?.toString() || "");
    } else {
      setInputAmount(cashOnHand?.toString() || "");
    }
  }, [isClosing, closingDetails, cashOnHand]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleConfirm();
    }
  };

  const validateInputs = () => {
    if (
      !inputAmount ||
      isNaN(parseFloat(inputAmount)) ||
      parseFloat(inputAmount) < 0
    ) {
      setError("Please enter a valid cash amount");
      return false;
    }

    if (isClosing) {
      const otherAmt = parseFloat(otherAmount || "0");
      if (isNaN(otherAmt)) {
        setError("Please enter a valid other amount");
        return false;
      }

      // Validate that cash in register is reasonable compared to opening + sales
      const expectedMin =
        (closingDetails.openingCash || 0) + (closingDetails.cashSales || 0);
      const enteredCash = parseFloat(inputAmount);

      if (enteredCash < expectedMin * 0.9 || enteredCash > expectedMin * 1.5) {
        setError(
          `Cash amount seems unusual. Expected around LKR ${expectedMin.toFixed(2)} based on sales.`
        );
        return false;
      }
    }

    setError("");
    return true;
  };

  const handleConfirm = async () => {
    if (!validateInputs()) return;

    setIsSubmitting(true);
    try {
      // Remove commas before parsing
      const sanitizedInput = inputAmount.replace(/,/g, "");
      const amount = parseFloat(sanitizedInput);
      const other = parseFloat(otherAmount || 0);

      if (isClosing) {
        await onConfirm({
          inCashierAmount: amount,
          otherAmount: other,
          expectedAmount:
            (closingDetails.openingCash || 0) + (closingDetails.cashSales || 0),
        });
      } else {
        await onConfirm(amount);
        // Removed setCashOnHand call as it is not provided by parent
        // setCashOnHand(amount);
      }

      onClose();
    } catch (err) {
      setError(err.message || "Failed to process register operation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDifference = () => {
    if (!isClosing) return null;

    const expected =
      (closingDetails.openingCash || 0) + (closingDetails.cashSales || 0);
    const actual = parseFloat(inputAmount || 0);
    const difference = actual - expected;

    return {
      expected,
      actual,
      difference,
      isOver: difference > 0,
      isShort: difference < 0,
    };
  };

  const diff = calculateDifference();

  // Show read-only view if register is open and we're not closing
  if (registerStatus === "open" && !isClosing) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-2xl max-w-md w-full border border-blue-100 dark:border-gray-700 relative overflow-hidden text-center">
          <div className="flex flex-col items-center gap-4">
            <Lock className="text-blue-600 dark:text-blue-300" size={48} />
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
              Register is currently open
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Cash on hand: LKR {cashOnHand?.toFixed(2) || "0.00"}
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
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
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute -top-20 -right-20 w-40 h-40 bg-blue-200 dark:bg-blue-900 rounded-full opacity-20"
            ></motion.div>
            <motion.div
              animate={{
                x: [0, -5, 5, 0],
                y: [0, 5, -5, 0],
                rotate: [0, -5, 5, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
                delay: 2,
              }}
              className="absolute -bottom-20 -left-20 w-40 h-40 bg-indigo-200 dark:bg-indigo-900 rounded-full opacity-20"
            ></motion.div>

            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{
                      rotateY: isClosing ? 180 : 0,
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      rotateY: { duration: 0.5 },
                      scale: { duration: 0.3, delay: 0.2 },
                    }}
                    className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full shadow-inner"
                  >
                    {isClosing ? (
                      <Lock
                        className="text-blue-600 dark:text-blue-300"
                        size={24}
                      />
                    ) : (
                      <LockOpen
                        className="text-blue-600 dark:text-blue-300"
                        size={24}
                      />
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
                  disabled={isSubmitting}
                  className="p-2 bg-white dark:bg-gray-700 rounded-full shadow hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  <X size={20} className="text-gray-600 dark:text-gray-300" />
                </motion.button>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg flex items-start gap-2 border border-red-100 dark:border-red-900"
                >
                  <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                  <div>{error}</div>
                </motion.div>
              )}

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
                        <Receipt
                          className="text-blue-500 dark:text-blue-400"
                          size={18}
                        />
                        Closing Summary
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-gray-600 dark:text-gray-400">
                          Total Sales:
                        </div>
                        <div className="font-medium text-right dark:text-white">
                          LKR {closingDetails.totalSales?.toFixed(2) || "0.00"}
                        </div>

                        <div className="text-gray-600 dark:text-gray-400">
                          Cash Sales:
                        </div>
                        <div className="font-medium text-right dark:text-white">
                          LKR {closingDetails.cashSales?.toFixed(2) || "0.00"}
                        </div>

                        <div className="text-gray-600 dark:text-gray-400">
                          Opening Cash:
                        </div>
                        <div className="font-medium text-right dark:text-white">
                          LKR {closingDetails.openingCash?.toFixed(2) || "0.00"}
                        </div>

                        {diff && (
                          <>
                            <div className="text-gray-600 dark:text-gray-400">
                              Expected Cash:
                            </div>
                            <div className="font-medium text-right dark:text-white">
                              LKR {diff.expected.toFixed(2)}
                            </div>

                            <div className="text-gray-600 dark:text-gray-400">
                              Difference:
                            </div>
                            <div
                              className={`font-medium text-right ${
                                diff.isShort
                                  ? "text-red-500"
                                  : diff.isOver
                                    ? "text-green-500"
                                    : "dark:text-white"
                              }`}
                            >
                              {diff.difference.toFixed(2)} LKR
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Coins
                          className="text-blue-500 dark:text-blue-400"
                          size={16}
                        />
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Cash in Register (LKR)
                        </label>
                      </div>
                      <input
                        ref={inputRef}
                        type="number"
                        value={inputAmount}
                        onChange={(e) => setInputAmount(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-400 transition-all bg-white dark:bg-gray-800 dark:text-white"
                        placeholder="Enter cash amount"
                        disabled={isSubmitting}
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet
                          className="text-blue-500 dark:text-blue-400"
                          size={16}
                        />
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Other Amount (LKR)
                        </label>
                      </div>
                      <input
                        type="number"
                        value={otherAmount}
                        onChange={(e) => setOtherAmount(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-400 transition-all bg-white dark:bg-gray-800 dark:text-white"
                        placeholder="Enter other amount (checks, etc.)"
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Include checks, credit card tips, or other non-cash
                        amounts
                      </p>
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
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 3,
                        }}
                        className="inline-flex items-center justify-center p-4 bg-blue-100 dark:bg-blue-900 rounded-full mb-4 shadow-inner"
                      >
                        <LockOpen
                          className="text-blue-600 dark:text-blue-300"
                          size={28}
                        />
                      </motion.div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                        Register is currently closed
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Please enter the opening cash amount to start
                        transactions
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Coins
                          className="text-blue-500 dark:text-blue-400"
                          size={16}
                        />
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Opening Cash Amount (LKR)
                        </label>
                      </div>
                      <input
                        ref={inputRef}
                        type="number"
                        value={inputAmount}
                        onChange={(e) => setInputAmount(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-400 transition-all bg-white dark:bg-gray-800 dark:text-white"
                        placeholder="Enter opening cash amount"
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Count the physical cash in the drawer and enter the
                        amount
                      </p>
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
                    disabled={isSubmitting}
                  >
                    <X size={18} /> Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:opacity-90 disabled:opacity-50 shadow-md"
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      <>
                        <Check size={18} />
                        {isClosing ? "Close Register" : "Open Register"}
                      </>
                    )}
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
