import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/NewAuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faUser,
  faLock,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import "./Login.css";
import { usePermissions } from "../constants/permissions";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login, user } = useAuth(); // Retrieve user from context
  const navigate = useNavigate();

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const { loadPermissions } = usePermissions() || {}; // Added fallback

  // New state variables for company details
  const [companyName, setCompanyName] = useState("Loading...");
  const [companyType, setCompanyType] = useState("");

  useEffect(() => {
    // Ensure that user and user.permissions exist before calling loadPermissions
    if (user && user.permissions && loadPermissions) {
      loadPermissions(user.permissions);
    }
  }, [user, loadPermissions]); // Added user and loadPermissions as dependencies

  useEffect(() => {
    // Check for remembered credentials
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
    emailRef.current.focus();

    // Fetch company details on mount
    const fetchCompanyDetails = async () => {
      try {
        // Fetch list of companies with id and company_name
        const listResponse = await axios.get(
          "https://sharvakshafoodcity.com.lk/backend/public/api/companies?fields=id,company_name"
        );
        const companies = listResponse.data;
        if (companies.length > 0) {
          // Fetch details of the first company
          const firstCompanyName = companies[0].company_name;
          const detailResponse = await axios.get(
            `https://sharvakshafoodcity.com.lk/backend/public/api/companies/${firstCompanyName}`
          );
          const companyData = detailResponse.data;
          setCompanyName(companyData.company_name || "Company");
          setCompanyType(companyData.company_type || "");
        } else {
          setCompanyName("Company");
          setCompanyType("");
        }
      } catch (error) {
        console.error("Error fetching company details:", error);
        setCompanyName("Company");
        setCompanyType("");
      }
    };

    fetchCompanyDetails();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Both fields are required.");
      setSuccess(false);
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const credentials = { email, password };
      const userData = await login(credentials);

      // Remember email if checkbox is checked
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
      setSuccess(true);
      setEmail("");
      setPassword("");
      navigate("/dashboard");
    } catch (err) {
      setSuccess(false);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e, nextFieldRef) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextFieldRef) {
        nextFieldRef.current.focus();
      } else {
        handleLogin();
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <motion.div
          className="login-box"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="login-header">
            <h2 className="login-title">{companyName}</h2>
            <h3 className="login-subtitle">{companyType}</h3>
            <p className="login-subtitle">Sign in to your account</p>
          </div>

          {success && (
            <motion.div
              className="success-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              Login Successful! Redirecting...
            </motion.div>
          )}

          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {error}
            </motion.div>
          )}

          <div className="input-group">
            <div className="input-icon">
              <FontAwesomeIcon icon={faUser} />
            </div>
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, passwordRef)}
              placeholder="Email address"
              aria-label="Email"
              className="login-input"
            />
          </div>

          <div className="input-group">
            <div className="input-icon">
              <FontAwesomeIcon icon={faLock} />
            </div>
            <input
              ref={passwordRef}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, null)}
              placeholder="Password"
              aria-label="Password"
              className="login-input"
            />
            <button
              type="button"
              className="show-password-button p-2 mt-0"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </button>
          </div>

          <div className="login-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <a href="/forgot-password" className="forgot-password">
              Forgot password?
            </a>
          </div>

          <motion.button
            onClick={handleLogin}
            className="login-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                <span>Signing in...</span>
              </>
            ) : (
              "Sign in"
            )}
          </motion.button>

          <div className="login-footer">
            Don't have an account? <a href="/register">Sign up</a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
