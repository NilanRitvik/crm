import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProposalModal.css';
import FileUpload from './FileUpload';

export default function ProposalModal({ isOpen, onClose, onSave, leads, initialData = null, onDeleteDocument }) {


    const [formData, setFormData] = useState({
        lead: '',
        status: 'Draft',
        submittedValue: '',
        submittedDate: new Date().toISOString().split('T')[0],
        role: 'Prime',
        agency: '',
        state: '',
        sector: 'State',
        solicitationNumber: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    lead: initialData.lead?._id || initialData.lead || '',
                    status: initialData.status || 'Draft',
                    submittedValue: initialData.submittedValue || '',
                    submittedDate: initialData.submittedDate ? initialData.submittedDate.split('T')[0] : new Date().toISOString().split('T')[0],
                    role: initialData.role || 'Prime',
                    agency: initialData.agency || '',
                    state: initialData.state || '',
                    sector: initialData.sector || 'State',
                    solicitationNumber: initialData.solicitationNumber || ''
                });
            } else {
                setFormData({
                    lead: '',
                    status: 'Draft',
                    submittedValue: '',
                    submittedDate: new Date().toISOString().split('T')[0],
                    role: 'Prime',
                    agency: '',
                    state: '',
                    sector: 'State',
                    solicitationNumber: ''
                });
            }
        }
    }, [isOpen, initialData]);

    const handleLeadChange = (e) => {
        const leadId = e.target.value;
        const selectedLead = leads.find(l => l._id === leadId);

        setFormData(prev => ({
            ...prev,
            lead: leadId,
            submittedValue: selectedLead ? selectedLead.value : '',
            agency: selectedLead ? selectedLead.agency : '',
            state: selectedLead ? selectedLead.state : '',
            sector: selectedLead?.sector || 'State'
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content proposal-modal">
                <div className="modal-header">
                    <h2>{initialData ? 'Edit Proposal' : 'Create New Proposal'}</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="proposal-form">
                    <div className="form-group full-width">
                        <label>Select Opportunity (Lead) *</label>
                        <select
                            required
                            value={formData.lead}
                            onChange={handleLeadChange}
                        >
                            <option value="">-- Select Linked Opportunity --</option>
                            {leads.map(lead => (
                                <option key={lead._id} value={lead._id}>
                                    {lead.name} ({lead.agency || 'No Agency'}) - ${lead.value?.toLocaleString()}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Sector / Type</label>
                            <select
                                value={formData.sector}
                                onChange={e => setFormData({ ...formData, sector: e.target.value })}
                            >
                                <option value="State">State</option>
                                <option value="Federal">Federal</option>
                                <option value="Others">Others</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Solicitation Number</label>
                            <input
                                type="text"
                                value={formData.solicitationNumber}
                                onChange={e => setFormData({ ...formData, solicitationNumber: e.target.value })}
                                placeholder="e.g. 12345-SOL"
                            />
                        </div>
                        <div className="form-group">
                            <label>Agency</label>
                            <input
                                type="text"
                                value={formData.agency}
                                onChange={e => setFormData({ ...formData, agency: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>State / Location</label>
                            <input
                                type="text"
                                value={formData.state}
                                onChange={e => setFormData({ ...formData, state: e.target.value })}
                                placeholder="e.g. NY, CA"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Submitted Value ($)</label>
                            <input
                                type="number"
                                value={formData.submittedValue}
                                onChange={e => setFormData({ ...formData, submittedValue: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Submission Date</label>
                            <input
                                type="date"
                                value={formData.submittedDate}
                                onChange={e => setFormData({ ...formData, submittedDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Our Role</label>
                            <select
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="Prime">Prime Contractor</option>
                                <option value="Subcontractor">Subcontractor</option>
                                <option value="JV">Joint Venture</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Initial Status</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="Draft">Draft</option>
                                <option value="Submitted">Submitted</option>
                                <option value="Under Evaluation">Under Evaluation</option>
                                <option value="Awarded">Awarded (Won)</option>
                                <option value="Lost">Lost</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>

                    {initialData && initialData.documents && initialData.documents.length > 0 && (
                        <div className="form-group full-width" style={{ marginTop: '15px', background: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
                            <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Attached Documents:</label>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {initialData.documents.map((doc, idx) => (
                                    <li key={idx} style={{ padding: '8px 0', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>📄</span>
                                        <a href={`http://localhost:5000${doc.url}`} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'none', flexGrow: 1 }}>
                                            {doc.name}
                                        </a>
                                        <span style={{ fontSize: '0.8em', color: '#888' }}>
                                            - {doc.type || 'Attachment'}
                                        </span>
                                        {onDeleteDocument && (
                                            <button
                                                type="button"
                                                onClick={() => onDeleteDocument(initialData._id, doc._id)}
                                                style={{ marginLeft: '10px', color: '#dc3545', border: 'none', background: 'none', cursor: 'pointer' }}
                                                title="Delete Document"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="form-group full-width">
                        <label>Upload Proposal Document (Optional)</label>
                        <FileUpload
                            onChange={e => setFormData({ ...formData, file: e.target.files[0] })}
                            label="Choose File"
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary">{initialData ? 'Update Proposal' : 'Create Proposal'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
