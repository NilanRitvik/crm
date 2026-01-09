import React, { useState } from "react";
import api from "../axios"; // Use configured instance
import { useNavigate, Link } from "react-router-dom";
import "./AuthStyles.css";
import loginImg from "../assets/login.png";
import login1Img from "../assets/login1.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Slider State
  const images = [loginImg, login1Img];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      // api interceptor will pick up the token automatically
      navigate("/", { replace: true });
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ display: 'flex', height: '100vh', width: '100vw', padding: 0, overflow: 'hidden', alignItems: 'stretch', justifyContent: 'flex-start' }}>

      {/* Left Side - Slider */}
      <div style={{ flex: 1.2, position: 'relative', overflow: 'hidden', background: 'black' }}>
        {images.map((img, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${img})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: currentImageIndex === index ? 1 : 0,
              transition: 'opacity 1s ease-in-out',
              zIndex: 1
            }}
          />
        ))}
        <div style={{ position: 'absolute', bottom: '40px', left: '40px', color: 'white', zIndex: 2, maxWidth: '80%' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '10px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Welcome to TIS</h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Techxl Intelligence System</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div style={{ flex: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f5f7' }}>
        <div className="auth-card" style={{ width: '400px', boxShadow: 'none', background: 'transparent' }}>
          <div className="auth-icon-container">
            <img src="/techxl-logo.png" alt="Techxl Logo" className="auth-logo" />
          </div>
          <div className="auth-subtitle">Techxl Intelligence System</div>

          <h2 className="auth-title">TIS LOGIN</h2>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleLogin}>
            <div className="input-group">
              <span className="input-icon">👤</span>
              <input
                type="email"
                className="auth-input"
                placeholder="Username / Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                className="auth-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button className="auth-button" disabled={loading} style={{ marginTop: "20px" }}>
              {loading ? "LOGGING IN..." : "LOGIN"}
            </button>
          </form>

          <div style={{ marginTop: '15px' }}>
            <Link to="/register" className="auth-footer-link" style={{ display: 'inline' }}>
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
