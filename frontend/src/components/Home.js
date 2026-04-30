import React from "react";
import { loginUser } from "./utils/api";
import "../App.css";

function Home() {
  return (
    <div className="app-page">
      <header className="topbar">
        <div className="brand-mark">♪</div>
        <h2>SoundScope</h2>
      </header>

      <main className="login-card">
        <div className="hero-icon">🎧</div>
        <h1>Discover music faster</h1>
        <p>
          Search artists, albums, and tracks using real Spotify Web API data.
        </p>

        <button onClick={loginUser} className="primary-button">
          Login with Spotify
        </button>

        <p className="disclaimer">
          This project uses the Spotify Web API and is not affiliated with
          Spotify.
        </p>
      </main>
    </div>
  );
}

export default Home;
