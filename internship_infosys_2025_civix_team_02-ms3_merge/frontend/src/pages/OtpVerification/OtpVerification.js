// frontend/src/pages/OtpVerification/OtpVerification.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyOTP, resendOTP } from '../../services/api';
import './OtpVerification.css';
import { toast } from 'react-toastify';

const OtpVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/signup');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto focus next input
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`).focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');

    if (otpValue.length !== 6) {
      setError('Please enter complete OTP');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await verifyOTP({ email, otp: otpValue });
      toast.success(response.data.message || 'OTP verified successfully!');
      setTimeout(() => {
        navigate('/login'); 
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setLoading(true);
    setError('');

    try {
      const response = await resendOTP(email);
      alert(response.data.message);
      setResendTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-container">
      <div className="otp-left">
        <div className="otp-logo">
          <div className="logo-icon">
            <img src="/logo.png" alt="Civix Logo" className="logo-image" />
          </div>
          <h1>CIVIX</h1>
        </div>
        <h2>Verify Your Email</h2>
        <p className="otp-info">
          We've sent a 6-digit verification code to your email address. Please
          enter it below to verify your account.
        </p>
      </div>

      <div className="otp-right">
        <div className="otp-form-container">
          <h2>Enter Verification Code</h2>
          <p className="otp-subtitle">
            Please check your email: <strong>{email}</strong>
          </p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="otp-inputs">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="otp-input"
                />
              ))}
            </div>

            <button type="submit" className="verify-button" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="resend-section">
            {canResend ? (
              <p>
                Didn't receive the code?{' '}
                <span onClick={handleResend} className="resend-link">
                  Resend OTP
                </span>
              </p>
            ) : (
              <p>
                Resend OTP in <strong>{resendTimer}s</strong>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpVerification;