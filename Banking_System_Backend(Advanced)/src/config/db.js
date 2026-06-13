const mongoose = require('mongoose');

async function connectDB() {
 try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Server is connected to database");
 } catch (err) {
  console.log("Error connecting to database");
  console.log(err);
  process.exit(1);
 }
}

module.exports = connectDB;