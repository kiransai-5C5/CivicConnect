const Petition = require("../models/Petition");
const Signature = require("../models/Signature");
const Poll = require("../models/Poll");

const assertCitizen = (user) => {
  if (!user || user.userType !== "Citizen") {
    const err = new Error("Only citizens can access this dashboard");
    err.statusCode = 403;
    throw err;
  }
};

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB");
};

const calcClosesIn = (date) => {
  if (!date) return "N/A";
  const diffMs = new Date(date) - new Date();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Closing soon";
  if (diffDays === 1) return "1 day";
  return `${diffDays} days`;
};

exports.getCitizenDashboard = async (req, res) => {
  try {
    assertCitizen(req.user);

    const userId = req.user._id;
    const userIdStr = userId.toString();

    const [myPetitions, successfulPetitions, pollsVoted] = await Promise.all([
      Petition.countDocuments({ creator_id: userId }),
      Petition.countDocuments({
        creator_id: userId,
        status: { $in: ["under_review", "closed"] },
      }),
      Poll.countDocuments({ "voters.user": userId }),
    ]);

    const trendingPetitionAgg = await Petition.aggregate([
      {
        $lookup: {
          from: "signatures",
          localField: "_id",
          foreignField: "petition_id",
          as: "signatures",
        },
      },
      {
        $addFields: {
          signature_count: { $size: "$signatures" },
        },
      },
      { $sort: { signature_count: -1, createdAt: -1 } },
      { $limit: 1 },
    ]);

    let trendingPetition = null;

    if (trendingPetitionAgg.length) {
      const doc = trendingPetitionAgg[0];
      const signed =
        doc.signatures?.some(
          (sig) => sig.user_id?.toString() === userIdStr
        ) || false;

      trendingPetition = {
        id: doc._id.toString(),
        title: doc.title,
        description: doc.description || "",
        category: doc.category || "General",
        location: doc.location || req.user.location || "Unknown",
        status: (doc.status || "active").toUpperCase(),
        signatures: doc.signature_count || 0,
        goal: doc.goal || 100,
        createdBy: doc.creator_name || "Citizen",
        createdDate: formatDate(doc.createdAt),
        signed,
      };
    }

    const trendingPollDoc = await Poll.findOne({
      officerStatus: "Approved",
    })
      .sort({ totalVotes: -1, createdAt: -1 })
      .populate("createdBy", "fullName")
      .lean();

    let trendingPoll = null;

    if (trendingPollDoc) {
      const options = (trendingPollDoc.options || []).map((opt, idx) => ({
        id: idx + 1,
        optionKey: opt._id ? opt._id.toString() : String(idx + 1),
        text: opt.text,
        votes: opt.votes || 0,
      }));

      let userVoted = null;
      const voteEntry = (trendingPollDoc.voters || []).find(
        (vote) => vote.user?.toString() === userIdStr
      );

      if (voteEntry) {
        const optionIndex = options.findIndex(
          (opt) => opt.optionKey === voteEntry.optionId
        );
        userVoted = optionIndex >= 0 ? options[optionIndex].id : null;
      }

      trendingPoll = {
        id: trendingPollDoc._id.toString(),
        question: trendingPollDoc.question,
        description: trendingPollDoc.description || "",
        category: trendingPollDoc.category || "General",
        location: trendingPollDoc.location || req.user.location || "City",
        status: trendingPollDoc.status || "Active",
        options,
        totalVotes: trendingPollDoc.totalVotes || 0,
        closesIn: calcClosesIn(trendingPollDoc.closesOn),
        createdBy:
          trendingPollDoc.createdBy?.fullName || "Citizen",
        createdDate: formatDate(trendingPollDoc.createdAt),
        userVoted,
        comments: [],
      };
    }

    const signatureActivities = await Signature.find({
      user_id: userId,
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("petition_id", "title status");

    const recentActivities = signatureActivities.map((sig) => ({
      date: formatDate(sig.createdAt),
      type: "Signed Petition",
      title: sig.petition_id?.title || "Petition",
      status: (sig.petition_id?.status || "active").replace("_", " "),
    }));

    if (req.user.createdAt) {
      recentActivities.push({
        type: "account",
        title: "Joined Civix Platform",
        date: formatDate(req.user.createdAt),
      });
    }

    const upcomingEvents = [
      {
        date: "15",
        month: "JUL",
        title: "City Council Town Hall",
        description: "Open discussion on Q3 fiscal budget.",
        location: req.user.location || "Main Auditorium",
      },
      {
        date: "22",
        month: "JUL",
        title: "Public Budget Hearing",
        description: "Review of infrastructure allocation.",
        location: "City Hall, Room 404",
      },
      {
        date: "28",
        month: "JUL",
        title: "Civic Safety Workshop",
        description: "Community policing initiatives.",
        location: "Community Center",
      },
    ];

    res.json({
      stats: {
        myPetitions,
        successfulPetitions,
        pollsVoted,
      },
      trendingPetition,
      trendingPoll,
      recentActivities,
      upcomingEvents,
    });
  } catch (error) {
    console.error("CITIZEN DASHBOARD ERROR:", error);
    const status = error.statusCode || 500;
    res
      .status(status)
      .json({ message: "Failed to load citizen dashboard data" });
  }
};

