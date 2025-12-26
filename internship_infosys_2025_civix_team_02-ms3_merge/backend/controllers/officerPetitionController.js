// backend/controllers/officerPetitionController.js
const Petition = require("../models/Petition");
const Signature = require("../models/Signature");

// Ensure caller is an Official
const assertOfficial = (user) => {
  if (!user || user.userType !== "Official") {
    const err = new Error("Only officials can perform this action");
    err.statusCode = 403;
    throw err;
  }
};

// ----------------------------------------------------
// GET OFFICER PETITIONS LIST (with filters)
// ----------------------------------------------------
// Query params:
//   - status: "active" | "under_review" | "closed" | "all"
//   - location: string or "All Locations"
//   - category: string or "All Categories"
exports.getOfficerPetitions = async (req, res) => {
  try {
    assertOfficial(req.user);

    const { status, location, category } = req.query;

    const filter = {};

    if (status && status !== "all") {
      const v = status.toString().trim().toLowerCase();
      if (v === "active") filter.status = "active";
      else if (v === "under review" || v === "under_review")
        filter.status = "under_review";
      else if (v === "closed") filter.status = "closed";
    }

    if (location && location !== "All Locations") {
      filter.location = location;
    }

    if (category && category !== "All Categories") {
      filter.category = category;
    }

    const petitions = await Petition.find(filter).sort({ createdAt: -1 });

    // Attach signature counts and shape the data so it's easy for tlook at he
    // officer frontend to consume (mirrors the citizen petitions UI)
    const result = [];
    for (let p of petitions) {
      const count = await Signature.countDocuments({ petition_id: p._id });

      // Map backend status values to officer UI labels
      let uiStatus = "ACTIVE";
      if (p.status === "under_review") uiStatus = "UNDER REVIEW";
      else if (p.status === "closed") uiStatus = "CLOSED";

      result.push({
        // Keep the raw mongo document fields as-is
        ...p.toObject(),

        // Explicit officer-friendly fields (these are what the frontend
        // components typically expect to render)
        id: p._id,
        title: p.title,
        description: p.description,
        category: p.category || "",
        location: p.location || "",
        status: uiStatus,
        signatures: count,
        goal: p.goal || 100,
        createdBy: p.creator_name || "Unknown",
        createdDate: p.createdAt
          ? new Date(p.createdAt).toLocaleDateString("en-GB")
          : "",
        officialResponse: p.officialResponse || null,
        responseDate: p.responseDate
          ? new Date(p.responseDate).toLocaleDateString("en-GB")
          : null,
      });
    }

    return res.json(result);
  } catch (err) {
    console.error("OFFICER GET PETITIONS ERROR:", err);
    const status = err.statusCode || 500;
    return res
      .status(status)
      .json({ message: "Error fetching officer petitions" });
  }
};

// ----------------------------------------------------
// UPDATE PETITION STATUS (officer)
// ----------------------------------------------------
exports.updateOfficerPetitionStatus = async (req, res) => {
  try {
    assertOfficial(req.user);

    let { status } = req.body; // can be backend ("active") or UI ("ACTIVE"/"UNDER REVIEW"/"CLOSED")

    // Accept both API-facing values and officer UI labels
    const normalizeStatus = (value) => {
      if (!value) return null;
      const v = value.toString().trim().toLowerCase();

      // UI labels
      if (v === "active") return "active";
      if (v === "under review" || v === "under_review") return "under_review";
      if (v === "closed") return "closed";

      return null;
    };

    const normalized = normalizeStatus(status);
    if (!normalized) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const petition = await Petition.findByIdAndUpdate(
      req.params.id,
      { status: normalized },
      { new: true }
    );

    if (!petition) {
      return res.status(404).json({ message: "Not found" });
    }

    return res.json(petition);
  } catch (err) {
    console.error("OFFICER UPDATE PETITION STATUS ERROR:", err);
    const status = err.statusCode || 500;
    return res
      .status(status)
      .json({ message: "Failed to update petition status" });
  }
};

// ----------------------------------------------------
// SET / UPDATE OFFICIAL RESPONSE
// ----------------------------------------------------
exports.setOfficerPetitionResponse = async (req, res) => {
  try {
    assertOfficial(req.user);

    const { response } = req.body;

    if (!response || !response.trim()) {
      return res
        .status(400)
        .json({ message: "Response text is required" });
    }

    const petition = await Petition.findByIdAndUpdate(
      req.params.id,
      {
        officialResponse: response.trim(),
        responseDate: new Date(),
      },
      { new: true }
    );

    if (!petition) {
      return res.status(404).json({ message: "Not found" });
    }

    return res.json(petition);
  } catch (err) {
    console.error("OFFICER SET PETITION RESPONSE ERROR:", err);
    const status = err.statusCode || 500;
    return res
      .status(status)
      .json({ message: "Failed to set official response" });
  }
};


