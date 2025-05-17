import React from "react";

export default function Dashboard() {
  return (
    <div
      style={{
        backgroundColor: "#000",
        color: "#fff",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
        flexDirection: "column",
        textAlign: "center",
        padding: "0 20px",
      }}
    >
      <i
        className="fas fa-search"
        style={{ fontSize: 60, marginBottom: 20, color: "#1DB954" }}
      ></i>
      <h1 style={{ fontSize: 32, marginBottom: 10 }}>Search Coming Soon</h1>
      <p style={{ fontSize: 18, color: "#ccc" }}>
        This feature will be available soon
      </p>
    </div>
  );
}
