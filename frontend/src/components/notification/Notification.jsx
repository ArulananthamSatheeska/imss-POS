import React, { useEffect } from "react";
import "./notification.css";

const Notification = ({ message, type, onClose, onConfirm, children }) => {
  useEffect(() => {
    if (type !== "confirm") {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Automatically close after 5 seconds for non-confirmation

      return () => clearTimeout(timer); // Cleanup timer on unmount
    }
  }, [onClose, type]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="p-6 rounded-lg shadow-lg bg-slate-800 text-amber-600 animate-fade-in-out relative">
        <div className="flex flex-col items-center text-center">
          <span className="font-semibold">{message}</span>

          {/* Render children or confirmation buttons */}
          {type === "confirm" ? (
            <div className="mt-4 flex gap-4">
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Yes, Delete
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg"
              >
                Cancel
              </button>
            </div>
          ) : (
            children && <div className="mt-4 flex gap-4">{children}</div> // Render custom actions if provided
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-0 right-2 p-1 text-white font-bold text-xl"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;
