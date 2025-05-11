import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Unauthorized = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeOfDay, setTimeOfDay] = useState("morning");
  const [motivationalMessage, setMotivationalMessage] = useState("");

  // Update time and time-of-day category
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      const hour = now.getHours();

      if (hour >= 5 && hour < 12) setTimeOfDay("morning");
      else if (hour >= 12 && hour < 17) setTimeOfDay("afternoon");
      else if (hour >= 17 && hour < 21) setTimeOfDay("evening");
      else if (hour >= 21 || hour < 5) setTimeOfDay("night");
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Set messages and animations based on time of day
  useEffect(() => {
    let message = "";
    switch (timeOfDay) {
      case "morning":
        message =
          "🌅 New day, new opportunities! Get back to POS for morning sales!";
        break;
      case "afternoon":
        message =
          "☀️ Afternoon hustle! Every transaction counts - return to POS!";
        break;
      case "evening":
        message = "🌇 Evening rush! Don't miss peak sales opportunities!";
        break;
      case "night":
        message =
          currentTime.getHours() >= 21
            ? "🌙 Night owls prosper! Close strong with POS!"
            : "🌌 Late night? Secure those final sales!";
        break;
      default:
        message = "⏱ Every minute counts! Get back to POS!";
    }
    setMotivationalMessage(message);
  }, [timeOfDay, currentTime]);

  // Animation configurations for each time of day
  const getTimeBasedAnimations = () => {
    switch (timeOfDay) {
      case "morning":
        return {
          background:
            "bg-gradient-to-tr from-yellow-100 via-orange-200 to-pink-200",
          animation: "animate-gradient-sunrise",
          iconColor: "text-yellow-500",
          buttonColor: "from-amber-500 to-orange-500",
          floatingElements: [
            {
              color: "bg-yellow-300",
              size: "w-32 h-32",
              position: "top-1/4 left-1/4",
              animation: "animate-float-slow",
            },
            {
              color: "bg-orange-300",
              size: "w-24 h-24",
              position: "top-1/3 right-1/4",
              animation: "animate-float-delay",
            },
            {
              color: "bg-pink-300",
              size: "w-20 h-20",
              position: "bottom-1/4 left-1/3",
              animation: "animate-float-reverse",
            },
          ],
        };
      case "afternoon":
        return {
          background:
            "bg-gradient-to-br from-blue-100 via-cyan-200 to-green-200",
          animation: "animate-gradient-afternoon",
          iconColor: "text-blue-500",
          buttonColor: "from-blue-500 to-teal-500",
          floatingElements: [
            {
              color: "bg-blue-300",
              size: "w-28 h-28",
              position: "top-1/5 right-1/5",
              animation: "animate-float-medium",
            },
            {
              color: "bg-teal-300",
              size: "w-20 h-20",
              position: "bottom-1/5 left-1/5",
              animation: "animate-float-slow",
            },
            {
              color: "bg-cyan-300",
              size: "w-16 h-16",
              position: "top-2/3 left-1/5",
              animation: "animate-float-delay",
            },
          ],
        };
      case "evening":
        return {
          background:
            "bg-gradient-to-tr from-purple-100 via-pink-200 to-red-200",
          animation: "animate-gradient-sunset",
          iconColor: "text-purple-500",
          buttonColor: "from-purple-500 to-pink-500",
          floatingElements: [
            {
              color: "bg-purple-300",
              size: "w-24 h-24",
              position: "top-1/4 right-1/3",
              animation: "animate-float-slow",
            },
            {
              color: "bg-pink-300",
              size: "w-32 h-32",
              position: "bottom-1/3 left-1/4",
              animation: "animate-float-reverse",
            },
            {
              color: "bg-red-300",
              size: "w-20 h-20",
              position: "top-2/3 right-1/4",
              animation: "animate-float-delay",
            },
          ],
        };
      case "night":
        return {
          background:
            "bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900",
          animation: "animate-gradient-night",
          iconColor: "text-indigo-300",
          buttonColor: "from-indigo-600 to-purple-600",
          floatingElements: [
            {
              color: "bg-indigo-700",
              size: "w-20 h-20",
              position: "top-1/3 left-1/4",
              animation: "animate-float-stars",
            },
            {
              color: "bg-purple-700",
              size: "w-16 h-16",
              position: "bottom-1/4 right-1/4",
              animation: "animate-float-stars-delay",
            },
            {
              color: "bg-blue-700",
              size: "w-12 h-12",
              position: "top-1/5 right-1/5",
              animation: "animate-twinkle",
            },
          ],
        };
      default:
        return {
          background:
            "bg-gradient-to-tr from-gray-100 via-gray-200 to-gray-300",
          animation: "animate-gradient-neutral",
          iconColor: "text-gray-500",
          buttonColor: "from-gray-500 to-blue-500",
          floatingElements: [],
        };
    }
  };

  const animations = getTimeBasedAnimations();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Time-based animated background */}
      <div
        className={`absolute inset-0 ${animations.background} ${animations.animation}`}
      ></div>

      {/* Time-based floating elements */}
      {animations.floatingElements.map((element, index) => (
        <div
          key={index}
          className={`absolute ${element.position} ${element.size} ${element.color} opacity-20 rounded-full ${element.animation}`}
        ></div>
      ))}

      {/* Main content container */}
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md backdrop-blur-sm bg-white/80 dark:bg-gray-800/90 rounded-xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-700/50">
          {/* Header with time-based accent */}
          <div
            className={`bg-gradient-to-r ${timeOfDay === "night" ? "from-indigo-900/30 to-purple-900/30" : "from-red-50 to-red-100"} dark:from-red-900/30 dark:to-red-800/30 border-b ${timeOfDay === "night" ? "border-indigo-800/50" : "border-red-100"} dark:border-red-800/50 p-6`}
          >
            <div className="flex flex-col items-center">
              <div
                className={`p-3 ${timeOfDay === "night" ? "bg-indigo-900/20" : "bg-red-100"} dark:bg-red-900/50 rounded-full mb-4`}
              >
                <svg
                  className={`w-8 h-8 ${animations.iconColor} dark:text-red-400`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Access Restricted
              </h1>
              <p
                className={`${timeOfDay === "night" ? "text-indigo-300" : "text-red-500"} dark:text-red-400 font-medium mt-1`}
              >
                Error 403: Unauthorized
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8">
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6 leading-relaxed">
              You don't have sufficient permissions to access this resource.
              Please contact your administrator if you believe this is an error.
            </p>

            {/* Time-based motivational message */}
            <div
              className={`mb-6 p-4 ${timeOfDay === "night" ? "bg-indigo-900/20" : "bg-blue-50"} dark:bg-blue-900/20 rounded-lg border ${timeOfDay === "night" ? "border-indigo-800/30" : "border-blue-100"} dark:border-blue-800/50`}
            >
              <div
                className={`flex items-center justify-center space-x-2 ${timeOfDay === "night" ? "text-indigo-200" : "text-blue-600"} dark:text-blue-300`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm font-medium text-center">
                  {motivationalMessage}
                </p>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <Link
                to="/"
                className={`px-6 py-3 bg-gradient-to-r ${animations.buttonColor} text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span>Return to POS</span>
              </Link>

              <button className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-center justify-center space-x-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>Contact Administrator</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div
            className={`${timeOfDay === "night" ? "bg-indigo-900/20" : "bg-gray-50"} dark:bg-gray-700/30 px-6 py-4 text-center border-t ${timeOfDay === "night" ? "border-indigo-800/30" : "border-gray-100"} dark:border-gray-700`}
          >
            <p
              className={`text-xs ${timeOfDay === "night" ? "text-indigo-300" : "text-gray-500"} dark:text-gray-400`}
            >
              © {new Date().getFullYear()} IMSS PVT(LTD). All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
