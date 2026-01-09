import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./AuthStyles.css";
import loginImg from "../assets/login.png";
import login1Img from "../assets/login1.png";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:5000/api/auth/register", {
        name,
        email,
        password
      });
      setSuccess("Registration successful! Redirecting...");
      setTimeout(() => navigate("/login"), 1500);
    } catch { // removed err
      setError("Registration failed. Try again.");
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
          <h1 style={{ fontSize: '3rem', marginBottom: '10px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Join TechXL</h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Create your account to start managing State & Federal opportunities.</p>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div style={{ flex: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f5f7' }}>
        <div className="auth-card" style={{ maxWidth: "450px", boxShadow: 'none', background: 'transparent' }}>
          <div className="auth-icon-container">
            <img src="/techxl-logo.png" alt="Techxl Logo" className="auth-logo" />
          </div>
          <div className="auth-subtitle">State / Federal CRM</div>

          <h2 className="auth-title">Sign Up</h2>

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <form className="auth-form" onSubmit={handleRegister}>
            <div className="input-group">
              <span className="input-icon">👤</span>
              <input
                type="text"
                className="auth-input"
                placeholder="Username"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <span className="input-icon">📧</span>
              <input
                type="email"
                className="auth-input"
                placeholder="E-mail"
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

            <button className="auth-button" style={{ marginTop: "20px" }}>
              CREATE ACCOUNT
            </button>
          </form>

          <Link to="/login" className="auth-footer-link">
            Already have an account? Login here
          </Link>
        </div>
      </div>

    </div>
  );
}
