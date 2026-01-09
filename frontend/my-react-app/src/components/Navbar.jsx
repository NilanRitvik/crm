import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, NavLink, Link } from "react-router-dom";
import axios from 'axios';
import "./Navbar.css";


export default function Navbar() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("search") || "";


  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  let user = null;
  try {
    const storedUser = localStorage.getItem("user");
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  // Fetch Notifications on Mount
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get("http://localhost:5000/api/notifications", {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Filter out those deemed "read" for TODAY
        // Key format: `notif-read-${id}-${dateString}`
        const todayStr = new Date().toISOString().split('T')[0];
        const activeNotifs = res.data.filter(n => {
          const readKey = `notif-read-${n.id}-${todayStr}`;
          return !localStorage.getItem(readKey);
        });

        setNotifications(activeNotifs);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };

    fetchNotifications();
    // Poll every minute for updates? Optional, lets just run on mount for now or intervals
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = (id) => {
    // Mark as read specifically for TODAY in local storage
    const todayStr = new Date().toISOString().split('T')[0];
    const readKey = `notif-read-${id}-${todayStr}`;
    localStorage.setItem(readKey, "true");

    // Remove from UI immediately
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    if (term) {
      setSearchParams({ ...Object.fromEntries(searchParams), search: term });
    } else {
      const newParams = Object.fromEntries(searchParams);
      delete newParams.search;
      setSearchParams(newParams);
    }
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar-left">
          <img src="/techxl-logo.png" alt="Techxl Logo" className="navbar-logo" />
          <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white', letterSpacing: '0.5px' }}>TIS</span>
        </div>

        <div className="navbar-center">
          <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            Dashboard
          </NavLink>
          <NavLink to="/pipeline" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            Pipeline
          </NavLink>
          <NavLink to="/forecast" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            Forecast
          </NavLink>
          <NavLink to="/proposals" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            Proposals
          </NavLink>
          <NavLink to="/contacts" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            Contacts
          </NavLink>
          <NavLink to="/partners" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            Partners
          </NavLink>
          <NavLink to="/portals" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            Portals
          </NavLink>
          <NavLink to="/events" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            Events
          </NavLink>
          <NavLink to="/company-profile" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            Company
          </NavLink>
          <NavLink to="/org-chart" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            State / Federal
          </NavLink>

          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search deals, contacts..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>

        <div className="navbar-right">
          <div className="notification-wrapper" style={{ position: 'relative', marginRight: '15px' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontSize: '1.2rem', position: 'relative' }}
            >
              🔔
              {notifications.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  background: '#ff5630',
                  color: 'white',
                  borderRadius: '50%',
                  padding: '2px 6px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold'
                }}>
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-dropdown" style={{
                position: 'absolute',
                top: '40px',
                right: '0',
                width: '320px',
                background: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                borderRadius: '8px',
                zIndex: 1000,
                padding: '10px',
                color: '#333'
              }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                  Notifications ({notifications.length})
                </h4>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <p style={{ fontSize: '0.9rem', color: '#888', textAlign: 'center' }}>No new notifications</p>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} style={{
                        padding: '10px',
                        borderBottom: '1px solid #f0f0f0',
                        marginBottom: '5px',
                        background: '#f9f9faf',
                        borderRadius: '4px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <strong style={{ fontSize: '0.85rem', color: notif.isOverdue ? '#d32f2f' : '#0052cc' }}>
                              {notif.isOverdue ? '🛑 ' : '⚠️ '}
                              {notif.type}
                              {notif.isOverdue
                                ? ` was ${Math.abs(notif.daysLeft)} day(s) ago`
                                : ` in ${notif.daysLeft} day${notif.daysLeft !== 1 ? 's' : ''}`
                              }
                            </strong>
                            <p style={{ margin: '4px 0', fontSize: '0.85rem' }}>
                              {notif.leadName}
                            </p>
                            <Link to={`/lead/${notif.leadId}`} onClick={() => setShowNotifications(false)} style={{ fontSize: '0.8rem', color: '#0052cc' }}>
                              View Lead
                            </Link>
                          </div>
                          <button
                            onClick={() => markAsRead(notif.id)}
                            style={{
                              background: '#e0e0e0',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              color: '#333'
                            }}
                          >
                            Read
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {user?.name && (
            <Link to="/profile" className="username-link">
              <span className="username">👤 {user.name}</span>
            </Link>
          )}
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </header >


    </>
  );
}
