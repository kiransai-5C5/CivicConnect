// frontend/src/pages/ResetPassword/ResetPassword.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { resetPassword } from '../../services/api';
import './ResetPassword.css';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from 'react-toastify';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const otp = location.state?.otp;

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email || !otp) {
      navigate('/forgot-password');
    }
  }, [email, otp, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword({
        email,
        otp,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      toast.success(response.data.message || 'Password reset successfully!')
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to reset password';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-left">
        <div className="reset-password-logo">
          <div className="logo-icon">
            <img src="/logo.png" alt="Civix Logo" className="logo-image" />
          </div>
          <h1>CIVIX</h1>
        </div>
        <h2>Create New Password</h2>
        <p className="reset-password-info">
          Your new password must be different from previously used passwords.
        </p>
      </div>

      <div className="reset-password-right">
        <div className="reset-password-form-container">
          <h2>Set New Password</h2>
          <p className="reset-password-subtitle">
            Please enter your new password below.
          </p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>New Password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="newPassword"
                  placeholder="Enter new password"
                  value={formData.newPassword}
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

            <div className="form-group">
              <label>Confirm New Password</label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <span
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
                </span>
              </div>
            </div>


            <button type="submit" className="reset-button" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <p className="back-to-login">
            Remember your password?{' '}
            <span onClick={() => navigate('/login')}>Back to Login</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;