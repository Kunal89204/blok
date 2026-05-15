const EC = require("elliptic").ec;

const SHA256 = require("crypto-js/sha256");

const ec = new EC("secp256k1");

const createWallet = () => {
  // Generate keypair
  const keyPair = ec.genKeyPair();

  const privateKey = keyPair.getPrivate("hex");

  const publicKey = keyPair.getPublic("hex");

  const walletAddress = SHA256(publicKey).toString();

  return {
    privateKey,
    publicKey,
    walletAddress,
  };
};

module.exports = {
  createWallet,
};
