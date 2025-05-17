import React from "react";

function Home() {
  const handleLogin = () => {
    window.location.href = "http://localhost:3001/login";
  };

  return (
    <div style={{ backgroundColor: "#000", color: "white", height: "100vh" }}>
      <header
        style={{
          backgroundColor: "#1DB954",
          height: 60,
          display: "flex",
          alignItems: "center",
          paddingLeft: 20,
        }}
      >
        <i
          className="fab fa-spotify"
          style={{ fontSize: 28, color: "white" }}
        ></i>
      </header>

      <div
        style={{
          textAlign: "center",
          marginTop: "10%",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <i
          className="fab fa-spotify"
          style={{ fontSize: 50, color: "#1DB954", marginBottom: 20 }}
        ></i>
        <h1 style={{ marginBottom: 10 }}>Please Login</h1>
        <p style={{ marginBottom: 5 }}>
          In order to search for artists, tracks, or songs
        </p>
        <p style={{ marginBottom: 30 }}>
          you must login to your Spotify account
        </p>

        <button
          onClick={handleLogin}
          style={{
            padding: "15px 40px",
            fontSize: 18,
            backgroundColor: "#1DB954",
            color: "white",
            border: "none",
            borderRadius: 30,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Login
        </button>
      </div>
    </div>
  );
}

export default Home;
