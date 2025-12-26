import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../../services/api';
import './Signup.css';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from "react-icons/fa"; 

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'Citizen',
    location: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 👇 New state for show/hide password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      const response = await signup(formData);
      toast.success(response.data.message || "Signup successful! Please log in to continue.");
      setTimeout(() => {
        navigate('/verify-otp', { state: { email: formData.email } });
      }, 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Signup failed. Please try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-left">
        <div className="signup-logo">
          <div className="logo-icon">
            <img src="/logo.png" alt="Civix Logo" className="logo-image" />
          </div>
          <h1>CIVIX</h1>
        </div>
        <h2>Hello, welcome!</h2>
        <p className="signup-tagline">
          Engage, vote, and make your voice heard.
        </p>
        <ul className="signup-benefits">
          <li>• Connect with your community and participate in local decisions</li>
          <li>• Stay informed about civic issues that matter to you</li>
          <li>• Make your voice heard in important community votes</li>
        </ul>
      </div>

      <div className="signup-right">
        <div className="signup-form-container">
          <h2>Create an Account</h2>
          <p className="signup-subtitle">Join the community to make your voice heard.</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>

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

            {/* 👇 Password Field with Eye Icon */}
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
                  className="password-toggle-icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? < FaEye /> : <FaEyeSlash />}
                </span>
              </div>
            </div>

            {/* 👇 Confirm Password Field with Eye Icon */}
            <div className="form-group">
              <label>Confirm Password</label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <span
                  className="password-toggle-icon"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEye /> : < FaEyeSlash />}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>I am a:</label>
              <div className="user-type-buttons">
                <button
                  type="button"
                  className={formData.userType === 'Citizen' ? 'active' : ''}
                  onClick={() => setFormData({ ...formData, userType: 'Citizen' })}
                >
                  Citizen
                </button>
                <button
                  type="button"
                  className={formData.userType === 'Official' ? 'active' : ''}
                  onClick={() => setFormData({ ...formData, userType: 'Official' })}
                >
                  Official
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                placeholder="Enter your location"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="signup-button" disabled={loading}>
              {loading ? 'Signing up...' : 'Sign up'}
            </button>
          </form>

          <p className="login-link">
            Already have an account?{' '}
            <span onClick={() => navigate('/login')}>Login</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
