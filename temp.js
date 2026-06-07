const {
  createWallet,
  verifyTransaction,
  signTransaction,
} = require("./src/services/wallet.service");

const wallet1 = createWallet();

const wallet2 = createWallet();

console.log(wallet1);

console.log(wallet2);

const transaction = {
  fromAddress:
    wallet1.walletAddress,

  toAddress:
    wallet2.walletAddress,

  amount: 100,
};

console.log(transaction);

const signature =
  signTransaction(
    transaction,
    wallet1.privateKey
  );

console.log(signature);

const isValid =
  verifyTransaction(
    transaction,
    signature,
    wallet1.publicKey
  );

console.log(
  JSON.stringify(
    {
      fromAddress:
        wallet1.walletAddress,

      toAddress:
        wallet2.walletAddress,

      amount: 100,

      publicKey:
        wallet1.publicKey,

      signature,
    },
    null,
    2
  )
);