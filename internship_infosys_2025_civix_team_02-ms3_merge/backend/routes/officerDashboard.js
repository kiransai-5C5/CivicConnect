const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { getOfficerDashboard } = require("../controllers/dashboardController");

router.get("/", auth, getOfficerDashboard);

module.exports = router;

