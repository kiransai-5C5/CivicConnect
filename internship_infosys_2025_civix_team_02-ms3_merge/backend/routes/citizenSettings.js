// backend/routes/citizenSettings.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getSettings,
  updateProfile,
  updatePassword,
  updateLocation,
  updateNotifications,
  getActivity
} = require('../controllers/citizenSettingsController');

// All routes require authentication
router.use(authMiddleware);

// GET all settings data
router.get('/', getSettings);

// Update profile
router.put('/profile', updateProfile);

// Change password
router.put('/password', updatePassword);

// Update location
router.put('/location', updateLocation);

// Update notification preferences
router.put('/notifications', updateNotifications);

// Get activity summary
router.get('/activity', getActivity);

module.exports = router;

