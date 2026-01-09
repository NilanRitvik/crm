import React, { useState, useEffect } from 'react';
import axios from 'axios';
import OrgChartModal from '../components/OrgChartModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../context/ToastContext';

const US_STATES = [
    'All States', 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'District of Columbia', 'Florida',
    'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
    'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
    'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
    'Federal'
];

export default function OrgChartPage() {
    const [entries, setEntries] = useState([]);
    const [filteredEntries, setFilteredEntries] = useState([]);
    const [selectedState, setSelectedState] = useState('All States');
    const [selectedSector, setSelectedSector] = useState('All Sectors');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);

    // Delete Confirmation
    const [showConfirm, setShowConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const { addToast } = useToast();

    const fetchEntries = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/state-org', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEntries(res.data);
            // Initial filter application handled by useEffect
        } catch (err) {
            console.error("Failed to fetch entries", err);
            addToast("Failed to load data", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, []);

    useEffect(() => {
        let res = entries;
        if (selectedSector !== 'All Sectors') {
            res = res.filter(e => e.sector === selectedSector || (!e.sector && selectedSector === 'State'));
        }
        if (selectedState !== 'All States') {
            res = res.filter(e => e.state === selectedState);
        }
        setFilteredEntries(res);
    }, [selectedSector, selectedState, entries]);

    const handleOpenAdd = () => {
        setEditingEntry(null);
        setShowModal(true);
    };

    const handleEdit = (entry) => {
        setEditingEntry(entry);
        setShowModal(true);
    };

    const handleDeleteClick = (id) => {
        setItemToDelete(id);
        setShowConfirm(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/state-org/${itemToDelete}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            addToast("Entry deleted successfully", "success");
            fetchEntries();
        } catch (err) {
            console.error(err);
            addToast("Failed to delete entry", "error");
        } finally {
            setShowConfirm(false);
            setItemToDelete(null);
        }
    };

    const handleSave = async (formData, newFiles) => {
        const token = localStorage.getItem('token');
        if (!token) {
            addToast("You must be logged in to save.", "error");
            return;
        }

        try {
            // EDIT EXISTING ENTRY
            if (editingEntry) {
                // 1. Update Text Data
                const res = await axios.put(
                    `http://localhost:5000/api/state-org/${editingEntry._id}`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
                );

                // 2. Upload New Files (if any)
                const savedId = res.data._id;
                if (newFiles && newFiles.length > 0) {
                    const uploadFormData = new FormData();
                    newFiles.forEach(file => {
                        uploadFormData.append('files', file);
                    });

                    await axios.post(
                        `http://localhost:5000/api/state-org/${savedId}/files`,
                        uploadFormData,
                        { headers: { Authorization: `Bearer ${token}` } } // Let Axios set multipart
                    );
                }
                addToast("Entry updated successfully", "success");

            } else {
                // CREATE NEW ENTRY
                const createFormData = new FormData();
                createFormData.append('name', formData.name);
                createFormData.append('state', formData.state);
                createFormData.append('sector', formData.sector);

                if (newFiles && newFiles.length > 0) {
                    newFiles.forEach(file => {
                        createFormData.append('files', file);
                    });
                }

                await axios.post(
                    'http://localhost:5000/api/state-org',
                    createFormData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                addToast("Entry created successfully", "success");
            }

            setShowModal(false);
            fetchEntries();

        } catch (err) {
            console.error("Save failed", err);
            const msg = err.response?.data?.message || "Failed to save entry";
            addToast(msg, "error");
        }
    };

    const handleDeleteFile = async (fileId) => {
        if (!editingEntry) return;
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://localhost:5000/api/state-org/${editingEntry._id}/files/${fileId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            addToast("File deleted", "success");
            // Update local editingEntry to remove file from view
            setEditingEntry(prev => ({
                ...prev,
                files: prev.files.filter(f => f._id !== fileId)
            }));
            fetchEntries(); // Refresh list background
        } catch (err) {
            console.error(err);
            addToast("Failed to delete file", "error");
            throw err;
        }
    };

    return (
        <div className="dashboard-container" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
                <h1 style={{ fontSize: '1.8rem', color: '#172B4D', margin: 0 }}>State / Federal - Techxl Intelligence System</h1>
                <button
                    onClick={handleOpenAdd}
                    style={{
                        backgroundColor: '#0052cc', color: 'white', padding: '10px 20px',
                        borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    + Add Entry
                </button>
            </div>

            <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden', gap: '20px' }}>
                {/* Sidebar Filter */}
                <div style={{
                    width: '250px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    flexShrink: 0
                }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #DFE1E6' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#42526E', fontSize: '0.9rem' }}>Sector</label>
                        <select
                            value={selectedSector}
                            onChange={(e) => setSelectedSector(e.target.value)}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #dfe1e6' }}
                        >
                            <option value="All Sectors">All Sectors</option>
                            <option value="State">State</option>
                            <option value="Federal">Federal</option>
                            <option value="Others">Others</option>
                        </select>
                    </div>
                    <div style={{ padding: '16px', borderBottom: '1px solid #DFE1E6', fontWeight: 600, color: '#42526E' }}>
                        Filter by State
                    </div>
                    <div style={{ overflowY: 'auto', flexGrow: 1 }}>
                        {US_STATES.map(state => (
                            <div
                                key={state}
                                onClick={() => setSelectedState(state)}
                                style={{
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    backgroundColor: selectedState === state ? '#E6EFFC' : 'transparent',
                                    color: selectedState === state ? '#0052CC' : '#42526E',
                                    fontWeight: selectedState === state ? 600 : 400,
                                    borderLeft: selectedState === state ? '4px solid #0052CC' : '4px solid transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {state}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div style={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    paddingRight: '10px' // for scrollbar space
                }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#6B778C' }}>Loading...</div>
                    ) : filteredEntries.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#6B778C', backgroundColor: 'white', borderRadius: '8px' }}>
                            No entries found for {selectedState}
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                            {filteredEntries.map(entry => (
                                <div key={entry._id} style={{
                                    backgroundColor: 'white',
                                    borderRadius: '8px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    padding: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.2s',
                                    border: '1px solid #EBECF0'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#172B4D' }}>{entry.name}</h3>
                                        <span style={{
                                            fontSize: '0.8rem', backgroundColor: '#DFE1E6', padding: '2px 8px',
                                            borderRadius: '10px', color: '#42526E', whiteSpace: 'nowrap'
                                        }}>
                                            {entry.state}
                                        </span>
                                    </div>

                                    <div style={{ flexGrow: 1, marginBottom: '16px' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#5E6C84', marginBottom: '8px' }}>
                                            Attached Files ({entry.files.length})
                                        </div>
                                        {entry.files.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {entry.files.slice(0, 3).map((f, i) => (
                                                    <a key={i} href={`http://localhost:5000${f.url}`} target="_blank" rel="noreferrer"
                                                        style={{ fontSize: '0.9rem', color: '#0052CC', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        📄 {f.name}
                                                    </a>
                                                ))}
                                                {entry.files.length > 3 && (
                                                    <span style={{ fontSize: '0.8rem', color: '#6B778C', fontStyle: 'italic' }}>
                                                        + {entry.files.length - 3} more (view details)
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '0.9rem', color: '#7A869A', fontStyle: 'italic' }}>No files attached</div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: 'auto', borderTop: '1px solid #EBECF0', paddingTop: '12px' }}>
                                        <button
                                            onClick={() => handleEdit(entry)}
                                            style={{ background: 'none', border: 'none', color: '#0052CC', cursor: 'pointer', fontWeight: 500 }}
                                        >
                                            View / Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(entry._id)}
                                            style={{ background: 'none', border: 'none', color: '#DE350B', cursor: 'pointer', fontWeight: 500 }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <OrgChartModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSave}
                onDeleteFile={handleDeleteFile}
                initialData={editingEntry}
            />

            <ConfirmationModal
                isOpen={showConfirm}
                onCancel={() => setShowConfirm(false)}
                onConfirm={confirmDelete}
                title="Delete Entry"
                message="Are you sure you want to delete this entry? All attached files will be unlinked."
            />
        </div>
    );
}
