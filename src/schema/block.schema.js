const { default: mongoose } = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    from: {
      type: String,
      required: true,
    },

    to: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

const BlockSchema = new mongoose.Schema(
  {
    index: {
      type: Number,
      required: true,
      unique: true,
    },

    timestamp: {
      type: Number,
      required: true,
    },

    transactions: {
      type: [TransactionSchema],
      default: [],
    },

    previousHash: {
      type: String,
      required: true,
    },

    hash: {
      type: String,
      required: true,
    },

    nonce: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Block", BlockSchema);