import React from "react";
import { Loader2, X } from "lucide-react";

const ProgressOverlay = ({ 
  progress, 
  indeterminate, 
  message, 
  onClose 
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md p-6 space-y-4 bg-white rounded-xl shadow-2xl border border-gray-100">
        {/* Close button (optional) */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        {/* Message */}
        <div className="flex items-center gap-3">
          {indeterminate && (
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          )}
          <h3 className="text-lg font-medium text-gray-900">
            {message}
          </h3>
        </div>
        
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={`absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out ${
                indeterminate ? "animate-indeterminate-progress" : ""
              }`}
              style={{ 
                width: indeterminate ? "50%" : `${progress}%`,
                backgroundSize: indeterminate ? "200% 100%" : "100%"
              }}
            />
          </div>
          
          {/* Percentage (when determinate) */}
          {!indeterminate && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Processing...</span>
              <span className="font-medium text-blue-600">
                {progress}% completed
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressOverlay;