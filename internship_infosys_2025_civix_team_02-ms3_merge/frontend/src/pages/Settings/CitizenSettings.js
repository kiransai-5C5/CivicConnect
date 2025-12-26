// frontend/src/pages/Settings/CitizenSettings.js
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  getCitizenSettings,
  updateCitizenProfile,
  updateCitizenPassword,
  updateCitizenLocation,
  updateCitizenNotifications,
  getCitizenActivity
} from '../../services/api';
import {
  FaUser,
  FaLock,
  FaMapMarkerAlt,
  FaBell,
  FaShieldAlt,
  FaSpinner,
  FaCheck,
  FaTimes
} from 'react-icons/fa';
import './Settings.css';

const CitizenSettings = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  // Profile state
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    role: 'Citizen',
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

  // Notification preferences
  const [notifications, setNotifications] = useState({
    petitionStatusUpdates: true,
    pollParticipationReminders: true,
    officialResponseNotifications: true
  });

  // Activity summary
  const [activity, setActivity] = useState({
    petitionsCreated: 0,
    petitionsSigned: 0,
    pollsVoted: 0
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data } = await getCitizenSettings();
      
      setProfile(data.profile);
      setLocation(data.profile.location);
      setNotifications(data.notificationPreferences || notifications);
      setActivity(data.activity || activity);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateCitizenProfile({
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
      await updateCitizenPassword(password);
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
        toast.error('Location is required');
        return;
      }

      setSaving(true);
      await updateCitizenLocation({ location });
      toast.success('Location updated successfully');
      setProfile({ ...profile, location });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update location';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationToggle = async (key) => {
    try {
      const updated = {
        ...notifications,
        [key]: !notifications[key]
      };
      setNotifications(updated);
      await updateCitizenNotifications(updated);
      toast.success('Notification preferences updated');
    } catch (error) {
      // Revert on error
      setNotifications(notifications);
      const message = error.response?.data?.message || 'Failed to update notifications';
      toast.error(message);
    }
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
    { id: 'location', label: 'Location', icon: FaMapMarkerAlt },
    { id: 'notifications', label: 'Notifications', icon: FaBell },
    { id: 'privacy', label: 'Privacy & Data', icon: FaShieldAlt }
  ];

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your account preferences and privacy settings</p>
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

          {/* Location Tab */}
          {activeTab === 'location' && (
            <div className="settings-section">
              <h2>Location Preferences</h2>
              <p className="section-description">
                Update your location to receive geo-targeted petitions and polls relevant to your area.
              </p>
              <form onSubmit={handleLocationUpdate} className="settings-form">
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter your location (e.g., City, State)"
                    required
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <FaSpinner className="spinner" /> : 'Update Location'}
                </button>
              </form>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2>Notification Preferences</h2>
              <p className="section-description">
                Choose which notifications you want to receive.
              </p>

              <div className="notification-list">
                <div className="notification-item">
                  <div className="notification-info">
                    <h3>Petition Status Updates</h3>
                    <p>Get notified when petitions you created or signed have status changes</p>
                  </div>
                  <button
                    className={`toggle-btn ${notifications.petitionStatusUpdates ? 'active' : ''}`}
                    onClick={() => handleNotificationToggle('petitionStatusUpdates')}
                  >
                    {notifications.petitionStatusUpdates ? <FaCheck /> : <FaTimes />}
                  </button>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <h3>Poll Participation Reminders</h3>
                    <p>Receive reminders about active polls in your area</p>
                  </div>
                  <button
                    className={`toggle-btn ${notifications.pollParticipationReminders ? 'active' : ''}`}
                    onClick={() => handleNotificationToggle('pollParticipationReminders')}
                  >
                    {notifications.pollParticipationReminders ? <FaCheck /> : <FaTimes />}
                  </button>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <h3>Official Response Notifications</h3>
                    <p>Get notified when officials respond to your petitions</p>
                  </div>
                  <button
                    className={`toggle-btn ${notifications.officialResponseNotifications ? 'active' : ''}`}
                    onClick={() => handleNotificationToggle('officialResponseNotifications')}
                  >
                    {notifications.officialResponseNotifications ? <FaCheck /> : <FaTimes />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Privacy & Data Tab */}
          {activeTab === 'privacy' && (
            <div className="settings-section">
              <h2>Privacy & Data</h2>
              <p className="section-description">
                View your activity summary and manage your data.
              </p>

              <div className="activity-summary">
                <div className="activity-card">
                  <h3>Petitions Created</h3>
                  <p className="activity-number">{activity.petitionsCreated}</p>
                </div>

                <div className="activity-card">
                  <h3>Petitions Signed</h3>
                  <p className="activity-number">{activity.petitionsSigned}</p>
                </div>

                <div className="activity-card">
                  <h3>Polls Voted</h3>
                  <p className="activity-number">{activity.pollsVoted}</p>
                </div>
              </div>

              <div className="data-export">
                <h3>Data Export</h3>
                <p>Request a copy of your data (Coming soon)</p>
                <button className="btn-secondary" disabled>
                  Request Data Export
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CitizenSettings;

