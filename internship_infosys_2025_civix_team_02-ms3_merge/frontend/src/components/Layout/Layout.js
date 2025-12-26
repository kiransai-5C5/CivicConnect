import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getProfile } from '../../services/api';
import { logout, getUser } from '../../utils/auth';
import { FaHome, FaFileAlt, FaPoll, FaChartBar, FaCog, FaQuestionCircle, FaMapMarkerAlt } from 'react-icons/fa';
import NotificationDropdown from '../Notifications/NotificationDropdown';
import './Layout.css';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(getUser());

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await getProfile();
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleProfileClick = () => {
    navigate('/settings');
  };

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/citizen-dashboard' || path === '/dashboard' || path === '/official-dashboard') return 'dashboard';
    if (path === '/petitions') return 'petitions';
    if (path === '/polls') return 'polls';
    if (path === '/reports') return 'reports';
    if (path === '/settings') return 'settings';
    return '';
  };

  const activeTab = getActiveTab();

  // Determine correct dashboard route based on user type
  const getDashboardRoute = () => {
    // Single dashboard route; dashboard component renders per role
    return '/dashboard';
  };

  const badgeLabel =
    (user?.userType || '').toLowerCase() === 'official'
      ? 'VERIFIED OFFICIAL'
      : 'VERIFIED CITIZEN';

  return (
    <div className="dashboard-container">
      {/* Top Bar - Same as Citizen Dashboard */}
      <header className="top-bar-global">
        <div className="top-bar-left">
          <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Civix Logo" className="top-logo-icon" />
          <h1 className="top-logo-text">Civix</h1>
        </div>
        <div className="top-bar-actions">
          <NotificationDropdown />
          <button className="profile-btn-top" onClick={handleProfileClick}>
            {user?.fullName?.charAt(0).toUpperCase()}
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Sidebar - Same as Citizen Dashboard */}
      <aside className="sidebar">
        <div className="user-profile">
          <div className="user-avatar">
            {user?.fullName?.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <h3>{user?.fullName?.split(' ')[0]}</h3>
            <span className="user-badge">{badgeLabel}</span>
          </div>
          <div className="user-location">
            <FaMapMarkerAlt /> {user?.location || 'Coimbatore'}
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => navigate(getDashboardRoute())}
          >
            <FaHome /> Dashboard
          </button>
          <button
            className={activeTab === 'petitions' ? 'active' : ''}
            onClick={() => navigate('/petitions')}
          >
            <FaFileAlt /> Petitions
          </button>
          <button
            className={activeTab === 'polls' ? 'active' : ''}
            onClick={() => navigate('/polls')}
          >
            <FaPoll /> Polls
          </button>
          <button
            className={activeTab === 'reports' ? 'active' : ''}
            onClick={() => navigate('/reports')}
          >
            <FaChartBar /> Reports
          </button>
          <button
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => navigate('/settings')}
          >
            <FaCog /> Settings
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="help-button">
            <FaQuestionCircle /> Help & Support
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;