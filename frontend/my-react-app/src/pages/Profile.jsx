import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Profile.css";

export default function Profile() {
    const [user, setUser] = useState({
        name: "",
        email: ""
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await axios.get("http://localhost:5000/api/auth/profile", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch profile", err);
            setMessage({ type: "error", text: "Failed to load profile data." });
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const token = localStorage.getItem("token");
            const res = await axios.put("http://localhost:5000/api/auth/profile", user, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update local storage if needed
            const storedUser = JSON.parse(localStorage.getItem("user"));
            localStorage.setItem("user", JSON.stringify({ ...storedUser, ...res.data }));

            setUser(res.data);
            setMessage({ type: "success", text: "Profile updated successfully!" });
        } catch (err) {
            console.error("Failed to update profile", err);
            setMessage({ type: "error", text: "Failed to update profile." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="profile-container">Loading...</div>;

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h1 className="profile-title">My Profile</h1>
            </div>

            <div className="profile-card">
                <h2 className="profile-section-title">Personal Information</h2>

                {message && (
                    <div className={`profile-message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                <form className="profile-form" onSubmit={handleSubmit}>
                    <div className="profile-field-group">
                        <label className="profile-label">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            className="profile-input"
                            value={user.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="profile-field-group">
                        <label className="profile-label">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            className="profile-input"
                            value={user.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="profile-actions">
                        <button type="submit" className="save-btn" disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
