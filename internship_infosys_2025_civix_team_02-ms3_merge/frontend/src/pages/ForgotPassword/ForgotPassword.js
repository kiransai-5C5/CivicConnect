// frontend/src/pages/ForgotPassword/ForgotPassword.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../../services/api';
import './ForgotPassword.css';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const toastId = toast.loading('Sending OTP...');

try {
  const response = await forgotPassword({ email });
  toast.update(toastId, {
    render: response.data.message || 'OTP sent successfully!',
    type: 'success',
    isLoading: false,
    autoClose: 2000,
  });
  setTimeout(() => {
    navigate('/reset-password-verify', { state: { email } });
  }, 1500);

    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to send OTP';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-left">
        <div className="forgot-password-logo">
          <div className="logo-icon">
            <img src="/logo.png" alt="Civix Logo" className="logo-image" />
          </div>
          <h1>CIVIX</h1>
        </div>
        <h2>Forgot Password?</h2>
        <p className="forgot-password-info">
          Don't worry! It happens. Please enter the email address associated with your account.
        </p>
      </div>

      <div className="forgot-password-right">
        <div className="forgot-password-form-container">
          <h2>Reset Password</h2>
          <p className="forgot-password-subtitle">
            Enter your email and we'll send you an OTP to reset your password.
          </p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                placeholder="name@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="send-otp-button" disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
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

export default ForgotPassword;