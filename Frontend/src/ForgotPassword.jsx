import React, { useState } from "react";

function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState("");
  const [accountType, setAccountType] = useState("tester");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/auth?action=forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            accountType,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: data.message,
        });
        setEmail("");
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to send reset link",
        });
      }
    } catch (error) {
      console.error("Forgot password error:", error);
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
            🔐 Forgot Password
          </h1>
          <p style={{ color: "#888", fontSize: "0.95rem" }}>
            Enter your email address and we'll send you a link to reset your password
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
              Account Type
            </label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
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
            >
              <option value="tester">Tester</option>
              <option value="developer">Developer</option>
            </select>
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
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
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
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading
                ? "#666"
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: "8px",
              color: "white",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              marginBottom: "16px",
              transition: "all 0.3s ease",
            }}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          <button
            type="button"
            onClick={onBack}
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
      </div>
    </div>
  );
}

export default ForgotPassword;
