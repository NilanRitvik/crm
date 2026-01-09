import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PartnerModal from '../components/PartnerModal';
import ConfirmationModal from '../components/ConfirmationModal';
import StateFilter from '../components/StateFilter';
import { useToast } from '../context/ToastContext';
import FileUpload from '../components/FileUpload';

export default function PartnersPage() {
    const [partners, setPartners] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [partnerToEdit, setPartnerToEdit] = useState(null);
    const [view, setView] = useState("grid"); // "grid" or "list"
    const [selectedState, setSelectedState] = useState(null);
    const [sectorFilter, setSectorFilter] = useState("All");

    // Confirm & Toast
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmCallback, setConfirmCallback] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState("");
    const { addToast } = useToast();
    const showToast = (msg, type) => addToast(msg, type);

    const fetchPartners = async () => {
        const token = localStorage.getItem("token");
        try {
            const res = await axios.get("http://localhost:5000/api/partners", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPartners(res.data);
        } catch (err) {
            console.error(err);
            showToast("Failed to fetch partners", "error");
        }
    };

    useEffect(() => {
        fetchPartners();
    }, []);

    const handleDelete = (id) => {
        setConfirmMessage("Are you sure you want to delete this partner?");
        setConfirmCallback(() => async () => {
            const token = localStorage.getItem("token");
            try {
                await axios.delete(`http://localhost:5000/api/partners/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPartners(prev => prev.filter(p => p._id !== id));
                showToast("Partner deleted", "success");
            } catch (err) {
                console.error(err);
                showToast("Failed to delete partner", "error");
            }
            setShowConfirm(false);
        });
        setShowConfirm(true);
    };

    const openEdit = (partner) => {
        setPartnerToEdit(partner);
        setIsModalOpen(true);
    };

    const handleFileUpload = async (e, partnerId) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        const token = localStorage.getItem("token");
        try {
            await axios.post(`http://localhost:5000/api/partners/${partnerId}/upload`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${token}`
                }
            });
            fetchPartners(); // Refresh to see new file
            showToast("Capability statement uploaded", "success");
        } catch (err) {
            console.error(err);
            showToast("Upload failed", "error");
        }
    };

    const analyzePartner = async (partnerId) => {
        const token = localStorage.getItem("token");
        try {
            showToast("Analyzing capability statement...", "info");
            await axios.post(`http://localhost:5000/api/partners/${partnerId}/analyze`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPartners(); // Refresh UI
            showToast("Analysis complete! Tags updated.", "success");
        } catch (err) {
            console.error(err);
            showToast("Analysis failed. Ensure a PDF is uploaded.", "error");
        }
    };

    // Filter partners by selected state
    // Filter partners by Sector then State
    const partnersInSector = partners.filter(p =>
        sectorFilter === "All" || p.sector === sectorFilter || (sectorFilter === 'State' && !p.sector)
    );

    const filteredPartners = partnersInSector.filter(partner =>
        selectedState ?
            (selectedState === '__NO_STATE__' ? !partner.state : partner.state === selectedState)
            : true
    );

    return (
        <div className="dashboard-container" style={{ padding: '20px' }}>
            <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                    <h2 style={{ margin: 0, color: '#172b4d' }}>Teaming Partners ({filteredPartners.length})</h2>
                    <p style={{ margin: '5px 0 0', color: '#6b778c' }}>Manage potential teaming partners, subs, and capabilities.</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => { setPartnerToEdit(null); setIsModalOpen(true); }}
                    style={{ padding: '10px 20px', background: '#0052cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    + Add Partner
                </button>
            </div>

            {/* Active Filter Indicator */}
            {selectedState && (
                <div style={{
                    background: '#e6f2ff',
                    border: '1px solid #0052cc',
                    borderRadius: '6px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span style={{ color: '#0052cc', fontWeight: '600' }}>
                        📍 Filtered by: {selectedState === '__NO_STATE__' ? 'No Location' : selectedState}
                        <span style={{ marginLeft: '8px', color: '#42526e', fontWeight: 'normal' }}>
                            ({filteredPartners.length} of {partners.length} partners)
                        </span>
                    </span>
                    <button
                        onClick={() => setSelectedState(null)}
                        style={{
                            background: '#0052cc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        Clear Filter
                    </button>
                </div>
            )}

            {/* Two-column layout for partners grid and state filter */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', alignItems: 'start' }}>
                {/* PARTNER LIST */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {filteredPartners.map(partner => (
                        <div key={partner._id} style={{
                            background: 'white', border: '1px solid #dfe1e6', borderRadius: '8px', padding: '16px',
                            display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#172b4d' }}>{partner.name}</h3>
                                    <span style={{
                                        fontSize: '0.8rem', padding: '2px 6px', borderRadius: '4px',
                                        background: partner.type === 'Prime' ? '#e3f2fd' : '#f4f5f7',
                                        color: partner.type === 'Prime' ? '#0052cc' : '#42526e',
                                        fontWeight: '500', marginTop: '4px', display: 'inline-block'
                                    }}>
                                        {partner.type}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button onClick={() => openEdit(partner)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>✏️</button>
                                    <button onClick={() => handleDelete(partner._id)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>🗑</button>
                                </div>
                            </div>

                            {partner.website && <a href={partner.website} target="_blank" rel="noreferrer" style={{ fontSize: '0.9rem', color: '#0052cc' }}>{partner.website}</a>}

                            <div style={{ fontSize: '0.9rem', color: '#42526e' }}>
                                <strong>Contact:</strong> {partner.contactName} {partner.email && `(${partner.email})`}
                            </div>

                            {partner.capabilities && (
                                <div style={{ background: '#f4f5f7', padding: '8px', borderRadius: '4px', fontSize: '0.85rem', color: '#172b4d', maxHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {partner.capabilities}
                                </div>
                            )}

                            {(partner.skills?.length > 0 || partner.agencies?.length > 0 || partner.naicsCodes?.length > 0) && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                                    {partner.agencies?.map(a => <span key={a} style={{ fontSize: '0.7em', padding: '2px 5px', background: '#E3FCEF', color: '#006644', borderRadius: '3px' }}>{a}</span>)}
                                    {partner.skills?.slice(0, 5).map(s => <span key={s} style={{ fontSize: '0.7em', padding: '2px 5px', background: '#DEEBFF', color: '#0747A6', borderRadius: '3px' }}>{s}</span>)}
                                    {partner.naicsCodes?.slice(0, 3).map(n => <span key={n} style={{ fontSize: '0.7em', padding: '2px 5px', background: '#eae6ff', color: '#403294', borderRadius: '3px' }}>{n}</span>)}
                                </div>
                            )}

                            <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                    <span style={{ color: '#6b778c' }}>Rating: {partner.performanceRating || 50}/100</span>
                                    <span style={{
                                        color: partner.status === 'Active' ? '#006644' : (partner.status === 'Vetted' ? '#0052cc' : '#FF991F'),
                                        fontWeight: 'bold'
                                    }}>
                                        {partner.status}
                                    </span>
                                </div>

                                <div style={{ marginTop: '10px' }}>
                                    <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px', color: '#6b778c' }}>Capability Statements:</label>
                                    {partner.files && partner.files.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {partner.files.map((f, i) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px', background: '#f4f5f7', borderRadius: '4px' }}>
                                                    <a href={`http://localhost:5000${f.url}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#0052cc' }}>📄 {f.name || `Doc ${i + 1}`}</a>
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                const token = localStorage.getItem("token");
                                                                const updatedFiles = partner.files.filter((_, idx) => idx !== i);
                                                                await axios.put(`http://localhost:5000/api/partners/${partner._id}`,
                                                                    { files: updatedFiles },
                                                                    { headers: { Authorization: `Bearer ${token}` } }
                                                                );
                                                                fetchPartners();
                                                                showToast("File removed", "success");
                                                            } catch (err) {
                                                                console.error(err);
                                                                showToast("Failed to remove file", "error");
                                                            }
                                                        }}
                                                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '0.9rem' }}
                                                    >
                                                        🗑
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <span style={{ fontSize: '0.8rem', color: '#dfe1e6' }}>No files</span>}

                                    <div style={{ marginTop: '4px' }}>
                                        <FileUpload id={`file-${partner._id}`} onChange={(e) => handleFileUpload(e, partner._id)} label="⬆ Upload New" />
                                    </div>
                                    {partner.files?.length > 0 && (
                                        <button
                                            onClick={() => analyzePartner(partner._id)}
                                            style={{ marginTop: '5px', width: '100%', fontSize: '0.75rem', padding: '4px 0', background: '#FF991F', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            🤖 Analyze Latest Doc
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}


                    {filteredPartners.length === 0 && partners.length > 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#6b778c', gridColumn: '1 / -1' }}>
                            <h3>No partners found in this location</h3>
                            <p>Try selecting a different location or clear the filter</p>
                        </div>
                    )}

                    {partners.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#6b778c', gridColumn: '1 / -1' }}>
                            <h3>No partners found.</h3>
                            <p>Start by adding a teaming partner or sub.</p>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #dfe1e6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#172b4d' }}>Sector</h3>
                        <select
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #dfe1e6' }}
                            value={sectorFilter}
                            onChange={(e) => { setSectorFilter(e.target.value); setSelectedState(null); }}
                        >
                            <option value="All">All Sectors</option>
                            <option value="State">State</option>
                            <option value="Federal">Federal</option>
                            <option value="Others">Others</option>
                        </select>
                    </div>

                    <StateFilter
                        items={partnersInSector}
                        selectedState={selectedState}
                        onStateSelect={setSelectedState}
                        getStateFromItem={(partner) => partner.state}
                    />
                </div>
            </div>

            <PartnerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onPartnerAdded={() => { fetchPartners(); showToast("Partner saved", "success"); }}
                partnerToEdit={partnerToEdit}
            />

            <ConfirmationModal
                isOpen={showConfirm}
                title="Delete Partner"
                message={confirmMessage}
                onConfirm={confirmCallback}
                onCancel={() => setShowConfirm(false)}
            />

        </div >
    );
}
