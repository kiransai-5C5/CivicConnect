// backend/controllers/citizenSettingsController.js
const User = require('../models/User');
const Signature = require('../models/Signature');
const Petition = require('../models/Petition');
const Poll = require('../models/Poll');
const bcrypt = require('bcryptjs');

// GET /api/citizen/settings - Get all settings data
exports.getSettings = async (req, res) => {
  try {
    const user = req.user;

    // Verify user is a citizen
    if (user.userType !== 'Citizen') {
      return res.status(403).json({ message: 'Access denied. Citizens only.' });
    }

    // Get activity summary
    const petitionsCreated = await Petition.countDocuments({ createdBy: user._id });
    const petitionsSigned = await Signature.countDocuments({ user: user._id });
    const pollsVoted = await Poll.countDocuments({ 'voters.user': user._id });

    res.json({
      profile: {
        fullName: user.fullName,
        email: user.email,
        role: user.userType,
        location: user.location
      },
      notificationPreferences: user.notificationPreferences || {
        petitionStatusUpdates: true,
        pollParticipationReminders: true,
        officialResponseNotifications: true
      },
      activity: {
        petitionsCreated,
        petitionsSigned,
        pollsVoted
      }
    });
  } catch (error) {
    console.error('Error fetching citizen settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/citizen/settings/profile - Update profile
exports.updateProfile = async (req, res) => {
  try {
    const user = req.user;

    if (user.userType !== 'Citizen') {
      return res.status(403).json({ message: 'Access denied. Citizens only.' });
    }

    const { fullName, email } = req.body;

    // Validation
    if (!fullName || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Update user
    user.fullName = fullName.trim();
    user.email = email.toLowerCase().trim();
    await user.save();

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

// PUT /api/citizen/settings/password - Change password
exports.updatePassword = async (req, res) => {
  try {
    const user = req.user;

    if (user.userType !== 'Citizen') {
      return res.status(403).json({ message: 'Access denied. Citizens only.' });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All password fields are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    // Verify current password
    const userWithPassword = await User.findById(user._id);
    const isMatch = await bcrypt.compare(currentPassword, userWithPassword.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash and update password
    const salt = await bcrypt.genSalt(10);
    userWithPassword.password = await bcrypt.hash(newPassword, salt);
    await userWithPassword.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/citizen/settings/location - Update location
exports.updateLocation = async (req, res) => {
  try {
    const user = req.user;

    if (user.userType !== 'Citizen') {
      return res.status(403).json({ message: 'Access denied. Citizens only.' });
    }

    const { location } = req.body;

    if (!location || location.trim() === '') {
      return res.status(400).json({ message: 'Location is required' });
    }

    user.location = location.trim();
    await user.save();

    res.json({ 
      message: 'Location updated successfully',
      location: user.location
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/citizen/settings/notifications - Update notification preferences
exports.updateNotifications = async (req, res) => {
  try {
    const user = req.user;

    if (user.userType !== 'Citizen') {
      return res.status(403).json({ message: 'Access denied. Citizens only.' });
    }

    const { petitionStatusUpdates, pollParticipationReminders, officialResponseNotifications } = req.body;

    // Initialize if not exists
    if (!user.notificationPreferences) {
      user.notificationPreferences = {};
    }

    if (typeof petitionStatusUpdates === 'boolean') {
      user.notificationPreferences.petitionStatusUpdates = petitionStatusUpdates;
    }
    if (typeof pollParticipationReminders === 'boolean') {
      user.notificationPreferences.pollParticipationReminders = pollParticipationReminders;
    }
    if (typeof officialResponseNotifications === 'boolean') {
      user.notificationPreferences.officialResponseNotifications = officialResponseNotifications;
    }

    await user.save();

    res.json({ 
      message: 'Notification preferences updated successfully',
      notificationPreferences: user.notificationPreferences
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/citizen/settings/activity - Get activity summary
exports.getActivity = async (req, res) => {
  try {
    const user = req.user;

    if (user.userType !== 'Citizen') {
      return res.status(403).json({ message: 'Access denied. Citizens only.' });
    }

    const petitionsCreated = await Petition.countDocuments({ createdBy: user._id });
    const petitionsSigned = await Signature.countDocuments({ user: user._id });
    
    // Count polls where user has voted
    const allPolls = await Poll.find({ 'voters.user': user._id });
    const pollsVoted = allPolls.length;

    res.json({
      petitionsCreated,
      petitionsSigned,
      pollsVoted
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

