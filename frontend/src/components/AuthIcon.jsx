import { useState, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";

export default function AuthIcon() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // 1. Check if they are already logged in when the app loads
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("http://localhost:8000/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (res.ok) {
          setUser({ picture: data.picture });
        } else {
          localStorage.removeItem("token");
        }
      } catch (error) {
        console.error("Failed to restore session");
      }
    };
    fetchProfile();
  }, []);

  // 2. The actual Google Login flow
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch("http://localhost:8000/api/users/google", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: tokenResponse.access_token }),
        });

        const data = await res.json();

        if (res.ok) {
          // SAVE THE TOKEN TO LOCAL STORAGE
          localStorage.setItem("token", data.token);
          setUser(data.user);

          // We will handle data.isNewUser logic here later
        } else {
          console.error("Login failed:", data.message);
        }
      } catch (error) {
        console.error("Network error during login:", error);
      }
    },
    onError: (error) => console.log("Google Login Failed:", error),
  });

  if (user) {
    return (
      <img
        src={user.picture}
        alt="Profile"
        onClick={() => navigate("/profile")}
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "12px",
          cursor: "pointer",
          border: "2px solid var(--border)",
          transition: "border-color 0.2s",
        }}
        onMouseOver={(e) =>
          (e.currentTarget.style.borderColor = "var(--marigold)")
        }
        onMouseOut={(e) =>
          (e.currentTarget.style.borderColor = "var(--border)")
        }
      />
    );
  }

  return (
    <button
      onClick={() => login()}
      style={{
        width: "42px",
        height: "42px",
        borderRadius: "12px",
        backgroundColor: "var(--panel)",
        border: "1px solid var(--border)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--ink-muted)",
        transition: "all 0.2s",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.color = "var(--marigold)";
        e.currentTarget.style.borderColor = "var(--marigold)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.color = "var(--ink-muted)";
        e.currentTarget.style.borderColor = "var(--border)";
      }}
    >
      👤
    </button>
  );
}
