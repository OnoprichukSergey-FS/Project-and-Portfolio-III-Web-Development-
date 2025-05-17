const mongoose = require("mongoose");

// This schema stores Spotify tokens per user
const tokenSchema = new mongoose.Schema({
  userId: String,
  accessToken: String,
  refreshToken: String,
  expiresAt: Date,
});

module.exports = mongoose.model("Token", tokenSchema);
