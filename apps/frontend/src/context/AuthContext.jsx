import { createContext, useContext, useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axios";
import { API } from "../api/services";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const hydrateAuth = async () => {
    try {
      const { data } = await axiosInstance.get(API.me);
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post(API.logout);
    } catch {}
    setUser(null);
  };

  const login = async (payload) => {
    setAuthLoading(true);
    try {
      const { data } = await axiosInstance.post(API.login, payload);
      setUser(data.user ?? null);
      return data;
    } finally {
      setAuthLoading(false);
    }
  };

  const signup = async (payload) => {
    setAuthLoading(true);
    try {
      const { data } = await axiosInstance.post(API.signup, payload);
      setUser(data.user ?? null);
      return data;
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    hydrateAuth();

    const handleForcedLogout = () => {
      setUser(null);
      setAuthLoading(false);
    };
    window.addEventListener("auth:logout", handleForcedLogout);

    return () => {
      window.removeEventListener("auth:logout", handleForcedLogout);
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      authLoading,
      isAuthenticated: Boolean(user),
      login,
      signup,
      logout,
      setUser,
    }),
    [user, authLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
