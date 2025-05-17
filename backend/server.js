const express = require("express");
const axios = require("axios");
const qs = require("querystring");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const Token = require("./models/Token");

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI,
  JWT_SECRET,
  MONGO_URI,
  PORT = 3001,
} = process.env;

const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Login route — redirects user to Spotify's login page
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

// Callback route — handles Spotify's response and saves tokens
app.get("/callback", async (req, res) => {
  const code = req.query.code || null;

  if (!code) return res.status(400).send("No code provided");

  try {
    // Exchange the code for access & refresh tokens
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

    // Fetch user's Spotify profile info
    const userResponse = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const user = userResponse.data;

    // Save token info in MongoDB
    await Token.findOneAndUpdate(
      { userId: user.id },
      {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(Date.now() + expires_in * 1000),
      },
      { upsert: true, new: true }
    );

    // Create a JWT
    const token = jwt.sign(
      {
        user_id: user.id,
        access_token: access_token,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Send the JWT as a secure cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      sameSite: "lax",
    });

    // ✅ Redirect the user to the dashboard
    res.redirect("http://localhost:3000/dashboard");
  } catch (err) {
    console.error("Error in /callback:", err.message);
    res.status(500).send("Authentication failed");
  }
});

// Logout route — clears JWT cookie
app.get("/logout", (req, res) => {
  res.clearCookie("jwt");
  res.sendStatus(204);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
