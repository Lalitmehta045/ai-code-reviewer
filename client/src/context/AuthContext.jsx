import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

const parseJwtPayload = (token) => {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(atob(normalized + padding));
  } catch (_) {
    return null;
  }
};

const getFallbackUserFromToken = (token) => {
  const payload = parseJwtPayload(token);
  return {
    id: payload?.id || payload?.sub || "oauth-user",
    name: "Google User",
    email: ""
  };
};

export const AuthProvider = ({ children }) => {
  // Configure axios once for the app
  axios.defaults.baseURL = import.meta.env.VITE_API_URL;
  axios.defaults.timeout = parseInt(import.meta.env.VITE_API_TIMEOUT || "10000", 10);
  axios.defaults.withCredentials = false;

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("authToken") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const savedUser = localStorage.getItem("authUser");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (_) {
          const fallbackUser = getFallbackUserFromToken(token);
          localStorage.setItem("authUser", JSON.stringify(fallbackUser));
          setUser(fallbackUser);
        }
      } else {
        const fallbackUser = getFallbackUserFromToken(token);
        localStorage.setItem("authUser", JSON.stringify(fallbackUser));
        setUser(fallbackUser);
      }
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
    setLoading(false);
  }, [token]);

  const login = (data) => {
    if (!data?.token) return;

    const resolvedUser = data.user || getFallbackUserFromToken(data.token);
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("authUser", JSON.stringify(resolvedUser));
    setToken(data.token);
    setUser(resolvedUser);
    axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
