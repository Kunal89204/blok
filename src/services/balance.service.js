const Block = require("../schema/block.schema");

const calculateBalance = async (
  walletAddress
) => {

  const blocks =
    await Block.find();

  let balance = 0;

  for (const block of blocks) {

    for (
      const tx of block.transactions
    ) {

      if (
        tx.toAddress === walletAddress
      ) {
        balance += tx.amount;
      }

      if (
        tx.fromAddress === walletAddress
      ) {
        balance -= tx.amount;
      }

    }

  }

  return balance;

};

module.exports = {
  calculateBalance,
};