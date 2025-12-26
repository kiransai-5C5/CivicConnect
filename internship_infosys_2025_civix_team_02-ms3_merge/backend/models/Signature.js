const mongoose = require("mongoose");

const SignatureSchema = new mongoose.Schema(
  {
    petition_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Petition",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// ✅ Compound Unique Index
SignatureSchema.index({ petition_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model("Signature", SignatureSchema);
