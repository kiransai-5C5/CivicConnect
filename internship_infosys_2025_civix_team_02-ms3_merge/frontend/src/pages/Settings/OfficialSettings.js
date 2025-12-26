// frontend/src/pages/Settings/OfficialSettings.js
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  getOfficialSettings,
  updateOfficialProfile,
  updateOfficialPassword,
  updateOfficialLocation,
  updateOfficialPreferences,
  getOfficialLogs
} from '../../services/api';
import {
  FaUser,
  FaLock,
  FaMapMarkerAlt,
  FaCog,
  FaFileAlt,
  FaSpinner,
  FaCheck,
  FaTimes,
  FaClock
} from 'react-icons/fa';
import './Settings.css';

const OfficialSettings = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  // Profile state
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    role: 'Official',
    location: ''
  });

  // Password state
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Location state
  const [location, setLocation] = useState('');

  // Governance preferences
  const [preferences, setPreferences] = useState({
    autoUpdatePetitionStatus: false,
    enablePublicComments: true,
    notifyOnNewPetitions: true,
    reportFrequency: 'monthly'
  });

  // Admin logs
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data } = await getOfficialSettings();
      
      setProfile(data.profile);
      setLocation(data.profile.location);
      setPreferences(data.governancePreferences || preferences);
      setLogs(data.recentLogs || []);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      setLoadingLogs(true);
      const { data } = await getOfficialLogs({ limit: 20 });
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Failed to load admin logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateOfficialProfile({
        fullName: profile.fullName,
        email: profile.email
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    try {
      if (password.newPassword !== password.confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }

      if (password.newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }

      setSaving(true);
      await updateOfficialPassword(password);
      toast.success('Password updated successfully');
      setPassword({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update password';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleLocationUpdate = async (e) => {
    e.preventDefault();
    try {
      if (!location.trim()) {
        toast.error('Jurisdiction is required');
        return;
      }

      setSaving(true);
      await updateOfficialLocation({ location });
      toast.success('Jurisdiction updated successfully');
      setProfile({ ...profile, location });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update jurisdiction';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceToggle = async (key, value) => {
    try {
      const updated = {
        ...preferences,
        [key]: value
      };
      setPreferences(updated);
      await updateOfficialPreferences(updated);
      toast.success('Preferences updated successfully');
    } catch (error) {
      // Revert on error
      setPreferences(preferences);
      const message = error.response?.data?.message || 'Failed to update preferences';
      toast.error(message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="settings-container">
        <div className="settings-loading">
          <FaSpinner className="spinner" />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FaUser },
    { id: 'security', label: 'Security', icon: FaLock },
    { id: 'jurisdiction', label: 'Jurisdiction', icon: FaMapMarkerAlt },
    { id: 'governance', label: 'Governance', icon: FaCog },
    { id: 'logs', label: 'Reports & Logs', icon: FaFileAlt }
  ];

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your account, preferences, and administrative settings</p>
      </div>

      <div className="settings-content">
        <div className="settings-sidebar">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="settings-main">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="settings-section">
              <h2>Profile Settings</h2>
              <form onSubmit={handleProfileUpdate} className="settings-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Role</label>
                  <input
                    type="text"
                    value={profile.role}
                    disabled
                    className="disabled-input"
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <FaSpinner className="spinner" /> : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="settings-section">
              <h2>Change Password</h2>
              <form onSubmit={handlePasswordUpdate} className="settings-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={password.currentPassword}
                    onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={password.newPassword}
                    onChange={(e) => setPassword({ ...password, newPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={password.confirmPassword}
                    onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <FaSpinner className="spinner" /> : 'Update Password'}
                </button>
              </form>
            </div>
          )}

          {/* Jurisdiction Tab */}
          {activeTab === 'jurisdiction' && (
            <div className="settings-section">
              <h2>Jurisdiction Settings</h2>
              <p className="section-description">
                Set or update your jurisdiction to filter petitions and polls in your area.
              </p>
              <form onSubmit={handleLocationUpdate} className="settings-form">
                <div className="form-group">
                  <label>Jurisdiction / Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter your jurisdiction (e.g., City, State)"
                    required
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <FaSpinner className="spinner" /> : 'Update Jurisdiction'}
                </button>
              </form>
            </div>
          )}

          {/* Governance Tab */}
          {activeTab === 'governance' && (
            <div className="settings-section">
              <h2>Governance Preferences</h2>
              <p className="section-description">
                Configure how you manage petitions and polls.
              </p>

              <div className="notification-list">
                <div className="notification-item">
                  <div className="notification-info">
                    <h3>Auto-update Petition Status</h3>
                    <p>Automatically update petition status based on predefined rules</p>
                  </div>
                  <button
                    className={`toggle-btn ${preferences.autoUpdatePetitionStatus ? 'active' : ''}`}
                    onClick={() => handlePreferenceToggle('autoUpdatePetitionStatus', !preferences.autoUpdatePetitionStatus)}
                  >
                    {preferences.autoUpdatePetitionStatus ? <FaCheck /> : <FaTimes />}
                  </button>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <h3>Enable Public Comments</h3>
                    <p>Allow citizens to comment on petitions and polls</p>
                  </div>
                  <button
                    className={`toggle-btn ${preferences.enablePublicComments ? 'active' : ''}`}
                    onClick={() => handlePreferenceToggle('enablePublicComments', !preferences.enablePublicComments)}
                  >
                    {preferences.enablePublicComments ? <FaCheck /> : <FaTimes />}
                  </button>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <h3>Notify on New Petitions</h3>
                    <p>Receive notifications when new petitions are created in your jurisdiction</p>
                  </div>
                  <button
                    className={`toggle-btn ${preferences.notifyOnNewPetitions ? 'active' : ''}`}
                    onClick={() => handlePreferenceToggle('notifyOnNewPetitions', !preferences.notifyOnNewPetitions)}
                  >
                    {preferences.notifyOnNewPetitions ? <FaCheck /> : <FaTimes />}
                  </button>
                </div>

                <div className="form-group">
                  <label>Report Frequency</label>
                  <select
                    value={preferences.reportFrequency}
                    onChange={(e) => handlePreferenceToggle('reportFrequency', e.target.value)}
                    className="form-select"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Reports & Logs Tab */}
          {activeTab === 'logs' && (
            <div className="settings-section">
              <h2>Reports & Logs</h2>
              <p className="section-description">
                View your recent administrative actions and activity logs.
              </p>

              {loadingLogs ? (
                <div className="logs-loading">
                  <FaSpinner className="spinner" />
                  <p>Loading logs...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="empty-logs">
                  <FaFileAlt />
                  <p>No admin logs found</p>
                </div>
              ) : (
                <div className="logs-table">
                  <div className="logs-header">
                    <div>Type</div>
                    <div>Action</div>
                    <div>Target</div>
                    <div>Timestamp</div>
                  </div>
                  {logs.map((log, index) => (
                    <div key={index} className="logs-row">
                      <div className="log-type">{log.type}</div>
                      <div className="log-action">{log.action}</div>
                      <div className="log-target">{log.target || 'N/A'}</div>
                      <div className="log-timestamp">
                        <FaClock /> {formatDate(log.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfficialSettings;

