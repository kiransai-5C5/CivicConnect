// frontend/src/pages/Dashboard/OfficialDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, getOfficerDashboard } from '../../services/api';
import { logout, getUser } from '../../utils/auth';
import { FaHome, FaFileAlt, FaPoll, FaChartBar, FaCog, FaQuestionCircle, FaMapMarkerAlt, FaCheckCircle, FaCalendarAlt, FaBullhorn, FaUserEdit, FaFileContract, FaUsers } from 'react-icons/fa';
import OfficialSettings from '../Settings/OfficialSettings';
import OfficerPetitions from '../OfficerPetitions/OfficerPetitions';
import OfficerPolls from '../OfficerPolls/OfficerPolls';
import OfficialReports from '../Reports/OfficialReports';
import NotificationDropdown from '../../components/Notifications/NotificationDropdown';
import './OfficialDashboard.css';

const OfficialDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(getUser());
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedPetitionId, setSelectedPetitionId] = useState(null);
    const [selectedPollId, setSelectedPollId] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [loadingDashboard, setLoadingDashboard] = useState(true);
    const [dashboardError, setDashboardError] = useState(null);

    const stats = dashboardData?.stats || {};
    const priorityPetitions = dashboardData?.priorityPetitions || [];
    const recentPolls = dashboardData?.recentPolls || [];

    const formatNumber = (value) => {
        if (value === undefined || value === null) return '--';
        return value.toLocaleString();
    };

    useEffect(() => {
        fetchUserProfile();
        fetchDashboardData();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const response = await getProfile();
            setUser(response.data.user);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        }
    };

    const fetchDashboardData = async () => {
        setLoadingDashboard(true);
        setDashboardError(null);
        try {
            const response = await getOfficerDashboard();
            setDashboardData(response.data);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            setDashboardError('Unable to load dashboard insights right now.');
        } finally {
            setLoadingDashboard(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const handleProfileClick = () => {
        handleNavigation('settings');
    };

    const handleNavigation = (tab) => {
        setActiveTab(tab);
        setSelectedPetitionId(null);
        setSelectedPollId(null);
    };

    const handlePetitionClick = (petitionId) => {
        setSelectedPetitionId(petitionId);
        setActiveTab('petitions');
    };

    const handlePollClick = (pollId) => {
        setSelectedPollId(pollId);
        setActiveTab('polls');
    };

    const handlePriorityPetitionSelect = (petitionId) => {
        if (!petitionId) return;
        setSelectedPetitionId(petitionId);
        setActiveTab('petitions');
    };

    const handleRecentPollSelect = (pollId) => {
        if (!pollId) return;
        setSelectedPollId(pollId);
        setActiveTab('polls');
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'petitions':
                return <OfficerPetitions initialPetitionId={selectedPetitionId} />;

            case 'polls':
                return <OfficerPolls initialPollId={selectedPollId} />;

            case 'reports':
                return <OfficialReports />;

            case 'settings':
                return <OfficialSettings />;

            default:
                if (loadingDashboard) {
                    return (
                        <div className="dashboard-loading">
                            <p>Loading dashboard insights...</p>
                        </div>
                    );
                }

                if (dashboardError) {
                    return (
                        <div className="dashboard-error-state">
                            <p>{dashboardError}</p>
                            <button className="official-view-all" onClick={fetchDashboardData}>
                                Retry
                            </button>
                        </div>
                    );
                }

                return (
                    <>
                        <header className="official-header">
                            <h1>Welcome back, {user?.fullName}</h1>
                            <p className="official-subtitle">Access key information and execute your duties with confidence.</p>
                        </header>

                        {/* Stats Grid */}
                        <div className="official-stats-grid">
                            <div className="official-stat-card">
                                <div className="official-stat-icon blue">
                                    <FaUsers />
                                </div>
                                <div className="official-stat-details">
                                    <h4>Constituent Reach</h4>
                                    <p className="official-stat-number">{formatNumber(stats.constituents)}</p>
                                    <span className="official-stat-label">Citizens in your district</span>
                                </div>
                            </div>

                            <div className="official-stat-card">
                                <div className="official-stat-icon orange">
                                    <FaFileContract />
                                </div>
                                <div className="official-stat-details">
                                    <h4>Pending Reviews</h4>
                                    <p className="official-stat-number">{formatNumber(stats.pendingReviews)}</p>
                                    <span className="official-stat-label">Awaiting your action</span>
                                </div>
                            </div>

                            <div className="official-stat-card">
                                <div className="official-stat-icon purple">
                                    <FaPoll />
                                </div>
                                <div className="official-stat-details">
                                    <h4>Active Polls</h4>
                                    <p className="official-stat-number">{formatNumber(stats.activePolls)}</p>
                                    <span className="official-stat-label">Ongoing polls</span>
                                </div>
                            </div>

                            <div className="official-stat-card">
                                <div className="official-stat-icon green">
                                    <FaCheckCircle />
                                </div>
                                <div className="official-stat-details">
                                    <h4>Issues Resolved</h4>
                                    <p className="official-stat-number">{formatNumber(stats.issuesResolved)}</p>
                                    <span className="official-stat-label">This month</span>
                                </div>
                            </div>
                        </div>

                        {/* Two Column Layout */}
                        <div className="official-two-column">
                            {/* Priority Petitions (first few from live list would be better, but keep static for now) */}
                            <div className="official-section">
                                <div className="official-section-header">
                                    <h2>Priority Petitions</h2>
                                    <button
                                        className="official-view-all"
                                        onClick={() => handleNavigation('petitions')}
                                    >
                                        View All
                                    </button>
                                </div>

                                <div className="official-petition-list">
                                    {priorityPetitions.length > 0 ? (
                                        priorityPetitions.map((petition) => (
                                    <div
                                                key={petition.id}
                                        className="official-petition-item"
                                                onClick={() => handlePriorityPetitionSelect(petition.id)}
                                    >
                                                <span className={`official-petition-category ${petition.category?.toLowerCase() || 'general'}`}>
                                                    {(petition.category || 'General').toUpperCase()}
                                            </span>
                                                <h3 className="official-petition-title">{petition.title}</h3>
                                                {petition.description && (
                                        <p className="official-petition-desc">
                                                        {petition.description.length > 200
                                                            ? `${petition.description.substring(0, 200)}...`
                                                            : petition.description}
                                        </p>
                                                )}
                                        <div className="official-petition-footer">
                                            <span className="official-petition-signatures">
                                                        <FaUsers /> {formatNumber(petition.signatures)} Signatures
                                            </span>
                                            <span className="official-petition-location">
                                                        <FaMapMarkerAlt /> {petition.location || 'Unknown'}
                                                    </span>
                                                    <span className={`official-petition-status status-${(petition.status || '').toLowerCase()}`}>
                                                        {petition.status}
                                            </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-state">
                                            <div className="empty-icon">📋</div>
                                            <h3 className="empty-title">No priority petitions yet</h3>
                                            <p className="empty-text">New citizen petitions will appear here as soon as they are submitted.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* AI Report & Quick Actions */}
                            <div className="official-right-column">
                                {/* AI Monthly Report */}
                                <div className="official-ai-report">
                                    <div className="official-ai-icon">
                                        <FaChartBar />
                                    </div>
                                    <h3>AI Monthly Report</h3>
                                    <p>Generate a comprehensive summary of constituent sentiment, top issues, and engagement metrics for your district.</p>
                                    <button 
                                        className="official-generate-btn"
                                        onClick={() => handleNavigation('reports')}
                                    >
                                        <FaFileContract /> Generate Report
                                    </button>
                                </div>

                                {/* Quick Actions */}
                                <div className="official-quick-actions">
                                    <h3>Quick Actions</h3>
                                    <button className="official-action-btn">
                                        <FaCalendarAlt /> Schedule Town Hall
                                    </button>
                                    <button className="official-action-btn">
                                        <FaBullhorn /> Broadcast Alert
                                    </button>
                                    <button 
                                        className="official-action-btn"
                                        onClick={() => handleNavigation('settings')}
                                    >
                                        <FaUserEdit /> Update Profile
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Recent Poll Activity (static preview, officer manages real data in Polls tab) */}
                        <div className="official-section">
                            <div className="official-section-header">
                                <h2>Recent Poll Activity</h2>
                                <button
                                    className="official-view-all"
                                    onClick={() => handleNavigation('polls')}
                                >
                                    View All
                                </button>
                            </div>
                            
                            <div className="official-poll-preview-list">
                                {recentPolls.length > 0 ? (
                                    recentPolls.map((poll) => (
                                <div
                                            key={poll.id}
                                    className="official-poll-preview-item"
                                            onClick={() => handleRecentPollSelect(poll.id)}
                                >
                                    <div className="official-poll-preview-header">
                                                <span className={`official-poll-category ${(poll.category || 'general').toLowerCase()}`}>
                                                    {(poll.category || 'General').toUpperCase()}
                                                </span>
                                                <span className={`official-poll-status ${poll.status === 'Active' ? 'active' : 'closed'}`}>
                                                    {poll.status}
                                                </span>
                                    </div>
                                    <h3 className="official-poll-preview-title">
                                                {poll.question}
                                    </h3>
                                    <div className="official-poll-preview-footer">
                                        <span className="official-poll-votes">
                                                    <FaPoll /> {formatNumber(poll.totalVotes)} votes
                                        </span>
                                        <span className="official-poll-location">
                                                    <FaMapMarkerAlt /> {poll.location || 'Unknown'}
                                        </span>
                                    </div>
                                </div>
                                    ))
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-icon">📊</div>
                                        <h3 className="empty-title">No approved polls yet</h3>
                                        <p className="empty-text">Approved polls will show up here once citizens start voting.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="official-dashboard-container">
            {/* Top Navigation Bar */}
            <nav className="official-top-navbar">
                <div className="official-navbar-left">
                    <img 
                        src={`${process.env.PUBLIC_URL}/logo.png`} 
                        alt="Civix Logo" 
                        className="logo-icon" 
                    />
                    <h1 className="official-navbar-title">Civix</h1>
                </div>
                <div className="official-navbar-right">
                    <NotificationDropdown />
                    <div className="official-navbar-profile">
                        <div className="official-navbar-avatar" onClick={handleProfileClick}>
                            {user?.fullName?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <button className="official-navbar-logout" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </nav>

            <div className="official-main-layout">
                {/* Sidebar */}
                <aside className="official-sidebar">
                    <div className="official-user-card">
                        <div className="official-user-avatar">
                            {user?.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="official-user-info">
                            <h3>{user?.fullName}</h3>
                            <span className="official-badge">Verified Official</span>
                        </div>
                        <div className="official-user-location">
                            <FaMapMarkerAlt /> {user?.location || 'District 1'}
                        </div>
                    </div>

                    <nav className="official-sidebar-nav">
                        <button
                            className={activeTab === 'dashboard' ? 'active' : ''}
                            onClick={() => handleNavigation('dashboard')}
                        >
                            <FaHome /> Dashboard
                        </button>
                        <button
                            className={activeTab === 'petitions' ? 'active' : ''}
                            onClick={() => handleNavigation('petitions')}
                        >
                            <FaFileAlt /> Petitions
                        </button>
                        <button
                            className={activeTab === 'polls' ? 'active' : ''}
                            onClick={() => handleNavigation('polls')}
                        >
                            <FaPoll /> Polls
                        </button>
                        <button
                            className={activeTab === 'reports' ? 'active' : ''}
                            onClick={() => handleNavigation('reports')}
                        >
                            <FaChartBar /> Reports
                        </button>
                        <button
                            className={activeTab === 'settings' ? 'active' : ''}
                            onClick={() => handleNavigation('settings')}
                        >
                            <FaCog /> Settings
                        </button>
                    </nav>

                    <div className="official-sidebar-footer">
                        <button className="official-help-btn">
                            <FaQuestionCircle /> Help & Support
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="official-main-content">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default OfficialDashboard;