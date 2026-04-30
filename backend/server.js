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
  FRONTEND_URL,
  PORT = 3001,
} = process.env;

const app = express();

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// ✅ Mongo
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ Mongo error:", err));

// ✅ Health check
app.get("/", (req, res) => {
  res.json({
    message: "Backend running",
  });
});

// =====================
// 🔐 LOGIN
// =====================
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

// =====================
// 🔁 CALLBACK
// =====================
app.get("/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Missing code");
  }

  try {
    // 🔥 Get token from Spotify
    const tokenRes = await axios.post(
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

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    // 🔥 Get user
    const userRes = await axios.get("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const user = userRes.data;

    // 🔥 Save token in DB
    await Token.findOneAndUpdate(
      { userId: user.id },
      {
        userId: user.id,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(Date.now() + expires_in * 1000),
      },
      { upsert: true }
    );

    // 🔥 Create JWT
    const token = jwt.sign({ user_id: user.id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    // ✅ IMPORTANT FIX (Netlify requires this)
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    // ✅ Redirect to frontend
    res.redirect(`${FRONTEND_URL}/dashboard`);
  } catch (err) {
    console.error("❌ CALLBACK ERROR:");
    console.error(err.response?.data || err.message);

    res.status(500).send("Authentication failed");
  }
});

// =====================
// 👤 GET USER
// =====================
app.get("/me", verifyToken, async (req, res) => {
  try {
    const record = await Token.findOne({ userId: req.user.user_id });

    const profile = await axios.get("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${record.accessToken}`,
      },
    });

    res.json(profile.data);
  } catch (err) {
    console.error("❌ /me error:", err.message);
    res.status(500).send("Failed");
  }
});

// =====================
// 🔎 SEARCH
// =====================
app.get("/search", verifyToken, async (req, res) => {
  const { q, type } = req.query;

  try {
    const record = await Token.findOne({ userId: req.user.user_id });

    const response = await axios.get("https://api.spotify.com/v1/search", {
      headers: {
        Authorization: `Bearer ${record.accessToken}`,
      },
      params: {
        q,
        type,
        limit: 10,
      },
    });

    res.json(response.data);
  } catch (err) {
    console.error("❌ search error:", err.message);
    res.status(500).send("Search failed");
  }
});

// =====================
// 🔄 REFRESH
// =====================
app.get("/refresh_token", verifyToken, async (req, res) => {
  try {
    const record = await Token.findOne({ userId: req.user.user_id });

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
        },
      }
    );

    record.accessToken = response.data.access_token;
    await record.save();

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ refresh error:", err.message);
    res.status(500).send("Refresh failed");
  }
});

// =====================
// 🚪 LOGOUT
// =====================
app.get("/logout", (req, res) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  res.sendStatus(204);
});

// =====================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
