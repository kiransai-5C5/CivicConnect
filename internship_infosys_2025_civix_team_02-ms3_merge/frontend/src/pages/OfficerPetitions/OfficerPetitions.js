import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaFilter, FaTimes, FaPaperPlane, FaCheck, FaExclamationTriangle, FaUser, FaClock, FaPlus } from 'react-icons/fa';
import { getOfficerPetitions, officerUpdatePetitionStatus, officerSetPetitionResponse, createPetition as apiCreatePetition } from '../../services/api';
import { toast } from 'react-toastify';
import './OfficerPetitions.css';

const OfficerPetitions = ({ initialPetitionId }) => {
  const [petitions, setPetitions] = useState([]);

  const [activeTab, setActiveTab] = useState('all');
  const [selectedPetition, setSelectedPetition] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [filters, setFilters] = useState({
    location: 'All Locations',
    category: 'All Categories',
    status: 'All'
  });

  const [newPetition, setNewPetition] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    goal: 100
  });

  const categories = ['All Categories', 'Infrastructure', 'Education', 'Environment', 'Public Safety', 'Healthcare'];
  const locations = ['All Locations', 'City Center', 'North District', 'South Suburbs', 'West End', 'East Bay', 'Rivertown'];
  const statuses = ['All', 'ACTIVE', 'UNDER REVIEW', 'CLOSED'];

  const mapStatusForBackend = (status) => {
    if (!status || status === 'All') return 'all';
    switch (status) {
      case 'ACTIVE':
        return 'active';
      case 'UNDER REVIEW':
        return 'under_review';
      case 'CLOSED':
        return 'closed';
      default:
        return 'all';
    }
  };

  // Load petitions from backend
  const fetchPetitions = async () => {
    try {
      const res = await getOfficerPetitions({
        status: mapStatusForBackend(filters.status),
        location: filters.location,
        category: filters.category,
      });
      const list = Array.isArray(res.data) ? res.data : [];
      setPetitions(list);
    } catch (err) {
      console.error('Failed to fetch officer petitions', err);
      toast.error(err?.response?.data?.message || 'Failed to fetch petitions');
    }
  };

  useEffect(() => {
    fetchPetitions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleCreatePetition = async () => {
    if (!newPetition.title || !newPetition.description || !newPetition.category || !newPetition.location) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const payload = {
        title: newPetition.title,
        description: newPetition.description,
        category: newPetition.category,
        location: newPetition.location,
        goal: newPetition.goal,
      };

      // Re-use citizen create API so this petition also appears on citizen side
      await apiCreatePetition(payload);
      toast.success('Petition created');
      setShowCreateModal(false);
      setNewPetition({
        title: '',
        description: '',
        category: '',
        location: '',
        goal: 100,
      });
      // Refresh officer list to include the new petition
      fetchPetitions();
    } catch (err) {
      console.error('Create petition failed', err);
      toast.error(err?.response?.data?.message || 'Failed to create petition');
    }
  };

  const handleCardClick = (petition) => {
    setSelectedPetition(petition);
    setShowDetailModal(true);
  };

  const handleWriteResponse = (petition, e) => {
    if (e) e.stopPropagation();
    setSelectedPetition(petition);
    setResponseText(petition.officialResponse || '');
    setShowResponseModal(true);
    setShowDetailModal(false);
  };

  const handleSubmitResponse = async () => {
    if (!responseText.trim() || !selectedPetition) return;

    try {
      await officerSetPetitionResponse(selectedPetition.id, responseText.trim());
      toast.success('Response posted');
      setShowResponseModal(false);
      setResponseText('');
      setSelectedPetition(null);
      fetchPetitions();
    } catch (err) {
      console.error('Failed to submit response', err);
      toast.error(err?.response?.data?.message || 'Failed to submit response');
    }
  };

  const handleChangeStatus = (petition, status, e) => {
    if (e) e.stopPropagation();
    setSelectedPetition(petition);
    setNewStatus(status);
    setShowStatusModal(true);
    setShowDetailModal(false);
  };

  const confirmStatusChange = async () => {
    if (!selectedPetition || !newStatus) return;

    // Map UI labels to backend values
    let backendStatus = null;
    if (newStatus === 'ACTIVE') backendStatus = 'active';
    else if (newStatus === 'UNDER REVIEW') backendStatus = 'under_review';
    else if (newStatus === 'CLOSED') backendStatus = 'closed';

    if (!backendStatus) {
      toast.error('Invalid status');
      return;
    }

    try {
      await officerUpdatePetitionStatus(selectedPetition.id, backendStatus);
      toast.success('Status updated');
      setShowStatusModal(false);
      setNewStatus('');
      setSelectedPetition(null);
      fetchPetitions();
    } catch (err) {
      console.error('Failed to update status', err);
      toast.error(err?.response?.data?.message || 'Failed to update status');
    }
  };

  const getFilteredPetitions = () => {
    let filtered = petitions;

    if (activeTab === 'my') {
      filtered = filtered.filter(p => p.officialResponse);
    } else if (activeTab === 'signed') {
      filtered = filtered.filter(p => p.status === 'UNDER REVIEW');
    }

    if (filters.location !== 'All Locations') {
      filtered = filtered.filter(p => p.location === filters.location);
    }

    if (filters.category !== 'All Categories') {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    if (filters.status !== 'All') {
      filtered = filtered.filter(p => p.status === filters.status);
    }

    return filtered;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'ACTIVE': return '#10b981';
      case 'UNDER REVIEW': return '#f59e0b';
      case 'APPROVE': return '#10b981';
      case 'CLOSED': return '#6b7280';
      default: return '#10b981';
    }
  };

  const getProgress = (signatures, goal) => {
    return Math.min((signatures / goal) * 100, 100);
  };

  const filteredPetitions = getFilteredPetitions();

  return (
    <div className="officer-petitions-wrapper">
      <div className="officer-petitions-container">
        {/* Header Section */}
        <div className="officer-petitions-header">
          <div className="header-content">
            <h1>Petitions Management</h1>
            <p className="header-subtitle">Review citizen petitions and provide official responses.</p>
          </div>
          <button className="create-petition-btn" onClick={() => setShowCreateModal(true)}>
            <FaPlus /> Create Petition
          </button>
        </div>

        {/* Tabs Section */}
        <div className="officer-petitions-tabs">
          <button 
            className={activeTab === 'all' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setActiveTab('all')}
          >
            All Petitions
          </button>
          <button 
            className={activeTab === 'my' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setActiveTab('my')}
          >
            My Responses
          </button>
          <button 
            className={activeTab === 'signed' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setActiveTab('signed')}
          >
            Under Review
          </button>
        </div>

        {/* Filters Section */}
        <div className="officer-petitions-filters">
          <div className="filter-item">
            <FaMapMarkerAlt className="filter-icon" />
            <select 
              className="filter-select"
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
            >
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <FaFilter className="filter-icon" />
            <select 
              className="filter-select"
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <select 
              className="filter-select"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              {statuses.map(status => (
                <option key={status} value={status}>Status: {status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Petitions Grid */}
        <div className="officer-petitions-grid">
          {filteredPetitions.map(petition => (
            <div key={petition.id} className="officer-petition-card" onClick={() => handleCardClick(petition)}>
              <div className="officer-petition-header">
                <div className="petition-meta">
                  <span className="meta-category">{petition.category}</span>
                  <span className="meta-separator">•</span>
                  <span className="meta-location">{petition.location}</span>
                </div>
                <span 
                  className="status-badge" 
                  style={{ backgroundColor: getStatusColor(petition.status) }}
                >
                  {petition.status}
                </span>
              </div>

              <h3 className="officer-petition-title">{petition.title}</h3>

              <p className="officer-petition-description">
                {petition.description.length > 150 
                  ? `${petition.description.substring(0, 150)}...` 
                  : petition.description}
              </p>

              <div className="officer-petition-progress">
                <div className="progress-info">
                  <span className="progress-text">{petition.signatures} / {petition.goal} signatures</span>
                  <span className="progress-percentage">
                    {Math.round(getProgress(petition.signatures, petition.goal))}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${getProgress(petition.signatures, petition.goal)}%`,
                      backgroundColor: getStatusColor(petition.status)
                    }}
                  />
                </div>
              </div>

              {petition.officialResponse && (
                <div className="officer-response-preview">
                  <div className="response-label">Official Response:</div>
                  <p className="response-text">
                    {petition.officialResponse.substring(0, 80)}...
                  </p>
                </div>
              )}

              <div className="officer-petition-footer">
                <span className="footer-text">
                  Created by {petition.createdBy === 'Official' ? <strong>Official</strong> : petition.createdBy} • {petition.createdDate}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredPetitions.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3 className="empty-title">No Petitions Found</h3>
            <p className="empty-text">No petitions match your current filters.</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedPetition && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-container detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowDetailModal(false)}>
              <FaTimes />
            </button>

            <h2 className="modal-title">{selectedPetition.title}</h2>

            <div className="modal-badges">
              <span 
                className="status-badge modal-status-badge" 
                style={{ backgroundColor: getStatusColor(selectedPetition.status) }}
              >
                {selectedPetition.status}
              </span>
              <span className="modal-category-badge">{selectedPetition.category}</span>
              <span className="modal-location-badge">{selectedPetition.location}</span>
            </div>

            <p className="modal-description">{selectedPetition.description}</p>

            <div className="modal-meta-info">
              <div className="meta-info-item">
                <FaUser className="meta-icon" />
                <span>Created by <strong>{selectedPetition.createdBy === 'Official' ? 'Official' : selectedPetition.createdBy}</strong></span>
              </div>
              <div className="meta-info-item">
                <FaClock className="meta-icon" />
                <span>on {selectedPetition.createdDate}</span>
              </div>
            </div>

            {selectedPetition.officialResponse && (
              <div className="modal-response-section">
                <div className="modal-response-header">
                  <h3>Official Response</h3>
                  {selectedPetition.responseDate && (
                    <span className="response-date">Responded on {selectedPetition.responseDate}</span>
                  )}
                </div>
                <div className="modal-response-content">
                  {selectedPetition.officialResponse}
                </div>
              </div>
            )}

            <div className="modal-progress">
              <div className="progress-info">
                <span className="progress-number">
                  {selectedPetition.signatures} / {selectedPetition.goal} signatures
                </span>
                <span className="progress-percentage modal-percentage">
                  {Math.round(getProgress(selectedPetition.signatures, selectedPetition.goal))}%
                </span>
              </div>
              <div className="progress-bar modal-progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${getProgress(selectedPetition.signatures, selectedPetition.goal)}%`,
                    backgroundColor: getStatusColor(selectedPetition.status)
                  }}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="modal-action-btn write-response"
                onClick={(e) => handleWriteResponse(selectedPetition, e)}
              >
                <FaPaperPlane /> {selectedPetition.officialResponse ? 'Edit Response' : 'Write Response'}
              </button>
            </div>

            <div className="modal-status-actions">
              <span className="status-label">CHANGE STATUS</span>
              <div className="status-buttons">
                <button 
                  className={`status-btn review ${selectedPetition.status === 'UNDER REVIEW' ? 'active' : ''}`}
                  onClick={(e) => handleChangeStatus(selectedPetition, 'UNDER REVIEW', e)}
                >
                  Review
                </button>
                <button 
                  className={`status-btn success ${selectedPetition.status === 'ACTIVE' ? 'active' : ''}`}
                  onClick={(e) => handleChangeStatus(selectedPetition, 'ACTIVE', e)}
                >
                  Approve
                </button>
                <button 
                  className={`status-btn close ${selectedPetition.status === 'CLOSED' ? 'active' : ''}`}
                  onClick={(e) => handleChangeStatus(selectedPetition, 'CLOSED', e)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Write Response Modal */}
      {showResponseModal && selectedPetition && (
        <div className="modal-overlay" onClick={() => setShowResponseModal(false)}>
          <div className="modal-container response-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowResponseModal(false)}>
              <FaTimes />
            </button>

            <div className="response-modal-header">
              <h2 className="modal-title">Official Response</h2>
            </div>

            <div className="response-modal-body">
              <div className="petition-info-box">
                <h3 className="petition-info-title">{selectedPetition.title}</h3>
                <div className="petition-info-meta">
                  <span><strong>{selectedPetition.signatures}</strong> signatures</span>
                  <span>•</span>
                  <span>{selectedPetition.category}</span>
                  <span>•</span>
                  <span>{selectedPetition.location}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Write your official response</label>
                <textarea
                  className="form-textarea response-textarea"
                  placeholder="Provide a detailed response to this petition. Be clear, professional, and address the concerns raised by citizens..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows="8"
                />
                <div className="textarea-counter">
                  {responseText.length} characters
                </div>
              </div>

              <div className="response-modal-actions">
                <button 
                  className="response-cancel-btn" 
                  onClick={() => setShowResponseModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="response-submit-btn" 
                  onClick={handleSubmitResponse}
                  disabled={!responseText.trim()}
                >
                  <FaPaperPlane /> Post Response
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      {showStatusModal && selectedPetition && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-container status-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowStatusModal(false)}>
              <FaTimes />
            </button>

            <div className="status-modal-icon">
              {newStatus === 'APPROVE' ? <FaCheck /> : <FaExclamationTriangle />}
            </div>

            <h2 className="status-modal-title">Change Petition Status?</h2>

            <p className="status-modal-text">
              You are about to change the status of
              <strong>"{selectedPetition.title}"</strong>
              to <strong className={`status-highlight ${newStatus.toLowerCase().replace(' ', '-')}`}>{newStatus}</strong>
            </p>

            <div className="status-info-box">
              <div className="status-info-item">
                <span className="status-info-label">Current Status:</span>
                <span className="status-info-value">{selectedPetition.status}</span>
              </div>
              <div className="status-info-item">
                <span className="status-info-label">New Status:</span>
                <span className="status-info-value">{newStatus}</span>
              </div>
              <div className="status-info-item">
                <span className="status-info-label">Signatures:</span>
                <span className="status-info-value">{selectedPetition.signatures} / {selectedPetition.goal}</span>
              </div>
            </div>

            <div className="status-modal-actions">
              <button className="status-cancel-btn" onClick={() => setShowStatusModal(false)}>
                Cancel
              </button>
              <button className="status-confirm-btn" onClick={confirmStatusChange}>
                <FaCheck /> Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Petition Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-container create-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>
              <FaTimes />
            </button>

            <div className="create-modal-header">
              <h2 className="modal-title">Create New Petition</h2>
            </div>

            <div className="create-modal-body">
              <div className="form-group">
                <label className="form-label">Petition Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Improve Our Local Park"
                  value={newPetition.title}
                  onChange={(e) => setNewPetition({...newPetition, title: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  placeholder="Explain the issue and what you want to change..."
                  value={newPetition.description}
                  onChange={(e) => setNewPetition({...newPetition, description: e.target.value})}
                  rows="5"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={newPetition.category}
                  onChange={(e) => setNewPetition({...newPetition, category: e.target.value})}
                >
                  <option value="">Select Category</option>
                  {categories.filter(c => c !== 'All Categories').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <select
                    className="form-select"
                    value={newPetition.location}
                    onChange={(e) => setNewPetition({...newPetition, location: e.target.value})}
                  >
                    <option value="">Select Location</option>
                    {locations.filter(l => l !== 'All Locations').map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Signature Goal</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    value={newPetition.goal}
                    onChange={(e) => setNewPetition({...newPetition, goal: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <button 
                className="create-submit-btn" 
                onClick={handleCreatePetition}
                disabled={!newPetition.title || !newPetition.description || !newPetition.category || !newPetition.location}
              >
                <FaPlus /> Create Petition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerPetitions;