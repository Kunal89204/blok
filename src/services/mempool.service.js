let pendingTransactions = [];

const addTransaction = (transaction) => {
  pendingTransactions.push(transaction);

  return transaction;
};

const getPendingTransactions = () => {
  return pendingTransactions;
};

const clearPendingTransactions = () => {
  pendingTransactions = [];
};

module.exports = {
  addTransaction,
  getPendingTransactions,
  clearPendingTransactions,
};
