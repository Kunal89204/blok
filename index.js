const express = require("express");
const app = express();
const BlockchainRoutes = require("./src/routes/blockchain.routes");
const connectDB = require("./src/db/dbConnect");

connectDB();

app.use(express.json());

app.use("/api/v1/block", BlockchainRoutes);

   
app.listen(8000, () => {
  console.log("Server is running on [port");
});
