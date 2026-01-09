import React, { useState, useEffect } from "react";
import axios from "axios";
import "./PartnerModal.css";
import { useToast } from '../context/ToastContext';
import FileUpload from './FileUpload';

export default function PartnerModal({ isOpen, onClose, onPartnerAdded, partnerToEdit = null }) {
    const { addToast } = useToast();
    const [formData, setFormData] = useState({
        name: "",
        type: "Sub",
        contactName: "",
        email: "",
        phone: "",
        website: "",
        state: "",
        sector: "State",
        capabilities: "",
        status: "Prospective"
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (partnerToEdit) {
            setFormData({
                name: partnerToEdit.name || "",
                type: partnerToEdit.type || "Sub",
                contactName: partnerToEdit.contactName || "",
                email: partnerToEdit.email || "",
                phone: partnerToEdit.phone || "",
                website: partnerToEdit.website || "",
                state: partnerToEdit.state || "",
                sector: partnerToEdit.sector || "State",
                capabilities: partnerToEdit.capabilities || "",
                status: partnerToEdit.status || "Prospective"
            });
        } else {
            setFormData({
                name: "",
                type: "Sub",
                contactName: "",
                email: "",
                phone: "",
                website: "",
                state: "",
                sector: "State",
                capabilities: "",
                status: "Prospective"
            });
        }
        setSelectedFile(null);
    }, [partnerToEdit, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name) return addToast("Partner Name is required", "warning");

        const token = localStorage.getItem("token");
        setIsLoading(true);

        try {
            let partnerId;

            // 1. Save Partner Data
            if (partnerToEdit) {
                const res = await axios.put(
                    `http://localhost:5000/api/partners/${partnerToEdit._id}`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
                );
                partnerId = res.data._id;
                addToast("Partner updated successfully", "success");
            } else {
                const res = await axios.post(
                    "http://localhost:5000/api/partners",
                    formData,
                    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
                );
                partnerId = res.data._id;
                addToast("Partner created successfully", "success");
            }

            // 2. Upload File (if provided)
            if (selectedFile && partnerId) {
                const uploadData = new FormData();
                uploadData.append('file', selectedFile);

                await axios.post(
                    `http://localhost:5000/api/partners/${partnerId}/upload`,
                    uploadData,
                    { headers: { Authorization: `Bearer ${token}` } } // Axios sets content-type
                );
                addToast("Capability Statement uploaded", "success");
            }

            onPartnerAdded();
            onClose();
        } catch (err) {
            console.error('❌ Error saving partner:', err);
            addToast("Failed to save partner", "error");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">{partnerToEdit ? "Edit Partner" : "Add New Partner"}</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Partner Name *</label>
                        <input name="name" className="form-control" value={formData.name} onChange={handleChange} />
                    </div>

                    <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Type</label>
                            <select name="type" className="form-control" value={formData.type} onChange={handleChange}>
                                <option value="Sub">Subcontractor</option>
                                <option value="Prime">Prime</option>
                                <option value="JV">Joint Venture</option>
                                <option value="Technology">Technology Partner</option>
                                <option value="Reseller">Reseller</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Status</label>
                            <select name="status" className="form-control" value={formData.status} onChange={handleChange}>
                                <option value="Prospective">Prospective</option>
                                <option value="Active">Active</option>
                                <option value="Vetted">Vetted</option>
                                <option value="Blacklisted">Blacklisted</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Website</label>
                        <input name="website" className="form-control" value={formData.website} onChange={handleChange} placeholder="https://example.com" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Sector *</label>
                        <select name="sector" className="form-control" value={formData.sector} onChange={handleChange}>
                            <option value="State">State</option>
                            <option value="Federal">Federal</option>
                            <option value="Others">Others</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">State / Location</label>
                        <input name="state" className="form-control" value={formData.state} onChange={handleChange} placeholder="e.g. NY, CA" />
                    </div>

                    <h4 style={{ marginTop: '15px', marginBottom: '10px', fontSize: '0.9rem', color: '#666' }}>Point of Contact</h4>
                    <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Name</label>
                            <input name="contactName" className="form-control" value={formData.contactName} onChange={handleChange} />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Email</label>
                            <input name="email" className="form-control" value={formData.email} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input name="phone" className="form-control" value={formData.phone} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Capabilities / Attributes</label>
                        <textarea name="capabilities" className="form-control" rows="3" value={formData.capabilities} onChange={handleChange} placeholder="List key capabilities, NAICS codes, or past performance highlights..." />
                    </div>

                    <div className="form-group" style={{ marginTop: '15px' }}>
                        <label className="form-label">Upload Capability Statement (Optional)</label>
                        <FileUpload
                            onChange={handleFileChange}
                            label="Upload New"
                            accept=".pdf,.doc,.docx"
                        />
                    </div>

                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose} disabled={isLoading}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Partner'}
                    </button>
                </div>
            </div>
        </div>
    );
}
