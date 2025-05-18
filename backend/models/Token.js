const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  userId: String,
  accessToken: String,
  refreshToken: String,
  expiresAt: Date,
});

module.exports = mongoose.model("Token", tokenSchema);
