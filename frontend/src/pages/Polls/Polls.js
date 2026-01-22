import React, { useEffect, useState } from "react";
import {
  FaMapMarkerAlt,
  FaFilter,
  FaTimes,
  FaCheck,
  FaTrash,
  FaExclamationTriangle,
  FaPlus,
  FaUser,
} from "react-icons/fa";
import Layout from "../../components/Layout/Layout";
import PollFeedback from "./PollFeedback";
import "./Polls.css";

import { getPolls, createPoll, votePoll, deletePoll } from "../../services/api";

const Polls = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("active");
  const [filters, setFilters] = useState({
    location: "All Locations",
    category: "All Categories",
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showVoteConfirm, setShowVoteConfirm] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const [pollToDelete, setPollToDelete] = useState(null);
  const [pendingVote, setPendingVote] = useState(null);
  const [feedbackData, setFeedbackData] = useState(null);

  const [validationErrors, setValidationErrors] = useState({});

  const [newPoll, setNewPoll] = useState({
    question: "",
    description: "",
    category: "",
    location: "",
    closesOn: "",
    options: ["", ""],
  });

  const MAX_DESCRIPTION_LENGTH = 200;

  const categories = [
    "All Categories",
    "Transportation",
    "Public Works",
    "Recreation",
    "Education",
    "Environment",
    "Infrastructure",
  ];

  const locations = [
    "All Locations",
    "Old Town",
    "City Center",
    "North Suburbs",
    "South District",
    "East Bay",
    "West End",
  ];

  // -------------------------------------------------
  // LOAD POLLS
  // -------------------------------------------------
  const loadPolls = async () => {
    try {
      setLoading(true);

      const { data } = await getPolls({
        tab: activeTab,
        location: filters.location,
        category: filters.category,
      });

      setPolls(data);
    } catch (error) {
      console.log("Error loading polls:", error);
    } finally {
      setLoading(false);
    }
  };
// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
  loadPolls();
}, [activeTab, filters, loadPolls]);


  // -------------------------------------------------
  // VOTE HANDLING
  // -------------------------------------------------
  const handleVoteClick = (pollId) => {
    const selected = document.querySelector(
      `input[name="poll-${pollId}"]:checked`
    );

    if (!selected) {
      alert("Please select an option first.");
      return;
    }

    const optionId = selected.dataset.optionid;

    const poll = polls.find((p) => p._id === pollId);
    const selectedOption = poll?.options?.find(
      (opt) => opt._id === optionId
    );

    console.log("Selected Poll ID:", pollId);
    console.log("Selected Option ID:", optionId);

    setPendingVote({
      pollId,
      optionId,
      pollQuestion: poll?.question,
      selectedOption: selectedOption?.text,
      pollData: poll,
    });

    setShowVoteConfirm(true);
  };

  const confirmVote = async () => {
    if (!pendingVote) return;

    console.log("Submitting vote for:", pendingVote);

    try {
      // Submit the vote to backend
      const response = await votePoll(pendingVote.pollId, pendingVote.optionId);

      // Close vote confirmation modal
      setShowVoteConfirm(false);

      // Get updated poll data from response or reload
      let updatedPoll = response?.data?.poll;
      
      if (!updatedPoll) {
        // If response doesn't contain poll, reload to get updated data
        const { data } = await getPolls({
          tab: activeTab,
          location: filters.location,
          category: filters.category,
        });
        setPolls(data);
        updatedPoll = data.find((p) => p._id === pendingVote.pollId);
      }

      // Prepare feedback data with updated results
      setFeedbackData({
        pollQuestion: pendingVote.pollQuestion,
        selectedOption: pendingVote.selectedOption,
        pollId: pendingVote.pollId,
        optionId: pendingVote.optionId,
        pollResults: updatedPoll || pendingVote.pollData,
      });

      // Clear pending vote
      setPendingVote(null);

      // Show feedback modal
      setShowFeedback(true);

    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message === "You already voted") {
        alert("You have already voted on this poll!");
      } else {
        alert("Something went wrong while submitting your vote.");
      }
      setShowVoteConfirm(false);
      setPendingVote(null);
    }
  };

  const cancelVote = () => {
    setShowVoteConfirm(false);
    setPendingVote(null);
  };

  const handleFeedbackClose = () => {
    setShowFeedback(false);
    setFeedbackData(null);
    // Reload polls to show updated results
    loadPolls();
  };

  // -------------------------------------------------
  // CREATE POLL
  // -------------------------------------------------
  const handleCreatePoll = async () => {
    const errors = {};

    if (!newPoll.question.trim()) errors.question = "Question required";
    if (!newPoll.category) errors.category = "Choose category";
    if (!newPoll.location.trim()) errors.location = "Location required";

    const filledOptions = newPoll.options.filter((opt) => opt.trim());
    if (filledOptions.length < 2)
      errors.options = "Minimum 2 options required";

    if (Object.keys(errors).length) {
      setValidationErrors(errors);
      return;
    }

    try {
      await createPoll({
        question: newPoll.question,
        description: newPoll.description,
        category: newPoll.category,
        location: newPoll.location,
        closesOn: newPoll.closesOn,
        options: filledOptions,
      });

      setShowCreateModal(false);
      setNewPoll({
        question: "",
        description: "",
        category: "",
        location: "",
        closesOn: "",
        options: ["", ""],
      });
      setValidationErrors({});

      loadPolls();
    } catch (error) {
      console.log("Create poll error:", error);
    }
  };

  // -------------------------------------------------
  // DELETE POLL
  // -------------------------------------------------
  const handleDeleteClick = (poll) => {
    setPollToDelete(poll);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deletePoll(pollToDelete._id);
      setShowDeleteModal(false);
      setPollToDelete(null);
      loadPolls();
    } catch (error) {
      console.log("Delete error:", error);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setPollToDelete(null);
  };

  // -------------------------------------------------
  // UI HELPERS
  // -------------------------------------------------
  const getPercentage = (votes, total) =>
    total > 0 ? ((votes / total) * 100).toFixed(1) : 0;

  const isCreatedByUser = (poll, userId) => {
    if (!poll || !userId) return false;
    const createdById = poll.createdBy && (poll.createdBy._id || poll.createdBy);
    return String(createdById) === String(userId);
  };

  const filteredPolls = polls || [];

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // -------------------------------------------------
  // RENDER UI
  // -------------------------------------------------
  return (
    <Layout>
      <div className="polls-wrapper">
        <div className="polls-container">
          {/* Header */}
          <div className="polls-header">
            <div className="header-content">
              <h1>Polls</h1>
              <p className="header-subtitle">
                Participate in community polls and share your voice.
              </p>
            </div>
            <button
              className="create-poll-btn"
              onClick={() => setShowCreateModal(true)}
            >
              Create Poll
            </button>
          </div>

          {/* Tabs */}
          <div className="polls-tabs">
            {["active", "voted", "my", "closed"].map((tab) => (
              <button
                key={tab}
                className={activeTab === tab ? "tab-btn active" : "tab-btn"}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "active"
                  ? "Active"
                  : tab === "voted"
                  ? "Voted on"
                  : tab === "my"
                  ? "My Polls"
                  : "Closed"}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="polls-filters">
            <div className="filter-item">
              <FaMapMarkerAlt className="filter-icon" />
              <select
                className="filter-select"
                value={filters.location}
                onChange={(e) =>
                  setFilters({ ...filters, location: e.target.value })
                }
              >
                {locations.map((loc) => (
                  <option key={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <FaFilter className="filter-icon" />
              <select
                className="filter-select"
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
              >
                {categories.map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <h3 style={{ textAlign: "center", marginTop: "20px" }}>
              Loading polls...
            </h3>
          )}

          {/* Poll List */}
          {!loading &&
            filteredPolls.map((poll) => {
              const userId = localStorage.getItem("userId");
              const hasVoted = poll.voters?.some((v) => v.user === userId);
              const isPending = poll.officerStatus === "Pending Review" || poll.officerStatus === "pending review";
              const isRejected = poll.officerStatus === "Rejected" || poll.officerStatus === "rejected";
              const isMyPoll = poll.createdBy === userId || poll.createdBy?._id === userId;

              return (
                <div key={poll._id} className="poll-item">
                  <div className="poll-item-header">
                    <div className="poll-item-info">
                      <h3 className="poll-item-question">{poll.question}</h3>

                      {poll.description && (
                        <p className="poll-item-description">
                          {poll.description}
                        </p>
                      )}

                      <div className="poll-item-meta">
                        <span className="meta-item">
                          <strong>CATEGORY:</strong>{" "}
                          {poll.category?.toUpperCase()}
                        </span>
                        <span className="meta-item">
                          <FaMapMarkerAlt /> <strong>LOCATION:</strong>{" "}
                          {poll.location?.toUpperCase()}
                        </span>
                        <span className="meta-item">
                          <FaUser /> <strong>CREATED BY:</strong>{" "}
                          {isMyPoll ? "You" : "User"}
                        </span>
                      </div>
                    </div>

                    <div className="poll-item-stats">
                      <div className="poll-votes-count">
                        {poll.totalVotes} votes
                      </div>

                      {poll.status === "Closed" ? (
                        <div className="poll-closed-date">Closed</div>
                      ) : (
                        <div className="poll-closes-in">
                          Closes on{" "}
                          {poll.closesOn ? formatDate(poll.closesOn) : "N/A"}
                        </div>
                      )}

                      {isMyPoll && (
                        <button
                          className="poll-delete-icon"
                          onClick={() => handleDeleteClick(poll)}
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Pending Approval Message */}
                  {isPending && (
                    <div className="poll-pending-approval" style={{
                      padding: "20px",
                      backgroundColor: "#fef3c7",
                      border: "1px solid #f59e0b",
                      borderRadius: "8px",
                      textAlign: "center",
                      marginTop: "15px"
                    }}>
                      <FaExclamationTriangle style={{ color: "#f59e0b", marginRight: "8px", fontSize: "20px" }} />
                      <strong style={{ color: "#92400e", fontSize: "16px", display: "block", marginBottom: "8px" }}>
                        {isMyPoll 
                          ? "Your poll is not approved by the official yet" 
                          : "Waiting for officials approval"}
                      </strong>
                      <p style={{ color: "#78350f", marginTop: "8px", fontSize: "14px" }}>
                        {isMyPoll 
                          ? "Your poll is currently under review by officials. It will be visible to all citizens and open for voting once approved." 
                          : "This poll is pending review by officials. It will be visible to all citizens once approved."}
                      </p>
                    </div>
                  )}

                  {/* Rejected Message */}
                  {isRejected && (
                    <div className="poll-rejected" style={{
                      padding: "20px",
                      backgroundColor: "#fee2e2",
                      border: "1px solid #ef4444",
                      borderRadius: "8px",
                      textAlign: "center",
                      marginTop: "15px"
                    }}>
                      <FaExclamationTriangle style={{ color: "#ef4444", marginRight: "8px" }} />
                      <strong style={{ color: "#991b1b" }}>
                        This poll has been rejected by officials
                      </strong>
                    </div>
                  )}

                  {/* Results if voted or closed (only show if approved) */}
                  {!isPending && !isRejected && (hasVoted || poll.status === "Closed") ? (
                    <div className="poll-results">
                      <h4 className="results-title">Results</h4>

                      {poll.options.map((opt) => (
                        <div key={opt._id} className="result-row">
                          <div className="result-info">
                            <span className="result-label">{opt.text}</span>
                            <span className="result-percentage">
                              {getPercentage(opt.votes, poll.totalVotes)}% (
                              {opt.votes})
                            </span>
                          </div>

                          <div className="result-bar-container">
                            <div
                              className="result-bar-fill"
                              style={{
                                width: `${getPercentage(
                                  opt.votes,
                                  poll.totalVotes
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !isPending && !isRejected ? (
                    /* Vote Options (only show if approved) */
                    <div className="poll-options-container">
                      {poll.options.map((option) => (
                        <div key={option._id} className="poll-option-item">
                          <input
                            type="radio"
                            name={`poll-${poll._id}`}
                            className="poll-radio"
                            data-optionid={option._id}
                            id={`poll-${poll._id}-opt-${option._id}`}
                          />

                          <label
                            htmlFor={`poll-${poll._id}-opt-${option._id}`}
                            className="poll-option-label"
                          >
                            {option.text}
                          </label>
                        </div>
                      ))}

                      <button
                        className="submit-vote-btn"
                        onClick={() => handleVoteClick(poll._id)}
                      >
                        Submit Vote
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}

          {/* EMPTY STATE */}
          {!loading && filteredPolls.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3 className="empty-title">No Polls Found</h3>
              <p className="empty-text">Try adjusting filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* ====================== CREATE POLL MODAL ====================== */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div
            className="modal-container create-poll-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="create-modal-header">
              <h2 className="modal-title">Create New Poll</h2>
              <button
                className="modal-close-btn create-close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="create-modal-body">
              <div className="form-group">
                <label className="form-label">Poll Question *</label>
                <input
                  type="text"
                  className={`form-input ${validationErrors.question ? "error" : ""}`}
                  value={newPoll.question}
                  onChange={(e) =>
                    setNewPoll({ ...newPoll, question: e.target.value })
                  }
                />
                {validationErrors.question && (
                  <span className="error-message">{validationErrors.question}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Description (Optional)
                  <span className="char-count">
                    {newPoll.description.length}/{MAX_DESCRIPTION_LENGTH}
                  </span>
                </label>

                <textarea
                  className="form-textarea"
                  value={newPoll.description}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_DESCRIPTION_LENGTH) {
                      setNewPoll({ ...newPoll, description: e.target.value });
                    }
                  }}
                />
              </div>

              <div className="form-row-three">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className={`form-select ${validationErrors.category ? "error" : ""}`}
                    value={newPoll.category}
                    onChange={(e) =>
                      setNewPoll({ ...newPoll, category: e.target.value })
                    }
                  >
                    <option value="">Select Category</option>
                    {categories
                      .filter((c) => c !== "All Categories")
                      .map((cat) => (
                        <option key={cat}>{cat}</option>
                      ))}
                  </select>
                  {validationErrors.category && (
                    <span className="error-message">{validationErrors.category}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Geo-Tag (Location) *</label>
                  <input
                    type="text"
                    className={`form-input ${validationErrors.location ? "error" : ""}`}
                    value={newPoll.location}
                    onChange={(e) =>
                      setNewPoll({ ...newPoll, location: e.target.value })
                    }
                  />
                  {validationErrors.location && (
                    <span className="error-message">{validationErrors.location}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Closes on</label>
                  <input
                    type="date"
                    className="form-input date-input"
                    value={newPoll.closesOn}
                    onChange={(e) =>
                      setNewPoll({ ...newPoll, closesOn: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Options *</label>

                {newPoll.options.map((opt, index) => (
                  <div key={index} className="option-input-group">
                    <input
                      type="text"
                      className="form-input option-input"
                      value={opt}
                      onChange={(e) => {
                        const updated = [...newPoll.options];
                        updated[index] = e.target.value;
                        setNewPoll({ ...newPoll, options: updated });
                      }}
                    />

                    {newPoll.options.length > 2 && (
                      <button
                        className="remove-option-btn"
                        onClick={() => {
                          const updated = newPoll.options.filter((_, i) => i !== index);
                          setNewPoll({ ...newPoll, options: updated });
                        }}
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                ))}

                {validationErrors.options && (
                  <span className="error-message">{validationErrors.options}</span>
                )}

                {newPoll.options.length < 6 && (
                  <button
                    className="add-option-btn"
                    onClick={() =>
                      setNewPoll({
                        ...newPoll,
                        options: [...newPoll.options, ""],
                      })
                    }
                  >
                    <FaPlus /> Add Option
                  </button>
                )}
              </div>

              <button className="create-submit-btn" onClick={handleCreatePoll}>
                Create Poll
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================== VOTE CONFIRM MODAL ====================== */}
      {showVoteConfirm && pendingVote && (
        <div className="modal-overlay" onClick={cancelVote}>
          <div
            className="modal-container confirm-modal vote-confirm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-modal-icon">
              <FaCheck />
            </div>

            <h2 className="confirm-modal-title">Confirm Vote</h2>

            <p className="confirm-modal-text">
              You are about to vote for:
              <strong>"{pendingVote.pollQuestion}"</strong>
            </p>

            <div className="vote-selected-option">
              <span className="vote-label">Your Selection:</span>
              <span className="vote-value">{pendingVote.selectedOption}</span>
            </div>

            <div className="vote-confirm-note">
              <p>
                <FaExclamationTriangle /> You cannot change your vote after
                submitting.
              </p>
            </div>

            <div className="confirm-modal-actions">
              <button className="confirm-cancel-btn" onClick={cancelVote}>
                Go Back
              </button>
              <button className="confirm-submit-btn" onClick={confirmVote}>
                <FaCheck /> Submit Vote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================== DELETE CONFIRM MODAL ====================== */}
      {showDeleteModal && pollToDelete && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div
            className="modal-container delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-btn delete-close-btn"
              onClick={handleCancelDelete}
            >
              <FaTimes />
            </button>

            <div className="delete-modal-icon">
              <FaExclamationTriangle />
            </div>

            <h2 className="delete-modal-title">Delete Poll?</h2>

            <p className="delete-modal-text">
              Are you sure you want to delete
              <strong>"{pollToDelete.question}"</strong>?
            </p>

            <div className="delete-modal-info">
              <div className="delete-info-item">
                <span className="delete-info-label">Total Votes:</span>
                <span className="delete-info-value">
                  {pollToDelete.totalVotes}
                </span>
              </div>
              <div className="delete-info-item">
                <span className="delete-info-label">Status:</span>
                <span className="delete-info-value">{pollToDelete.status}</span>
              </div>
            </div>

            <div className="delete-modal-actions">
              <button className="delete-cancel-btn" onClick={handleCancelDelete}>
                Cancel
              </button>
              <button className="delete-confirm-btn" onClick={handleConfirmDelete}>
                <FaTrash /> Delete Poll
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================== FEEDBACK MODAL ====================== */}
      {showFeedback && feedbackData && (
        <PollFeedback
          show={showFeedback}
          onClose={handleFeedbackClose}
          selectedOption={feedbackData.selectedOption}
          pollQuestion={feedbackData.pollQuestion}
          pollResults={feedbackData.pollResults}
          pollId={feedbackData.pollId}
          optionId={feedbackData.optionId}
        />
      )}
    </Layout>
  );
};

export default Polls;