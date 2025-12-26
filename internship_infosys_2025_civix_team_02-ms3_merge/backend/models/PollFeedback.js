// backend/models/PollFeedback.js
const mongoose = require("mongoose");

const pollFeedbackSchema = new mongoose.Schema(
  {
    poll: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Poll",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    optionId: {
      type: String, // store the option _id as string
      required: true,
    },
    selectedOption: {
      type: String, // the text of the option
      required: true,
    },
    pollQuestion: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    improvements: {
      type: String,
      default: "",
    },
    concerns: {
      type: String,
      default: "",
    },
    rating: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PollFeedback", pollFeedbackSchema);