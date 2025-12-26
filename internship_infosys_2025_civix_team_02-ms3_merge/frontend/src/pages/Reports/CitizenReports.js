import React, { useState, useEffect } from 'react';
import { getReports } from '../../services/api';
import { FaFileAlt, FaPoll } from 'react-icons/fa';
import EngagementChart from './components/EngagementChart';
import PollAnalyticsChart from './components/PollAnalyticsChart';
import './Reports.css';

const CitizenReports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const { data } = await getReports();
      setReportData(data);
    } catch (err) {
      console.error('Failed to load report:', err);
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="reports-container">
        <div className="reports-loading">
          <p>Loading insights...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="reports-container">
        <div className="reports-error">
          <p>{error || 'No data available'}</p>
          <button onClick={fetchReport}>Retry</button>
        </div>
      </div>
    );
  }

  const {
    metrics = {},
    engagementGrowth = [],
    pollVotesTrend = [],
    signaturesTrend = [],
    petitionAnalytics = {},
    pollAnalytics = {},
  } = reportData;

  const topCategories = petitionAnalytics.topCategories || [];
  const statusDistribution = petitionAnalytics.statusDistribution || [];
  const mostVotedPolls = pollAnalytics.mostVotedPolls || [];

  return (
    <div className="reports-container">
      <div className="reports-header">
        <div>
          <h1>Community Insights</h1>
          <p>Real-time data on petitions, polls, and civic engagement in your community</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon blue">
            <FaFileAlt />
          </div>
          <div className="metric-content">
            <div className="metric-label">Total Signatures</div>
            <div className="metric-value">{formatNumber(metrics.totalSignatures)}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon purple">
            <FaPoll />
          </div>
          <div className="metric-content">
            <div className="metric-label">Total Votes</div>
            <div className="metric-value">{formatNumber(metrics.totalVotes)}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon orange">
            <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
              <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v2H8V8zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"/>
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-label">Active Polls</div>
            <div className="metric-value">{formatNumber(metrics.activePolls)}</div>
          </div>
        </div>
      </div>

      <EngagementChart
        data={engagementGrowth}
        pollTrend={pollVotesTrend}
        signatureTrend={signaturesTrend}
      />

      {/* Analytics Sections */}
      <div className="analytics-grid">
        {/* Petition Analytics */}
        <div className="analytics-section">
          <div className="analytics-header">
            <FaFileAlt className="analytics-icon" />
            <h3>Petition Analytics</h3>
          </div>

          <div className="analytics-subsection">
            <h4>TOP CATEGORIES</h4>
            <div className="bar-chart-horizontal">
              {topCategories.map((cat, i) => {
                const maxCount = topCategories.length ? Math.max(...topCategories.map(c => c.count)) : 0;
                const width = maxCount > 0 ? (cat.count / maxCount) * 100 : 0;
                const colors = ['#3b82f6', '#10b981', '#f59e0b'];
                return (
                  <div key={i} className="bar-item">
                    <div className="bar-label">{cat.name}</div>
                    <div className="bar-container">
                      <div
                        className="bar-fill"
                        style={{ width: `${width}%`, backgroundColor: colors[i] || '#3b82f6' }}
                      />
                    </div>
                    <div className="bar-value">{cat.count}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="analytics-subsection">
            <h4>STATUS DISTRIBUTION</h4>
            <div className="donut-chart-container">
              <svg width="200" height="200" className="donut-chart">
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="40"
                />
                {(() => {
                  const total = statusDistribution.reduce((sum, s) => sum + s.count, 0);
                  let currentOffset = 0;
                  const colors = { 'Active': '#3b82f6', 'Under Review': '#10b981', 'Closed': '#6b7280' };
                  return statusDistribution.map((status, i) => {
                    const percentage = total > 0 ? (status.count / total) * 100 : 0;
                    const strokeDasharray = `${(percentage / 100) * 502.65} 502.65`;
                    const offset = currentOffset;
                    currentOffset -= (percentage / 100) * 502.65;
                    return (
                      <circle
                        key={i}
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke={colors[status.status] || '#3b82f6'}
                        strokeWidth="40"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={offset}
                        transform="rotate(-90 100 100)"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="donut-legend">
                {statusDistribution.map((status, i) => {
                  const colors = { 'Active': '#3b82f6', 'Under Review': '#10b981', 'Closed': '#6b7280' };
                  return (
                    <div key={i} className="donut-legend-item">
                      <div className="donut-legend-color" style={{ backgroundColor: colors[status.status] || '#3b82f6' }}></div>
                      <span>{status.status}: {status.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Poll Analytics */}
        <div className="analytics-section">
          <div className="analytics-header">
            <FaPoll className="analytics-icon" />
            <h3 className="poll-analytics-title">Poll Analytics</h3>
          </div>

          <div className="analytics-subsection">
            <h4>MOST VOTED TOPICS</h4>
            <PollAnalyticsChart polls={mostVotedPolls} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenReports;

