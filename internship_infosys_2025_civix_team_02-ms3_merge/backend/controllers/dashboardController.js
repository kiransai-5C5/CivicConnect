const Petition = require("../models/Petition");
const Signature = require("../models/Signature");
const Poll = require("../models/Poll");
const User = require("../models/User");

const assertOfficial = (user) => {
  if (!user || user.userType !== "Official") {
    const err = new Error("Only officials can access dashboard data");
    err.statusCode = 403;
    throw err;
  }
};

exports.getOfficerDashboard = async (req, res) => {
  try {
    assertOfficial(req.user);

    const [
      totalCitizens,
      pendingPetitionsCount,
      pendingPollsCount,
      activePollsCount,
      closedPetitionsCount,
    ] = await Promise.all([
      // All citizens
      User.countDocuments({ userType: "Citizen" }),
      // All petitions under review
      Petition.countDocuments({ status: "under_review" }),
      // All polls pending officer review (matches OfficerPolls \"Pending Review\" tab)
      Poll.countDocuments({
        officerStatus: "Pending Review",
      }),
      // All approved & active polls (matches citizen-visible active approved polls)
      Poll.countDocuments({
        officerStatus: "Approved",
        status: "Active",
      }),
      // All closed petitions
      Petition.countDocuments({ status: "closed" }),
    ]);

    const priorityPetitions = await Petition.find()
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();

    const petitionIds = priorityPetitions.map((p) => p._id);
    let signatureMap = {};
    if (petitionIds.length) {
      const signatures = await Signature.aggregate([
        { $match: { petition_id: { $in: petitionIds } } },
        { $group: { _id: "$petition_id", count: { $sum: 1 } } },
      ]);
      signatureMap = signatures.reduce((acc, curr) => {
        acc[curr._id.toString()] = curr.count;
        return acc;
      }, {});
    }

    const formattedPetitions = priorityPetitions.map((petition) => ({
      id: petition._id,
      title: petition.title,
      category: petition.category,
      location: petition.location,
      status: (petition.status || "active").toUpperCase(),
      description: petition.description,
      signatures: signatureMap[petition._id.toString()] || 0,
      goal: petition.goal || 100,
    }));

    const recentPollsRaw = await Poll.find({
      officerStatus: "Approved",
    })
      .sort({ reviewedAt: -1, createdAt: -1 })
      .limit(4)
      .lean();

    const recentPolls = recentPollsRaw.map((poll) => ({
      id: poll._id,
      question: poll.question,
      category: poll.category,
      location: poll.location,
      totalVotes: poll.totalVotes || 0,
      status: poll.status,
    }));

    res.json({
      stats: {
        constituents: totalCitizens,
        pendingReviews: pendingPetitionsCount + pendingPollsCount,
        activePolls: activePollsCount,
        issuesResolved: closedPetitionsCount,
      },
      priorityPetitions: formattedPetitions,
      recentPolls,
    });
  } catch (error) {
    console.error("OFFICER DASHBOARD ERROR:", error);
    const status = error.statusCode || 500;
    res.status(status).json({ message: "Failed to load dashboard data" });
  }
};

