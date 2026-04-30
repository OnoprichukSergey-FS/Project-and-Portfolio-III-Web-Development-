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

app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.json({
    message: "Spotify backend is running",
    routes: [
      "/login",
      "/callback",
      "/me",
      "/search",
      "/refresh_token",
      "/logout",
    ],
  });
});

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

app.get("/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Missing code from Spotify");
  }

  try {
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

    const userResponse = await axios.get("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const user = userResponse.data;

    await Token.findOneAndUpdate(
      { userId: user.id },
      {
        userId: user.id,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(Date.now() + expires_in * 1000),
      },
      {
        upsert: true,
        new: true,
      }
    );

    const token = jwt.sign({ user_id: user.id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("jwt", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

    res.redirect("http://127.0.0.1:3000/dashboard");
  } catch (err) {
    console.error("Error in /callback:", err.response?.data || err.message);
    res.status(500).send("Authentication failed");
  }
});

app.get("/me", verifyToken, async (req, res) => {
  try {
    const record = await Token.findOne({ userId: req.user.user_id });

    if (!record) {
      return res.status(404).send("User token not found");
    }

    const profile = await axios.get("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${record.accessToken}`,
      },
    });

    res.json(profile.data);
  } catch (err) {
    console.error("Error in /me:", err.response?.data || err.message);
    res.status(500).send("Failed to load profile");
  }
});

app.get("/search", verifyToken, async (req, res) => {
  const { q, type } = req.query;

  if (!q || !type) {
    return res.status(400).send("Missing query or type");
  }

  try {
    const record = await Token.findOne({ userId: req.user.user_id });

    if (!record) {
      return res.status(401).send("Token not found");
    }

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
    console.error("Error in /search:", err.response?.data || err.message);
    res.status(500).send("Search failed");
  }
});

app.get("/refresh_token", verifyToken, async (req, res) => {
  try {
    const record = await Token.findOne({ userId: req.user.user_id });

    if (!record || !record.refreshToken) {
      return res.status(401).send("No refresh token available");
    }

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

    record.accessToken = access_token;
    record.expiresAt = new Date(Date.now() + expires_in * 1000);
    await record.save();

    const newJWT = jwt.sign({ user_id: req.user.user_id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("jwt", newJWT, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

    res.status(200).send("Token refreshed");
  } catch (err) {
    console.error(
      "Error in /refresh_token:",
      err.response?.data || err.message
    );
    res.status(500).send("Token refresh failed");
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });

  res.sendStatus(204);
});

app.listen(PORT, () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
