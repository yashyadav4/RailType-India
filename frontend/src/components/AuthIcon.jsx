import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthIcon() {
  const navigate = useNavigate();
  const { user, login: authLogin, loading } = useAuth();

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      await authLogin(tokenResponse.access_token);
    },
    onError: (error) => console.log("Google Login Failed:", error),
  });

  // Don't flash the wrong icon while session is restoring
  if (loading) return null;

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
      onClick={() => googleLogin()}
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
