const BASE_URL =
  "https://project-and-portfolio-iii-web-development.onrender.com";

const TOKEN_KEY = "soundscope_token";

export const saveAuthTokenFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    window.history.replaceState({}, document.title, window.location.pathname);
  }
};

const getAuthHeaders = () => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) return {};

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const loginUser = () => {
  window.location.href = `${BASE_URL}/login`;
};

export const fetchUser = () => {
  saveAuthTokenFromUrl();

  return fetch(`${BASE_URL}/me`, {
    credentials: "include",
    headers: getAuthHeaders(),
  }).then((res) => {
    if (!res.ok) throw new Error("Unauthorized");
    return res.json();
  });
};

export const refreshToken = () => {
  return fetch(`${BASE_URL}/refresh_token`, {
    credentials: "include",
    headers: getAuthHeaders(),
  }).then((res) => {
    if (!res.ok) throw new Error("Token refresh failed");
  });
};

export const logoutUser = () => {
  localStorage.removeItem(TOKEN_KEY);

  return fetch(`${BASE_URL}/logout`, {
    credentials: "include",
    headers: getAuthHeaders(),
  });
};

export const searchSpotify = async (query) => {
  const response = await fetch(
    `${BASE_URL}/search?q=${encodeURIComponent(query)}&type=track,artist,album`,
    {
      credentials: "include",
      headers: getAuthHeaders(),
    }
  );

  if (response.status === 401) {
    throw new Error("session-expired");
  }

  if (!response.ok) throw new Error("Search failed");

  return response.json();
};
