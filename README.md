# 🎧 Project and Portfolio III — Spotify Web App ()

This project utilizes the **Spotify Web API** to allow users to authenticate via Spotify and search for their favorite **songs**, **artists**, or **albums**.

The **frontend** offers a simple, user-friendly login page and a modern search interface built with **React**. The **backend** handles Spotify OAuth authentication, token management, and API communication to power the application.

---

## Features

- Spotify OAuth login
- Search functionality for songs, artists, and albums
- Secure token management
- RESTful API backend with Express
- Clean frontend interface built with React

---

## Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)
- [Ngrok](https://ngrok.com/)
- [Homebrew (Brew)](https://brew.sh/)
- Chrome browser (recommended for development/testing)

---

## Setup & Configuration

### 1. Environment Variables

Create a `.env` file inside the `backend` folder with the following keys:

```
PORT=3001
MONGO_URI=your_mongo_connection_string
CLIENT_ID=your_spotify_client_id
CLIENT_SECRET=your_spotify_client_secret
```

### 2. Install Dependencies

Run the following commands to install the required dependencies:

```bash
cd frontend
npm install

cd ../backend
npm install
```

### 3. Run the App

Start the frontend (React):

```bash
cd frontend
npm start
```

Start the backend (Express):

```bash
cd backend
node server.js
```

> **Note:**
>
> - The frontend runs on port **3000** and backend on **3001**.
> - Make sure these ports are not already in use.
> - Spotify requires a public URL for redirect; use **Ngrok** to expose your local server.

---

## 🔗 Important Links

> URLs may vary if you're using Ngrok for Spotify OAuth redirect.

- `http://localhost:3000` — Frontend (React)
- `http://localhost:3001` — Backend (Express API)
- `http://localhost:3001/spotify/v1` — Spotify API Middleware
- `http://localhost:3001/spotify/v1/status` — JWT status check (returns `true`/`false`)
- `http://localhost:3001/spotify/v1/login` — Spotify login and JWT generation
- `http://localhost:3001/spotify/v1/search` — Global search endpoint (returns JSON of results)

---

## 📌 Notes

- Spotify does **not** allow `localhost` in redirect URIs for production use — **Ngrok** is required for OAuth testing.
- Make sure to register your Ngrok forwarding URL in your Spotify Developer Dashboard.
