// frontend/src/pages/Login/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/api';
import { setToken, setUser } from '../../utils/auth';
import './Login.css';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // make sure it’s imported

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(formData);
      setToken(response.data.token);
      setUser(response.data.user);

      // 🟢 Replace alert with beautiful toast
      toast.success("Welcome back! You’ve successfully signed in to Civix.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        icon: "✅",
        style: {
          background: "#fff",
          color: "#2e7d32",
          fontWeight: "500",
          borderRadius: "10px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        },
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        icon: "❌",
        style: {
          background: "#ffeaea",
          color: "#b71c1c",
          fontWeight: "500",
          borderRadius: "10px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-logo">
          <div className="logo-icon">
            <img src="/logo.png" alt="Civix Logo" className="logo-image" />
          </div>
          <h1>CIVIX</h1>
        </div>
        <h2>Hello, welcome!</h2>
        <p className="login-tagline">
          Engage, vote, and make your voice heard.
        </p>
        <ul className="login-benefits">
          <li>• Connect with your community and participate in local decisions</li>
          <li>• Stay informed about civic issues that matter to you</li>
          <li>• Make your voice heard in important community votes</li>
        </ul>
      </div>

      <div className="login-right">
        <div className="login-form-container">
          <h2>Login</h2>
          <p className="login-subtitle">Welcome back! Please enter your details.</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                name="email"
                placeholder="name@mail.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <span
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEye /> : <FaEyeSlash />}
                </span>
              </div>
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <span className="forgot-password" onClick={() => navigate('/forgot-password')}>
                Forgot password?
              </span>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="signup-link">
            Not a member yet?{' '}
            <span onClick={() => navigate('/signup')}>Sign up</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
