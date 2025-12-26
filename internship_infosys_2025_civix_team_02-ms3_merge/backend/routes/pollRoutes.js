const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const {
  createPoll,
  getPolls,
  getPollById,
  votePoll,
  deletePoll,
  getOfficerPolls,
  updateOfficerPollStatus,
} = require("../controllers/pollController");

const { submitPollFeedback } = require("../controllers/pollFeedbackController"); // <-- ADD THIS

// ... existing code ...

router.post("/", auth, createPoll);
router.get("/", auth, getPolls);
router.get("/:id", auth, getPollById);
router.post("/:pollId/vote/:optionId", auth, votePoll);
router.delete("/:id", auth, deletePoll);

// Officer-specific poll management
router.get("/officer/list", auth, getOfficerPolls);
router.patch("/:id/officer-status", auth, updateOfficerPollStatus);

// submit feedback for a poll  <-- ADD THIS BLOCK
router.post("/:pollId/feedback", auth, submitPollFeedback);

module.exports = router;