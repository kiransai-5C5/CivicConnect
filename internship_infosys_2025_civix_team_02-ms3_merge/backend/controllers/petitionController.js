const Petition = require("../models/Petition");
const Signature = require("../models/Signature");

// ----------------------------------------------------
// CREATE PETITION
// ----------------------------------------------------
exports.createPetition = async (req, res) => {
  try {
    const { title, description, category, location, goal } = req.body;

    if (!title || !description)
      return res.status(400).json({ message: "Title & description required" });

    const petition = await Petition.create({
      creator_id: req.user._id,
      creator_name: req.user.fullName,
      title,
      description,
      category,
      location,
      goal: goal || 100,
    });

    res.status(201).json(petition);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to create petition" });
  }
};


// ----------------------------------------------------
// GET PETITIONS WITH FULL FILTERING (LIKE POLLS)
// ----------------------------------------------------
exports.getPetitions = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { tab, location, category, status } = req.query;

    let filter = {};

    // TAB FILTERS
    if (tab === "my") filter.creator_id = userId;

    if (tab === "signed") {
      const signed = await Signature.find({ user_id: userId }).select("petition_id");
      const signedIds = signed.map(s => s.petition_id);
      filter._id = { $in: signedIds };
    }

    // LOCATION FILTER
    if (location && location !== "All Locations") filter.location = location;

    // CATEGORY FILTER
    if (category && category !== "All Categories") filter.category = category;

    // STATUS FILTER
    if (status && status !== "All") filter.status = status.toLowerCase();

    const petitions = await Petition.find(filter).sort({ createdAt: -1 });

    // Attach signature counts + signed status for each petition
    const result = [];
    for (let p of petitions) {
      const count = await Signature.countDocuments({ petition_id: p._id });

      const signed = await Signature.findOne({
        petition_id: p._id,
        user_id: userId,
      });

      result.push({
        ...p.toObject(),
        signature_count: count,
        user_has_signed: !!signed,
      });
    }

    res.json(result);
  } catch (err) {
    console.log("GET PETITIONS ERROR:", err);
    res.status(500).json({ message: "Error fetching petitions" });
  }
};



// ----------------------------------------------------
// GET PETITION BY ID
// ----------------------------------------------------
exports.getPetitionById = async (req, res) => {
  try {
    const petition = await Petition.findById(req.params.id);

    if (!petition) return res.status(404).json({ message: "Not found" });

    const count = await Signature.countDocuments({ petition_id: petition._id });

    res.json({
      ...petition.toObject(),
      signature_count: count
    });
  } catch (err) {
    res.status(500).json({ message: "Failed" });
  }
};


// ----------------------------------------------------
// SIGN PETITION
// ----------------------------------------------------
exports.signPetition = async (req, res) => {
  try {
    const petition = await Petition.findById(req.params.id);
    if (!petition) return res.status(404).json({ message: "Not found" });

    if (petition.status === "closed")
      return res.status(400).json({ message: "Closed petition" });

    // prevent duplicate signing
    const exists = await Signature.findOne({
      petition_id: petition._id,
      user_id: req.user._id
    });

    if (exists) return res.status(409).json({ message: "Already signed" });

    await Signature.create({
      petition_id: petition._id,
      user_id: req.user._id
    });

    res.json({ message: "Signed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to sign petition" });
  }
};


// ----------------------------------------------------
// UPDATE STATUS (OFFICIAL ONLY)
// ----------------------------------------------------
exports.updateStatus = async (req, res) => {
  try {
    if (req.user.userType !== "official")
      return res.status(403).json({ message: "Only officials allowed" });

    const { status } = req.body;
    const allowed = ["active", "under_review", "closed"];

    if (!allowed.includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const petition = await Petition.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(petition);
  } catch (err) {
    res.status(500).json({ message: "Failed to update status" });
  }
};


// ----------------------------------------------------
// DELETE PETITION
// ----------------------------------------------------
exports.deletePetition = async (req, res) => {
  try {
    const petition = await Petition.findById(req.params.id);
    if (!petition) return res.status(404).json({ message: "Not found" });

    if (petition.creator_id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    await Signature.deleteMany({ petition_id: petition._id });
    await petition.deleteOne();

    res.json({ message: "Petition deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete petition" });
  }
};


// ----------------------------------------------------
// EDIT PETITION
// ----------------------------------------------------
exports.editPetition = async (req, res) => {
  try {
    const petition = await Petition.findById(req.params.id);

    if (!petition) return res.status(404).json({ message: "Not found" });

    if (petition.creator_id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    if (petition.status !== "active")
      return res.status(400).json({ message: "Not editable" });

    Object.assign(petition, req.body);
    await petition.save();

    res.json(petition);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to edit petition" });
  }
};


// ----------------------------------------------------
// SET OFFICIAL RESPONSE (OFFICER PETITIONS)
// ----------------------------------------------------
exports.setOfficialResponse = async (req, res) => {
  try {
    if (req.user.userType !== "Official") {
      return res
        .status(403)
        .json({ message: "Only officials can post official responses" });
    }

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
    console.error("SET OFFICIAL RESPONSE ERROR:", err);
    return res
      .status(500)
      .json({ message: "Failed to set official response" });
  }
};
