// src/utils/api.js
const BASE_URL =
  "https://c9e9-2600-1700-3cb0-4960-1d36-9275-acd-5beb.ngrok-free.app";

export const fetchUser = () => {
  return fetch(`${BASE_URL}/me`, { credentials: "include" }).then((res) => {
    if (!res.ok) throw new Error("Unauthorized");
    return res.json();
  });
};

export const refreshToken = () => {
  return fetch(`${BASE_URL}/refresh_token`, { credentials: "include" }).then(
    (res) => {
      if (!res.ok) throw new Error("Token refresh failed");
    }
  );
};

export const logoutUser = () => {
  return fetch(`${BASE_URL}/logout`, { credentials: "include" });
};

export const searchSpotify = async (query) => {
  const response = await fetch(
    `${BASE_URL}/search?q=${encodeURIComponent(query)}&type=track,artist,album`,
    {
      credentials: "include",
    }
  );

  if (response.status === 401) {
    throw new Error("session-expired");
  }

  if (!response.ok) throw new Error("Search failed");

  return response.json();
};
