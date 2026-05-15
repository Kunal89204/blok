const generateHash = require("../utils/generateHash");
const DIFFICULTY = require("../constants/difficulty");

const mineBlock = ({ index, timestamp, transactions, previousHash }) => {
  let nonce = 0;

  let hash = "";

  const target = "0".repeat(DIFFICULTY);

  while (!hash.startsWith(target)) {
    nonce++;

    hash = generateHash({
      index,
      timestamp,
      transactions,
      previousHash,
      nonce,
    });
    console.log(hash);
  }

  return {
    nonce,
    hash,
  };
};

module.exports = {
  mineBlock,
};
