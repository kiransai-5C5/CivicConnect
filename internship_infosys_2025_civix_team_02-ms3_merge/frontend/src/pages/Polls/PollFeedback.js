import React, { useState } from 'react';
import { FaTimes, FaStar, FaCheckCircle } from 'react-icons/fa';
import './PollFeedback.css';
import { submitPollFeedback } from '../../services/api';

const PollFeedback = ({
  show,
  onClose,
  selectedOption,
  pollQuestion,
  pollId,
  optionId,
}) => {
  const [feedback, setFeedback] = useState({
    reason: '',
    improvements: '',
    concerns: '',
    rating: '4 - Good'
  });

  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const ratings = [
    '5 - Excellent',
    '4 - Good',
    '3 - Average',
    '2 - Below Average',
    '1 - Poor'
  ];

  const handleSubmit = async () => {
    const newErrors = {};
    
    if (!feedback.reason.trim()) {
      newErrors.reason = 'Please provide a reason for your choice';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // send feedback to backend
      await submitPollFeedback(pollId, {
        optionId,
        selectedOption,
        pollQuestion,
        reason: feedback.reason,
        improvements: feedback.improvements,
        concerns: feedback.concerns,
        rating: feedback.rating,
      });

      // Show success notification
      setShowSuccess(true);

      // Auto-hide notification and close modal after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
        setFeedback({
          reason: '',
          improvements: '',
          concerns: '',
          rating: '4 - Good',
        });
        setErrors({});
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting poll feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    }
  };

  const handleCancel = () => {
    setFeedback({
      reason: '',
      improvements: '',
      concerns: '',
      rating: '4 - Good'
    });
    setErrors({});
    setShowSuccess(false);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="feedback-modal-overlay" onClick={handleCancel}>
      <div className="feedback-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="feedback-close-btn" onClick={handleCancel}>
          <FaTimes />
        </button>

        {/* Success Notification */}
        {showSuccess && (
          <div className="feedback-success-notification">
            <FaCheckCircle className="success-icon" />
            <span>Feedback Submitted Successfully!</span>
          </div>
        )}

        {/* Left Panel */}
        <div className="feedback-left-panel">
          <div className="feedback-icon-container">
            <FaStar className="feedback-star-icon" />
          </div>
          <h2 className="feedback-left-title">Your Voice Matters</h2>
          <p className="feedback-left-description">
            Providing detailed feedback helps officials make better data-driven decisions for your district.
          </p>

          <div className="feedback-selected-option">
            <span className="feedback-selected-label">YOU SELECTED</span>
            <div className="feedback-selected-value">
              <div className="feedback-selected-indicator"></div>
              {selectedOption}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="feedback-right-panel">
          <h2 className="feedback-title">Poll Feedback</h2>
          <p className="feedback-subtitle">
            Help improve future polls by sharing why you chose that option.
          </p>

          <div className="feedback-form">
            {/* Reason for Choice */}
            <div className="feedback-form-group">
              <label className="feedback-label">
                Reason for Choice <span className="feedback-required">*</span>
              </label>
              <textarea
                className={`feedback-textarea ${errors.reason ? 'error' : ''}`}
                placeholder="Why did you pick this option?"
                value={feedback.reason}
                onChange={(e) => {
                  setFeedback({ ...feedback, reason: e.target.value });
                  if (errors.reason) {
                    setErrors({ ...errors, reason: '' });
                  }
                }}
                rows="3"
              />
              {errors.reason && (
                <span className="feedback-error-message">{errors.reason}</span>
              )}
            </div>

            {/* Improvements Needed */}
            <div className="feedback-form-group">
              <label className="feedback-label">
                Improvements Needed <span className="feedback-optional">(optional)</span>
              </label>
              <textarea
                className="feedback-textarea"
                placeholder="Any suggestions to improve the poll or option?"
                value={feedback.improvements}
                onChange={(e) => setFeedback({ ...feedback, improvements: e.target.value })}
                rows="3"
              />
            </div>

            {/* Concerns / Suggestions */}
            <div className="feedback-form-group">
              <label className="feedback-label">
                Concerns / Suggestions <span className="feedback-optional">(optional)</span>
              </label>
              <textarea
                className="feedback-textarea"
                placeholder="Any other concerns or suggestions?"
                value={feedback.concerns}
                onChange={(e) => setFeedback({ ...feedback, concerns: e.target.value })}
                rows="3"
              />
            </div>

            {/* Rating */}
            <div className="feedback-form-group">
              <label className="feedback-label">
                Rating <span className="feedback-required">*</span>
              </label>
              <select
                className="feedback-select"
                value={feedback.rating}
                onChange={(e) => setFeedback({ ...feedback, rating: e.target.value })}
              >
                {ratings.map(rating => (
                  <option key={rating} value={rating}>{rating}</option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="feedback-actions">
              <button className="feedback-cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
              <button className="feedback-submit-btn" onClick={handleSubmit}>
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PollFeedback;