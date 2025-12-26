import React, { useEffect, useState } from 'react';
import { FaMapMarkerAlt, FaFilter, FaTimes, FaCheck, FaUser, FaClock, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import Layout from '../../components/Layout/Layout';
import './Petitions.css';
import { 
  createPetition as apiCreatePetition,
  getPetitions as apiGetPetitions,
  getPetitionById as apiGetPetitionById,
  editPetition as apiEditPetition,
  signPetition as apiSignPetition,
  updatePetitionStatus as apiUpdatePetitionStatus,
  deletePetition as apiDeletePetition,
} from '../../services/api';
import { toast } from 'react-toastify';

const Petitions = () => {
  const [petitions, setPetitions] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedPetition, setSelectedPetition] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [petitionToDelete, setPetitionToDelete] = useState(null);
  const [filters, setFilters] = useState({
    location: 'All Locations',
    category: 'All Categories',
    status: 'All'
  });
  const [loading, setLoading] = useState(false);

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
  if (!status || status === "All") return null;

  switch (status) {
    case "ACTIVE":
      return "active";
    case "UNDER REVIEW":
      return "under_review";
    case "CLOSED":
      return "closed";
    default:
      return null;
  }
};


  // Utility: transform backend petition -> UI-friendly object
  const normalize = (p) => {
  return {
    id: p._id,
    title: p.title,
    description: p.description,
    category: p.category || "",
    location: p.location || "",
    status: (p.status || "active").toUpperCase(),
    signatures: p.signature_count || 0,
    goal: p.goal || 100,
    createdBy: p.creator_name || "Unknown",
    createdDate: p.createdAt 
      ? new Date(p.createdAt).toLocaleDateString("en-GB")
      : "",
    signed: p.user_has_signed || false  // <-- FIXED
  };
};

  // Fetch petitions from backend
const fetchPetitions = async () => {
  setLoading(true);
  try {
    const mappedStatus = mapStatusForBackend(filters.status);

    const res = await apiGetPetitions({
      tab: activeTab,
      location: filters.location,
      category: filters.category,
      status: mappedStatus,
    });

    const list = Array.isArray(res.data) ? res.data.map(normalize) : [];
    setPetitions(list);
  } catch (err) {
    console.error('Failed to fetch petitions', err);
    toast.error('Failed to fetch petitions');
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchPetitions();
}, [activeTab, filters]);


  const getStatusColor = (status) => {
    switch(status) {
      case 'ACTIVE': return '#10b981';
      case 'UNDER REVIEW': return '#f59e0b';
      case 'CLOSED': return '#6b7280';
      default: return '#10b981';
    }
  };

  const getProgress = (signatures, goal) => {
    return Math.min((signatures / (goal || 100)) * 100, 100);
  };

  // Create petition
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
        goal: newPetition.goal
      };

      const res = await apiCreatePetition(payload);
      const created = normalize(res.data);
      setPetitions(prev => [created, ...prev]);
      toast.success('Petition created');
      setShowCreateModal(false);
      setNewPetition({ title: '', description: '', category: '', location: '', goal: 100 });
    } catch (err) {
      console.error('Create petition failed', err);
      const msg = err?.response?.data?.message || 'Failed to create petition';
      toast.error(msg);
    }
  };

  // Sign petition
  const handleSignPetition = async (petitionId) => {
    try {
      await apiSignPetition(petitionId);
      // update UI: increment signatures and mark signed
      setPetitions(prev => prev.map(p => p.id === petitionId ? { ...p, signatures: p.signatures + 1, signed: true } : p));
      setSelectedPetition(prev => prev && prev.id === petitionId ? { ...prev, signatures: prev.signatures + 1, signed: true } : prev);
      toast.success('Signed successfully');
    } catch (err) {
      console.error('Sign failed', err);
      const status = err?.response?.status;
      if (status === 409) toast.info('You already signed this petition');
      else toast.error(err?.response?.data?.message || 'Failed to sign petition');
    }
  };

  // Delete petition (backend + UI)
  const handleConfirmDelete = async () => {
    if (!petitionToDelete) return;
    const id = petitionToDelete.id;

    try {
      await apiDeletePetition(id);
      setPetitions(prev => prev.filter(p => p.id !== id));
      toast.success('Petition deleted');
    } catch (err) {
      console.error('Delete petition failed', err);
      toast.error(err?.response?.data?.message || 'Failed to delete petition');
    } finally {
      setShowDeleteModal(false);
      setPetitionToDelete(null);
      if (selectedPetition && selectedPetition.id === id) setSelectedPetition(null);
    }
  };

  const handleDeleteClick = (petition, e) => {
    e.stopPropagation();
    setPetitionToDelete(petition);
    setShowDeleteModal(true);
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setPetitionToDelete(null);
  };

  // On card click
  const handleOpenDetails = async (petition) => {
    // If you want to fetch fresh details from server:
    try {
      const res = await apiGetPetitionById(petition.id);
      const normalized = normalize(res.data);
      setSelectedPetition(normalized);
    } catch (err) {
      // fallback to local item
      setSelectedPetition(petition);
    }
  };

  // When create modal is closed we reset
  useEffect(() => {
    if (!showCreateModal) {
      setNewPetition({ title: '', description: '', category: '', location: '', goal: 100 });
    }
  }, [showCreateModal]);

  const filteredPetitions = petitions || [];


  return (
    <Layout>
      <div className="petitions-wrapper">
        <div className="petitions-container">
          {/* Header Section */}
          <div className="petitions-header">
            <div className="header-content">
              <h1>Petitions</h1>
              <p className="header-subtitle">Discover, sign, and spark action in your community.</p>
            </div>
            <button className="create-petition-btn" onClick={() => setShowCreateModal(true)}>
              Create Petition
            </button>
          </div>

          {/* Tabs Section */}
          <div className="petitions-tabs">
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
              My Petitions
            </button>
            <button 
              className={activeTab === 'signed' ? 'tab-btn active' : 'tab-btn'}
              onClick={() => setActiveTab('signed')}
            >
              Signed by Me
            </button>
          </div>

          {/* Filters Section */}
          <div className="petitions-filters">
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
          <div className="petitions-grid">
            {loading && <div style={{ gridColumn: '1/-1', textAlign: 'center' }}>Loading petitions...</div>}
            {!loading && filteredPetitions.map(petition => (
              <div key={petition.id} className="petition-card" onClick={() => handleOpenDetails(petition)}>
                <div className="petition-header">
                  <div className="petition-meta">
                    <span className="meta-category">{petition.category}</span>
                    <span className="meta-separator">•</span>
                    <span className="meta-location">{petition.location}</span>
                  </div>
                  <div className="petition-header-right">
                    <span 
                      className="status-badge" 
                      style={{ backgroundColor: getStatusColor(petition.status) }}
                    >
                      {petition.status}
                    </span>
                    {petition.createdBy === (localStorage.getItem('fullName') || localStorage.getItem('name')) && (
                      <button 
                        className="card-delete-btn"
                        onClick={(e) => handleDeleteClick(petition, e)}
                        title="Delete Petition"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="petition-title">{petition.title}</h3>

                <p className="petition-description">
                  {petition.description.length > 150 
                    ? `${petition.description.substring(0, 150)}...` 
                    : petition.description}
                </p>

                <div className="petition-progress">
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

                <button 
                  className={`petition-action-btn ${
                    petition.status === 'CLOSED' ? 'btn-closed' : 
                    petition.status === 'UNDER REVIEW' ? 'btn-review' :
                    petition.signed ? 'btn-signed' : 'btn-sign'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Open detail modal: sign from details
                    setSelectedPetition(petition);
                  }}
                  disabled={petition.status === 'CLOSED'}
                >
                  {petition.status === 'CLOSED' ? 'Status: Closed' : 
                   petition.status === 'UNDER REVIEW' ? 'Status: Under review' :
                   petition.signed ? 'Signed' : 'Sign Petitions'}
                </button>

                <div className="petition-footer">
                  <span className="footer-text">Created on {petition.createdDate}</span>
                </div>
              </div>
            ))}
          </div>

          {filteredPetitions.length === 0 && !loading && (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <div className="empty-icon">📋</div>
              <h3 className="empty-title">No Petitions Found</h3>
              <p className="empty-text">
                {activeTab === 'my' 
                  ? "You haven't created any petitions yet. Start making a difference today!" 
                  : activeTab === 'signed'
                  ? "You haven't signed any petitions yet. Browse and support causes you care about!"
                  : "No petitions match your current filters. Try adjusting your search criteria."}
              </p>
            </div>
          )}
        </div>

        {/* Petition Detail Modal */}
        {selectedPetition && (
          <div className="modal-overlay" onClick={() => setSelectedPetition(null)}>
            <div className="modal-container detail-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setSelectedPetition(null)}>
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
                  <span>Created by <strong>{selectedPetition.createdBy}</strong></span>
                </div>
                <div className="meta-info-item">
                  <FaClock className="meta-icon" />
                  <span>on {selectedPetition.createdDate}</span>
                </div>
              </div>

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
                  className={`modal-sign-btn ${selectedPetition.signed ? 'btn-signed' : ''}`}
                  onClick={() => handleSignPetition(selectedPetition.id)}
                  disabled={selectedPetition.signed || selectedPetition.status === 'CLOSED'}
                >
                  {selectedPetition.signed ? (
                    <>
                      <FaCheck /> Signed
                    </>
                  ) : (
                    'Sign Petitions'
                  )}
                </button>

                {selectedPetition.createdBy === (localStorage.getItem('fullName') || localStorage.getItem('name')) && (
                  <button 
                    className="modal-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(selectedPetition, e);
                    }}
                  >
                    <FaTrash /> Delete Petition
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && petitionToDelete && (
          <div className="modal-overlay" onClick={handleCancelDelete}>
            <div className="modal-container delete-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn delete-close-btn" onClick={handleCancelDelete}>
                <FaTimes />
              </button>
              
              <div className="delete-modal-icon">
                <FaExclamationTriangle />
              </div>
              
              <h2 className="delete-modal-title">Delete Petition?</h2>
              
              <p className="delete-modal-text">
                Are you sure you want to delete 
                <strong>"{petitionToDelete.title}"</strong>
                ? This action cannot be undone and all signatures will be lost.
              </p>

              <div className="delete-modal-info">
                <div className="delete-info-item">
                  <span className="delete-info-label">Current Signatures:</span>
                  <span className="delete-info-value">{petitionToDelete.signatures} / {petitionToDelete.goal}</span>
                </div>
                <div className="delete-info-item">
                  <span className="delete-info-label">Status:</span>
                  <span className="delete-info-value">{petitionToDelete.status}</span>
                </div>
              </div>

              <div className="delete-modal-actions">
                <button className="delete-cancel-btn" onClick={handleCancelDelete}>
                  Cancel
                </button>
                <button className="delete-confirm-btn" onClick={handleConfirmDelete}>
                  <FaTrash /> Delete Petition
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Petition Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-container create-modal" onClick={(e) => e.stopPropagation()}>
              <div className="create-modal-header">
                <h2 className="modal-title">Start Your Petition</h2>
                <button className="modal-close-btn create-close-btn" onClick={() => setShowCreateModal(false)}>
                  <FaTimes />
                </button>
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
                    placeholder="Explain the issue and what you want to change."
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
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., City, State"
                      value={newPetition.location}
                      onChange={(e) => setNewPetition({...newPetition, location: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Signature Goal</label>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      value={newPetition.goal}
                      onChange={(e) => setNewPetition({...newPetition, goal: parseInt(e.target.value || 100)})}
                    />
                  </div>
                </div>

                <button className="create-submit-btn" onClick={handleCreatePetition}>
                  Create Petition
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Petitions;
