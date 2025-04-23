import React, { useState, useEffect } from "react";
import { useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../context/NewAuthContext";
import TopNav from "./navigation/TopNav";
import SideNav from "./navigation/SideNav";
import ErrorBoundary from "./ErrorBoundary";

function Layout({ isDarkMode, onThemeToggle }) {
  const location = useLocation();
  const { user, loading } = useAuth();

  const showNav = !loading && user && !['/login', '/register'].includes(location.pathname);

  const [isNavVisible, setIsNavVisible] = useState(true);

  useEffect(() => {
    const storedState = localStorage.getItem("isNavVisible");
    if (storedState !== null) {
      setIsNavVisible(JSON.parse(storedState));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("isNavVisible", JSON.stringify(isNavVisible));
  }, [isNavVisible]);

  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {showNav && <SideNav isNavVisible={isNavVisible} setIsNavVisible={setIsNavVisible} />}
      <div className="flex-1 flex flex-col transition-all duration-300">
        {showNav && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-[#1f2937]">
            <TopNav isDarkMode={isDarkMode} onThemeToggle={onThemeToggle} />
          </div>
        )}
        <main
          className={`flex-1 overflow-y-auto p-4 pt-[6rem] min-h-screen transition-all duration-300 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
        >
          <ErrorBoundary key={location.pathname}>
            <Outlet context={{ isNavVisible }} />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default Layout;
