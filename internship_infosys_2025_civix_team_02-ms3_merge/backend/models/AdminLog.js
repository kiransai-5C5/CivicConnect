// backend/models/AdminLog.js
const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['petition', 'poll', 'settings', 'user', 'other']
  },
  action: {
    type: String,
    required: true
  },
  target: {
    type: String,
    default: null
  },
  officerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  officerName: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AdminLog', adminLogSchema);

