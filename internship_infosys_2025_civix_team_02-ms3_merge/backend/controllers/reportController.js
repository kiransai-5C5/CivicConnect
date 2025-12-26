const Petition = require("../models/Petition");
const Signature = require("../models/Signature");
const Poll = require("../models/Poll");
const PollFeedback = require("../models/PollFeedback");
const User = require("../models/User");

const assertOfficial = (user) => {
  if (!user || user.userType !== "Official") {
    const err = new Error("Only officials can access reports");
    err.statusCode = 403;
    throw err;
  }
};

const assertCitizen = (user) => {
  if (!user || user.userType !== "Citizen") {
    const err = new Error("Only citizens can access this report");
    err.statusCode = 403;
    throw err;
  }
};

// Helper to get last 6 months data
const getLast6Months = () => {
  const months = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      name: monthNames[date.getMonth()],
      start: new Date(date.getFullYear(), date.getMonth(), 1),
      end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59),
    });
  }
  return months;
};

const buildTrendSeries = (data = [], key) => {
  if (!Array.isArray(data) || !data.length) return [];

  const yValues = data.map((item) => Number(item?.[key]) || 0);
  const n = yValues.length;
  const xValues = yValues.map((_, idx) => idx);

  const sumX = xValues.reduce((acc, val) => acc + val, 0);
  const sumY = yValues.reduce((acc, val) => acc + val, 0);
  const sumXY = xValues.reduce((acc, val, idx) => acc + val * yValues[idx], 0);
  const sumX2 = xValues.reduce((acc, val) => acc + val * val, 0);
  const denominator = n * sumX2 - sumX * sumX;
  const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
  const intercept = n !== 0 ? (sumY - slope * sumX) / n : 0;

  return data.map((entry, idx) => ({
    month: entry.month,
    value: Number((slope * idx + intercept).toFixed(2)),
  }));
};

// ============================================================
// CITIZEN REPORT (Simplified, Read-Only)
// ============================================================
exports.getCitizenReport = async (req, res) => {
  try {
    assertCitizen(req.user);

    // Get simplified metrics
    const [totalSignatures, totalVotes, activePolls] = await Promise.all([
      Signature.countDocuments(),
      Poll.aggregate([
        { $group: { _id: null, total: { $sum: "$totalVotes" } } },
      ]).then((result) => result[0]?.total || 0),
      Poll.countDocuments({ officerStatus: "Approved", status: "Active" }),
    ]);

    // Get last 6 months engagement data
    const months = getLast6Months();
    const engagementData = await Promise.all(
      months.map(async (month) => {
        const signatures = await Signature.countDocuments({
          createdAt: { $gte: month.start, $lte: month.end },
        });

        const polls = await Poll.find({
          createdAt: { $gte: month.start, $lte: month.end },
        }).lean();

        const votes = polls.reduce((sum, poll) => sum + (poll.totalVotes || 0), 0);

        return {
          month: month.name,
          signatures,
          votes,
        };
      })
    );

    const signaturesTrend = buildTrendSeries(engagementData, "signatures");
    const pollVotesTrend = buildTrendSeries(engagementData, "votes");

    // Petition status distribution (simplified)
    const statusData = await Petition.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusDistribution = statusData.map((status) => ({
      status:
        status._id === "active"
          ? "Active"
          : status._id === "under_review"
          ? "Under Review"
          : "Closed",
      count: status.count,
    }));

    // Top petition categories (simplified)
    const categoryData = await Petition.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]);

    const topCategories = categoryData.map((cat) => ({
      name: cat._id || "General",
      count: cat.count,
    }));

    // Most voted poll topics (simplified)
    const mostVotedPolls = await Poll.find({
      officerStatus: "Approved",
    })
      .sort({ totalVotes: -1 })
      .limit(2)
      .lean()
      .then((polls) =>
        polls.map((poll) => ({
          question: poll.question,
          votes: poll.totalVotes || 0,
        }))
      );

    res.json({
      metrics: {
        totalSignatures,
        totalVotes,
        activePolls,
      },
      engagementGrowth: engagementData,
      signaturesTrend,
      pollVotesTrend,
      petitionAnalytics: {
        topCategories,
        statusDistribution,
      },
      pollAnalytics: {
        mostVotedPolls,
      },
    });
  } catch (error) {
    console.error("CITIZEN REPORT ERROR:", error);
    const status = error.statusCode || 500;
    res.status(status).json({ message: "Failed to load report data" });
  }
};

// ============================================================
// OFFICIAL REPORT (Full-Featured with Filters & Exports)
// ============================================================
exports.generateReport = async (req, res) => {
  try {
    assertOfficial(req.user);

    // Extract filters from query params
    const { startDate, endDate, category, location } = req.query;
    
    // Build filter objects
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const categoryFilter = category && category !== "All Categories" ? { category } : {};
    const locationFilter = location && location !== "All Locations" ? { location } : {};
    const combinedFilter = { ...dateFilter, ...categoryFilter, ...locationFilter };

    // Get petition IDs for location filter if needed
    let signatureFilter = {};
    if (dateFilter.createdAt) {
      signatureFilter.createdAt = dateFilter.createdAt;
    }
    if (locationFilter.location) {
      const petitionIds = await Petition.find(locationFilter).distinct("_id");
      signatureFilter.petition_id = { $in: petitionIds };
    }

    // Get all time totals (with filters)
    const [totalSignatures, totalVotes, resolvedIssues, unresolvedIssues, activePolls] =
      await Promise.all([
        Signature.countDocuments(signatureFilter),
        Poll.aggregate([
          { $match: { ...combinedFilter, officerStatus: "Approved" } },
          { $group: { _id: null, total: { $sum: "$totalVotes" } } },
        ]).then((result) => result[0]?.total || 0),
        Petition.countDocuments({ status: "closed", ...combinedFilter }),
        Petition.countDocuments({
          status: { $in: ["active", "under_review"] },
          ...combinedFilter,
        }),
        Poll.countDocuments({
          officerStatus: "Approved",
          status: "Active",
          ...combinedFilter,
        }),
      ]);

    // Calculate growth percentages (compare current period vs previous period)
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [currentSignatures, previousSignatures, currentVotes, previousVotes] =
      await Promise.all([
        Signature.countDocuments({
          createdAt: { $gte: currentMonthStart },
        }),
        Signature.countDocuments({
          createdAt: {
            $gte: previousMonthStart,
            $lte: previousMonthEnd,
          },
        }),
        Poll.aggregate([
          {
            $match: {
              createdAt: { $gte: currentMonthStart },
              officerStatus: "Approved",
            },
          },
          { $group: { _id: null, total: { $sum: "$totalVotes" } } },
        ]).then((result) => result[0]?.total || 0),
        Poll.aggregate([
          {
            $match: {
              createdAt: {
                $gte: previousMonthStart,
                $lte: previousMonthEnd,
              },
              officerStatus: "Approved",
            },
          },
          { $group: { _id: null, total: { $sum: "$totalVotes" } } },
        ]).then((result) => result[0]?.total || 0),
      ]);

    const signaturesGrowth =
      previousSignatures > 0
        ? Math.round(
            ((currentSignatures - previousSignatures) / previousSignatures) * 100
          )
        : 0;
    const votesGrowth =
      previousVotes > 0
        ? Math.round(((currentVotes - previousVotes) / previousVotes) * 100)
        : 0;

    // Get last 6 months engagement data (with filters)
    const months = getLast6Months();
    const engagementData = await Promise.all(
      months.map(async (month) => {
        const monthFilter = {
          createdAt: { $gte: month.start, $lte: month.end },
        };

        const signatures = await Signature.countDocuments(
          locationFilter.location
            ? {
                ...monthFilter,
                petition_id: {
                  $in: await Petition.find(locationFilter).distinct("_id"),
                },
              }
            : monthFilter
        );

        const polls = await Poll.find({
          ...monthFilter,
          ...categoryFilter,
          ...locationFilter,
        }).lean();

        const votes = polls.reduce((sum, poll) => sum + (poll.totalVotes || 0), 0);

        return {
          month: month.name,
          signatures,
          votes,
        };
      })
    );

    const signaturesTrend = buildTrendSeries(engagementData, "signatures");
    const pollVotesTrend = buildTrendSeries(engagementData, "votes");

    // Top petition categories (with filters)
    const categoryMatch = { ...dateFilter, ...locationFilter };
    const categoryData = await Petition.aggregate([
      ...(Object.keys(categoryMatch).length > 0 ? [{ $match: categoryMatch }] : []),
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const topCategories = categoryData.map((cat) => ({
      name: cat._id || "General",
      count: cat.count,
    }));

    // Petition status distribution (with filters)
    const statusMatch = { ...combinedFilter };
    const statusData = await Petition.aggregate([
      ...(Object.keys(statusMatch).length > 0 ? [{ $match: statusMatch }] : []),
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusDistribution = statusData.map((status) => ({
      status:
        status._id === "active"
          ? "Active"
          : status._id === "under_review"
          ? "Under Review"
          : "Closed",
      count: status.count,
    }));

    // Poll engagement breakdown
    const pollEngagement = await Poll.aggregate([
      {
        $match: {
          officerStatus: "Approved",
          ...combinedFilter,
        },
      },
      {
        $project: {
          question: 1,
          totalVotes: 1,
          createdAt: 1,
          options: 1,
        },
      },
      { $sort: { totalVotes: -1 } },
      { $limit: 5 },
    ]);

    const pollEngagementBreakdown = pollEngagement.map((poll) => ({
      question: poll.question,
      totalVotes: poll.totalVotes || 0,
      options: poll.options || [],
      createdAt: poll.createdAt,
    }));

    // Most active polls (by votes) with filters
    const activePollsData = await Poll.find({
      officerStatus: "Approved",
      ...combinedFilter,
    })
      .sort({ totalVotes: -1 })
      .limit(5)
      .lean();

    const mostActivePolls = activePollsData.map((poll) => ({
      question: poll.question,
      votes: poll.totalVotes || 0,
    }));

    // Most discussed polls (by comments/feedback) with filters
    const pollFeedbackMatch = {};
    if (dateFilter.createdAt) {
      pollFeedbackMatch.createdAt = dateFilter.createdAt;
    }

    const pollFeedbackCounts = await PollFeedback.aggregate([
      ...(Object.keys(pollFeedbackMatch).length > 0
        ? [{ $match: pollFeedbackMatch }]
        : []),
      {
        $lookup: {
          from: "polls",
          localField: "poll",
          foreignField: "_id",
          as: "pollData",
        },
      },
      { $unwind: "$pollData" },
      ...(categoryFilter.category
        ? [{ $match: { "pollData.category": categoryFilter.category } }]
        : []),
      ...(locationFilter.location
        ? [{ $match: { "pollData.location": locationFilter.location } }]
        : []),
      {
        $group: {
          _id: "$poll",
          count: { $sum: 1 },
          question: { $first: "$pollData.question" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const mostDiscussed = pollFeedbackCounts.map((feedback) => ({
      question: feedback.question || "Unknown Poll",
      comments: feedback.count,
    }));

    // Admin logs (recent official actions)
    const adminLogs = await Promise.all([
      // Recent petition status updates
      Petition.find({
        reviewedBy: { $exists: true },
        ...(dateFilter.createdAt ? {} : {}),
      })
        .sort({ reviewedAt: -1 })
        .limit(10)
        .populate("reviewedBy", "name email")
        .lean()
        .then((petitions) =>
          petitions.map((p) => ({
            type: "Petition Review",
            action: `Status changed to ${p.status}`,
            target: p.title,
            officer: p.reviewedBy?.name || "Unknown",
            timestamp: p.reviewedAt || p.updatedAt,
          }))
        ),
      // Recent poll approvals/rejections
      Poll.find({
        reviewedBy: { $exists: true },
        ...(dateFilter.createdAt ? {} : {}),
      })
        .sort({ reviewedAt: -1 })
        .limit(10)
        .populate("reviewedBy", "name email")
        .lean()
        .then((polls) =>
          polls.map((p) => ({
            type: "Poll Review",
            action: `Status: ${p.officerStatus}`,
            target: p.question,
            officer: p.reviewedBy?.name || "Unknown",
            timestamp: p.reviewedAt || p.updatedAt,
          }))
        ),
    ]).then((results) => {
      const allLogs = [...results[0], ...results[1]];
      return allLogs
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 20);
    });

    // Get available filter options
    const availableCategories = await Petition.distinct("category");
    const availableLocations = await Petition.distinct("location");

    // Export metadata
    const exportMetadata = {
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.name || req.user.email,
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        category: category || "All Categories",
        location: location || "All Locations",
      },
      formats: ["PDF", "CSV"],
    };

    res.json({
      metrics: {
        totalSignatures,
        totalVotes,
        resolvedIssues,
        unresolvedIssues,
        activePolls,
        signaturesGrowth,
        votesGrowth,
      },
      engagementGrowth: engagementData,
      signaturesTrend,
      pollVotesTrend,
      petitionAnalytics: {
        topCategories,
        statusDistribution,
      },
      pollAnalytics: {
        mostActivePolls,
        mostDiscussed,
        engagementBreakdown: pollEngagementBreakdown,
      },
      adminLogs,
      filters: {
        availableCategories: ["All Categories", ...availableCategories],
        availableLocations: ["All Locations", ...availableLocations],
        current: {
          startDate: startDate || null,
          endDate: endDate || null,
          category: category || "All Categories",
          location: location || "All Locations",
        },
      },
      exportMetadata,
    });
  } catch (error) {
    console.error("REPORT GENERATION ERROR:", error);
    const status = error.statusCode || 500;
    res.status(status).json({ message: "Failed to generate report" });
  }
};

/**
 * Unified reports endpoint – automatically serves the correct payload
 * based on the authenticated user's role.
 */
exports.getReportByRole = async (req, res) => {
  try {
    if (req.user?.userType === "Official") {
      return exports.generateReport(req, res);
    }

    return exports.getCitizenReport(req, res);
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ message: "Failed to load report data" });
  }
};

