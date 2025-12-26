const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const {
  getCitizenDashboard,
} = require("../controllers/citizenDashboardController");

router.get("/", auth, getCitizenDashboard);

module.exports = router;

