import React, { useState, useEffect } from "react";
import {
  Settings,
  User,
  Sun,
  Moon,
  Calculator,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "./LOGO-01.png";
import { MdTouchApp } from "react-icons/md";
import { useAuth } from "../../context/NewAuthContext";

const TopNav = ({ isDarkMode, onThemeToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(interval); // Cleanup on unmount
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

  const handleOpenPOS = () => navigate("/pos");
  const handleOpenTouchPOS = () => navigate("/touchpos");

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/login");
    }
  };

  return (
    <div className="relative z-50 animate-slide-down">
      <div className="bg-white dark:bg-gray-900 shadow-xl border border-transparent rounded-b-xl relative overflow-hidden">
        {/* Animated glowing border */}
        <div className="absolute inset-0 z-[-1] rounded-b-xl border-2 border-transparent animate-glow border-gradient" />

        <div className="top-nav-content flex items-center justify-between min-h-10 max-h-20 px-4 py-2">
          {/* Left - Logo */}
          <div className="top-nav-left">
            <img src={logo} alt="Logo" className="w-28 h-auto" />
          </div>

          {/* Center - Heading */}
          <div className="top-nav-center">
            <h1 className="typing-text text-3xl mr-24 font-extrabold text-white dark:text-gray-900 px-4 py-1 border-2 border-gradient rounded-xl shadow-md whitespace-nowrap overflow-hidden">
              {heading}
            </h1>
          </div>

          {/* Right - Controls */}
          <div className="top-nav-right flex items-center gap-4">
            <button
              onClick={handleOpenTouchPOS}
              className="flex items-center px-4 py-2 text-white bg-blue-500 rounded-lg shadow hover:bg-blue-600 transition-all"
            >
              <span className="hidden md:inline">TOUCHPOS</span>
              <MdTouchApp className="w-5 h-5 ml-2" />
            </button>

            <button
              onClick={handleOpenPOS}
              className="flex items-center px-4 py-2 text-white bg-blue-500 rounded-lg shadow hover:bg-blue-600 transition-all"
            >
              <span className="hidden md:inline">POS</span>
              <Calculator className="w-5 h-5 ml-2" />
            </button>

            <button
              onClick={() => navigate("/settings")}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

            <button
              onClick={onThemeToggle}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>

            {/* User Info */}
            <div className="flex items-center gap-2 pl-4 border-l dark:border-gray-700">
              <div className="p-2 bg-blue-100 rounded-full dark:bg-blue-700">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-200" />
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-medium text-gray-700 dark:text-gray-200">
                  {user?.name || "Admin"}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {currentTime}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 ml-2 text-sm text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNav;
