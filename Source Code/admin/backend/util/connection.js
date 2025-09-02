//mongoose
const mongoose = require("mongoose");

// Prefer env var; fallback to provided connection string to avoid crashes
const mongoUri =
  process?.env?.MongoDb_Connection_String ||
  "mongodb+srv://osohbayar:U4c8befcf18ca@mentormeet.xfipt6t.mongodb.net/";

mongoose.connect(mongoUri, {}).catch((err) => {
  console.error("Mongo connection error:", err?.message || err);
});

const db = mongoose.connection;

module.exports = db;
