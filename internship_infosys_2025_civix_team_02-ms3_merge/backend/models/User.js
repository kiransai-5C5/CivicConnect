// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    enum: ['Citizen', 'Official'],
    default: 'Citizen'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String
  },
  otpExpires: {
    type: Date
  },
  // Notification preferences
  notificationPreferences: {
    petitionStatusUpdates: {
      type: Boolean,
      default: true
    },
    pollParticipationReminders: {
      type: Boolean,
      default: true
    },
    officialResponseNotifications: {
      type: Boolean,
      default: true
    }
  },
  // Official-specific preferences
  governancePreferences: {
    autoUpdatePetitionStatus: {
      type: Boolean,
      default: false
    },
    enablePublicComments: {
      type: Boolean,
      default: true
    },
    notifyOnNewPetitions: {
      type: Boolean,
      default: true
    },
    reportFrequency: {
      type: String,
      enum: ['weekly', 'monthly'],
      default: 'monthly'
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);