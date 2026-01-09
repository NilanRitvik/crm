import React, { useState } from 'react';
import axios from 'axios';
import USAMap from '../components/USAMap';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const StateCIOPage = () => {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedState, setSelectedState] = useState(null);
    const [cios, setCios] = useState([{}, {}]); // Default 2 slots
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleStateClick = async (stateName, stateId) => {
        setSelectedState({ name: stateName, id: stateId });
        setLoading(true);
        setModalOpen(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/state-cio/${stateName}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            let fetchedCios = res.data.cios || [];
            // Ensure we have 2 objects to bind to
            while (fetchedCios.length < 2) fetchedCios.push({});
            setCios(fetchedCios.slice(0, 2));

        } catch (err) {
            console.error(err);
            addToast("Failed to load CIO details", 'error');
            setCios([{}, {}]);
        } finally {
            setLoading(false);
        }
    };

    const handleCioChange = (index, field, value) => {
        const newCios = [...cios];
        newCios[index] = { ...newCios[index], [field]: value };
        setCios(newCios);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post("http://localhost:5000/api/state-cio", {
                stateName: selectedState.name,
                cios: cios
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            addToast(`Updated CIOs for ${selectedState.name}`, 'success');
            setModalOpen(false);
        } catch (err) {
            console.error(err);
            addToast("Failed to save", 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="dashboard-container" style={{ padding: '10px', maxWidth: '100vw', margin: '0', minHeight: '95vh', overflow: 'hidden' }}>
            <div className="dashboard-header" style={{ display: "flex", alignItems: "center", marginBottom: "20px", gap: '15px' }}>
                <button
                    onClick={() => navigate('/contacts')}
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
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                >
                    <span>←</span> Back to Contacts
                </button>
                <h2 style={{ margin: 0, color: '#172b4d' }}>Chief Information Officers Map</h2>
            </div>

            <p style={{ textAlign: 'center', color: '#6b778c', marginBottom: '20px' }}>
                Select a state to view and manage CIO contact details.
            </p>

            <USAMap onStateClick={handleStateClick} />

            {/* MODAL */}
            {modalOpen && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(9, 30, 66, 0.54)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }} onClick={() => setModalOpen(false)}>

                    <div className="modal-content" style={{
                        background: 'white', borderRadius: '8px', padding: '0',
                        width: '800px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto',
                        boxShadow: '0 8px 16px -4px rgba(9, 30, 66, 0.25)'
                    }} onClick={e => e.stopPropagation()}>

                        <div style={{ padding: '20px', borderBottom: '1px solid #ebecf0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, color: '#172b4d' }}>
                                {selectedState?.name} ({selectedState?.id}) - CIO Details
                            </h2>
                            <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#5e6c84' }}>&times;</button>
                        </div>

                        <div style={{ padding: '30px' }}>
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
                            ) : (
                                <form onSubmit={handleSave}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                        {/* CIO 1 */}
                                        <div style={{ background: '#f4f5f7', padding: '20px', borderRadius: '8px' }}>
                                            <h3 style={{ marginTop: 0, color: '#0052cc', borderBottom: '2px solid #dfe1e6', paddingBottom: '10px' }}>Primary CIO / Official</h3>

                                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600', color: '#42526E' }}>Name</label>
                                                <input
                                                    value={cios[0]?.name || ''}
                                                    onChange={e => handleCioChange(0, 'name', e.target.value)}
                                                    style={{ width: '100%', padding: '8px', border: '1px solid #dfe1e6', borderRadius: '4px' }}
                                                    placeholder="Full Name"
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600', color: '#42526E' }}>Title</label>
                                                <input
                                                    value={cios[0]?.title || ''}
                                                    onChange={e => handleCioChange(0, 'title', e.target.value)}
                                                    style={{ width: '100%', padding: '8px', border: '1px solid #dfe1e6', borderRadius: '4px' }}
                                                    placeholder="Role / Title"
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600', color: '#42526E' }}>Email</label>
                                                <input
                                                    value={cios[0]?.email || ''}
                                                    onChange={e => handleCioChange(0, 'email', e.target.value)}
                                                    style={{ width: '100%', padding: '8px', border: '1px solid #dfe1e6', borderRadius: '4px' }}
                                                    placeholder="email@example.com"
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600', color: '#42526E' }}>Phone</label>
                                                <input
                                                    value={cios[0]?.phone || ''}
                                                    onChange={e => handleCioChange(0, 'phone', e.target.value)}
                                                    style={{ width: '100%', padding: '8px', border: '1px solid #dfe1e6', borderRadius: '4px' }}
                                                    placeholder="(555) 123-4567"
                                                />
                                            </div>
                                        </div>

                                        {/* CIO 2 */}
                                        <div style={{ background: '#f4f5f7', padding: '20px', borderRadius: '8px' }}>
                                            <h3 style={{ marginTop: 0, color: '#6554C0', borderBottom: '2px solid #dfe1e6', paddingBottom: '10px' }}>Secondary Contact / Deputy</h3>

                                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600', color: '#42526E' }}>Name</label>
                                                <input
                                                    value={cios[1]?.name || ''}
                                                    onChange={e => handleCioChange(1, 'name', e.target.value)}
                                                    style={{ width: '100%', padding: '8px', border: '1px solid #dfe1e6', borderRadius: '4px' }}
                                                    placeholder="Full Name"
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600', color: '#42526E' }}>Title</label>
                                                <input
                                                    value={cios[1]?.title || ''}
                                                    onChange={e => handleCioChange(1, 'title', e.target.value)}
                                                    style={{ width: '100%', padding: '8px', border: '1px solid #dfe1e6', borderRadius: '4px' }}
                                                    placeholder="Role / Title"
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600', color: '#42526E' }}>Email</label>
                                                <input
                                                    value={cios[1]?.email || ''}
                                                    onChange={e => handleCioChange(1, 'email', e.target.value)}
                                                    style={{ width: '100%', padding: '8px', border: '1px solid #dfe1e6', borderRadius: '4px' }}
                                                    placeholder="email@example.com"
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600', color: '#42526E' }}>Phone</label>
                                                <input
                                                    value={cios[1]?.phone || ''}
                                                    onChange={e => handleCioChange(1, 'phone', e.target.value)}
                                                    style={{ width: '100%', padding: '8px', border: '1px solid #dfe1e6', borderRadius: '4px' }}
                                                    placeholder="(555) 123-4567"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                        <button type="button" onClick={() => setModalOpen(false)} style={{ padding: '10px 20px', border: '1px solid #dfe1e6', background: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                                        <button type="submit" disabled={saving} style={{ padding: '10px 24px', background: '#0052cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StateCIOPage;
