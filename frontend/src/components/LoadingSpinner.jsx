import { useState, useEffect } from "react";

export function LoadingSpinner({ duration = 2000 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center min-h-screen space-y-8 bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Animated logo container */}
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-full opacity-10 bg-blue-500 animate-pulse-slow" />

        {/* Pulsing ring */}
        <div className="absolute rounded-full h-20 w-20 border-2 border-blue-200 animate-pulse-slow" />

        {/* Main spinner */}
        <div className="relative flex items-center justify-center">
          <div className="animate-spin-slow rounded-full h-16 w-16 border-4 border-t-blue-600 border-r-blue-400 border-b-blue-600 border-l-blue-400" />
        </div>

        {/* Inner dot */}
        <div className="absolute rounded-full h-3 w-3 bg-blue-600" />
      </div>

      {/* Company branding */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
            MUNSI TEX
          </span>
        </h1>
        <div className="h-px w-16 mx-auto bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
      </div>

      {/* Status indicator */}
      <div className="flex flex-col items-center space-y-1 text-center max-w-xs">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 tracking-wide">
          Loading application resources
        </p>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
          <div
            className="bg-blue-600 h-1.5 rounded-full animate-progress"
            style={{ width: "70%" }}
          />
        </div>
      </div>
    </div>
  );
}
