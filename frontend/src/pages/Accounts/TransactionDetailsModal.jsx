import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

const TransactionDetailsModal = ({ transaction, onClose }) => {
  const modalRef = useRef(null);
  const outstandingRef = useRef(null);
  const paymentHistoryRef = useRef(null);

  if (!transaction) return null;

  // Calculate outstanding details
  const outstandingAmount = transaction.final_outstanding_amount || 0;
  const paidPercentage =
    transaction.total_amount > 0
      ? (transaction.paid_amount / transaction.total_amount) * 100
      : 0;
  const outstandingPercentage = 100 - paidPercentage;

  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "LKR",
    }).format(value);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Determine if transaction is paid
  const isPaid = outstandingAmount <= 0;

  // Animation effects
  useEffect(() => {
    if (!modalRef.current) return;

    const tl = gsap.timeline();
    tl.from(modalRef.current, {
      y: 50,
      opacity: 0,
      duration: 0.6,
      ease: "back.out(1.2)",
    });

    // Animate outstanding section
    if (outstandingRef.current) {
      tl.from(
        outstandingRef.current,
        {
          y: 20,
          opacity: 0,
          duration: 0.4,
        },
        "-=0.3"
      );
    }

    // Animate payment history
    if (paymentHistoryRef.current) {
      tl.from(
        paymentHistoryRef.current.children,
        {
          x: -20,
          opacity: 0,
          stagger: 0.1,
          duration: 0.3,
        },
        "-=0.2"
      );
    }
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50 p-4">
      <div
        ref={modalRef}
        className="relative bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Transaction Details
              </h3>
              {/* Modern 3D Status Stamp */}
              <div
                className={`inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full border-4 text-sm font-extrabold uppercase tracking-widest shadow-lg backdrop-blur-sm rotate-[-6deg] scale-110 relative transition-all duration-300
                  ${
                    isPaid
                      ? "border-green-500 text-green-800 bg-green-200/30 dark:border-green-400 dark:text-green-100 dark:bg-green-900/30"
                      : "border-red-500 text-red-800 bg-red-200/30 dark:border-red-400 dark:text-red-100 dark:bg-red-900/30"
                  }`}
              >
                <div
                  className={`absolute inset-0 rounded-full z-0 opacity-25 blur-md ${
                    isPaid ? "bg-green-300" : "bg-red-300"
                  }`}
                ></div>

                <div className="relative z-10 flex items-center gap-1">
                  {isPaid ? (
                    <svg
                      className="h-4 w-4 text-green-600 dark:text-green-300"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4 text-red-600 dark:text-red-300"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                  <span>{isPaid ? "Paid" : "Unpaid"}</span>
                </div>

                {/* Shine effect */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/70 blur-sm opacity-70"></div>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              #{transaction.id} • {formatDate(transaction.date)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Outstanding Amount Section - Highlighted */}
        <div
          ref={outstandingRef}
          className={`mb-6 p-4 rounded-lg ${
            isPaid
              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-200">
                {isPaid ? "Fully Paid" : "Outstanding Balance"}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isPaid ? "No remaining balance" : "Payment pending"}
              </p>
            </div>
            <div className="text-right">
              <p
                className={`text-2xl font-bold ${
                  isPaid
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrency(Math.abs(outstandingAmount))}
              </p>
              {!isPaid && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {outstandingPercentage.toFixed(1)}% of total
                </p>
              )}
            </div>
          </div>

          {/* Payment Progress Bar */}
          {!isPaid && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2.5 rounded-full"
                  style={{ width: `${paidPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Paid: {formatCurrency(transaction.paid_amount)}</span>
                <span>Total: {formatCurrency(transaction.total_amount)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Transaction Summary */}
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Customer Information
              </h4>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-300 font-medium">
                    {transaction.customer_name?.charAt(0) || "C"}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {transaction.customer_name || "No name provided"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {transaction.payment_type || "No payment type specified"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Financial Summary
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    Subtotal
                  </span>
                  <span className="font-medium">
                    {formatCurrency(
                      transaction.subtotal || transaction.total_amount
                    )}
                  </span>
                </div>
                {transaction.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">
                      Tax ({transaction.tax_rate || 0}%)
                    </span>
                    <span className="font-medium">
                      {formatCurrency(transaction.tax_amount)}
                    </span>
                  </div>
                )}
                {transaction.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">
                      Discount
                    </span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      -{formatCurrency(transaction.discount_amount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className="text-gray-600 dark:text-gray-300 font-medium">
                    Total Amount
                  </span>
                  <span className="font-bold">
                    {formatCurrency(transaction.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Payment History */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Payment History
            </h4>

            <div ref={paymentHistoryRef} className="space-y-3">
              {transaction.payment_history?.length > 0 ? (
                transaction.payment_history.map((payment, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatDate(payment.payment_date)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {payment.payment_method || "No method specified"}
                        </p>
                        {payment.reference && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Reference: {payment.reference}
                          </p>
                        )}
                      </div>
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                    {payment.notes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                        {payment.notes}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    No payment history available
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with action buttons */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
          {!isPaid && (
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
              Record Payment
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsModal;
