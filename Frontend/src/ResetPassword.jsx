import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [token, setToken] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Get token from URL query parameters
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get("token");

    if (!resetToken) {
      setMessage({
        type: "error",
        text: "Invalid reset link. Please request a new password reset.",
      });
    } else {
      setToken(resetToken);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters long",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({
        type: "error",
        text: "Passwords do not match",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/auth?action=reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: data.message,
        });

        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to reset password",
        });
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setMessage({
        type: "error",
        text: "Network error. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0E0F15",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "450px",
          width: "100%",
          backgroundColor: "#1A1A1A",
          borderRadius: "16px",
          padding: "40px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1
            style={{
              color: "white",
              fontSize: "2rem",
              marginBottom: "8px",
              fontFamily: "Sansita, sans-serif",
            }}
          >
            🔑 Reset Password
          </h1>
          <p style={{ color: "#888", fontSize: "0.95rem" }}>
            Enter your new password below
          </p>
        </div>

        {message.text && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              backgroundColor: message.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
              border: `1px solid ${message.type === "success" ? "#10B981" : "#EF4444"}`,
              color: message.type === "success" ? "#10B981" : "#EF4444",
              fontSize: "0.9rem",
            }}
          >
            {message.text}
          </div>
        )}

        {!token ? (
          <div style={{ textAlign: "center" }}>
            <button
              onClick={() => navigate("/login")}
              style={{
                padding: "14px 32px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  color: "#E5E5E5",
                  fontSize: "0.9rem",
                  marginBottom: "8px",
                  display: "block",
                  fontWeight: "500",
                }}
              >
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  backgroundColor: "#2A2A2A",
                  border: "1px solid #404040",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "1rem",
                  outline: "none",
                }}
              />
              <p style={{ color: "#666", fontSize: "0.8rem", marginTop: "4px" }}>
                Must be at least 6 characters
              </p>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  color: "#E5E5E5",
                  fontSize: "0.9rem",
                  marginBottom: "8px",
                  display: "block",
                  fontWeight: "500",
                }}
              >
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  backgroundColor: "#2A2A2A",
                  border: "1px solid #404040",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "1rem",
                  outline: "none",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              style={{
                width: "100%",
                padding: "14px",
                background: loading || !token
                  ? "#666"
                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: loading || !token ? "not-allowed" : "pointer",
                marginBottom: "16px",
                transition: "all 0.3s ease",
              }}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              style={{
                width: "100%",
                padding: "14px",
                background: "transparent",
                border: "1px solid #404040",
                borderRadius: "8px",
                color: "#888",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#2A2A2A";
                e.target.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "transparent";
                e.target.style.color = "#888";
              }}
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
