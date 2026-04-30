import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchSpotify } from "./utils/api";
import "../App.css";

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
      <section className="result-section">
        <h2>{type} →</h2>

        <div className="result-grid">
          {items.map((item) => {
            const image =
              item.images?.[0]?.url ||
              item.album?.images?.[0]?.url ||
              "https://via.placeholder.com/150";

            const name = item.name;
            const link = item.external_urls?.spotify;

            return (
              <a
                key={item.id}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="result-card"
              >
                <img src={image} alt={name} />

                <div className="card-body">
                  <span className="mini-icon">♪</span>
                  <strong>{name}</strong>
                </div>
              </a>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <main className="search-page">
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search artists, albums, or tracks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <button type="submit">Search</button>
      </form>

      {loading && <p className="loading-text">Loading results...</p>}
      {error && <p className="error-text">{error}</p>}

      {searchResults?.artists?.items.length > 0 &&
        renderGrid(searchResults.artists.items, "Artists")}

      {searchResults?.albums?.items.length > 0 &&
        renderGrid(searchResults.albums.items, "Albums")}

      {searchResults?.tracks?.items.length > 0 &&
        renderGrid(searchResults.tracks.items, "Tracks")}
    </main>
  );
}
