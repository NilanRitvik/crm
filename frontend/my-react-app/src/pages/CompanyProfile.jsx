import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import FileUpload from '../components/FileUpload';
import './CompanyProfile.css';

export default function CompanyProfile() {
    const { addToast } = useToast();
    const [profiles, setProfiles] = useState([]);
    const [selectedProfile, setSelectedProfile] = useState(null); // The full object being edited
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'

    // Editor State (for the detail view)
    const [activeTab, setActiveTab] = useState('view'); // Default to view summary
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get('http://localhost:5000/api/company-profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Ensure response is always an array
            const data = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);
            setProfiles(data);
        } catch (err) {
            console.error('Error fetching profiles:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setSelectedProfile({
            legalName: '',
            samStatus: 'Not Registered',
            capabilities: '',
            naicsCodes: []
            // Add other defaults as needed
        });
        setActiveTab('legal');
        setViewMode('detail');
    };

    const handleEditProfile = (profile) => {
        setSelectedProfile(profile);
        setActiveTab('view');
        setViewMode('detail');
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedProfile(null);
        fetchProfiles(); // Refresh list on return
    };

    const handleSave = async () => {
        setSaving(true);
        const token = localStorage.getItem('token');
        try {
            let res;
            if (selectedProfile._id) {
                // Update existing
                res = await axios.put(`http://localhost:5000/api/company-profile/${selectedProfile._id}`, selectedProfile, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                // Create new
                res = await axios.post('http://localhost:5000/api/company-profile', selectedProfile, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            addToast('Company profile saved successfully!', 'success');
            setSelectedProfile(res.data); // Update with server response (has _id etc)
        } catch (err) {
            console.error('Error saving profile:', err);
            const msg = err.response?.data?.error || err.response?.data?.message || 'Unknown error';
            addToast(`Failed to save profile: ${msg}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleCertUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!selectedProfile._id) {
            addToast("Please save the profile definition once before adding attachments.", 'info');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        const token = localStorage.getItem('token');

        try {
            const res = await axios.post(
                `http://localhost:5000/api/company-profile/${selectedProfile._id}/certifications`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSelectedProfile(prev => ({ ...prev, certificationAttachments: res.data }));
            addToast("Certification uploaded successfully.", 'success');
        } catch (err) {
            console.error(err);
            addToast("Failed to upload certification.", 'error');
        }
    };

    const handleCertDelete = async (fileId) => {
        if (!window.confirm("Are you sure you want to permanently delete this file?")) return;
        if (!selectedProfile._id) return;

        const token = localStorage.getItem('token');
        try {
            const res = await axios.delete(
                `http://localhost:5000/api/company-profile/${selectedProfile._id}/certifications/${fileId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSelectedProfile(prev => ({ ...prev, certificationAttachments: res.data }));
        } catch (err) {
            console.error(err);
            addToast("Failed to delete file.", 'error');
        }
    };

    const handleFileUpload = async (e, category) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/company-profile/upload', formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });

            // Add attachment to the relevant list in the profile
            const newAttachment = {
                name: res.data.name,
                url: res.data.url,
                type: 'Document',
                uploadedAt: new Date()
            };

            const fieldMap = {
                'legal': 'legalAttachments',
                'registration': 'registrationAttachments',
                'certifications': 'certificationAttachments',
                'capabilities': 'capabilityAttachments',
                'financial': 'financialAttachments',
                'compliance': 'complianceAttachments'
            };

            const targetField = fieldMap[category] || 'legalAttachments';

            setSelectedProfile(prev => ({
                ...prev,
                [targetField]: [...(prev[targetField] || []), newAttachment]
            }));

            addToast("File uploaded. Don't forget to Save Changes!", 'success');
        } catch (err) {
            console.error('File upload error:', err);
            addToast("Failed to upload file", 'error');
        }
    };

    const updateField = (field, value) => {
        setSelectedProfile(prev => ({ ...prev, [field]: value }));
    };

    const updateNestedField = (parent, field, value) => {
        setSelectedProfile(prev => ({
            ...prev,
            [parent]: { ...prev[parent], [field]: value }
        }));
    };

    if (loading) return <div className="profile-container">Loading...</div>;

    const tabs = [
        { id: 'legal', label: 'Legal & Business' },
        { id: 'registration', label: 'Registration' },
        { id: 'certifications', label: 'Certifications' },
        { id: 'capabilities', label: 'Capabilities' },
        { id: 'performance', label: 'Past Performance' },
        { id: 'financial', label: 'Financial' },
        { id: 'compliance', label: 'Compliance' },
        { id: 'contacts', label: 'Key Contacts' },
        { id: 'teaming', label: 'Teaming' },
        { id: 'view', label: 'View Profile' }
    ];

    // --- LIST VIEW ---
    if (viewMode === 'list') {
        return (
            <div className="profile-container">
                <div className="profile-header">
                    <h1>Company Directory</h1>
                    <p>Manage multiple company profiles</p>
                    <button className="btn-save-profile" onClick={handleCreateNew}>+ New Company</button>
                </div>

                <div className="profiles-grid">
                    {profiles.map(p => (
                        <div key={p._id} className="company-card" onClick={() => handleEditProfile(p)}>
                            <h3>{p.legalName || 'Untitled Company'}</h3>
                            <div className="card-detail"><strong>UEI:</strong> {p.uei || '-'}</div>
                            <div className="card-detail"><strong>CAGE:</strong> {p.cageCode || '-'}</div>
                            <div className="card-detail"><strong>Status:</strong>
                                <span className={`status-badge ${p.samStatus === 'Active' ? 'success' : 'warning'}`}>
                                    {p.samStatus || 'Unknown'}
                                </span>
                            </div>
                            <div className="card-footer">
                                <span>Updated: {new Date(p.updatedAt).toLocaleDateString()}</span>
                                <span className="arrow">➔</span>
                            </div>
                        </div>
                    ))}
                    {profiles.length === 0 && (
                        <div className="empty-state">
                            <p>No company profiles found.</p>
                            <button onClick={handleCreateNew}>Create First Company</button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- DETAIL VIEW ---
    const profile = selectedProfile || {}; // Alias for compatibility

    return (
        <div className="profile-container">
            <div className="profile-header">
                <div>
                    <button onClick={handleBackToList} className="back-link">← Back to Directory</button>
                    <h1>{profile.legalName || 'New Company'}</h1>
                    <p>Federal & State Contract Readiness</p>
                </div>
                <div className="header-actions">
                    <button onClick={handleSave} disabled={saving} className="btn-save-profile">
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </button>
                    {profile?.updatedAt && (
                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px', textAlign: 'right' }}>
                            Last Saved: {new Date(profile.updatedAt).toLocaleString()}
                        </div>
                    )}
                </div>
            </div>

            <div className="profile-split-layout">
                <div className="profile-sidebar-wrapper">
                    <div className="profile-tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                </div>

                <div className="profile-main-content">
                    <div className="profile-content">
                        {/* --- VIEW ONLY MODE --- */}
                        {activeTab === 'view' && profile && (
                            <div className="tab-panel view-mode">
                                <h2>Company Profile Summary</h2>
                                <div className="summary-section">
                                    <h3>Legal & Business</h3>
                                    <div className="detail-row">
                                        <strong>Legal Name:</strong> <span>{profile.legalName || '-'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <strong>Tax ID (EIN):</strong> <span>{profile.taxId || '-'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <strong>UEI:</strong> <span>{profile.uei || '-'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <strong>CAGE Code:</strong> <span>{profile.cageCode || '-'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <strong>Website:</strong> <span>{profile.websiteUrl || '-'}</span>
                                    </div>
                                </div>

                                <div className="summary-section">
                                    <h3>Registration Status</h3>
                                    <div className="detail-row">
                                        <strong>SAM Status:</strong>
                                        <span className={`status-badge ${profile.samStatus === 'Active' ? 'success' : 'warning'}`}>
                                            {profile.samStatus}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <strong>Expiration:</strong> <span>{profile.samExpirationDate ? new Date(profile.samExpirationDate).toLocaleDateString() : '-'}</span>
                                    </div>
                                </div>

                                <div className="summary-section">
                                    <h3>Capabilities</h3>
                                    <div className="detail-chunk">
                                        <strong>Core Capabilities:</strong>
                                        <p>{profile.coreCapabilities || 'No capabilities listed.'}</p>
                                    </div>
                                </div>

                                <div className="summary-section">
                                    <h3>NAICS Codes</h3>
                                    <div className="tags-list">
                                        {profile.naicsCodes && profile.naicsCodes.length > 0 ? (
                                            profile.naicsCodes.map((n, i) => (
                                                <span key={i} className="tag-badge">{n.code}</span>
                                            ))
                                        ) : <span>No codes added</span>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* LEGAL & BUSINESS */}
                        {activeTab === 'legal' && (
                            <div className="tab-panel">
                                <h2>Legal & Business Information</h2>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Legal Company Name *</label>
                                        <input
                                            type="text"
                                            value={profile?.legalName || ''}
                                            onChange={(e) => updateField('legalName', e.target.value)}
                                            placeholder="As registered with IRS & SAM"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Doing Business As (DBA)</label>
                                        <input
                                            type="text"
                                            value={profile?.dba || ''}
                                            onChange={(e) => updateField('dba', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>UEI (Unique Entity ID)</label>
                                        <input
                                            type="text"
                                            value={profile?.uei || ''}
                                            onChange={(e) => updateField('uei', e.target.value)}
                                            placeholder="Replaces DUNS"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>CAGE Code</label>
                                        <input
                                            type="text"
                                            value={profile?.cageCode || ''}
                                            onChange={(e) => updateField('cageCode', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Business Type</label>
                                        <select
                                            value={profile?.businessType || ''}
                                            onChange={(e) => updateField('businessType', e.target.value)}
                                        >
                                            <option value="">Select Type</option>
                                            <option value="LLC">LLC</option>
                                            <option value="Corporation">Corporation</option>
                                            <option value="S-Corp">S-Corp</option>
                                            <option value="Partnership">Partnership</option>
                                            <option value="Sole Proprietorship">Sole Proprietorship</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Year Established</label>
                                        <input
                                            type="number"
                                            value={profile?.yearEstablished || ''}
                                            onChange={(e) => updateField('yearEstablished', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Website URL</label>
                                        <input
                                            type="url"
                                            value={profile?.websiteUrl || ''}
                                            onChange={(e) => updateField('websiteUrl', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <h3>Primary Address</h3>
                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label>Street Address</label>
                                        <input
                                            type="text"
                                            value={profile?.primaryAddress?.street || ''}
                                            onChange={(e) => updateNestedField('primaryAddress', 'street', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>City</label>
                                        <input
                                            type="text"
                                            value={profile?.primaryAddress?.city || ''}
                                            onChange={(e) => updateNestedField('primaryAddress', 'city', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>State</label>
                                        <input
                                            type="text"
                                            value={profile?.primaryAddress?.state || ''}
                                            onChange={(e) => updateNestedField('primaryAddress', 'state', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>ZIP Code</label>
                                        <input
                                            type="text"
                                            value={profile?.primaryAddress?.zip || ''}
                                            onChange={(e) => updateNestedField('primaryAddress', 'zip', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="attachments-section" style={{ marginTop: '25px', borderTop: '1px solid #e0e0e0', paddingTop: '20px' }}>
                                    <h3 style={{ fontSize: '1.1rem', color: '#2d3748', marginBottom: '15px' }}>Legal Documents</h3>

                                    <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px dashed #cbd5e0' }}>
                                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600, fontSize: '0.9rem', color: '#4a5568' }}>Upload Document (Articles of Incorporation, Tax Docs)</label>
                                        <div style={{ marginTop: '5px' }}><FileUpload onChange={(e) => handleFileUpload(e, 'legal')} label="Select Legal Document" /></div>
                                    </div>

                                    {profile?.legalAttachments && profile.legalAttachments.length > 0 ? (
                                        <ul className="attachments-list" style={{ listStyle: 'none', padding: 0 }}>
                                            {profile.legalAttachments.map((file, i) => (
                                                <li key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'white', marginBottom: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span style={{ fontSize: '1.2rem' }}>📄</span>
                                                        <a href={`http://localhost:5000${file.url}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3182ce', textDecoration: 'none', fontWeight: 500 }}>
                                                            {file.name}
                                                        </a>
                                                    </div>
                                                    <span style={{ fontSize: '0.8rem', color: '#718096' }}>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p style={{ color: '#a0aec0', fontStyle: 'italic', fontSize: '0.9rem' }}>No documents attached.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* REGISTRATION */}
                        {activeTab === 'registration' && (
                            <div className="tab-panel">
                                <h2>Federal & State Registration</h2>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>SAM Registration Status</label>
                                        <select
                                            value={profile?.samStatus || 'Not Registered'}
                                            onChange={(e) => updateField('samStatus', e.target.value)}
                                        >
                                            <option value="Not Registered">Not Registered</option>
                                            <option value="Active">Active</option>
                                            <option value="Expired">Expired</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>SAM Expiration Date</label>
                                        <input
                                            type="date"
                                            value={profile?.samExpirationDate ? profile.samExpirationDate.split('T')[0] : ''}
                                            onChange={(e) => updateField('samExpirationDate', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>GSA Schedule</label>
                                        <input
                                            type="text"
                                            value={profile?.gsaSchedule || ''}
                                            onChange={(e) => updateField('gsaSchedule', e.target.value)}
                                            placeholder="e.g., MAS, OASIS+"
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                        }

                        {/* CERTIFICATIONS */}
                        {
                            activeTab === 'certifications' && (
                                <div className="tab-panel">
                                    <h2>Business Size & Certifications</h2>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Business Size</label>
                                            <select
                                                value={profile?.businessSize || ''}
                                                onChange={(e) => updateField('businessSize', e.target.value)}
                                            >
                                                <option value="">Select Size</option>
                                                <option value="Small">Small Business</option>
                                                <option value="Large">Large Business</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Minority-Owned</label>
                                            <input
                                                type="checkbox"
                                                checked={profile?.minorityOwned || false}
                                                onChange={(e) => updateField('minorityOwned', e.target.checked)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Woman-Owned</label>
                                            <input
                                                type="checkbox"
                                                checked={profile?.womanOwned || false}
                                                onChange={(e) => updateField('womanOwned', e.target.checked)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Veteran-Owned</label>
                                            <input
                                                type="checkbox"
                                                checked={profile?.veteranOwned || false}
                                                onChange={(e) => updateField('veteranOwned', e.target.checked)}
                                            />
                                        </div>

                                        <div className="form-group full-width" style={{ marginTop: '25px', borderTop: '1px solid #ebecf0', paddingTop: '25px', gridColumn: '1 / -1' }}>
                                            <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', color: '#172b4d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span>📜</span> Certification Documents
                                            </h3>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                                                {profile?.certificationAttachments?.length > 0 ? (
                                                    profile.certificationAttachments.map((cert, idx) => (
                                                        <div key={cert._id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #dfe1e6', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                <span style={{ fontSize: '1.5rem', background: '#e6fcff', padding: '8px', borderRadius: '8px' }}>📄</span>
                                                                <div>
                                                                    <a href={`http://localhost:5000${cert.url}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0052cc', fontWeight: '600', textDecoration: 'none', display: 'block', marginBottom: '2px' }}>
                                                                        {cert.name}
                                                                    </a>
                                                                    <div style={{ fontSize: '0.8rem', color: '#6b778c' }}>Uploaded: {new Date(cert.uploadedAt).toLocaleDateString()}</div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleCertDelete(cert._id)}
                                                                style={{ background: '#ffebe6', border: 'none', color: '#de350b', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500', transition: 'background 0.2s' }}
                                                                title="Delete File"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div style={{ padding: '30px', textAlign: 'center', background: '#f4f5f7', borderRadius: '8px', color: '#505f79', border: '2px dashed #dfe1e6' }}>
                                                        <p style={{ margin: 0, fontWeight: 500 }}>No certification documents uploaded yet.</p>
                                                        <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem' }}>Upload certificates like ISO, CMMI, etc.</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <FileUpload onChange={handleCertUpload} label="Upload New Certification" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        }

                        {/* CAPABILITIES */}
                        {
                            activeTab === 'capabilities' && (
                                <div className="tab-panel">
                                    <h2>Capability & Technical Profile</h2>
                                    <div className="form-group full-width">
                                        <label>Core Capabilities</label>
                                        <textarea
                                            rows="6"
                                            value={profile?.coreCapabilities || ''}
                                            onChange={(e) => updateField('coreCapabilities', e.target.value)}
                                            placeholder="Describe your company's core capabilities and strengths..."
                                        />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Security Capabilities</label>
                                        <textarea
                                            rows="4"
                                            value={profile?.securityCapabilities || ''}
                                            onChange={(e) => updateField('securityCapabilities', e.target.value)}
                                            placeholder="Describe security controls, compliance frameworks, etc..."
                                        />
                                    </div>
                                </div>
                            )
                        }

                        {/* PERFORMANCE */}
                        {
                            activeTab === 'performance' && (
                                <div className="tab-panel">
                                    <h2>Past Performance</h2>
                                    <p style={{ color: '#666', marginBottom: '20px' }}>
                                        Track your contract history and performance ratings
                                    </p>
                                    <div className="info-box">
                                        <p>Past Performance tracking coming soon - Add contracts, CPARS ratings, and references</p>
                                    </div>
                                </div>
                            )
                        }

                        {/* FINANCIAL */}
                        {
                            activeTab === 'financial' && (
                                <div className="tab-panel">
                                    <h2>Financial & Banking</h2>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Banking Institution</label>
                                            <input
                                                type="text"
                                                value={profile?.bankingInstitution || ''}
                                                onChange={(e) => updateField('bankingInstitution', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Accounting System</label>
                                            <input
                                                type="text"
                                                value={profile?.accountingSystem || ''}
                                                onChange={(e) => updateField('accountingSystem', e.target.value)}
                                                placeholder="e.g., QuickBooks, Deltek"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>DCAA Compliant</label>
                                            <input
                                                type="checkbox"
                                                checked={profile?.dcaaCompliant || false}
                                                onChange={(e) => updateField('dcaaCompliant', e.target.checked)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        }

                        {/* COMPLIANCE */}
                        {
                            activeTab === 'compliance' && (
                                <div className="tab-panel">
                                    <h2>Compliance & Security</h2>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>HIPAA Compliant</label>
                                            <input
                                                type="checkbox"
                                                checked={profile?.hipaaCompliant || false}
                                                onChange={(e) => updateField('hipaaCompliant', e.target.checked)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>SOC 2</label>
                                            <select
                                                value={profile?.soc2 || 'None'}
                                                onChange={(e) => updateField('soc2', e.target.value)}
                                            >
                                                <option value="None">None</option>
                                                <option value="Type I">Type I</option>
                                                <option value="Type II">Type II</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>CMMC Level</label>
                                            <select
                                                value={profile?.cmmcLevel || 'None'}
                                                onChange={(e) => updateField('cmmcLevel', e.target.value)}
                                            >
                                                <option value="None">None</option>
                                                <option value="Level 1">Level 1</option>
                                                <option value="Level 2">Level 2</option>
                                                <option value="Level 3">Level 3</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )
                        }

                        {/* CONTACTS */}
                        {
                            activeTab === 'contacts' && (
                                <div className="tab-panel">
                                    <h2>Key Contacts</h2>
                                    <p style={{ color: '#666', marginBottom: '20px' }}>
                                        Authorized representatives and key personnel
                                    </p>
                                    <div className="info-box">
                                        <p>Key Contacts management coming soon - Add authorized signatories, contracts managers, etc.</p>
                                    </div>
                                </div>
                            )
                        }

                        {/* TEAMING */}
                        {
                            activeTab === 'teaming' && (
                                <div className="tab-panel">
                                    <h2>Subcontracting & Teaming</h2>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Prime/Sub Preference</label>
                                            <select
                                                value={profile?.primeSubPreference || ''}
                                                onChange={(e) => updateField('primeSubPreference', e.target.value)}
                                            >
                                                <option value="">Select Preference</option>
                                                <option value="Prime">Prime Contractor</option>
                                                <option value="Subcontractor">Subcontractor</option>
                                                <option value="Both">Both</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Has Subcontracting Plan</label>
                                            <input
                                                type="checkbox"
                                                checked={profile?.hasSubcontractingPlan || false}
                                                onChange={(e) => updateField('hasSubcontractingPlan', e.target.checked)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                    </div >

                    <div className="profile-footer">
                        <button onClick={handleSave} disabled={saving} className="btn-save-profile-large">
                            {saving ? 'Saving...' : 'Save All Changes'}
                        </button>
                        <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '10px' }}>
                            Last updated: {profile?.lastUpdated ? new Date(profile.lastUpdated).toLocaleString() : 'Never'}
                        </p>
                    </div>
                </div>
            </div>
        </div >
    );
}

