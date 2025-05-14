import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const RegisterContext = createContext();

export const RegisterProvider = ({ children }) => {
  const [registerStatus, setRegisterStatus] = useState({
    isOpen: false,
    cashOnHand: 0,
    openedAt: null,
    closedAt: null,
    userId: null,
    registerId: null,
    terminalId: null,
    totalSales: 0,
    totalSalesQty: 0,
    openingCash: 0,
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getTerminalId = useCallback(() => {
    let terminalId = localStorage.getItem("terminalId");
    if (!terminalId) {
      terminalId = `TERM-${uuidv4().substr(0, 8)}`;
      localStorage.setItem("terminalId", terminalId);
    }
    return terminalId;
  }, []);

  const terminalId = getTerminalId();

  const getAuthHeaders = useCallback(() => {
    const storedUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!storedUser) return {};

    const user = JSON.parse(storedUser);

    // Check if token is expired
    const isTokenExpired = (token) => {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const exp = payload.exp;
        if (!exp) return false;
        return Date.now() >= exp * 1000;
      } catch (e) {
        return false;
      }
    };

    if (isTokenExpired(user.token)) {
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      window.location.href = "/login";
      return {};
    }

    return {
      headers: {
        Authorization: `Bearer ${user.token}`,
        "Content-Type": "application/json",
      },
    };
  }, []);

  // Add axios interceptor to handle 401 errors globally
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("user");
          sessionStorage.removeItem("user");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const fetchRegisterStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storedUser =
        localStorage.getItem("user") || sessionStorage.getItem("user");
      if (!storedUser) {
        // No user logged in - clear any existing register status
        setRegisterStatus((prev) => ({
          ...prev,
          isOpen: false,
          cashOnHand: 0,
          openedAt: null,
          closedAt: null,
          userId: null,
          registerId: null,
          terminalId: null,
        }));
        localStorage.removeItem("registerStatus");
        return;
      }

      // First try to get fresh status from backend
      const user = JSON.parse(storedUser);
      const response = await axios.get("/api/register/status", {
        params: { user_id: user.id },
        ...getAuthHeaders(),
      });

      if (response.data.status === "open" && response.data.register) {
        const register = response.data.register;
        const newStatus = {
          isOpen: true,
          cashOnHand: register.cash_on_hand,
          openedAt: new Date(register.opened_at),
          closedAt: register.closed_at ? new Date(register.closed_at) : null,
          userId: register.user_id,
          registerId: register.id,
          terminalId: register.terminal_id,
          totalSales: Number(register.total_sales) || 0,
          totalSalesQty: Number(register.total_sales_qty) || 0,
          openingCash: Number(register.opening_cash) || 0,
        };

        setRegisterStatus(newStatus);
        // Update local storage with fresh data from backend
        localStorage.setItem("registerStatus", JSON.stringify(newStatus));
        return;
      }

      // If register is not open from backend response
      setRegisterStatus((prev) => ({
        ...prev,
        isOpen: false,
        cashOnHand: 0,
        openedAt: null,
        closedAt: null,
        userId: null,
        registerId: null,
        terminalId: terminalId,
      }));
      localStorage.removeItem("registerStatus");
    } catch (error) {
      console.error("Failed to fetch register status:", error);
      setError(
        error.response?.data?.message || "Failed to fetch register status"
      );

      // Fallback to local storage only if the error isn't 401 (unauthorized)
      if (!error.response || error.response.status !== 401) {
        const savedStatus = localStorage.getItem("registerStatus");
        if (savedStatus) {
          const parsedStatus = JSON.parse(savedStatus);
          // Verify the saved status isn't too old (e.g., more than 24 hours)
          if (
            parsedStatus.openedAt &&
            new Date() - new Date(parsedStatus.openedAt) < 24 * 60 * 60 * 1000
          ) {
            setRegisterStatus(parsedStatus);
          } else {
            localStorage.removeItem("registerStatus");
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, terminalId]);
  const openRegister = async ({ user_id, terminal_id, opening_cash }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        "/api/register/open",
        {
          user_id: user_id,
          terminal_id: terminal_id,
          opening_cash: opening_cash,
        },
        getAuthHeaders()
      );

      if (response.status === 201) {
        const register = response.data.register;
        const newStatus = {
          isOpen: true,
          cashOnHand: register.opening_balance, // Use opening_balance from response
          openedAt: new Date(register.opened_at),
          closedAt: null,
          userId: register.user_id,
          registerId: register.id,
          terminalId: terminal_id, // Use the terminal_id from the request
          totalSales: 0,
          totalSalesQty: 0,
          openingCash: register.opening_balance,
        };

        setRegisterStatus(newStatus);
        localStorage.setItem("registerStatus", JSON.stringify(newStatus)); // Save to localStorage
        return { success: true, register: newStatus };
      }
      return { success: false };
    } catch (error) {
      console.error("Failed to open register:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to open register"
      );
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to open register",
      };
    } finally {
      setLoading(false);
    }
  };

  const closeRegister = async (closingDetails) => {
    setLoading(true);
    setError(null);
    try {
      if (!registerStatus.registerId) {
        throw new Error("No open register session to close.");
      }

      const response = await axios.post(
        "/api/register/close",
        {
          register_id: registerStatus.registerId,
          closing_balance: closingDetails.inCashierAmount,
          actual_cash:
            closingDetails.inCashierAmount + (closingDetails.otherAmount || 0),
        },
        getAuthHeaders()
      );

      if (response.status === 200) {
        const register = response.data.register;
        const newStatus = {
          isOpen: false,
          cashOnHand: 0,
          openedAt: null,
          closedAt: response.data.closing_time
            ? new Date(response.data.closing_time)
            : null,
          userId: null,
          registerId: null,
          terminalId: null,
          totalSales: response.data.total_sales || 0,
          totalSalesQty: response.data.total_sales_qty || 0,
          openingCash: response.data.opening_cash || 0,
          notes: response.data.notes || "",
        };

        setRegisterStatus(newStatus);
        return {
          success: true,
          totalSales: response.data.total_sales,
          totalSalesQty: response.data.total_sales_qty,
          openingCash: response.data.opening_cash,
          closingTime: response.data.closing_time,
          notes: response.data.notes,
        };
      }
      return { success: false, error: "Unexpected response from server" };
    } catch (error) {
      console.error("Failed to close register:", error);
      setError(error.message);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to close register",
      };
    } finally {
      setLoading(false);
    }
  };

  const refreshRegisterStatus = useCallback(() => {
    fetchRegisterStatus();
  }, [fetchRegisterStatus]);

  useEffect(() => {
    fetchRegisterStatus();
  }, [fetchRegisterStatus]);

  return (
    <RegisterContext.Provider
      value={{
        registerStatus,
        openRegister,
        closeRegister,
        loading,
        error,
        refreshRegisterStatus,
        terminalId,
        getAuthHeaders,
      }}
    >
      {children}
    </RegisterContext.Provider>
  );
};

export const useRegister = () => useContext(RegisterContext);
