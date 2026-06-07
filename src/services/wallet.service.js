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

const signTransaction = (
  transactionData,
  privateKey
) => {

  const key = ec.keyFromPrivate(
    privateKey
  );

  const transactionHash = SHA256(
    JSON.stringify(transactionData)
  ).toString();

  const signature = key.sign(
    transactionHash,
    "hex"
  )

  return signature.toDER("hex");
}

const verifyTransaction = (transactionData,
  signature,
  publicKey
) => {
  const transactionHash = SHA256(
    JSON.stringify(transactionData)
  ).toString();

  const key = ec.keyFromPublic(
    publicKey,
    "hex"
  );

  return key.verify(
    transactionHash,
    signature
  )
}

module.exports = {
  createWallet,
  signTransaction,
  verifyTransaction
};
