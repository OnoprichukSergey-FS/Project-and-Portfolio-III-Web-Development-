import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchSpotify } from "./utils/api";

export default function Search() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await searchSpotify(searchTerm);
      setSearchResults(data);
    } catch (err) {
      if (err.message === "session-expired") {
        navigate("/");
      } else {
        setError("Failed to fetch search results.");
      }
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  };

  const renderGrid = (items, type) => {
    return (
      <div style={{ marginBottom: 40 }}>
        <h2
          style={{
            color: "white",
            fontSize: 22,
            marginBottom: 15,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {type} <span style={{ fontSize: 18 }}>➝</span>
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: 20,
          }}
        >
          {items.map((item) => {
            const image =
              item.images?.[0]?.url ||
              item.album?.images?.[0]?.url || // for songs
              "https://via.placeholder.com/150";

            const name = item.name;
            const link = item.external_urls?.spotify;

            return (
              <a
                key={item.id}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: "none",
                  color: "white",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  backgroundColor: "#1a1a1a",
                  borderRadius: 8,
                  overflow: "hidden",
                  paddingBottom: 10,
                  transition: "transform 0.2s",
                }}
              >
                <img
                  src={image}
                  alt={name}
                  style={{
                    width: "100%",
                    height: 150,
                    objectFit: "cover",
                    marginBottom: 8,
                  }}
                />
                <div style={{ fontWeight: "bold", textAlign: "center" }}>
                  <i
                    className="fab fa-spotify"
                    style={{ marginRight: 6, color: "#1DB954" }}
                  ></i>
                  {name}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <section
      style={{
        marginTop: 40,
        padding: "0 20px 60px",
        backgroundColor: "#000000",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Search Bar */}
      <form
        onSubmit={handleSearch}
        style={{ textAlign: "center", marginBottom: 40 }}
      >
        <input
          type="text"
          placeholder=" Search for artist..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: "12px 20px",
            width: "70%",
            maxWidth: 500,
            fontSize: 18,
            borderRadius: 30,
            border: "1px solid #ccc",
            fontFamily: "Arial, sans-serif",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "12px 25px",
            marginLeft: 10,
            fontSize: 16,
            borderRadius: 30,
            backgroundColor: "#1DB954",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Search
        </button>
      </form>

      {/* Loading/Error */}
      {loading && (
        <p style={{ color: "white", textAlign: "center" }}>
          Loading results...
        </p>
      )}
      {error && (
        <p style={{ color: "red", textAlign: "center", marginBottom: 30 }}>
          {error}
        </p>
      )}

      {/* Results */}
      {searchResults?.artists?.items.length > 0 &&
        renderGrid(searchResults.artists.items, "Artists")}

      {searchResults?.albums?.items.length > 0 &&
        renderGrid(searchResults.albums.items, "Albums")}

      {searchResults?.tracks?.items.length > 0 &&
        renderGrid(searchResults.tracks.items, "Songs")}
    </section>
  );
}
