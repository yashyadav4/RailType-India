import { createContext, useContext, useState, useEffect } from "react";
import { getGuestRuns, clearGuestRuns } from "../utils/guestRuns";

const AuthContext = createContext(null);

const API_BASE = "/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Restore session on mount if a token exists
  useEffect(() => {
    const restoreSession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (res.ok) {
          setUser(data);
        } else {
          // Token is invalid/expired — clean up
          localStorage.removeItem("token");
          setToken(null);
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  /**
   * Login with a Google OAuth access_token.
   * After login, syncs any guest runs from localStorage to the backend.
   */
  const login = async (googleAccessToken) => {
    try {
      const res = await fetch(`${API_BASE}/users/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: googleAccessToken }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setUser(data.user);

        // Sync guest runs only for brand-new users
        if (data.isNewUser) {
          await syncGuestRuns(data.token);
        }

        return { success: true, isNewUser: data.isNewUser };
      } else {
        console.error("Login failed:", data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error("Network error during login:", error);
      return { success: false, message: "Network error" };
    }
  };

  /**
   * Sync any guest runs stored in localStorage to the backend.
   * Called automatically after login.
   */
  const syncGuestRuns = async (authToken) => {
    const guestRuns = getGuestRuns();
    if (guestRuns.length === 0) return;

    try {
      const res = await fetch(`${API_BASE}/runs/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ runs: guestRuns }),
      });

      if (res.ok) {
        clearGuestRuns();
        console.log(`Synced ${guestRuns.length} guest runs to account`);
      }
    } catch (error) {
      console.error("Failed to sync guest runs:", error);
      // Guest runs stay in localStorage for next attempt
    }
  };

  /**
   * Logout — clears token, clears user state.
   */
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to consume auth state from any component.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
