// backend/controllers/pollFeedbackController.js
const Poll = require("../models/Poll");
const PollFeedback = require("../models/PollFeedback");

const submitPollFeedback = async (req, res) => {
  try {
    const { pollId } = req.params;
    const {
      optionId,
      selectedOption,
      pollQuestion,
      reason,
      improvements,
      concerns,
      rating,
    } = req.body;

    // basic validation
    if (!reason || !reason.trim()) {
      return res
        .status(400)
        .json({ message: "Please provide a reason for your choice" });
    }

    if (!optionId || !selectedOption || !pollQuestion || !rating) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ensure poll exists
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    // optionally, you could check here that the optionId belongs to this poll

    const feedback = new PollFeedback({
      poll: pollId,
      user: req.user.id, // comes from authMiddleware
      optionId,
      selectedOption,
      pollQuestion,
      reason: reason.trim(),
      improvements: improvements || "",
      concerns: concerns || "",
      rating,
    });

    await feedback.save();

    return res
      .status(201)
      .json({ message: "Feedback submitted successfully", feedback });
  } catch (err) {
    console.error("POLL FEEDBACK ERROR:", err);
    return res
      .status(500)
      .json({ message: "Error submitting feedback", error: err.message });
  }
};

module.exports = {
  submitPollFeedback,
};