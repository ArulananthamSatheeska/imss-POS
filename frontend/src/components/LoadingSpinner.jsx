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
    <div className="flex flex-col items-center justify-center min-h-screen space-y-6 bg-gradient-to-br from-white via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Spinner with glow and layered rings */}
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 bg-blue-400 opacity-75"></div>
        <div className="animate-spin rounded-full h-16 w-16 border-[6px] border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent"></div>
      </div>

      {/* Company Name with 3D and motion effect */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 drop-shadow-md animate-float">
        Sharvaksha
      </h1>

      {/* Loading Text */}
      <div className="flex flex-col items-center text-center">
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 animate-pulse">
          Loading Application...
        </p>
        <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Please wait while we set things up for you
        </span>
      </div>
    </div>
  );
}
