const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  votes: { type: Number, default: 0 }
});

const pollSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    description: String,
    category: { type: String, required: true },
    location: { type: String, required: true },

    options: [optionSchema],

    totalVotes: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["Active", "Closed"],
      default: "Active"
    },

    // officer / official review workflow
    officerStatus: {
      type: String,
      enum: ["Pending Review", "Approved", "Rejected"],
      default: "Pending Review",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },

    closesOn: Date,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    voters: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        optionId: String
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Poll", pollSchema);
