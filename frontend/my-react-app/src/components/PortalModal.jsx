import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PortalModal.css';
import { useToast } from '../context/ToastContext';

const PortalModal = ({ isOpen, onClose }) => {
    const { addToast } = useToast();
    const [portals, setPortals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [manageMode, setManageMode] = useState(false);
    const [newPortal, setNewPortal] = useState({ name: '', url: '', category: 'State' });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', url: '', category: '' });

    useEffect(() => {
        if (isOpen) {
            fetchPortals();
        }
    }, [isOpen]);

    const fetchPortals = async () => {
        setLoading(true);
        try {
            const res = await axios.get("http://localhost:5000/api/portals");
            setPortals(res.data);
        } catch (err) {
            console.error("Failed to load portals", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await axios.post("http://localhost:5000/api/portals", newPortal);
            setNewPortal({ name: '', url: '', category: 'State' });
            fetchPortals();
        } catch (err) {
            addToast("Failed to add portal", 'error');
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        e.preventDefault(); // Prevent link click
        if (window.confirm("Delete this portal?")) {
            try {
                await axios.delete(`http://localhost:5000/api/portals/${id}`);
                fetchPortals();
            } catch (err) {
                addToast("Failed to delete", 'error');
            }
        }
    };

    const startEdit = (p, e) => {
        e.stopPropagation();
        e.preventDefault();
        setEditingId(p._id);
        setEditForm({ name: p.name, url: p.url, category: p.category });
    };

    const handleUpdate = async () => {
        try {
            await axios.put(`http://localhost:5000/api/portals/${editingId}`, editForm);
            setEditingId(null);
            fetchPortals();
        } catch (err) {
            addToast("Failed to update", 'error');
        }
    };

    const federalPortals = portals.filter(p => p.category === 'Federal');
    const statePortals = portals.filter(p => p.category === 'State');
    const paidPortals = portals.filter(p => p.category === 'Paid');
    const othersPortals = portals.filter(p => p.category === 'Others');

    if (!isOpen) return null;

    return (
        <div className="portal-modal-overlay" onClick={onClose}>
            <div className="portal-modal-content" onClick={e => e.stopPropagation()}>
                <div className="portal-modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <h2>🏛️ Procurement Portals</h2>
                        <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setManageMode(!manageMode)}
                            style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                        >
                            {manageMode ? "Done Managing" : "Manage Links ✏️"}
                        </button>
                    </div>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="portal-modal-body">

                    {/* ADD FORM */}
                    {manageMode && (
                        <div style={{ background: '#e0f2fe', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #bae6fd' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#0369a1' }}>Add New Portal</h4>
                            <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    placeholder="Name (e.g. NASA)"
                                    value={newPortal.name}
                                    onChange={e => setNewPortal({ ...newPortal, name: e.target.value })}
                                    required
                                    style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                                <input
                                    placeholder="URL (https://...)"
                                    value={newPortal.url}
                                    onChange={e => setNewPortal({ ...newPortal, url: e.target.value })}
                                    required
                                    style={{ flex: 1.5, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                                <select
                                    value={newPortal.category}
                                    onChange={e => setNewPortal({ ...newPortal, category: e.target.value })}
                                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                >
                                    <option value="State">State</option>
                                    <option value="Federal">Federal</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Others">Others</option>
                                </select>
                                <button type="submit" style={{ padding: '8px 16px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add</button>
                            </form>
                        </div>
                    )}

                    {loading ? <p>Loading portals...</p> : (
                        <>
                            {/* FEDERAL SECTION */}
                            <div className="portal-section">
                                <h3>Federal Portals</h3>
                                <div className="portal-grid">
                                    {federalPortals.map((p) => (
                                        editingId === p._id ? (
                                            <div key={p._id} className="portal-edit-card">
                                                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                                                <input value={editForm.url} onChange={e => setEditForm({ ...editForm, url: e.target.value })} />
                                                <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                                                    <button onClick={handleUpdate} className="btn-sm-save">Save</button>
                                                    <button onClick={() => setEditingId(null)} className="btn-sm-cancel">Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <a key={p._id} href={p.url} target="_blank" rel="noopener noreferrer" className="portal-link federal">
                                                <span>{p.name} {manageMode && <small style={{ fontSize: '0.7rem', color: '#666' }}>({p.url})</small>}</span>
                                                {manageMode ? (
                                                    <div className="manage-actions">
                                                        <span onClick={(e) => startEdit(p, e)} title="Edit">✏️</span>
                                                        <span onClick={(e) => handleDelete(p._id, e)} title="Delete" style={{ marginLeft: '8px', color: 'red' }}>🗑️</span>
                                                    </div>
                                                ) : <span className="link-icon">↗</span>}
                                            </a>
                                        )
                                    ))}
                                </div>
                            </div>

                            {/* STATE SECTION */}
                            <div className="portal-section">
                                <h3>State Portals</h3>
                                <div className="portal-grid">
                                    {statePortals.map((p) => (
                                        editingId === p._id ? (
                                            <div key={p._id} className="portal-edit-card" style={{ gridColumn: 'span 2' }}>
                                                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ width: '40%', marginRight: '5px' }} />
                                                <input value={editForm.url} onChange={e => setEditForm({ ...editForm, url: e.target.value })} style={{ width: '40%', marginRight: '5px' }} />
                                                <button onClick={handleUpdate} className="btn-sm-save">Save</button>
                                                <button onClick={() => setEditingId(null)} className="btn-sm-cancel" style={{ marginLeft: '5px' }}>Cancel</button>
                                            </div>
                                        ) : (
                                            <a key={p._id} href={p.url} target="_blank" rel="noopener noreferrer" className="portal-link state">
                                                <span className="state-name">{p.name}</span>
                                                {manageMode ? (
                                                    <div className="manage-actions">
                                                        <span onClick={(e) => startEdit(p, e)} title="Edit">✏️</span>
                                                        <span onClick={(e) => handleDelete(p._id, e)} title="Delete" style={{ marginLeft: '8px', color: 'red' }}>🗑️</span>
                                                    </div>
                                                ) : <span className="link-icon">↗</span>}
                                            </a>
                                        )
                                    ))}
                                </div>
                            </div>

                            {/* PAID SECTION */}
                            <div className="portal-section">
                                <h3>Paid Portals</h3>
                                <div className="portal-grid">
                                    {paidPortals.map((p) => (
                                        editingId === p._id ? (
                                            <div key={p._id} className="portal-edit-card" style={{ gridColumn: 'span 2' }}>
                                                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ width: '40%', marginRight: '5px' }} />
                                                <input value={editForm.url} onChange={e => setEditForm({ ...editForm, url: e.target.value })} style={{ width: '40%', marginRight: '5px' }} />
                                                <button onClick={handleUpdate} className="btn-sm-save">Save</button>
                                                <button onClick={() => setEditingId(null)} className="btn-sm-cancel" style={{ marginLeft: '5px' }}>Cancel</button>
                                            </div>
                                        ) : (
                                            <a key={p._id} href={p.url} target="_blank" rel="noopener noreferrer" className="portal-link paid" style={{ background: '#fff7ed', borderColor: '#ffedd5', color: '#9a3412' }}>
                                                <span className="state-name">{p.name}</span>
                                                {manageMode ? (
                                                    <div className="manage-actions">
                                                        <span onClick={(e) => startEdit(p, e)} title="Edit">✏️</span>
                                                        <span onClick={(e) => handleDelete(p._id, e)} title="Delete" style={{ marginLeft: '8px', color: 'red' }}>🗑️</span>
                                                    </div>
                                                ) : <span className="link-icon">↗</span>}
                                            </a>
                                        )
                                    ))}
                                </div>
                            </div>

                            {/* OTHERS SECTION */}
                            <div className="portal-section">
                                <h3>Other Resources</h3>
                                <div className="portal-grid">
                                    {othersPortals.map((p) => (
                                        editingId === p._id ? (
                                            <div key={p._id} className="portal-edit-card" style={{ gridColumn: 'span 2' }}>
                                                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ width: '40%', marginRight: '5px' }} />
                                                <input value={editForm.url} onChange={e => setEditForm({ ...editForm, url: e.target.value })} style={{ width: '40%', marginRight: '5px' }} />
                                                <button onClick={handleUpdate} className="btn-sm-save">Save</button>
                                                <button onClick={() => setEditingId(null)} className="btn-sm-cancel" style={{ marginLeft: '5px' }}>Cancel</button>
                                            </div>
                                        ) : (
                                            <a key={p._id} href={p.url} target="_blank" rel="noopener noreferrer" className="portal-link others" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}>
                                                <span className="state-name">{p.name}</span>
                                                {manageMode ? (
                                                    <div className="manage-actions">
                                                        <span onClick={(e) => startEdit(p, e)} title="Edit">✏️</span>
                                                        <span onClick={(e) => handleDelete(p._id, e)} title="Delete" style={{ marginLeft: '8px', color: 'red' }}>🗑️</span>
                                                    </div>
                                                ) : <span className="link-icon">↗</span>}
                                            </a>
                                        )
                                    ))}
                                </div>
                            </div>

                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PortalModal;
