const SHA256 = require("crypto-js/sha256");

const generateHash = ({
  index,
  timestamp,
  transactions,
  previousHash,
  nonce
}) => {

  return SHA256(
    JSON.stringify({
      index,
      timestamp,
      transactions,
      previousHash,
      nonce
    })
  ).toString();

};

module.exports = generateHash;