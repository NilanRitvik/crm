import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const PortalCredentials = () => {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [credentials, setCredentials] = useState([]);
    const [filteredCredentials, setFilteredCredentials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [newCred, setNewCred] = useState({ portalName: '', username: '', password: '' });
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchCredentials();
    }, []);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredCredentials(credentials);
        } else {
            const lower = searchTerm.toLowerCase();
            setFilteredCredentials(credentials.filter(c =>
                c.portalName.toLowerCase().includes(lower) ||
                c.username.toLowerCase().includes(lower)
            ));
        }
    }, [searchTerm, credentials]);

    const fetchCredentials = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get("http://localhost:5000/api/credentials", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCredentials(res.data);
            setFilteredCredentials(res.data);
        } catch (err) {
            console.error(err);
            addToast("Failed to load credentials", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');

            if (editingId) {
                await axios.put(`http://localhost:5000/api/credentials/${editingId}`, newCred, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                addToast("Credential updated successfully", 'success');
            } else {
                await axios.post("http://localhost:5000/api/credentials", newCred, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                addToast("Credential saved successfully", 'success');
            }

            resetForm();
            fetchCredentials();
        } catch (err) {
            addToast(editingId ? "Failed to update" : "Failed to save", 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this credential?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/credentials/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            addToast("Deleted successfully", 'success');
            fetchCredentials();
        } catch (err) {
            addToast("Failed to delete", 'error');
        }
    };

    const handleEdit = (cred) => {
        setNewCred({ portalName: cred.portalName, username: cred.username, password: cred.password });
        setEditingId(cred._id);
        setIsAdding(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setNewCred({ portalName: '', username: '', password: '' });
        setEditingId(null);
        setIsAdding(false);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        addToast("Copied to clipboard", 'success');
    };

    return (
        <div className="dashboard-container" style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Header */}
            <div className="dashboard-header" style={{ display: "flex", alignItems: "center", marginBottom: "30px", gap: '15px' }}>
                <button
                    onClick={() => navigate('/portals')}
                    style={{
                        background: 'white',
                        border: '1px solid #dfe1e6',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#172b4d',
                        fontWeight: '500',
                        fontSize: '0.9rem',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        transition: 'background 0.2s'
                    }}
                    title="Back to Portals"
                >
                    <span>←</span> Back to Portals
                </button>
                <h2 style={{ margin: 0, color: '#172b4d' }}>Portal Credentials</h2>
            </div>

            {/* Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                <input
                    type="text"
                    placeholder="Search credentials..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        padding: '10px 15px',
                        borderRadius: '6px',
                        border: '1px solid #dfe1e6',
                        width: '300px',
                        fontSize: '1rem'
                    }}
                />
                <button
                    onClick={() => {
                        if (isAdding) {
                            resetForm();
                        } else {
                            setIsAdding(true);
                        }
                    }}
                    style={{
                        padding: '10px 20px',
                        background: isAdding ? '#42526E' : '#0052cc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    {isAdding ? "Cancel" : "+ Add Credential"}
                </button>
            </div>

            {/* ADD / EDIT FORM */}
            {isAdding && (
                <div style={{ background: '#f4f5f7', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #dfe1e6', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#172b4d' }}>
                        {editingId ? "Edit Credential" : "Add New Credential"}
                    </h3>
                    <form onSubmit={handleSave} style={{ display: 'grid', gap: '15px', gridTemplateColumns: '1fr 1fr 1fr auto' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#5e6c84' }}>Portal Name</label>
                            <input
                                placeholder="e.g. FedConnect"
                                value={newCred.portalName}
                                onChange={e => setNewCred({ ...newCred, portalName: e.target.value })}
                                required
                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#5e6c84' }}>User ID / Email</label>
                            <input
                                placeholder="User ID"
                                value={newCred.username}
                                onChange={e => setNewCred({ ...newCred, username: e.target.value })}
                                required
                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#5e6c84' }}>Password</label>
                            <input
                                placeholder="Password"
                                value={newCred.password}
                                onChange={e => setNewCred({ ...newCred, password: e.target.value })}
                                required
                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                            <button type="submit" style={{ padding: '10px 20px', background: '#36b37e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                {editingId ? "Update" : "Save"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Credentials List */}
            {loading ? <p>Loading...</p> : (
                <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                    {filteredCredentials.length === 0 ? (
                        <p style={{ color: '#6b778c', fontStyle: 'italic', gridColumn: '1/-1', textAlign: 'center' }}>No credentials found.</p>
                    ) : (
                        filteredCredentials.map(cred => (
                            <div key={cred._id} style={{
                                background: 'white',
                                borderRadius: '8px',
                                border: '1px solid #ebecf0',
                                padding: '20px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                position: 'relative'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h3 style={{ margin: 0, color: '#0052cc', fontSize: '1.1rem' }}>{cred.portalName}</h3>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button
                                            onClick={() => handleEdit(cred)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px' }}
                                            title="Edit"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cred._id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '1.2rem', padding: '0 5px' }}
                                            title="Delete"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#172b4d' }}>
                                    <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#6b778c' }}>User ID:</span>
                                        <span>
                                            <strong style={{ marginRight: '8px' }}>{cred.username}</strong>
                                            <button onClick={() => copyToClipboard(cred.username)} style={copyBtnStyle}>📋</button>
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#6b778c' }}>Password:</span>
                                        <span>
                                            <strong style={{ marginRight: '8px' }}>{cred.password}</strong>
                                            <button onClick={() => copyToClipboard(cred.password)} style={copyBtnStyle}>📋</button>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

const copyBtnStyle = {
    background: '#f4f5f7',
    border: '1px solid #dfe1e6',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    padding: '2px 5px',
    color: '#172b4d'
};

export default PortalCredentials;
