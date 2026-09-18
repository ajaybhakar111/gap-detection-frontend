import { useNavigate } from "react-router-dom";

export default function HeroPage() {
  const navigate = useNavigate();

  return (
    <main className="hero">
      <div className="hero-content">
        <h1 className="hero-title">Sugarcane Gap Detection</h1>
        <p className="hero-subtitle">
          Find the empty patches in your sugarcane farm early, so you can
          replant and protect your yield.
        </p>

        <div className="hero-buttons">
          <button
            className="btn btn-primary"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </button>
        </div>
      </div>
    </main>
  );
}