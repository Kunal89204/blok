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
} = require("../controllers/blockchain.controllers");


const router = express.Router();

router.post("/", addBlock);
router.get("/", getAllBlocks);
router.get("/validate", validate);
router.get("/latest-block", latestBlock);
router.get("/:hash", blockByHash);
router.post("/mine", mine);

// New routes
router.post("/addTransaction", addTransaction);
router.get("/transaction/pending", getPendingTransactions)

module.exports = router;
