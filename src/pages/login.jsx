import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:3000/api/auth/login";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Invalid email or password.");
      }

      // token is returned by the backend (to be built next)
      if (data.token) localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/upload");
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <div className="crop-icon">
          <svg viewBox="0 0 64 64" width="42" height="42">
            <path d="M32 58 L32 20" stroke="#c9a227" strokeWidth="3" strokeLinecap="round" />
            <path d="M32 34 C22 30 16 20 18 8 C28 12 34 20 32 34 Z" fill="#2f6d4f" />
            <path d="M32 26 C42 22 48 12 46 4 C36 8 30 16 32 26 Z" fill="#5fa77e" />
          </svg>
        </div>

        <h1 className="heading">Welcome Back</h1>
        <p className="subtext">
          Log in to continue detecting gaps in your sugarcane fields.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="password-wrap">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="toggle-btn"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="auth-switch">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;