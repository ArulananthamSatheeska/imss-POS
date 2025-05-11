import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const RegisterContext = createContext();

export const RegisterProvider = ({ children }) => {
  const [registerStatus, setRegisterStatus] = useState({
    status: "closed",
    register: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshRegisterStatus = async (userId) => {
    console.log("Refreshing register status for user:", userId);
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/register/status", {
        params: { user_id: userId },
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      console.log("Register status response:", response.data);
      if (response.data && response.data.status) {
        setRegisterStatus({
          status: response.data.status,
          register: response.data.register,
        });
      } else {
        setRegisterStatus({ status: "closed", register: null });
      }
    } catch (err) {
      console.error("Error fetching register status:", err);
      setError(err.message || "Failed to fetch register status");
      setRegisterStatus({ status: "closed", register: null });
    } finally {
      setLoading(false);
    }
  };

  const openRegister = async ({ user_id, terminal_id, opening_cash }) => {
    console.log("Opening register with:", {
      user_id,
      terminal_id,
      opening_cash,
    });
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/register/open",
        {
          user_id,
          terminal_id,
          opening_cash,
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      console.log("Open register response:", response);
      if (response.status === 201 && response.data.register) {
        setRegisterStatus({
          status: "open",
          register: response.data.register,
        });
        return true;
      } else {
        setError(response.data.message || "Failed to open register");
        return false;
      }
    } catch (err) {
      console.error("Error opening register:", err);
      setError(err.message || "Failed to open register");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const closeRegister = async (closingDetails) => {
    console.log("Closing register with details:", closingDetails);
    setLoading(true);
    setError(null);
    try {
      if (!registerStatus.register || !registerStatus.register.id) {
        setError("No open register to close");
        return false;
      }
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/register/close",
        {
          register_id: registerStatus.register.id,
          closing_balance: closingDetails.inCashierAmount,
          actual_cash: closingDetails.inCashierAmount,
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      console.log("Close register response:", response);
      if (response.status === 200) {
        setRegisterStatus({ status: "closed", register: null });
        return true;
      } else {
        setError(response.data.message || "Failed to close register");
        return false;
      }
    } catch (err) {
      console.error("Error closing register:", err);
      setError(err.message || "Failed to close register");
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Optionally, refresh register status on mount if user info is available
    // For example, get user id from auth context or local storage
  }, []);

  return (
    <RegisterContext.Provider
      value={{
        registerStatus,
        loading,
        error,
        refreshRegisterStatus,
        openRegister,
        closeRegister,
      }}
    >
      {children}
    </RegisterContext.Provider>
  );
};

export const useRegister = () => {
  return useContext(RegisterContext);
};
