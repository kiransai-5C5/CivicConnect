// backend/controllers/officialSettingsController.js
const User = require('../models/User');
const AdminLog = require('../models/AdminLog');
const bcrypt = require('bcryptjs');

// Helper to log admin actions
const logAdminAction = async (officer, type, action, target = null, details = {}) => {
  try {
    await AdminLog.create({
      type,
      action,
      target,
      officerId: officer._id,
      officerName: officer.fullName,
      details
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
};

// Helper role check
const ensureOfficial = (user, res) => {
  if (!user?.userType || user.userType.toLowerCase() !== 'official') {
    res.status(403).json({ message: 'Access denied. Officials only.' });
    return false;
  }
  return true;
};

// GET /api/official/settings - Get all settings data
exports.getSettings = async (req, res) => {
  try {
    const user = req.user;

    if (!ensureOfficial(user, res)) return;

    const recentLogs = await AdminLog.find({ officerId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('type action target createdAt details')
      .lean();

    res.json({
      profile: {
        fullName: user.fullName,
        email: user.email,
        role: user.userType,
        location: user.location
      },
      governancePreferences: user.governancePreferences || {
        autoUpdatePetitionStatus: false,
        enablePublicComments: true,
        notifyOnNewPetitions: true,
        reportFrequency: 'monthly'
      },
      recentLogs
    });
  } catch (error) {
    console.error('Error fetching official settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/official/settings/profile
exports.updateProfile = async (req, res) => {
  try {
    const user = req.user;

    if (!ensureOfficial(user, res)) return;

    const { fullName, email } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const oldName = user.fullName;
    const oldEmail = user.email;

    user.fullName = fullName.trim();
    user.email = email.toLowerCase().trim();
    await user.save();

    await logAdminAction(user, 'settings', 'Updated profile', null, {
      oldName,
      newName: user.fullName,
      oldEmail,
      newEmail: user.email
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/official/settings/password
exports.updatePassword = async (req, res) => {
  try {
    const user = req.user;

    if (!ensureOfficial(user, res)) return;

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All password fields are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    const userWithPassword = await User.findById(user._id);
    const isMatch = await bcrypt.compare(currentPassword, userWithPassword.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    userWithPassword.password = await bcrypt.hash(newPassword, salt);
    await userWithPassword.save();

    await logAdminAction(user, 'settings', 'Changed password', null, {});

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/official/settings/location
exports.updateLocation = async (req, res) => {
  try {
    const user = req.user;

    if (!ensureOfficial(user, res)) return;

    const { location } = req.body;

    if (!location || location.trim() === '') {
      return res.status(400).json({ message: 'Location is required' });
    }

    const oldLocation = user.location;
    user.location = location.trim();
    await user.save();

    await logAdminAction(user, 'settings', 'Updated jurisdiction', null, {
      oldLocation,
      newLocation: user.location
    });

    res.json({
      message: 'Jurisdiction updated successfully',
      location: user.location
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/official/settings/preferences
exports.updatePreferences = async (req, res) => {
  try {
    const user = req.user;

    if (!ensureOfficial(user, res)) return;

    const {
      autoUpdatePetitionStatus,
      enablePublicComments,
      notifyOnNewPetitions,
      reportFrequency
    } = req.body;

    if (!user.governancePreferences) {
      user.governancePreferences = {};
    }

    const oldPreferences = { ...user.governancePreferences };

    if (typeof autoUpdatePetitionStatus === 'boolean')
      user.governancePreferences.autoUpdatePetitionStatus = autoUpdatePetitionStatus;

    if (typeof enablePublicComments === 'boolean')
      user.governancePreferences.enablePublicComments = enablePublicComments;

    if (typeof notifyOnNewPetitions === 'boolean')
      user.governancePreferences.notifyOnNewPetitions = notifyOnNewPetitions;

    if (reportFrequency && ['weekly', 'monthly'].includes(reportFrequency))
      user.governancePreferences.reportFrequency = reportFrequency;

    await user.save();

    await logAdminAction(user, 'settings', 'Updated governance preferences', null, {
      oldPreferences,
      newPreferences: user.governancePreferences
    });

    res.json({
      message: 'Governance preferences updated successfully',
      governancePreferences: user.governancePreferences
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/official/settings/logs
exports.getLogs = async (req, res) => {
  try {
    const user = req.user;

    if (!ensureOfficial(user, res)) return;

    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const logs = await AdminLog.find({ officerId: user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('type action target createdAt details')
      .lean();

    const total = await AdminLog.countDocuments({ officerId: user._id });

    res.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
