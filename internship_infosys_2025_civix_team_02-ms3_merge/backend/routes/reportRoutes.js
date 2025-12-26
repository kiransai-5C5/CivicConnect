const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const {
  generateReport,
  getCitizenReport,
  getReportByRole,
} = require("../controllers/reportController");

// Unified endpoint – auto-detects role
router.get("/", auth, getReportByRole);

// Legacy/explicit endpoints (optional)
router.get("/official", auth, generateReport);
router.get("/citizen", auth, getCitizenReport);

module.exports = router;

