// controllers/pollController.js
const Poll = require("../models/Poll.js");

// CREATE POLL
const createPoll = async (req, res) => {
  try {
    // 🔥 DEBUG LINE TO CONFIRM TOKEN USER IS COMING
    // console.log("USER FROM TOKEN:", req.user);

    const newPoll = new Poll({
      question: req.body.question,
      description: req.body.description,
      category: req.body.category,
      location: req.body.location,
      closesOn: req.body.closesOn,
      createdBy: req.user.id, // ensure user is correctly assigned

      // officerStatus defaults to "Pending Review" in the schema

      // Convert ["a","b"] to [{text:"a"},{text:"b"}]
      options: req.body.options.map((opt) => ({ text: opt })),
    });

    await newPoll.save();
    res.status(201).json(newPoll);
  } catch (err) {
    console.log("CREATE POLL ERROR:", err);
    res.status(500).json({ message: "Error creating poll", error: err.message });
  }
};

// GET ALL POLLS + FILTERS (citizen-facing)
const getPolls = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tab, location, category } = req.query;

    let filter = {};

    // For "my" tab, show all polls created by user (including pending)
    if (tab === "my") {
      filter.createdBy = userId;
      // Don't filter by officerStatus for "my" tab - show all user's polls
    } else {
      // For other tabs: show approved polls OR polls created by current user (so they can see their pending polls)
      filter.$or = [
        { officerStatus: "Approved" },
        { createdBy: userId } // User's own polls (including pending) visible in all tabs
      ];
    }

    if (tab === "active") filter.status = "Active";
    if (tab === "closed") filter.status = "Closed";
    if (tab === "voted") filter["voters.user"] = userId;

    if (category && category !== "All Categories") {
      filter.category = category;
    }

    if (location && location !== "All Locations") {
      filter.location = location;
    }

    let polls = await Poll.find(filter).sort({ createdAt: -1 });

    // ⭐ AUTO-CLOSE POLLS BASED ON DATE
    const now = new Date();
    for (let poll of polls) {
      if (poll.closesOn && new Date(poll.closesOn) < now && poll.status !== "Closed") {
        poll.status = "Closed";
        await poll.save();
      }
    }

    res.json(polls);
  } catch (err) {
    console.log("GET POLLS ERROR:", err);
    res.status(500).json({ message: "Error fetching polls" });
  }
};


// GET POLL BY ID
const getPollById = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: "Poll not found" });

    res.json(poll);
  } catch (err) {
    res.status(500).json({ message: "Error fetching poll" });
  }
};

// VOTE ON POLL
const votePoll = async (req, res) => {
  try {
    const { pollId, optionId } = req.params;

    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).json({ message: "Poll not found" });

    // Check if poll is approved - only approved polls can be voted on
    if (poll.officerStatus !== "Approved") {
      return res.status(403).json({ 
        message: "This poll is pending approval and cannot be voted on yet" 
      });
    }

    // user already voted?
    const alreadyVoted = poll.voters.find(
      (v) => v.user.toString() === req.user.id
    );

    if (alreadyVoted) {
      return res.status(400).json({ message: "You already voted" });
    }

    const option = poll.options.find(
      (opt) => opt._id.toString() === optionId
    );

    if (!option) {
      return res.status(404).json({ message: "Option not found" });
    }

    option.votes += 1;
    poll.totalVotes += 1;

    poll.voters.push({ user: req.user.id, optionId });

    await poll.save();

    res.json({ message: "Vote submitted successfully", poll });

  } catch (err) {
    console.error("Vote Error:", err);
    res.status(500).json({ message: "Error submitting vote" });
  }
};

// DELETE POLL
const deletePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) return res.status(404).json({ message: "Poll not found" });

    if (poll.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await poll.deleteOne();

    res.json({ message: "Poll deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting poll" });
  }
};

// ----------------------------------------------------
// OFFICER POLLS: LIST WITH OFFICER FILTERS
// ----------------------------------------------------
const getOfficerPolls = async (req, res) => {
  try {
    if (req.user.userType !== "Official") {
      return res
        .status(403)
        .json({ message: "Only officials can view officer polls" });
    }

    const { status, location, category } = req.query;

    const filter = {};

    if (status && status !== "all") {
      // expect values: "Pending Review", "Approved", "Rejected"
      filter.officerStatus = status;
    }

    if (location && location !== "All Locations") {
      filter.location = location;
    }

    if (category && category !== "All Categories") {
      filter.category = category;
    }

    const polls = await Poll.find(filter).sort({ createdAt: -1 });

    return res.json(polls);
  } catch (err) {
    console.error("GET OFFICER POLLS ERROR:", err);
    return res
      .status(500)
      .json({ message: "Error fetching officer polls" });
  }
};

// ----------------------------------------------------
// OFFICER POLLS: UPDATE OFFICER STATUS (approve / reject)
// ----------------------------------------------------
const updateOfficerPollStatus = async (req, res) => {
  try {
    if (req.user.userType !== "Official") {
      return res
        .status(403)
        .json({ message: "Only officials can update poll status" });
    }

    const { status } = req.body; // "Pending Review" | "Approved" | "Rejected"

    const allowed = ["Pending Review", "Approved", "Rejected"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const update = {
      officerStatus: status,
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    };

    // If approved or rejected, we also close the poll on citizen side
    if (status === "Approved" || status === "Rejected") {
      update.status = "Closed";
    }

    const poll = await Poll.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    return res.json(poll);
  } catch (err) {
    console.error("UPDATE OFFICER POLL STATUS ERROR:", err);
    return res
      .status(500)
      .json({ message: "Error updating poll status" });
  }
};

module.exports = {
  createPoll,
  getPolls,
  getPollById,
  votePoll,
  deletePoll,
  getOfficerPolls,
  updateOfficerPollStatus,
};
