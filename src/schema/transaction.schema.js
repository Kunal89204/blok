const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    fromAddress: {
      type: String,
      required: true,
    },

    toAddress: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    publicKey: {
      type: String,
      required: true,
    },

    signature: {
      type: String,
      required: true,
    },

    txHash: {
      type: String,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed"],
      default: "pending",
    },

    minedInBlock: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);
