// backend/routes/officerPolls.js
const router = require("express").Router();
const auth = require("../middleware/authMiddleware");

const {
  getOfficerPolls,
  updateOfficerPollStatus,
} = require("../controllers/officerPollController");

// List polls for officers (with filters)
router.get("/", auth, getOfficerPolls);

// Update officer status (Pending Review / Approved / Rejected)
router.patch("/:id/status", auth, updateOfficerPollStatus);

module.exports = router;


