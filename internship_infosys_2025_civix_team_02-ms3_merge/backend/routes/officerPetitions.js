// backend/routes/officerPetitions.js
const router = require("express").Router();
const auth = require("../middleware/authMiddleware");

const {
  getOfficerPetitions,
  updateOfficerPetitionStatus,
  setOfficerPetitionResponse,
} = require("../controllers/officerPetitionController");

// List petitions for officers (with filters)
router.get("/", auth, getOfficerPetitions);

// Update petition status (active / under_review / closed)
router.patch("/:id/status", auth, updateOfficerPetitionStatus);

// Set / update official response
router.patch("/:id/response", auth, setOfficerPetitionResponse);

module.exports = router;


