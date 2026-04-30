import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUser, refreshToken, logoutUser } from "./utils/api";
import Search from "./Search";
import "../App.css";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [errorUser, setErrorUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await fetchUser();
        setUser(userData);
        setErrorUser(null);
      } catch {
        setUser(null);
        setErrorUser("Failed to fetch user info");
        navigate("/");
      } finally {
        setLoadingUser(false);
      }
    };

    loadUser();

    const intervalId = setInterval(async () => {
      try {
        await refreshToken();
      } catch {
        setErrorUser("Session expired, please log in again");
        setUser(null);
        navigate("/");
      }
    }, 50 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setErrorUser(null);
      navigate("/");
    } catch {
      setErrorUser("Logout failed");
    }
  };

  if (loadingUser) {
    return <p className="loading-text">Loading user info...</p>;
  }

  return (
    <div className="app-page">
      <header className="topbar">
        <div className="brand-left">
          <div className="brand-mark">♪</div>
          <div>
            <h2>SoundScope</h2>
            <p>Music discovery dashboard</p>
          </div>
        </div>

        {user && (
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        )}
      </header>

      {errorUser && <p className="error-text">{errorUser}</p>}

      <Search />

      <footer className="footer-note">
        This project uses the Spotify Web API and is not affiliated with
        Spotify.
      </footer>
    </div>
  );
}
