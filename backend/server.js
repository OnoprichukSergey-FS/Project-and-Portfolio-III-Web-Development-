const express = require("express");
const axios = require("axios");
const qs = require("querystring");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const Token = require("./models/Token");
const verifyToken = require("./middleware/auth");

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI,
  JWT_SECRET,
  MONGO_URI,
  PORT = 3001,
} = process.env;

const app = express();

// Basic middleware setup
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// STEP 1: Redirect user to Spotify login
app.get("/login", (req, res) => {
  const scope = "user-read-private user-read-email";
  const queryParams = qs.stringify({
    response_type: "code",
    client_id: SPOTIFY_CLIENT_ID,
    scope,
    redirect_uri: SPOTIFY_REDIRECT_URI,
  });

  res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
});

// STEP 2: Spotify redirects back to us with a code
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing code from Spotify");

  try {
    // Exchange code for tokens
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      qs.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
      }),
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
            ).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    // Get user info from Spotify
    const userResponse = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const user = userResponse.data;

    // Save access and refresh token to DB
    await Token.findOneAndUpdate(
      { userId: user.id },
      {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(Date.now() + expires_in * 1000),
      },
      { upsert: true }
    );

    // Create JWT and set it as a cookie
    const token = jwt.sign({ user_id: user.id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.cookie("jwt", token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });

    // Send user to the frontend dashboard
    res.redirect("http://localhost:3000/dashboard");
  } catch (err) {
    console.error("Error in /callback:", err.message);
    res.status(500).send("Authentication failed");
  }
});

// STEP 3: Protected route to get user's Spotify profile
app.get("/me", verifyToken, async (req, res) => {
  try {
    const record = await Token.findOne({ userId: req.user.user_id });
    if (!record) return res.status(404).send("User token not found");

    const profile = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${record.accessToken}` },
    });

    res.json(profile.data);
  } catch (err) {
    res.status(500).send("Failed to load profile");
  }
});

// STEP 4: Protected search route (track, artist, album)
app.get("/search", verifyToken, async (req, res) => {
  const { q, type } = req.query;
  if (!q || !type) return res.status(400).send("Missing query or type");

  try {
    const record = await Token.findOne({ userId: req.user.user_id });
    if (!record) return res.status(401).send("Token not found");

    const response = await axios.get("https://api.spotify.com/v1/search", {
      headers: { Authorization: `Bearer ${record.accessToken}` },
      params: { q, type, limit: 10 },
    });

    res.json(response.data);
  } catch (err) {
    res.status(500).send("Search failed");
  }
});

// STEP 5: Refresh the user's token using refresh_token
app.get("/refresh_token", verifyToken, async (req, res) => {
  try {
    const record = await Token.findOne({ userId: req.user.user_id });
    if (!record || !record.refreshToken)
      return res.status(401).send("No refresh token available");

    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      qs.stringify({
        grant_type: "refresh_token",
        refresh_token: record.refreshToken,
      }),
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
            ).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, expires_in } = response.data;

    // Update the stored access token and expiration
    record.accessToken = access_token;
    record.expiresAt = new Date(Date.now() + expires_in * 1000);
    await record.save();

    // Refresh the JWT too
    const newJWT = jwt.sign({ user_id: req.user.user_id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.cookie("jwt", newJWT, { httpOnly: true, sameSite: "lax" });

    res.status(200).send("Token refreshed");
  } catch (err) {
    res.status(500).send("Token refresh failed");
  }
});

// STEP 6: Logout and clear the JWT cookie
app.get("/logout", (req, res) => {
  res.clearCookie("jwt");
  res.sendStatus(204);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
