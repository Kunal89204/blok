const { sendSuccess, sendError } = require("../utils/response");
const Block = require("../schema/block.schema");
const { SHA256 } = require("crypto-js");
const generateHash = require("../utils/generateHash");
const { mineBlock } = require("../services/mining.service");
const {
  addTransaction: appendTransaction,
  getPendingTransactions: fetchPendingTransactions,
  clearPendingTransactions,
} = require("../services/mempool.service");
const Transaction = require("../schema/transaction.schema");
const { verifyTransaction } = require("../services/wallet.service");
const { calculateBalance } = require("../services/balance.service");
const { MINING_REWARD } = require("../constants/miningreward");

const addBlock = async (req, res) => {
  try {
    const { from, to, amount } = req.body || {};

    if (!from || !to || !amount) {
      return sendError({
        res,
        statusCode: 400,
        message: "Missing Required Fields",
        error: {
          code: "VALIDATION_ERROR",
          details: "from, to and amount are required",
        },
      });
    }

    const latestBlock = await Block.findOne().sort({ index: -1 });

    const index = latestBlock ? latestBlock.index + 1 : 0;

    const timestamp = Date.now();

    const transactions = [
      {
        from,
        to,
        amount: Number(amount),
      },
    ];

    const previousHash = latestBlock ? latestBlock.hash : "0";

    const { hash, nonce } = mineBlock({
      index,
      timestamp,
      transactions,
      previousHash,
    });
    const newBlock = await Block.create({
      index,
      timestamp,
      transactions,
      previousHash,
      hash,
      nonce: nonce,
    });

    return sendSuccess({
      res,
      statusCode: 201,
      message: "Block created successfully",
      data: {
        block: newBlock,
      },
    });
  } catch (error) {
    return sendError({
      res,
      statusCode: 500,
      message: "Failed to create block",
      error: {
        code: "BLOCK_CREATION_FAILED",
        details: error.message,
      },
    });
  }
};

const getAllBlocks = async (req, res) => {
  try {
    // Query params
    let page = Number(req.query.page) || 1;

    let limit = Number(req.query.limit) || 10;

    // Safety limits
    if (page < 1) {
      page = 1;
    }

    if (limit < 1) {
      limit = 10;
    }

    // Prevent huge payload abuse
    if (limit > 100) {
      limit = 100;
    }

    const skip = (page - 1) * limit;

    // Parallel queries
    const [blocks, totalBlocks] = await Promise.all([
      Block.find().sort({ index: 1 }).skip(skip).limit(limit).lean(),

      Block.countDocuments(),
    ]);

    const totalPages = Math.ceil(totalBlocks / limit);

    return sendSuccess({
      res,
      statusCode: 200,
      message: "Blocks fetched successfully",

      data: {
        pagination: {
          totalBlocks,
          totalPages,
          currentPage: page,
          limit,

          hasNextPage: page < totalPages,

          hasPreviousPage: page > 1,

          nextPage: page < totalPages ? page + 1 : null,

          previousPage: page > 1 ? page - 1 : null,
        },
        blocks,
      },
    });
  } catch (error) {
    return sendError({
      res,
      statusCode: 500,
      message: "Failed to fetch blocks",

      error: {
        code: "BLOCK_FETCH_FAILED",
        details: error.message,
      },
    });
  }
};

const validate = async (req, res) => {
  try {
    const blocks = await Block.find().sort({ index: 1 }).lean();

    // Empty chain check
    if (!blocks.length) {
      return sendError({
        res,
        statusCode: 404,
        message: "Blockchain is empty",
      });
    }

    // Validate chain
    for (let i = 1; i < blocks.length; i++) {
      const currentBlock = blocks[i];

      const previousBlock = blocks[i - 1];

      // Recalculate current block hash
      const recalculatedHash = generateHash({
        index: currentBlock.index,
        timestamp: currentBlock.timestamp,
        transactions: currentBlock.transactions,
        previousHash: currentBlock.previousHash,
        nonce: currentBlock.nonce,
      });

      // Check if hash was tampered
      if (currentBlock.hash !== recalculatedHash) {
        return sendError({
          res,
          statusCode: 400,
          message: "Blockchain validation failed",
          error: {
            code: "INVALID_HASH",
            details: `Block ${currentBlock.index} hash mismatch`,
            data: {
              hash1: currentBlock.hash,
              hash2: recalculatedHash,
            },
          },
        });
      }

      // Check previous hash linkage
      if (currentBlock.previousHash !== previousBlock.hash) {
        return sendError({
          res,
          statusCode: 400,
          message: "Blockchain validation failed",
          error: {
            code: "BROKEN_CHAIN",
            details: `Block ${currentBlock.index} previousHash mismatch`,
          },
        });
      }
    }

    return sendSuccess({
      res,
      message: "Blockchain is valid",
      data: {
        valid: true,
        totalBlocks: blocks.length,
      },
    });
  } catch (error) {
    return sendError({
      res,
      statusCode: 500,
      message: "Failed to validate blockchain",
      error: {
        code: "VALIDATION_ERROR",
        details: error.message,
      },
    });
  }
};

const latestBlock = async (req, res) => {
  try {
    const latestBlock = await Block.findOne().sort({ index: -1 });

    return sendSuccess({
      res,
      data: latestBlock,
      message: "Latest Block Fetched",
      statusCode: 200,
    });
  } catch (error) {
    return sendError({
      res,
      statusCode: 404,
      message: "Block not found",
    });
  }
};

const blockByHash = async (req, res) => {
  try {
    const hash = req?.params?.hash;

    if (!hash) {
      return sendError({
        res,
        statusCode: 404,
        message: "Please provide valid hash",
      });
    }

    const block = await Block.findOne({ hash });

    if (!block) {
      return sendError({
        res,
        message: "Block not found",
        statusCode: 404,
      });
    }

    return sendSuccess({
      res,
      data: block,
      message: "Block Fetched",
      statusCode: 200,
    });
  } catch (error) {
    return sendError({
      res,
      statusCode: 404,
      message: "Block not found",
    });
  }
};

// New controllers

const addTransaction = async (req, res) => {

  try {

    const {
      fromAddress,
      toAddress,
      amount,
      publicKey,
      signature,
    } = req.body || {};

    if (
      !fromAddress ||
      !toAddress ||
      !amount ||
      !publicKey ||
      !signature
    ) {

      return sendError({
        res,
        statusCode: 400,
        message: "Missing Required Fields",

        error: {
          code: "VALIDATION_ERROR",
          details:
            "fromAddress, toAddress, amount, publicKey and signature are required",
        },
      });

    }

    const transactionData = {
      fromAddress,
      toAddress,
      amount: Number(amount),
    };

    const isValid =
      verifyTransaction(
        transactionData,
        signature,
        publicKey
      );

    if (!isValid) {

      return sendError({
        res,
        statusCode: 400,
        message: "Invalid Signature",

        error: {
          code: "INVALID_SIGNATURE",
          details:
            "Transaction signature verification failed",
        },
      });

    }

    const txHash = SHA256(
      JSON.stringify(transactionData)
    ).toString();

    const balance = await calculateBalance(
      fromAddress
    )

    if (
      balance < Number(amount)
    ) {

      return sendError({
        res,
        statusCode: 400,
        message:
          "Insufficient balance",

        error: {
          code:
            "INSUFFICIENT_BALANCE",
        },
      });

    }

    const newTransaction =
      await Transaction.create({

        fromAddress,
        toAddress,

        amount: Number(amount),

        publicKey,
        signature,

        txHash,

        status: "pending",
      });

    return sendSuccess({
      res,
      statusCode: 201,
      message:
        "Transaction added to mempool",

      data: {
        transaction: newTransaction,
      },
    });

  } catch (error) {

    return sendError({
      res,
      statusCode: 500,
      message:
        "Failed to add transaction",

      error: {
        code: "TRANSACTION_ADD_FAILED",
        details: error.message,
      },
    });

  }

};


// -------------------------------------
// GET PENDING TRANSACTIONS
// -------------------------------------

const getPendingTransactions =
  async (req, res) => {

    try {

      const pendingTransactions =
        await Transaction.find({
          status: "pending",
        }).lean();

      return sendSuccess({
        res,
        statusCode: 200,
        message:
          "Pending transactions fetched successfully",

        data: {
          transactions:
            pendingTransactions,
        },
      });

    } catch (error) {

      return sendError({
        res,
        statusCode: 500,
        message:
          "Failed to fetch pending transactions",

        error: {
          code: "PENDING_FETCH_FAILED",
          details: error.message,
        },
      });

    }

  };


// -------------------------------------
// MINE BLOCK
// -------------------------------------

const mine = async (req, res) => {
  try {

    const { minerAddress } = req.body;

    if (!minerAddress) {
      return sendError({
        res,
        statusCode: 400,
        message: "Miner address required",
      });
    }

    const pendingTransactions = await Transaction
      .find({ status: "pending" })
      .lean();



    const rewardTransaction = {
      fromAddress: "SYSTEM",
      toAddress: minerAddress,
      amount: MINING_REWARD,
      publicKey: "SYSTEM",
      signature: "SYSTEM",
    };

    const blockTransactions = [
      rewardTransaction,
      ...pendingTransactions.map(tx => ({
        fromAddress: tx.fromAddress,
        toAddress: tx.toAddress,
        amount: tx.amount,
        publicKey: tx.publicKey,
        signature: tx.signature,
      })),
    ];

    const latestBlock = await Block
      .findOne()
      .sort({ index: -1 })
      .lean();

    const index = latestBlock
      ? latestBlock.index + 1
      : 0;

    const timestamp = Date.now();

    const previousHash = latestBlock
      ? latestBlock.hash
      : "0";

    const { hash, nonce } = mineBlock({
      index,
      timestamp,
      transactions: blockTransactions,
      previousHash,
    });

    const newBlock = await Block.create({
      index,
      timestamp,
      transactions: blockTransactions,
      previousHash,
      hash,
      nonce,
    });

    await Transaction.updateMany(
      {
        _id: {
          $in: pendingTransactions.map(
            tx => tx._id
          ),
        },
      },
      {
        $set: {
          status: "confirmed",
          minedInBlock: index,
        },
      }
    );

    return sendSuccess({
      res,
      statusCode: 201,
      message: "Block mined successfully",
      data: {
        block: newBlock,
      },
    });

  } catch (error) {

    return sendError({
      res,
      statusCode: 500,
      message: "Mining failed",
      error: {
        code: "MINING_FAILED",
        details: error.message,
      },
    });

  }
};

const getBalance = async (req, res) => {
  try {
    const walletAddress = req.params.address;

    if (!walletAddress) {
      return sendError({
        res,
        statusCode: 400,
        message: "Wallet address is required",
        error: {
          code: "VALIDATION_ERROR",
        },
      });
    }

    const blocks = await Block.find();

    let balance = 0;
    let totalReceived = 0;
    let totalSent = 0;

    for (const block of blocks) {
      for (const tx of block.transactions) {

        if (tx.toAddress === walletAddress) {
          balance += tx.amount;
          totalReceived += tx.amount;
        }

        if (tx.fromAddress === walletAddress) {
          balance -= tx.amount;
          totalSent += tx.amount;
        }

      }
    }

    return sendSuccess({
      res,
      statusCode: 200,
      message: "Balance fetched successfully",
      data: {
        walletAddress,
        balance,
        totalReceived,
        totalSent,
      },
    });

  } catch (error) {

    return sendError({
      res,
      statusCode: 500,
      message: "Failed to fetch balance",
      error: {
        code: "BALANCE_FETCH_FAILED",
        details: error.message,
      },
    });

  }
};

module.exports = {
  addBlock,
  getAllBlocks,
  validate,
  latestBlock,
  blockByHash,
  addTransaction,
  getPendingTransactions,
  mine,
  getBalance
};
