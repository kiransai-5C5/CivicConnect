const router = require("express").Router();
const auth = require("../middleware/authMiddleware");

const {
  createPetition,
  getPetitions,
  getPetitionById,
  editPetition,
  signPetition,
  updateStatus,
  deletePetition,
  setOfficialResponse,
} = require("../controllers/petitionController");

// Create petition
router.post("/", auth, createPetition);

// Get petitions (with filters)
router.get("/", auth, getPetitions);

// Get single petition
router.get("/:id", auth, getPetitionById);

// Edit petition
router.put("/:id", auth, editPetition);

// Sign petition
router.post("/:id/sign", auth, signPetition);

// Update petition status
router.patch("/:id/status", auth, updateStatus);

// Set / update official response (officer petitions)
router.patch("/:id/official-response", auth, setOfficialResponse);

// Delete petition
router.delete("/:id", auth, deletePetition);

module.exports = router;
