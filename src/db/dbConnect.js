const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/blockchain");
    console.log("DB Connected");
  } catch (error) {
    console.log("There was an error connectign with the database", error);
  }
};

module.exports = connectDB;
