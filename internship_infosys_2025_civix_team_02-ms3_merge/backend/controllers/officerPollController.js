// backend/controllers/officerPollController.js
const Poll = require("../models/Poll");

// Ensure caller is an Official
const assertOfficial = (user) => {
  if (!user || user.userType !== "Official") {
    const err = new Error("Only officials can perform this action");
    err.statusCode = 403;
    throw err;
  }
};

// ----------------------------------------------------
// GET OFFICER POLLS LIST (with filters)
// ----------------------------------------------------
// Query params:
//   - status: "Pending Review" | "Approved" | "Rejected" | "all"
//   - location: string or "All Locations"
//   - category: string or "All Categories"
exports.getOfficerPolls = async (req, res) => {
  try {
    assertOfficial(req.user);

    const { status, location, category } = req.query;

    const filter = {};

    if (status && status !== "all") {
      // Normalise status to match values stored in officerStatus.
      // Treat missing officerStatus as "Pending Review" so older polls
      // still show up in the Pending tab.
      const v = status.toString().trim().toLowerCase();
      if (v === "pending review" || v === "pending_review") {
        filter.$or = [
          { officerStatus: "Pending Review" },
          { officerStatus: { $exists: false } },
          { officerStatus: null },
        ];
      } else if (v === "approved") {
        filter.officerStatus = "Approved";
      } else if (v === "rejected") {
        filter.officerStatus = "Rejected";
      }
    }

    if (location && location !== "All Locations") {
      filter.location = location;
    }

    if (category && category !== "All Categories") {
      filter.category = category;
    }

    const polls = await Poll.find(filter).sort({ createdAt: -1 });

    // Shape data so it's easy for the officer polls UI to consume
    const result = polls.map((p) => {
      // Derive display status for officer UI (uses officerStatus field)
      const uiStatus = p.officerStatus || "Pending Review";

      // Compute closesIn / closedOn labels
      let closesIn = null;
      let closedOn = null;

      if (uiStatus === "Pending Review") {
        if (p.closesOn) {
          const now = new Date();
          const diffMs = new Date(p.closesOn) - now;
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          closesIn =
            diffDays > 0 ? `${diffDays} days` : "Closing soon";
        } else {
          closesIn = "N/A";
        }
      } else {
        closedOn = p.reviewedAt
          ? new Date(p.reviewedAt).toLocaleDateString("en-GB")
          : new Date().toLocaleDateString("en-GB");
      }

      return {
        // Keep the raw mongo document fields
        ...p.toObject(),

        // Officer-friendly fields that match the UI components
        id: p._id,
        question: p.question,
        description: p.description || "",
        category: p.category,
        location: p.location,
        status: uiStatus,
        options: (p.options || []).map((opt, idx) => ({
          id: opt._id || idx + 1,
          text: opt.text,
          votes: opt.votes || 0,
        })),
        totalVotes: p.totalVotes || 0,
        closesIn,
        closedOn,
        createdBy: p.createdByName || "Citizen",
        createdDate: p.createdAt
          ? new Date(p.createdAt).toLocaleDateString("en-GB")
          : "",
      };
    });

    return res.json(result);
  } catch (err) {
    console.error("OFFICER GET POLLS ERROR:", err);
    const status = err.statusCode || 500;
    return res
      .status(status)
      .json({ message: "Error fetching officer polls" });
  }
};

// ----------------------------------------------------
// UPDATE OFFICER POLL STATUS (approve / reject)
// ----------------------------------------------------
exports.updateOfficerPollStatus = async (req, res) => {
  try {
    assertOfficial(req.user);

    let { status } = req.body; // "Pending Review" | "Approved" | "Rejected" (or case-insensitive)

    const allowed = ["Pending Review", "Approved", "Rejected"];

    // Normalise status from UI / API
    const normalizeStatus = (value) => {
      if (!value) return null;
      const v = value.toString().trim().toLowerCase();
      if (v === "pending review" || v === "pending_review")
        return "Pending Review";
      if (v === "approved") return "Approved";
      if (v === "rejected") return "Rejected";
      return null;
    };

    const normalized = normalizeStatus(status);
    if (!normalized || !allowed.includes(normalized)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const update = {
      officerStatus: normalized,
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    };

    // If approved, set status to Active so citizens can see and vote
    // If rejected, close the poll
    if (normalized === "Approved") {
      update.status = "Active";
    } else if (normalized === "Rejected") {
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
    console.error("OFFICER UPDATE POLL STATUS ERROR:", err);
    const status = err.statusCode || 500;
    return res
      .status(status)
      .json({ message: "Error updating poll status" });
  }
};


