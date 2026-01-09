import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import '../components/PortalModal.css'; // Reusing existing styles for cards

const PortalsPage = () => {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [portals, setPortals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [manageMode, setManageMode] = useState(false);
    const [newPortal, setNewPortal] = useState({ name: '', url: '', category: 'State' });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', url: '', category: '' });

    useEffect(() => {
        fetchPortals();
    }, []);

    const fetchPortals = async () => {
        setLoading(true);
        try {
            const res = await axios.get("http://localhost:5000/api/portals");
            setPortals(res.data);
        } catch (err) {
            console.error("Failed to load portals", err);
            addToast("Failed to load portals", 'error');
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
            addToast("Portal added successfully", 'success');
        } catch (err) {
            addToast("Failed to add portal", 'error');
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        e.preventDefault();
        if (window.confirm("Delete this portal?")) {
            try {
                await axios.delete(`http://localhost:5000/api/portals/${id}`);
                fetchPortals();
                addToast("Portal deleted", 'success');
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
            addToast("Portal updated", 'success');
        } catch (err) {
            addToast("Failed to update", 'error');
        }
    };

    const federalPortals = portals.filter(p => p.category === 'Federal');
    const statePortals = portals.filter(p => p.category === 'State');
    const paidPortals = portals.filter(p => p.category === 'Paid');
    const othersPortals = portals.filter(p => p.category === 'Others');

    return (
        <div className="dashboard-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                    <h2 style={{ margin: 0, color: '#172b4d' }}>Procurement Portals</h2>
                    <p style={{ margin: '5px 0 0', color: '#6b778c' }}>Access and manage state, federal, and paid portal links.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="btn"
                        onClick={() => navigate('/portals/credentials')}
                        style={{
                            padding: '10px 20px',
                            background: '#6554C0',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: '500'
                        }}
                    >
                        🔑 Credentials
                    </button>
                    <button
                        className="btn"
                        onClick={() => setManageMode(!manageMode)}
                        style={{
                            padding: '10px 20px',
                            background: manageMode ? '#42526E' : '#0052cc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        {manageMode ? "Done Managing" : "Manage Links ✏️"}
                    </button>
                </div>
            </div>

            <div className="portal-page-content">
                {/* ADD FORM */}
                {manageMode && (
                    <div style={{ background: '#e0f2fe', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #bae6fd' }}>
                        <h4 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#0369a1' }}>Add New Portal</h4>
                        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            <input
                                placeholder="Name (e.g. NASA)"
                                value={newPortal.name}
                                onChange={e => setNewPortal({ ...newPortal, name: e.target.value })}
                                required
                                style={{ flex: '1 1 200px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                            <input
                                placeholder="URL (https://...)"
                                value={newPortal.url}
                                onChange={e => setNewPortal({ ...newPortal, url: e.target.value })}
                                required
                                style={{ flex: '2 1 300px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                            <select
                                value={newPortal.category}
                                onChange={e => setNewPortal({ ...newPortal, category: e.target.value })}
                                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '120px' }}
                            >
                                <option value="State">State</option>
                                <option value="Federal">Federal</option>
                                <option value="Paid">Paid</option>
                                <option value="Others">Others</option>
                            </select>
                            <button type="submit" style={{ padding: '10px 20px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Add Portal</button>
                        </form>
                    </div>
                )}

                {loading ? <div style={{ textAlign: 'center', padding: '40px' }}>Loading portals...</div> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        {/* FEDERAL SECTION */}
                        <PortalSection
                            title="Federal Portals"
                            portals={federalPortals}
                            type="federal"
                            manageMode={manageMode}
                            editingId={editingId}
                            editForm={editForm}
                            setEditForm={setEditForm}
                            startEdit={startEdit}
                            handleDelete={handleDelete}
                            handleUpdate={handleUpdate}
                            setEditingId={setEditingId}
                        />

                        {/* STATE SECTION */}
                        <PortalSection
                            title="State Portals"
                            portals={statePortals}
                            type="state"
                            manageMode={manageMode}
                            editingId={editingId}
                            editForm={editForm}
                            setEditForm={setEditForm}
                            startEdit={startEdit}
                            handleDelete={handleDelete}
                            handleUpdate={handleUpdate}
                            setEditingId={setEditingId}
                        />

                        {/* PAID SECTION */}
                        <PortalSection
                            title="Paid Portals"
                            portals={paidPortals}
                            type="paid"
                            manageMode={manageMode}
                            editingId={editingId}
                            editForm={editForm}
                            setEditForm={setEditForm}
                            startEdit={startEdit}
                            handleDelete={handleDelete}
                            handleUpdate={handleUpdate}
                            setEditingId={setEditingId}
                        />

                        {/* OTHERS SECTION */}
                        <PortalSection
                            title="Other Resources"
                            portals={othersPortals}
                            type="others"
                            manageMode={manageMode}
                            editingId={editingId}
                            editForm={editForm}
                            setEditForm={setEditForm}
                            startEdit={startEdit}
                            handleDelete={handleDelete}
                            handleUpdate={handleUpdate}
                            setEditingId={setEditingId}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper Component to avoid repetition
const PortalSection = ({ title, portals, type, manageMode, editingId, editForm, setEditForm, startEdit, handleDelete, handleUpdate, setEditingId }) => {
    if (portals.length === 0 && !manageMode) return null;

    let linkClass = "portal-link";
    let style = {};
    if (type === 'federal') linkClass += " federal";
    if (type === 'state') linkClass += " state";
    if (type === 'paid') { linkClass += " paid"; style = { background: '#fff7ed', borderColor: '#ffedd5', color: '#9a3412' }; }
    if (type === 'others') { linkClass += " others"; style = { background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }; }

    return (
        <div className="portal-section">
            <h3 style={{ borderBottom: '2px solid #ebecf0', paddingBottom: '10px', marginBottom: '15px' }}>{title}</h3>
            <div className="portal-grid">
                {portals.map((p) => (
                    editingId === p._id ? (
                        <div key={p._id} className="portal-edit-card" style={{ gridColumn: 'span 2' }}>
                            <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ width: '40%', marginRight: '5px' }} />
                            <input value={editForm.url} onChange={e => setEditForm({ ...editForm, url: e.target.value })} style={{ width: '40%', marginRight: '5px' }} />
                            <button onClick={handleUpdate} className="btn-sm-save">Save</button>
                            <button onClick={() => setEditingId(null)} className="btn-sm-cancel" style={{ marginLeft: '5px' }}>Cancel</button>
                        </div>
                    ) : (
                        <a key={p._id} href={p.url} target="_blank" rel="noopener noreferrer" className={linkClass} style={style}>
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
                {portals.length === 0 && <p style={{ color: '#888', fontStyle: 'italic' }}>No portals added.</p>}
            </div>
        </div>
    );
};

export default PortalsPage;
