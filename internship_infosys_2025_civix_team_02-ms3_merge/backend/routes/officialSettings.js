// backend/routes/officialSettings.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getSettings,
  updateProfile,
  updatePassword,
  updateLocation,
  updatePreferences,
  getLogs
} = require('../controllers/officialSettingsController');

// All routes require authentication
router.use(authMiddleware);

// GET all settings data
router.get('/', getSettings);

// Update profile
router.put('/profile', updateProfile);

// Change password
router.put('/password', updatePassword);

// Update jurisdiction/location
router.put('/location', updateLocation);

// Update governance preferences
router.put('/preferences', updatePreferences);

// Get admin logs
router.get('/logs', getLogs);

module.exports = router;

