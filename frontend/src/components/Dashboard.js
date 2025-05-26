import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUser, refreshToken, logoutUser } from "./utils/api";
import Search from "./Search";

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
        console.log("Token refreshed");
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

  if (loadingUser)
    return (
      <p style={{ textAlign: "center", marginTop: 50, color: "white" }}>
        Loading user info...
      </p>
    );

  return (
    <div
      style={{ backgroundColor: "#000", minHeight: "100vh", color: "white" }}
    >
      {/* Header Bar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          padding: "15px 30px",
          backgroundColor: "#000",
          borderBottom: "1px solid #222",
        }}
      >
        <i
          className="fab fa-spotify"
          style={{ fontSize: 28, color: "#1DB954", marginRight: 15 }}
        ></i>
        <span style={{ fontSize: 20, fontWeight: "bold", marginRight: 30 }}>
          Spotify Search
        </span>
        {user && (
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 16px",
              fontSize: 14,
              backgroundColor: "#1DB954",
              color: "white",
              border: "none",
              borderRadius: 20,
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Logout
          </button>
        )}
      </header>

      {/* Optional Error Message */}
      {errorUser && (
        <p style={{ color: "red", textAlign: "center", marginTop: 10 }}>
          {errorUser}
        </p>
      )}

      {/* Main Search Section */}
      <Search />
    </div>
  );
}
