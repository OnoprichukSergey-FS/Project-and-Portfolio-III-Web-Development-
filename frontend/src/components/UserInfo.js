import React from "react";

export default function UserInfo({ user, onLogout }) {
  return (
    <div style={{ textAlign: "center" }}>
      <h1>Welcome, {user.display_name}!</h1>
      {user.images?.[0] && (
        <img
          src={user.images[0].url}
          alt="Profile"
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            marginTop: 10,
          }}
        />
      )}
      <p style={{ marginTop: 10 }}>Email: {user.email}</p>
      <button
        onClick={onLogout}
        style={{
          padding: "12px 25px",
          fontSize: 18,
          cursor: "pointer",
          borderRadius: 6,
          backgroundColor: "#1DB954",
          color: "white",
          border: "none",
          fontWeight: "bold",
          marginTop: 15,
        }}
      >
        Logout
      </button>
    </div>
  );
}
