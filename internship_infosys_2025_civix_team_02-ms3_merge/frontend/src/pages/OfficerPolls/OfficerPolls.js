import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaFilter, FaTimes, FaCheck, FaUser, FaPoll, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { getOfficerPolls, officerUpdatePollStatus, createPoll as apiCreatePoll } from '../../services/api';
import { toast } from 'react-toastify';
import './OfficerPolls.css';

const OfficerPolls = ({ initialPollId }) => {
  const [polls, setPolls] = useState([]);

  const [pollTab, setPollTab] = useState('pending');
  const [expandedPollId, setExpandedPollId] = useState(initialPollId || null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const [filters, setFilters] = useState({
    location: 'All Locations',
    category: 'All Categories'
  });

  const [newPoll, setNewPoll] = useState({
    question: '',
    description: '',
    category: '',
    location: '',
    closesOn: '',
    options: ['', '']
  });

  const MAX_DESCRIPTION_LENGTH = 200;

  const categories = ['All Categories', 'Transportation', 'Public Works', 'Recreation', 'Education', 'Environment', 'Infrastructure'];
  const locations = ['All Locations', 'Old Town', 'City Center', 'North Suburbs', 'South District', 'East Bay', 'West End', 'City Wide'];

  // Load polls from backend
  const fetchPolls = async () => {
    try {
      const res = await getOfficerPolls({
        status: pollTab === 'all' ? 'all' : (pollTab === 'pending' ? 'Pending Review' : pollTab === 'approved' ? 'Approved' : 'Rejected'),
        location: filters.location,
        category: filters.category,
      });
      const list = Array.isArray(res.data) ? res.data : [];
      setPolls(list);
    } catch (err) {
      console.error('Failed to fetch officer polls', err);
      toast.error(err?.response?.data?.message || 'Failed to fetch polls');
    }
  };

  useEffect(() => {
    fetchPolls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollTab, filters]);

  const handleCreatePoll = async () => {
    const errors = {};
    
    if (!newPoll.question.trim()) {
      errors.question = 'Poll question is required';
    }
    
    if (!newPoll.category) {
      errors.category = 'Please select a category';
    }
    
    if (!newPoll.location.trim()) {
      errors.location = 'Location is required';
    }
    
    const filledOptions = newPoll.options.filter(opt => opt.trim());
    if (filledOptions.length < 2) {
      errors.options = 'At least 2 options are required';
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setValidationErrors({});
    
    try {
      const payload = {
      question: newPoll.question,
      description: newPoll.description,
      category: newPoll.category,
      location: newPoll.location,
        closesOn: newPoll.closesOn,
        options: newPoll.options.filter(opt => opt.trim()),
      };

      // Use citizen poll create API so it appears to citizens; officerStatus will default to "Pending Review"
      await apiCreatePoll(payload);

      toast.success('Poll created');
    setShowCreateModal(false);
    setNewPoll({
      question: '',
      description: '',
      category: '',
      location: '',
      closesOn: '',
        options: ['', ''],
    });

      fetchPolls();
    } catch (err) {
      console.error('Create poll failed', err);
      toast.error(err?.response?.data?.message || 'Failed to create poll');
    }
  };

  const addOption = () => {
    if (newPoll.options.length < 6) {
      setNewPoll({ ...newPoll, options: [...newPoll.options, ''] });
    }
  };

  const removeOption = (index) => {
    if (newPoll.options.length > 2) {
      setNewPoll({
        ...newPoll,
        options: newPoll.options.filter((_, i) => i !== index)
      });
    }
  };

  const updateOption = (index, value) => {
    const updatedOptions = [...newPoll.options];
    updatedOptions[index] = value;
    setNewPoll({ ...newPoll, options: updatedOptions });
  };

  const handleApprovePoll = (poll) => {
    setSelectedPoll(poll);
    setShowApproveModal(true);
  };

  const handleRejectPoll = (poll) => {
    setSelectedPoll(poll);
    setShowRejectModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedPoll) return;
    try {
      await officerUpdatePollStatus(selectedPoll.id, 'Approved');
      toast.success('Poll approved');
      setShowApproveModal(false);
      setSelectedPoll(null);
      fetchPolls();
    } catch (err) {
      console.error('Approve poll failed', err);
      toast.error(err?.response?.data?.message || 'Failed to approve poll');
    }
  };

  const confirmReject = async () => {
    if (!selectedPoll) return;
    try {
      await officerUpdatePollStatus(selectedPoll.id, 'Rejected');
      toast.success('Poll rejected');
      setShowRejectModal(false);
      setSelectedPoll(null);
      fetchPolls();
    } catch (err) {
      console.error('Reject poll failed', err);
      toast.error(err?.response?.data?.message || 'Failed to reject poll');
    }
  };

  const getFilteredPolls = () => {
    let filtered = polls;

    if (pollTab === 'pending') {
      filtered = filtered.filter(p => p.status === 'Pending Review');
    } else if (pollTab === 'approved') {
      filtered = filtered.filter(p => p.status === 'Approved');
    } else if (pollTab === 'rejected') {
      filtered = filtered.filter(p => p.status === 'Rejected');
    }

    if (filters.location !== 'All Locations') {
      filtered = filtered.filter(p => p.location === filters.location);
    }

    if (filters.category !== 'All Categories') {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    return filtered;
  };

  const getPercentage = (votes, total) => {
    return total > 0 ? ((votes / total) * 100).toFixed(1) : 0;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending Review':
        return 'status-pending';
      case 'Approved':
        return 'status-approved';
      case 'Rejected':
        return 'status-rejected';
      default:
        return '';
    }
  };

  const filteredPolls = getFilteredPolls();

  return (
    <div className="officer-polls-wrapper">
      <div className="officer-polls-container">
        {/* Header Section */}
        <div className="officer-polls-header">
          <div className="officer-header-content">
            <h1>Poll Management</h1>
            <p className="officer-header-subtitle">Review, approve, or reject citizen polls and engage with community feedback.</p>
          </div>
          <button className="officer-create-poll-btn" onClick={() => setShowCreateModal(true)}>
            Create Poll
          </button>
        </div>

        {/* Tabs Section */}
        <div className="officer-polls-tabs">
          <button 
            className={pollTab === 'pending' ? 'officer-tab-btn active' : 'officer-tab-btn'}
            onClick={() => setPollTab('pending')}
          >
            Pending Review
          </button>
          <button 
            className={pollTab === 'approved' ? 'officer-tab-btn active' : 'officer-tab-btn'}
            onClick={() => setPollTab('approved')}
          >
            Approved
          </button>
          <button 
            className={pollTab === 'rejected' ? 'officer-tab-btn active' : 'officer-tab-btn'}
            onClick={() => setPollTab('rejected')}
          >
            Rejected
          </button>
          <button 
            className={pollTab === 'all' ? 'officer-tab-btn active' : 'officer-tab-btn'}
            onClick={() => setPollTab('all')}
          >
            All Polls
          </button>
        </div>

        {/* Filters Section */}
        <div className="officer-polls-filters">
          <div className="officer-filter-item">
            <FaMapMarkerAlt className="officer-filter-icon" />
            <select 
              className="officer-filter-select"
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
            >
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div className="officer-filter-item">
            <FaFilter className="officer-filter-icon" />
            <select 
              className="officer-filter-select"
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Polls List */}
        <div className="officer-polls-list">
          {filteredPolls.map(poll => (
            <div key={poll.id} className="officer-poll-item">
              <div className="officer-poll-item-header">
                <div className="officer-poll-item-info">
                  <div className="officer-poll-status-badge-container">
                    <h3 className="officer-poll-item-question">{poll.question}</h3>
                    <span className={`officer-poll-status-badge ${getStatusColor(poll.status)}`}>
                      {poll.status}
                    </span>
                  </div>
                  <div className="officer-poll-item-meta">
                    <span className="officer-meta-item">
                      <strong>CATEGORY:</strong> {poll.category.toUpperCase()}
                    </span>
                    <span className="officer-meta-item">
                      <FaMapMarkerAlt /> <strong>LOCATION:</strong> {poll.location.toUpperCase()}
                    </span>
                    <span className="officer-meta-item">
                      <FaUser /> <strong>CREATED BY:</strong> {poll.createdBy.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="officer-poll-item-stats">
                  <div className="officer-poll-votes-count">{poll.totalVotes} votes</div>
                  {poll.status === 'Pending Review' ? (
                    <div className="officer-poll-closes-in">Closes in {poll.closesIn}</div>
                  ) : (
                    <div className="officer-poll-closed-date">Closed on {poll.closedOn}</div>
                  )}
                </div>
              </div>

              {/* Poll Results */}
              <div className="officer-poll-results">
                <h4 className="officer-results-title">Results:</h4>
                <div className="officer-results-list">
                  {poll.options.map(option => (
                    <div key={option.id} className="officer-result-row">
                      <div className="officer-result-info">
                        <span className="officer-result-label">{option.text}</span>
                        <span className="officer-result-percentage">
                          {getPercentage(option.votes, poll.totalVotes)}% ({option.votes})
                        </span>
                      </div>
                      <div className="officer-result-bar-container">
                        <div 
                          className="officer-result-bar-fill"
                          style={{ width: `${getPercentage(option.votes, poll.totalVotes)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Official Action Section */}
              {poll.status === 'Pending Review' && (
                <div className="officer-action-section">
                  <div className="officer-action-header">
                    <FaCheckCircle className="officer-action-icon" />
                    <div className="officer-action-text">
                      <h4>OFFICIAL ACTION</h4>
                      <p>As a verified official, your validation is required to publish these results to the public dashboard. Please review the content carefully before approving.</p>
                    </div>
                  </div>
                  <div className="officer-action-buttons">
                    <button 
                      className="officer-approve-btn"
                      onClick={() => handleApprovePoll(poll)}
                    >
                      <FaCheck /> Approve Poll
                    </button>
                    <button 
                      className="officer-reject-btn"
                      onClick={() => handleRejectPoll(poll)}
                    >
                      <FaTimes /> Reject Poll
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredPolls.length === 0 && (
          <div className="officer-empty-state">
            <div className="officer-empty-icon">📊</div>
            <h3 className="officer-empty-title">No Polls Found</h3>
            <p className="officer-empty-text">
              {pollTab === 'pending' 
                ? "No polls are currently pending review." 
                : pollTab === 'approved'
                ? "No polls have been approved yet."
                : pollTab === 'rejected'
                ? "No polls have been rejected."
                : "No polls match your current filters."}
            </p>
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedPoll && (
        <div className="officer-modal-overlay" onClick={() => setShowApproveModal(false)}>
          <div className="officer-modal-container officer-approve-modal" onClick={(e) => e.stopPropagation()}>
            <button className="officer-modal-close-btn" onClick={() => setShowApproveModal(false)}>
              <FaTimes />
            </button>
            
            <div className="officer-approve-modal-icon">
              <FaCheckCircle />
            </div>
            
            <h2 className="officer-modal-title">Approve Poll?</h2>
            
            <p className="officer-modal-text">
              You are about to approve 
              <strong>"{selectedPoll.question}"</strong>
              This poll will be published to the public dashboard and marked as officially validated.
            </p>

            <div className="officer-modal-info">
              <div className="officer-info-item">
                <span className="officer-info-label">Total Votes:</span>
                <span className="officer-info-value">{selectedPoll.totalVotes}</span>
              </div>
              <div className="officer-info-item">
                <span className="officer-info-label">Category:</span>
                <span className="officer-info-value">{selectedPoll.category}</span>
              </div>
            </div>

            <div className="officer-modal-actions">
              <button className="officer-modal-cancel-btn" onClick={() => setShowApproveModal(false)}>
                Cancel
              </button>
              <button className="officer-modal-approve-btn" onClick={confirmApprove}>
                <FaCheck /> Approve Poll
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedPoll && (
        <div className="officer-modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="officer-modal-container officer-reject-modal" onClick={(e) => e.stopPropagation()}>
            <button className="officer-modal-close-btn" onClick={() => setShowRejectModal(false)}>
              <FaTimes />
            </button>
            
            <div className="officer-reject-modal-icon">
              <FaTimesCircle />
            </div>
            
            <h2 className="officer-modal-title">Reject Poll?</h2>
            
            <p className="officer-modal-text">
              You are about to reject 
              <strong>"{selectedPoll.question}"</strong>
              This poll will be marked as rejected and will not appear on the public dashboard.
            </p>

            <div className="officer-modal-info">
              <div className="officer-info-item">
                <span className="officer-info-label">Total Votes:</span>
                <span className="officer-info-value">{selectedPoll.totalVotes}</span>
              </div>
              <div className="officer-info-item">
                <span className="officer-info-label">Created By:</span>
                <span className="officer-info-value">{selectedPoll.createdBy}</span>
              </div>
            </div>

            <div className="officer-modal-actions">
              <button className="officer-modal-cancel-btn" onClick={() => setShowRejectModal(false)}>
                Cancel
              </button>
              <button className="officer-modal-reject-btn" onClick={confirmReject}>
                <FaTimes /> Reject Poll
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Poll Modal */}
      {showCreateModal && (
        <div className="officer-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="officer-modal-container officer-create-poll-modal" onClick={(e) => e.stopPropagation()}>
            <div className="officer-create-modal-header">
              <h2 className="officer-modal-title">Create a New Poll</h2>
              <button className="officer-modal-close-btn officer-create-close-btn" onClick={() => setShowCreateModal(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="officer-create-modal-body">
              <div className="officer-form-group">
                <label className="officer-form-label">Poll Question *</label>
                <input
                  type="text"
                  className={`officer-form-input ${validationErrors.question ? 'error' : ''}`}
                  placeholder="e.g., Should we build a new park?"
                  value={newPoll.question}
                  onChange={(e) => {
                    setNewPoll({...newPoll, question: e.target.value});
                    if (validationErrors.question) {
                      setValidationErrors({...validationErrors, question: ''});
                    }
                  }}
                />
                {validationErrors.question && (
                  <span className="officer-error-message">{validationErrors.question}</span>
                )}
              </div>

              <div className="officer-form-group">
                <label className="officer-form-label">
                  Description (Optional) 
                  <span className="officer-char-count">
                    {newPoll.description.length}/{MAX_DESCRIPTION_LENGTH}
                  </span>
                </label>
                <textarea
                  className="officer-form-textarea"
                  placeholder="Provide more context or details about the poll..."
                  value={newPoll.description}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_DESCRIPTION_LENGTH) {
                      setNewPoll({...newPoll, description: e.target.value});
                    }
                  }}
                  rows="3"
                  maxLength={MAX_DESCRIPTION_LENGTH}
                />
              </div>

              <div className="officer-form-row-three">
                <div className="officer-form-group">
                  <label className="officer-form-label">Category *</label>
                  <select
                    className={`officer-form-select ${validationErrors.category ? 'error' : ''}`}
                    value={newPoll.category}
                    onChange={(e) => {
                      setNewPoll({...newPoll, category: e.target.value});
                      if (validationErrors.category) {
                        setValidationErrors({...validationErrors, category: ''});
                      }
                    }}
                  >
                    <option value="">Select Category</option>
                    {categories.filter(c => c !== 'All Categories').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {validationErrors.category && (
                    <span className="officer-error-message">{validationErrors.category}</span>
                  )}
                </div>

                <div className="officer-form-group">
                  <label className="officer-form-label">Geo-Tag (Location) *</label>
                  <input
                    type="text"
                    className={`officer-form-input ${validationErrors.location ? 'error' : ''}`}
                    placeholder="e.g., Downtown District"
                    value={newPoll.location}
                    onChange={(e) => {
                      setNewPoll({...newPoll, location: e.target.value});
                      if (validationErrors.location) {
                        setValidationErrors({...validationErrors, location: ''});
                      }
                    }}
                  />
                  {validationErrors.location && (
                    <span className="officer-error-message">{validationErrors.location}</span>
                  )}
                </div>

                <div className="officer-form-group">
                  <label className="officer-form-label">Closes on</label>
                  <input
                    type="date"
                    className="officer-form-input officer-date-input"
                    value={newPoll.closesOn}
                    onChange={(e) => setNewPoll({...newPoll, closesOn: e.target.value})}
                  />
                </div>
              </div>

              <div className="officer-form-group">
                <label className="officer-form-label">Options *</label>
                {newPoll.options.map((option, index) => (
                  <div key={index} className="officer-option-input-group">
                    <input
                      type="text"
                      className={`officer-form-input officer-option-input ${validationErrors.options ? 'error' : ''}`}
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => {
                        updateOption(index, e.target.value);
                        if (validationErrors.options) {
                          setValidationErrors({...validationErrors, options: ''});
                        }
                      }}
                    />
                    {newPoll.options.length > 2 && (
                      <button 
                        className="officer-remove-option-btn"
                        onClick={() => removeOption(index)}
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                ))}
                {validationErrors.options && (
                  <span className="officer-error-message">{validationErrors.options}</span>
                )}
                {newPoll.options.length < 6 && (
                  <button className="officer-add-option-btn" onClick={addOption}>
                    <FaCheckCircle /> Add Option
                  </button>
                )}
              </div>

              <button className="officer-create-submit-btn" onClick={handleCreatePoll}>
                Create Poll
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerPolls;