"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface User {
  id: string;
  email: string;
  name?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Logout Handler
  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
  }, []);

  // Login Handler (Called from AuthModal or Login Forms)
  const login = useCallback((newToken: string, userData: User) => {
    localStorage.setItem("auth_token", newToken);
    setToken(newToken);
    setUser(userData);
  }, []);

  // Automatic Re-hydration on Page Load / Refresh
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("auth_token");

      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      setToken(savedToken);

      try {
        const res = await fetch(`${API_BASE_URL}/api/user/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${savedToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error("Token invalid or expired");
        }

        const data = await res.json();
        setUser(data.user);
      } catch (error) {
        console.warn("Session rehydration failed:", error);
        // Clear invalid or expired token
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook for Consuming Auth State
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
