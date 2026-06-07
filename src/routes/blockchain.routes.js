const express = require("express");

const {
  addBlock,
  validate,
  getAllBlocks,
  latest,
  latestBlock,
  blockByHash,
  addTransaction,
  getPendingTransactions,
  mine,
  getBalance
} = require("../controllers/blockchain.controllers");


const router = express.Router();

router.post("/", addBlock); //deprecated doesn't involve mining
router.get("/", getAllBlocks);
router.get("/validate", validate);
router.get("/latest-block", latestBlock);
router.get("/:hash", blockByHash);
router.post("/mine", mine);

// New routes
router.post("/addTransaction", addTransaction);
router.get("/transaction/pending", getPendingTransactions)
router.get("/wallet/:address/balance", getBalance)

module.exports = router;
