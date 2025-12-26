const mongoose = require("mongoose");

const PetitionSchema = new mongoose.Schema(
  {
    creator_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creator_name: {
      type: String,
      required: true
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String },
    location: { type: String },
    goal: { type: Number, default: 100 },
    status: {
      type: String,
      enum: ["active", "under_review", "closed"],
      default: "active",
    },
    // fields for officer / official workflows
    officialResponse: {
      type: String,
    },
    responseDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Petition", PetitionSchema);
