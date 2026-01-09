import React, { useState, useEffect } from 'react';
import FileUpload from './FileUpload';
import ConfirmationModal from './ConfirmationModal';

const US_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'District of Columbia', 'Florida',
    'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
    'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
    'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
    'Federal'
];

export default function OrgChartModal({ isOpen, onClose, onSave, onDeleteFile, initialData }) {
    const [formData, setFormData] = useState({ name: '', state: '', sector: 'State' });
    const [newFiles, setNewFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // File Delete Confirmation State
    const [showConfirm, setShowConfirm] = useState(false);
    const [fileToDeleteId, setFileToDeleteId] = useState(null);

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData({
                name: initialData.name || '',
                state: initialData.state || '',
                sector: initialData.sector || 'State'
            });
            setNewFiles([]);
        } else if (isOpen) { // Reset for new entry
            setFormData({ name: '', state: '', sector: 'State' });
            setNewFiles([]);
        }
    }, [isOpen, initialData]);

    const handleFileChange = (e) => {
        if (e.target.files) {
            setNewFiles(prev => [...prev, ...Array.from(e.target.files)]);
        }
    };

    const handleRemoveNewFile = (index) => {
        setNewFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Trigger confirmation modal
    const handleDeleteCheck = (fileId) => {
        setFileToDeleteId(fileId);
        setShowConfirm(true);
    };

    // Actual delete action
    const confirmDeleteFile = async () => {
        if (!fileToDeleteId) return;
        try {
            setIsLoading(true);
            await onDeleteFile(fileToDeleteId);
            setShowConfirm(false);
            setFileToDeleteId(null);
        } catch (error) {
            console.error("Failed to delete file", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Cancel delete
    const cancelDelete = () => {
        setShowConfirm(false);
        setFileToDeleteId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onSave(formData, newFiles);
            // Parent usually handles closing
        } catch (error) {
            console.error("Failed to save", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000
        }} onClick={onClose}>
            {/* Main Modal Content */}
            <div style={{
                backgroundColor: 'white', borderRadius: '8px', padding: '24px', width: '500px', maxWidth: '90%',
                maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }} onClick={e => e.stopPropagation()}>

                <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#172B4D' }}>
                    {initialData ? 'Edit Entry' : 'Add New State / Federal Org'}
                </h2>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#42526E' }}>Organization Name *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #DFE1E6', fontSize: '14px' }}
                            placeholder="e.g. Department of Transportation"
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#42526E' }}>Sector *</label>
                        <select
                            required
                            value={formData.sector}
                            onChange={e => setFormData({ ...formData, sector: e.target.value })}
                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #DFE1E6', fontSize: '14px', backgroundColor: 'white' }}
                        >
                            <option value="State">State</option>
                            <option value="Federal">Federal</option>
                            <option value="Others">Others</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#42526E' }}>State / Location *</label>
                        <select
                            required
                            value={formData.state}
                            onChange={e => setFormData({ ...formData, state: e.target.value })}
                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #DFE1E6', fontSize: '14px', backgroundColor: 'white' }}
                        >
                            <option value="">Select State...</option>
                            {US_STATES.map(state => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#42526E' }}>Attach Files</label>

                        <div style={{ marginBottom: '10px' }}>
                            <FileUpload
                                onChange={handleFileChange}
                                multiple={true}
                                label="Choose Files"
                            />
                        </div>

                        {/* New Files List */}
                        {newFiles.length > 0 && (
                            <div style={{ backgroundColor: '#F4F5F7', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
                                <strong style={{ fontSize: '12px', color: '#5E6C84' }}>New Files:</strong>
                                <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px', fontSize: '13px' }}>
                                    {newFiles.map((file, idx) => (
                                        <li key={idx} style={{ marginBottom: '4px' }}>
                                            {file.name}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveNewFile(idx)}
                                                style={{ marginLeft: '10px', color: '#BF2600', border: 'none', background: 'none', cursor: 'pointer' }}
                                            >
                                                &times;
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Existing Files List */}
                        {initialData && initialData.files && initialData.files.length > 0 && (
                            <div style={{ border: '1px solid #DFE1E6', padding: '10px', borderRadius: '4px' }}>
                                <strong style={{ fontSize: '12px', color: '#5E6C84' }}>Existing Files:</strong>
                                <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px', fontSize: '13px' }}>
                                    {initialData.files.map((file) => (
                                        <li key={file._id} style={{ marginBottom: '4px', display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                                            <a href={`http://localhost:5000${file.url}`} target="_blank" rel="noreferrer" style={{ color: '#0052CC', textDecoration: 'none', flexGrow: 1 }}>
                                                {file.name}
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteCheck(file._id)}
                                                style={{ marginLeft: '10px', color: '#BF2600', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}
                                                title="Delete File"
                                            >
                                                🗑
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button type="button" onClick={onClose} disabled={isLoading} style={{ padding: '10px 16px', borderRadius: '4px', border: 'none', background: '#F4F5F7', color: '#42526E', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
                        <button type="submit" disabled={isLoading} style={{ padding: '10px 16px', borderRadius: '4px', border: 'none', background: '#0052CC', color: 'white', cursor: 'pointer', fontWeight: 500, minWidth: '80px' }}>{isLoading ? 'Saving...' : 'Save'}</button>
                    </div>
                </form>
            </div>

            {/* Nested Confirmation Modal */}
            <ConfirmationModal
                isOpen={showConfirm}
                onCancel={cancelDelete}
                onConfirm={confirmDeleteFile}
                title="Delete File?"
                message="Are you sure you want to remove this attached file? This cannot be undone."
            />
        </div>
    );
}
