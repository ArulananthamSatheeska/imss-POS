import React, { useState, useEffect, useRef } from "react";
import { Settings, User, Sun, Moon, Calculator } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "./LOGO-01.png";
import { MdTouchApp } from "react-icons/md";
import { useAuth } from "../../context/NewAuthContext";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { TextPlugin } from "gsap/TextPlugin";

// Register GSAP plugins
gsap.registerPlugin(MotionPathPlugin, TextPlugin, useGSAP);

const TopNav = ({ isDarkMode, onThemeToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef(null);
  const logoRef = useRef(null);
  const headingRef = useRef(null);
  const buttonsRef = useRef([]);
  const timeRef = useRef(null);

  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString()
  );
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
      // Animate time update
      if (timeRef.current) {
        gsap.from(timeRef.current, {
          y: -5,
          opacity: 0,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const pageHeadings = {
    "/dashboard": "Dashboard",
    "/items": "Items",
    "/Customers": "Customers",
    "/sales": "Sales",
    "/purchasing": "Purchasing",
    "/outstanding": "Outstanding",
    "/ledger": "Ledger",
    "/day-book": "Day Book",
    "/profit": "Profit",
    "/settings": "Settings",
    "/pos": "POS",
    "/touchpos": "TOUCHPOS",
    "/suppliers": "Suppliers",
    "/store-locations": "Store Locations",
    "/units": "Units",
    "/categories": "Categories",
    "/sales-invoice": "Sales Invoice",
    "/StockReport": "Stock Report",
    "/ItemWiseReport": "Item-wise Report",
    "/DailyProfit": "Daily Profit Report",
    "/BillWiseProfit": "Bill-wise Profit Report",
    "/AdminAccess": "Admin Panel",
    "/UserManagement": "User Management",
    "/UserForm": "User Form",
    "/UserList": "User List",
    "/StockRecheck": "Stock Recheck",
    "/RecycleBin": "Recycle Bin",
    "/UserProfile": "User Profile",
  };

  const heading = pageHeadings[location.pathname] || "Page";

  // GSAP animations
  useGSAP(() => {
    // Initial load animation
    gsap.from(navRef.current, {
      y: -100,
      opacity: 0,
      duration: 0.8,
      ease: "elastic.out(1, 0.5)",
    });

    // Logo animation
    gsap.from(logoRef.current, {
      scale: 0,
      duration: 1,
      delay: 0.3,
      ease: "back.out(4)",
    });

    // Heading typing effect
    gsap.to(headingRef.current, {
      text: heading,
      duration: 1,
      delay: 0.5,
      ease: "power2.inOut",
    });

    // Button stagger animation
    gsap.from(buttonsRef.current, {
      y: 20,
      opacity: 0,
      stagger: 0.1,
      duration: 0.6,
      delay: 0.7,
      ease: "power2.out",
    });
  }, [location.pathname]);

  const handleOpenPOS = () => {
    gsap.to(buttonsRef.current[0], {
      scale: 0.9,
      y: 2,
      duration: 0.2,
      onComplete: () => {
        navigate("/pos");
        gsap.to(buttonsRef.current[0], {
          scale: 1,
          y: 0,
          duration: 0.3,
          ease: "elastic.out(1, 0.5)",
        });
      },
    });
  };

  const handleOpenTouchPOS = () => {
    gsap.to(buttonsRef.current[1], {
      scale: 0.9,
      y: 2,
      duration: 0.2,
      onComplete: () => {
        navigate("/touchpos");
        gsap.to(buttonsRef.current[1], {
          scale: 1,
          y: 0,
          duration: 0.3,
          ease: "elastic.out(1, 0.5)",
        });
      },
    });
  };

  const handleLogout = async () => {
    try {
      const logoutBtn = buttonsRef.current[buttonsRef.current.length - 1];
      gsap.to(logoutBtn, {
        scale: 0.9,
        backgroundColor: "#dc2626",
        duration: 0.2,
        onComplete: async () => {
          await logout();
          navigate("/login");
        },
      });
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/login");
    }
  };

  const handleHover = (index, isHover) => {
    setIsHovering(isHover);
    gsap.to(buttonsRef.current[index], {
      scale: isHover ? 1.05 : 1,
      y: isHover ? -3 : 0,
      boxShadow: isHover
        ? "0 10px 25px -5px rgba(0, 0, 0, 0.2)"
        : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleThemeToggle = () => {
    gsap.to(buttonsRef.current[3], {
      rotation: 360,
      duration: 0.5,
      ease: "power2.out",
      onComplete: onThemeToggle,
    });
  };

  return (
    <div className="relative z-50" ref={navRef}>
      <div className="bg-gradient-to-r from-slate-900 to-slate-200 dark:from-gray-800 dark:to-gray-900 shadow-lg border-b border-slate-300/40 dark:border-gray-700 rounded-b-2xl relative overflow-hidden">
        {/* Animated particles background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${5 + Math.random() * 10}s infinite ease-in-out`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        <div className="top-nav-content flex items-center justify-between min-h-16 max-h-20 px-6 py-3 relative z-10">
          {/* Left - Logo with 3D effect */}
          <div
            className="top-nav-left cursor-pointer"
            ref={logoRef}
            onMouseEnter={() => {
              gsap.to(logoRef.current, {
                scale: 1.1,
                duration: 0.3,
              });
            }}
            onMouseLeave={() => {
              gsap.to(logoRef.current, {
                scale: 1,
                duration: 0.3,
              });
            }}
          >
            <img
              src={logo}
              alt="Logo"
              className="w-32 h-auto transform transition-transform duration-300 hover:rotate-y-10"
              style={{ transformStyle: "preserve-3d" }}
            />
          </div>

          {/* Center - Heading with 3D text effect */}
          <div className="top-nav-center">
            <h1
              ref={headingRef}
              className="text-4xl font-extrabold text-white dark:text-gray-100 px-6 py-2 rounded-xl whitespace-nowrap overflow-hidden"
              style={{
                textShadow: "0 2px 10px rgba(0,0,0,0.3)",
                transform: "perspective(500px) rotateX(10deg)",
                background:
                  "linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
                backdropFilter: "blur(5px)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {/* Text will be filled by GSAP */}
            </h1>
          </div>
          {/* Buttons - Made more visible */}
          <div className="flex items-center space-x-4">
            {/* POS Button - High contrast */}
            <button
              onClick={handleOpenPOS}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow"
            >
              <Calculator className="w-5 h-5 mr-1" />
              <span>POS</span>
            </button>

            {/* TOUCHPOS Button - High contrast */}
            <button
              onClick={handleOpenTouchPOS}
              className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow"
            >
              <MdTouchApp className="w-5 h-5 mr-1" />
              <span>TOUCHPOS</span>
            </button>

            {/* Settings Button - Visible icon */}
            <button
              onClick={() => navigate("/settings")}
              className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Theme Toggle - Visible icon */}
            <button
              onClick={onThemeToggle}
              className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* User & Logout - Visible section */}
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user?.name || "Admin"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {currentTime}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
        .border-gradient {
          border-image: linear-gradient(90deg, #3b82f6, #8b5cf6) 1;
        }
      `}</style>
    </div>
  );
};

export default TopNav;
