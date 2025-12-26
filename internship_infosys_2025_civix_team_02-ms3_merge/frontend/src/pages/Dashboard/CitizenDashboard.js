// frontend/src/pages/Dashboard/CitizenDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getProfile, 
  getCitizenDashboard, 
  signPetition as apiSignPetition, 
  votePoll as apiVotePoll 
} from '../../services/api';
import { logout, getUser } from '../../utils/auth';
import { FaHome, FaFileAlt, FaPoll, FaChartBar, FaCog, FaQuestionCircle, FaMapMarkerAlt, FaUser, FaCheck, FaExclamationTriangle, FaComment, FaTimes, FaClock, FaTrash, FaUserTie } from 'react-icons/fa';
import NotificationDropdown from '../../components/Notifications/NotificationDropdown';
import './Dashboard.css';

const CitizenDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showVoteConfirm, setShowVoteConfirm] = useState(false);
  const [pendingVote, setPendingVote] = useState(null);
  const [selectedPetition, setSelectedPetition] = useState(null);

  const [petitions, setPetitions] = useState([]);
  const [polls, setPolls] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);

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
      const { data } = await getCitizenDashboard();
      setDashboardData(data);

      if (data.trendingPetition) {
        setPetitions([data.trendingPetition]);
      } else {
        setPetitions([]);
      }

      if (data.trendingPoll) {
        setPolls([data.trendingPoll]);
      } else {
        setPolls([]);
      }

      setRecentActivities(data.recentActivities || []);
      setUpcomingEvents(data.upcomingEvents || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setDashboardError('Unable to load your dashboard insights right now.');
    } finally {
      setLoadingDashboard(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleProfileClick = () => {
    setActiveTab('settings');
    navigate('/settings');
  };

  // Get trending poll (highest votes from active polls)
  const stats = dashboardData?.stats || {};

  const getTrendingPoll = () => {
    const activePolls = polls.filter(p => p.status === 'Active');
    if (activePolls.length === 0) return null;
    
    return activePolls.sort((a, b) => b.totalVotes - a.totalVotes)[0];
  };

  // Get trending petition (highest signatures from active petitions)
  const getTrendingPetition = () => {
    const activePetitions = petitions.filter(p => p.status === 'ACTIVE');
    if (activePetitions.length === 0) return null;
    
    return activePetitions.sort((a, b) => b.signatures - a.signatures)[0];
  };

  const trendingPoll = getTrendingPoll();
  const trendingPetition = getTrendingPetition();

  const handleSignPetition = async (petitionId) => {
    try {
      await apiSignPetition(petitionId);

      setPetitions(petitions.map(p => 
        p.id === petitionId && !p.signed
          ? { ...p, signatures: p.signatures + 1, signed: true }
          : p
      ));
      
      if (selectedPetition && selectedPetition.id === petitionId) {
        setSelectedPetition(prev => ({ 
          ...prev, 
          signatures: prev.signatures + 1, 
          signed: true 
        }));
      }
    } catch (error) {
      console.error('Failed to sign petition:', error);
    }
  };

  const getProgress = (signatures, goal) => {
    return Math.min((signatures / goal) * 100, 100);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'ACTIVE': return '#10b981';
      case 'UNDER REVIEW': return '#f59e0b';
      case 'CLOSED': return '#6b7280';
      default: return '#10b981';
    }
  };

  const handleVote = (pollId, optionId) => {
    setPolls(polls.map(poll => {
      if (poll.id === pollId && !poll.userVoted && poll.status === 'Active') {
        const updatedOptions = poll.options.map(opt =>
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        );
        return {
          ...poll,
          options: updatedOptions,
          totalVotes: poll.totalVotes + 1,
          userVoted: optionId
        };
      }
      return poll;
    }));
  };

  const handleVoteClick = (pollId) => {
    const selected = document.querySelector(`input[name="trending-poll-${pollId}"]:checked`);
    if (selected) {
      const optionId = parseInt(selected.dataset.displayid, 10);
      const optionKey = selected.dataset.optionid;
      const poll = polls.find(p => p.id === pollId);
      const selectedOption = poll?.options?.find(opt => opt.id === optionId);
      
      if (!poll || !selectedOption) return;

      setPendingVote({
        pollId,
        optionId,
        optionKey,
        pollQuestion: poll.question,
        selectedOption: selectedOption.text
      });
      setShowVoteConfirm(true);
    }
  };

  const confirmVote = async () => {
    if (!pendingVote) return;
    try {
      if (pendingVote.optionKey) {
        await apiVotePoll(pendingVote.pollId, pendingVote.optionKey);
      }
      handleVote(pendingVote.pollId, pendingVote.optionId);
    } catch (error) {
      console.error('Failed to submit vote:', error);
    } finally {
      setShowVoteConfirm(false);
      setPendingVote(null);
    }
  };

  const cancelVote = () => {
    setShowVoteConfirm(false);
    setPendingVote(null);
  };

  const getPercentage = (votes, total) => {
    return total > 0 ? ((votes / total) * 100).toFixed(1) : 0;
  };

  const formatNumber = (value) => {
    if (value === undefined || value === null) return '--';
    return value.toLocaleString();
  };

  const defaultRecentActivities = [
    {
      date: "15/06/2025",
      type: "Signed Petition",
      title: "Municipal Education Grant: Public School...",
      status: "Active"
    },
    {
      date: "20/05/2025",
      type: "Signed Petition",
      title: "Environmental Protection Order: Green Valley...",
      status: "Under Review"
    },
    {
      type: "account",
      title: "Joined Civix Platform"
    }
  ];

  const defaultUpcomingEvents = [
    {
      date: "15",
      month: "JUL",
      title: "City Council Town Hall",
      description: "Open discussion on Q3 fiscal budget.",
      location: "Main Auditorium"
    },
    {
      date: "22",
      month: "JUL",
      title: "Public Budget Hearing",
      description: "Review of infrastructure allocation.",
      location: "City Hall, Rm 404"
    },
    {
      date: "28",
      month: "JUL",
      title: "Civic Safety Workshop",
      description: "Community policing initiatives.",
      location: "Community Center"
    }
  ];

  return (
    <div className="dashboard-container">
      {/* Top Bar - Outside sidebar */}
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

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="user-profile">
          <div className="user-avatar">
            {user?.fullName?.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <h3>{user?.fullName?.split(' ')[0]}</h3>
            <span className="user-badge">VERIFIED CITIZEN</span>
          </div>
          <div className="user-location">
            <FaMapMarkerAlt /> {user?.location || 'Coimbatore'}
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
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
            onClick={() => {
              setActiveTab('reports');
              navigate('/reports');
            }}
          >
            <FaChartBar /> Reports
          </button>
          <button
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => setActiveTab('settings')}
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
        <div className="dashboard-content">
          {/* Welcome Banner */}
          <div className="welcome-banner">
            <h1>Welcome back, {user?.fullName?.split(' ')[0]}</h1>
            <p>Your active participation is vital for the governance of <strong>{user?.location || 'Coimbatore'}</strong>. Here is your daily civic overview.</p>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card stat-card-blue">
              <div className="stat-icon">
                <FaFileAlt />
              </div>
              <div className="stat-info">
                <div className="stat-label">MY PETITIONS</div>
                <div className="stat-number">{formatNumber(stats.myPetitions || 0)}</div>
                <div className="stat-sublabel">petitions</div>
              </div>
            </div>

            <div className="stat-card stat-card-blue">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-label">SUCCESSFUL PETITIONS</div>
                <div className="stat-number">{formatNumber(stats.successfulPetitions || 0)}</div>
                <div className="stat-sublabel">or under review</div>
              </div>
            </div>

            <div className="stat-card stat-card-blue">
              <div className="stat-icon">
                <FaPoll />
              </div>
              <div className="stat-info">
                <div className="stat-label">POLLS VOTED</div>
                <div className="stat-number">{formatNumber(stats.pollsVoted || 0)}</div>
                <div className="stat-sublabel">polls</div>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="two-column-layout">
            {/* Left Column - Trending Poll & Petition */}
            <div className="left-column">
              {/* Trending Poll */}
              <div className="section trending-poll-section">
                <div className="section-header">
                  <h2><span className="section-icon-orange">📈</span> Trending Poll</h2>
                  <div className="location-badge">
                    <FaMapMarkerAlt /> {user?.location?.toUpperCase() || 'COIMBATORE'}
                  </div>
                </div>

                {trendingPoll ? (
                  <div className="dashboard-poll-card">
                    <div className="poll-item-header">
                      <div className="poll-item-info">
                        <h3 className="poll-item-question">{trendingPoll.question}</h3>
                        <div className="poll-item-meta">
                          <span className="meta-item">
                            <strong>CATEGORY:</strong> {trendingPoll.category.toUpperCase()}
                          </span>
                          <span className="meta-item">
                            <FaMapMarkerAlt /> <strong>LOCATION:</strong> {trendingPoll.location.toUpperCase()}
                          </span>
                          <span className="meta-item">
                            <FaUser /> <strong>CREATED BY:</strong> {trendingPoll.createdBy.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="poll-item-stats">
                        <div className="poll-votes-count">{trendingPoll.totalVotes} votes</div>
                        <div className="poll-closes-in">Closes in {trendingPoll.closesIn}</div>
                      </div>
                    </div>

                    {trendingPoll.userVoted || trendingPoll.status === 'Closed' ? (
                      // Show Results
                      <div className="poll-results">
                        <h4 className="results-title">Results:</h4>
                        <div className="results-list">
                          {trendingPoll.options
                            .sort((a, b) => b.votes - a.votes)
                            .map(option => {
                              const percentage = getPercentage(option.votes, trendingPoll.totalVotes);
                              return (
                                <div key={option.id} className="result-row">
                                  <div className="result-info">
                                    <span className="result-label">{option.text}</span>
                                    <span className="result-percentage">{percentage}% ({option.votes})</span>
                                  </div>
                                  <div className="result-bar-container">
                                    <div 
                                      className={`result-bar-fill ${trendingPoll.userVoted === option.id ? 'voted' : ''}`}
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                        </div>

                        {/* Voter Insights Section */}
                        <div className="voter-insights-section">
                          <div className="insights-header">
                            <h4 className="insights-title">
                              <FaComment className="insights-icon" /> Voter Insights
                            </h4>
                            <span className="insights-count">{trendingPoll.comments?.length || 0} Comments</span>
                          </div>

                          {/* Add or View Comments */}
                          <div className="insights-action-container">
                            <button className="view-add-comments-btn" onClick={() => navigate('/polls')}>
                              <FaComment /> Add or View Comments
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Show Vote Options
                      <div className="poll-options-container">
                        {trendingPoll.options.map(option => (
                          <div key={option.id} className="poll-option-item">
                            <input
                              type="radio"
                              id={`trending-poll-${trendingPoll.id}-option-${option.id}`}
                              name={`trending-poll-${trendingPoll.id}`}
                              className="poll-radio"
                              data-displayid={option.id}
                              data-optionid={option.optionKey || option.id}
                            />
                            <label 
                              htmlFor={`trending-poll-${trendingPoll.id}-option-${option.id}`}
                              className="poll-option-label"
                            >
                              {option.text}
                            </label>
                          </div>
                        ))}
                        <button 
                          className="submit-vote-btn"
                          onClick={() => handleVoteClick(trendingPoll.id)}
                        >
                          Submit Vote
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-trending-poll">
                    <div className="empty-icon">📊</div>
                    <p>No active polls available at the moment.</p>
                  </div>
                )}
              </div>

              {/* Trending Petition */}
              <div className="section trending-petition-section">
                <div className="section-header">
                  <h2><span className="section-icon-blue">📈</span> Trending Petition</h2>
                  <button className="view-all-link" onClick={() => navigate('/petitions')}>View All</button>
                </div>

                {trendingPetition ? (
                  <div 
                    className="dashboard-petition-card" 
                    onClick={() => setSelectedPetition(trendingPetition)}
                  >
                    <div className="petition-header">
                      <div className="petition-meta">
                        <span className="meta-category">{trendingPetition.category}</span>
                        <span className="meta-separator">•</span>
                        <span className="meta-location">{trendingPetition.location}</span>
                      </div>
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: getStatusColor(trendingPetition.status) }}
                      >
                        {trendingPetition.status}
                      </span>
                    </div>

                    <h3 className="petition-title">{trendingPetition.title}</h3>

                    <p className="petition-description">
                      {trendingPetition.description.length > 150 
                        ? `${trendingPetition.description.substring(0, 150)}...` 
                        : trendingPetition.description}
                    </p>

                    <div className="petition-progress">
                      <div className="progress-info">
                        <span className="progress-text">{trendingPetition.signatures} / {trendingPetition.goal} signatures</span>
                        <span className="progress-percentage">
                          {Math.round(getProgress(trendingPetition.signatures, trendingPetition.goal))}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${getProgress(trendingPetition.signatures, trendingPetition.goal)}%`,
                            backgroundColor: getStatusColor(trendingPetition.status)
                          }}
                        />
                      </div>
                    </div>

                    <button 
                      className={`petition-action-btn ${
                        trendingPetition.status === 'CLOSED' ? 'btn-closed' : 
                        trendingPetition.status === 'UNDER REVIEW' ? 'btn-review' :
                        trendingPetition.signed ? 'btn-signed' : 'btn-sign'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPetition(trendingPetition);
                      }}
                    >
                      {trendingPetition.status === 'CLOSED' ? 'Status: Closed' : 
                       trendingPetition.status === 'UNDER REVIEW' ? 'Status: Under review' :
                       trendingPetition.signed ? 'Signed' : 'Sign Petition'}
                    </button>

                    <div className="petition-footer">
                      <span className="footer-text">Created on {trendingPetition.createdDate}</span>
                    </div>
                  </div>
                ) : (
                  <div className="no-trending-petition">
                    <div className="empty-icon">📋</div>
                    <p>No active petitions available at the moment.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Recent Activity & Events */}
            <div className="right-column">
              {/* Recent Activity */}
              <div className="section activity-section">
                <div className="section-header-simple">
                  <h2>Recent Activity</h2>
                </div>

                <div className="activity-list">
                  {(recentActivities.length ? recentActivities : defaultRecentActivities).map((activity, index) => (
                    <div key={index} className="activity-item">
                      {activity.date && (
                        <>
                          <div className="activity-icon-circle">
                            <FaFileAlt />
                          </div>
                          <div className="activity-content">
                            <div className="activity-date">{activity.date}</div>
                            <div className="activity-type">{activity.type}</div>
                            <div className="activity-title">{activity.title}</div>
                            <span className={`activity-status status-${(activity.status || 'pending').toLowerCase().replace(' ', '-')}`}>
                              {activity.status || 'Pending'}
                            </span>
                          </div>
                        </>
                      )}
                      {activity.type === 'account' && (
                        <>
                          <div className="activity-icon-circle">
                            <FaUserTie />
                          </div>
                          <div className="activity-content">
                            <div className="activity-type-gray">ACCOUNT CREATED</div>
                            <div className="activity-title">{activity.title}</div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="section events-section">
                <div className="section-header-simple">
                  <h2><span className="section-icon-calendar">📅</span> UPCOMING EVENTS</h2>
                  <button className="view-all-link">View All</button>
                </div>

                <div className="events-list">
                  {(upcomingEvents.length ? upcomingEvents : defaultUpcomingEvents).map((event, index) => (
                    <div key={index} className="event-item">
                      <div className="event-date-box">
                        <div className="event-month">{event.month}</div>
                        <div className="event-date">{event.date}</div>
                      </div>
                      <div className="event-details">
                        <h4>{event.title}</h4>
                        <p>{event.description}</p>
                        <div className="event-location">
                          <FaMapMarkerAlt /> {event.location}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Petition Detail Modal */}
      {selectedPetition && (
        <div className="modal-overlay" onClick={() => setSelectedPetition(null)}>
          <div className="modal-container detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedPetition(null)}>
              <FaTimes />
            </button>

            <h2 className="modal-title" style={{ paddingRight: '50px' }}>{selectedPetition.title}</h2>

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
                  'Sign Petition'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vote Confirmation Modal */}
      {showVoteConfirm && pendingVote && (
        <div className="modal-overlay" onClick={cancelVote}>
          <div className="modal-container confirm-modal vote-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-icon">
              <FaCheck />
            </div>
            
            <h2 className="confirm-modal-title">Confirm Your Vote</h2>
            
            <p className="confirm-modal-text">
              You are about to vote on
              <strong>"{pendingVote.pollQuestion}"</strong>
            </p>

            <div className="vote-selected-option">
              <span className="vote-label">Your Selection:</span>
              <span className="vote-value">{pendingVote.selectedOption}</span>
            </div>

            <div className="vote-confirm-note">
              <p>
                <FaExclamationTriangle /> Once submitted, your vote cannot be changed.
              </p>
            </div>

            <div className="confirm-modal-actions">
              <button className="confirm-cancel-btn" onClick={cancelVote}>
                Go Back
              </button>
              <button className="confirm-submit-btn" onClick={confirmVote}>
                <FaCheck /> Yes, Submit Vote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenDashboard;