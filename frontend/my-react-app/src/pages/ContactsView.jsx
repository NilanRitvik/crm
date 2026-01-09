import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './ContactsView.css';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';
import StateFilter from '../components/StateFilter';

export default function ContactsView() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [leads, setLeads] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedState, setSelectedState] = useState(null);
    const [contactView, setContactView] = useState("card"); // "card" or "list"
    const [loading, setLoading] = useState(true);

    const [editingContactId, setEditingContactId] = useState(null); // id format: `${leadId}-${index}`
    const [editFormData, setEditFormData] = useState({});

    // ADD CONTACT STATE
    const [isAddingContact, setIsAddingContact] = useState(false);
    const [newContactData, setNewContactData] = useState({
        name: "", surname: "", role: "", agency: "", email: "", phone: "",
        state: "", county: "", department: "", stateUrl: "", linkedinUrl: "", notes: "",
        targetLeadId: "" // Must select a lead
    });

    // Delete Confirmation State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [contactToDelete, setContactToDelete] = useState(null);

    useEffect(() => {
        const fetchLeads = async () => {
            const token = localStorage.getItem("token");
            try {
                const res = await axios.get("http://localhost:5000/api/leads", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLeads(res.data);
            } catch (err) {
                console.error("Error fetching leads:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeads();
    }, []);

    const allContacts = useMemo(() => {
        return leads.flatMap(lead => {
            if (!lead.contacts) return [];
            return lead.contacts.map((contact, index) => ({
                ...contact,
                sourceLeadName: lead.name,
                sourceLeadId: lead._id,
                sourceLeadStage: lead.stage,
                originalIndex: index
            }));
        });
    }, [leads]);

    const filteredContacts = allContacts.filter(contact =>
        ((contact.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (contact.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (contact.role?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (contact.sourceLeadName?.toLowerCase() || "").includes(searchTerm.toLowerCase())) &&
        (selectedState ?
            (selectedState === '__NO_STATE__' ? !contact.state : contact.state === selectedState)
            : true)
    );

    const handleEditClick = (contact) => {
        const uniqueId = `${contact.sourceLeadId}-${contact.originalIndex}`;
        setEditingContactId(uniqueId);
        setEditFormData({ ...contact });
    };

    const handleCancelClick = () => {
        setEditingContactId(null);
        setEditFormData({});
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveClick = async () => {
        if (!editFormData.sourceLeadId) return;

        try {
            // Find the lead to update
            const leadToUpdate = leads.find(l => l._id === editFormData.sourceLeadId);
            if (!leadToUpdate) return;

            // Update the specific contact
            const updatedContacts = [...leadToUpdate.contacts];
            updatedContacts[editFormData.originalIndex] = {
                name: editFormData.name,
                surname: editFormData.surname,
                role: editFormData.role,
                email: editFormData.email,
                phone: editFormData.phone,
                notes: editFormData.notes,
                state: editFormData.state,
                county: editFormData.county,
                agency: editFormData.agency,
                department: editFormData.department,
                stateUrl: editFormData.stateUrl,
                linkedinUrl: editFormData.linkedinUrl
            };

            const token = localStorage.getItem("token");
            await axios.put(
                `http://localhost:5000/api/leads/${editFormData.sourceLeadId}`,
                { ...leadToUpdate, contacts: updatedContacts },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update local state
            setLeads(prevLeads => prevLeads.map(l => {
                if (l._id === editFormData.sourceLeadId) {
                    return { ...l, contacts: updatedContacts };
                }
                return l;
            }));

            setEditingContactId(null);
            setEditFormData({});
        } catch (err) {
            console.error("Failed to update contact", err);
            addToast("Failed to update contact", 'error');
        }
    }; // Correct closing for handleSaveClick

    const handleAddClick = () => {
        setIsAddingContact(true);
        setNewContactData({
            name: "", surname: "", role: "", agency: "", email: "", phone: "",
            state: "", county: "", department: "", stateUrl: "", linkedinUrl: "", notes: "",
            targetLeadId: "" // Default to empty to show 'Manual Added' placeholder
        });
    };

    const handleCancelAdd = () => {
        setIsAddingContact(false);
        setNewContactData({});
    };

    const handleAddChange = (e) => {
        const { name, value } = e.target;
        setNewContactData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveNewContact = async () => {
        if (!newContactData.targetLeadId || !newContactData.name) {
            addToast("Please select a Lead and enter a Name", 'warning');
            return;
        }

        try {
            const leadToUpdate = leads.find(l => l._id === newContactData.targetLeadId);
            if (!leadToUpdate) return;

            const newContact = {
                name: newContactData.name,
                surname: newContactData.surname,
                role: newContactData.role,
                agency: newContactData.agency,
                email: newContactData.email,
                phone: newContactData.phone,
                state: newContactData.state,
                county: newContactData.county,
                department: newContactData.department,
                stateUrl: newContactData.stateUrl,
                linkedinUrl: newContactData.linkedinUrl,
                notes: newContactData.notes
            };

            const updatedContacts = [...(leadToUpdate.contacts || []), newContact];

            const token = localStorage.getItem("token");
            await axios.put(
                `http://localhost:5000/api/leads/${newContactData.targetLeadId}`,
                { ...leadToUpdate, contacts: updatedContacts },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update local state
            setLeads(prevLeads => prevLeads.map(l => {
                if (l._id === newContactData.targetLeadId) {
                    return { ...l, contacts: updatedContacts };
                }
                return l;
            }));

            setIsAddingContact(false);
            setNewContactData({});
            addToast("Contact added successfully", 'success');
        } catch (err) {
            console.error("Failed to add contact", err);
            addToast("Failed to add contact", 'error');
        }
    }; // Correct closing for handleSaveNewContact

    const handleDeleteClick = (contact) => {
        setContactToDelete(contact);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteContact = async () => {
        if (!contactToDelete) return;

        try {
            const leadToUpdate = leads.find(l => l._id === contactToDelete.sourceLeadId);
            if (!leadToUpdate) return;

            // Remove the contact from the array
            const updatedContacts = leadToUpdate.contacts.filter((_, index) => index !== contactToDelete.originalIndex);

            const token = localStorage.getItem("token");
            await axios.put(
                `http://localhost:5000/api/leads/${contactToDelete.sourceLeadId}`,
                { contacts: updatedContacts },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update local state
            setLeads(prevLeads => prevLeads.map(l => {
                if (l._id === contactToDelete.sourceLeadId) {
                    return { ...l, contacts: updatedContacts };
                }
                return l;
            }));

            addToast("Contact deleted successfully", 'success');
        } catch (err) {
            console.error("Failed to delete contact", err);
            addToast("Failed to delete contact", 'error');
        } finally {
            setShowDeleteConfirm(false);
            setContactToDelete(null);
        }
    };

    if (loading) return <div className="contacts-container">Loading contacts...</div>;

    return (
        <div className="contacts-container fade-in">
            <div className="contacts-header">
                <h2>Global Contacts Directory</h2>
                <div className="search-wrapper">
                    <input
                        type="text"
                        placeholder="Search contacts, roles, or leads..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="contacts-search"
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            className={`toggle-btn ${contactView === "list" ? "active" : ""}`}
                            onClick={() => setContactView("list")}
                            style={{
                                padding: "8px 16px",
                                border: "1px solid #ccc",
                                borderRadius: "4px 0 0 4px",
                                background: contactView === "list" ? "#007bff" : "white",
                                color: contactView === "list" ? "white" : "#333",
                                cursor: "pointer"
                            }}
                        >
                            📋 List
                        </button>
                        <button
                            className={`toggle-btn ${contactView === "card" ? "active" : ""}`}
                            onClick={() => setContactView("card")}
                            style={{
                                padding: "8px 16px",
                                border: "1px solid #ccc",
                                borderRadius: "0 4px 4px 0",
                                borderLeft: "none",
                                background: contactView === "card" ? "#007bff" : "white",
                                color: contactView === "card" ? "white" : "#333",
                                cursor: "pointer"
                            }}
                        >
                            🗂️ Card
                        </button>
                        <button className="btn-save" onClick={handleAddClick} style={{ whiteSpace: 'nowrap' }}>+ Add Contact</button>
                        <button
                            onClick={() => navigate('/state-cio')}
                            style={{
                                whiteSpace: 'nowrap',
                                background: '#6554C0',
                                color: 'white',
                                padding: '8px 16px',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            CIO Map 🗺️
                        </button>
                    </div>
                </div>
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
                            ({filteredContacts.length} of {allContacts.length} contacts)
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

            {/* EDIT CONTACT MODAL */}
            {editingContactId && (
                <div className="modal-overlay editing-modal" onClick={handleCancelClick}>
                    <div className="modal-content editing-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Contact</h3>
                            <button className="close-btn" onClick={handleCancelClick}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="contact-edit-form">
                                <div className="edit-form-row">
                                    <div className="form-group-half">
                                        <label>Name</label>
                                        <input name="name" value={editFormData.name || ""} onChange={handleEditChange} className="edit-input" />
                                    </div>
                                    <div className="form-group-half">
                                        <label>Surname</label>
                                        <input name="surname" value={editFormData.surname || ""} onChange={handleEditChange} className="edit-input" />
                                    </div>
                                </div>
                                <div className="edit-form-row">
                                    <div className="form-group-half">
                                        <label>Role</label>
                                        <input name="role" value={editFormData.role || ""} onChange={handleEditChange} className="edit-input" />
                                    </div>
                                    <div className="form-group-half">
                                        <label>Agency</label>
                                        <input name="agency" value={editFormData.agency || ""} onChange={handleEditChange} className="edit-input" />
                                    </div>
                                </div>
                                <div className="edit-form-row">
                                    <div className="form-group-half">
                                        <label>Email</label>
                                        <input name="email" value={editFormData.email || ""} onChange={handleEditChange} className="edit-input" />
                                    </div>
                                    <div className="form-group-half">
                                        <label>Phone</label>
                                        <input name="phone" value={editFormData.phone || ""} onChange={handleEditChange} className="edit-input" />
                                    </div>
                                </div>
                                <div className="edit-form-row">
                                    <div className="form-group-half">
                                        <label>State</label>
                                        <input name="state" value={editFormData.state || ""} onChange={handleEditChange} className="edit-input" />
                                    </div>
                                    <div className="form-group-half">
                                        <label>County</label>
                                        <input name="county" value={editFormData.county || ""} onChange={handleEditChange} className="edit-input" />
                                    </div>
                                </div>
                                <div className="edit-form-row">
                                    <div className="form-group-half">
                                        <label>Department</label>
                                        <input name="department" value={editFormData.department || ""} onChange={handleEditChange} className="edit-input" />
                                    </div>
                                </div>
                                <div className="edit-form-row">
                                    <div className="form-group-half">
                                        <label>State URL</label>
                                        <input name="stateUrl" value={editFormData.stateUrl || ""} onChange={handleEditChange} className="edit-input" />
                                    </div>
                                    <div className="form-group-half">
                                        <label>LinkedIn URL</label>
                                        <input name="linkedinUrl" value={editFormData.linkedinUrl || ""} onChange={handleEditChange} className="edit-input" />
                                    </div>
                                </div>
                                <div className="form-group-full">
                                    <label>Notes</label>
                                    <textarea name="notes" value={editFormData.notes || ""} onChange={handleEditChange} className="edit-textarea" />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={handleCancelClick} className="btn-cancel">Cancel</button>
                            <button onClick={handleSaveClick} className="btn-save">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD CONTACT MODAL */}
            {isAddingContact && (
                <div className="modal-overlay editing-modal" onClick={handleCancelAdd}>
                    <div className="modal-content editing-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add New Contact</h3>
                            <button className="close-btn" onClick={handleCancelAdd}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="contact-edit-form">
                                <div className="form-group-full">
                                    <label>Source Deal</label>
                                    <select name="targetLeadId" value={newContactData.targetLeadId} onChange={handleAddChange} className="edit-input" style={{ borderColor: !newContactData.targetLeadId ? '#ef4444' : '#dfe1e6' }}>
                                        <option value="" disabled>Select Associated Deal (Required)</option>
                                        {leads.length === 0 && <option disabled>No Active Deals Found</option>}
                                        {leads.map(lead => (
                                            <option key={lead._id} value={lead._id}>{lead.name}</option>
                                        ))}
                                    </select>
                                    {/* Helper text if needed */}
                                    {(!newContactData.targetLeadId && leads.length > 0) && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>Please select a deal to link this contact.</span>}
                                </div>
                                <div className="edit-form-row">
                                    <div className="form-group-half">
                                        <label>Name (Required)</label>
                                        <input name="name" value={newContactData.name || ""} onChange={handleAddChange} className="edit-input" />
                                    </div>
                                    <div className="form-group-half">
                                        <label>Surname</label>
                                        <input name="surname" value={newContactData.surname || ""} onChange={handleAddChange} className="edit-input" />
                                    </div>
                                </div>
                                <div className="edit-form-row">
                                    <div className="form-group-half">
                                        <label>Role</label>
                                        <input name="role" value={newContactData.role || ""} onChange={handleAddChange} className="edit-input" />
                                    </div>
                                    <div className="form-group-half">
                                        <label>Agency</label>
                                        <input name="agency" value={newContactData.agency || ""} onChange={handleAddChange} className="edit-input" />
                                    </div>
                                </div>
                                <div className="edit-form-row">
                                    <div className="form-group-half">
                                        <label>Email</label>
                                        <input name="email" value={newContactData.email || ""} onChange={handleAddChange} className="edit-input" />
                                    </div>
                                    <div className="form-group-half">
                                        <label>Phone</label>
                                        <input name="phone" value={newContactData.phone || ""} onChange={handleAddChange} className="edit-input" />
                                    </div>
                                </div>
                                <div className="edit-form-row">
                                    <div className="form-group-half">
                                        <label>State</label>
                                        <input name="state" value={newContactData.state || ""} onChange={handleAddChange} className="edit-input" />
                                    </div>
                                    <div className="form-group-half">
                                        <label>County</label>
                                        <input name="county" value={newContactData.county || ""} onChange={handleAddChange} className="edit-input" />
                                    </div>
                                </div>
                                <div className="edit-form-row">
                                    <div className="form-group-half">
                                        <label>Department</label>
                                        <input name="department" value={newContactData.department || ""} onChange={handleAddChange} className="edit-input" />
                                    </div>
                                </div>
                                <div className="edit-form-row">
                                    <div className="form-group-half">
                                        <label>State URL</label>
                                        <input name="stateUrl" value={newContactData.stateUrl || ""} onChange={handleAddChange} className="edit-input" />
                                    </div>
                                    <div className="form-group-half">
                                        <label>LinkedIn URL</label>
                                        <input name="linkedinUrl" value={newContactData.linkedinUrl || ""} onChange={handleAddChange} className="edit-input" />
                                    </div>
                                </div>
                                <div className="form-group-full">
                                    <label>Notes</label>
                                    <textarea name="notes" value={newContactData.notes || ""} onChange={handleAddChange} className="edit-textarea" />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={handleCancelAdd} className="btn-cancel">Cancel</button>
                            <button onClick={handleSaveNewContact} className="btn-save">Add Contact</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area with State Filter */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', alignItems: 'start' }}>
                <div className="contacts-grid-wrapper">
                    {filteredContacts.length === 0 ? (
                        <div className="no-contacts">
                            <p>No contacts found matching your search.</p>
                        </div>
                    ) : contactView === "list" ? (
                        /* LIST VIEW */
                        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Role</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Email</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Phone</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Agency</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>State</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Source Deal</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredContacts.map((contact) => {
                                    const uniqueId = `${contact.sourceLeadId}-${contact.originalIndex}`;
                                    return (
                                        <tr key={uniqueId} style={{ borderBottom: '1px solid #dee2e6' }}>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div className="avatar-circle" style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                                                        {contact.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <strong>{contact.name} {contact.surname}</strong>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px' }}>{contact.role || "-"}</td>
                                            <td style={{ padding: '12px' }}>
                                                {contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : "-"}
                                            </td>
                                            <td style={{ padding: '12px' }}>{contact.phone || "-"}</td>
                                            <td style={{ padding: '12px' }}>{contact.agency || "-"}</td>
                                            <td style={{ padding: '12px' }}>{contact.state || "-"}</td>
                                            <td style={{ padding: '12px' }}>
                                                <Link to={`/lead/${contact.sourceLeadId}`} className="source-link">
                                                    {contact.sourceLeadName} ↗
                                                </Link>
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    <button className="edit-icon-btn" onClick={() => handleEditClick(contact)} title="Edit Contact">✎</button>
                                                    <button
                                                        className="edit-icon-btn"
                                                        onClick={() => handleDeleteClick(contact)}
                                                        style={{ color: '#dc2626' }}
                                                        title="Delete Contact"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        /* CARD VIEW */
                        <div className="contacts-list-grid">
                            {filteredContacts.map((contact) => {
                                const uniqueId = `${contact.sourceLeadId}-${contact.originalIndex}`;
                                return (
                                    <div key={uniqueId} className="contact-card scale-up">
                                        <div className="contact-card-header">
                                            <div className="avatar-circle">
                                                {contact.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="contact-main-info">
                                                <h3>{contact.name} {contact.surname}</h3>
                                                <span className="role-badge">
                                                    {contact.role || "No Role"}
                                                    {contact.agency ? ` • ${contact.agency}` : ""}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="edit-icon-btn" onClick={() => handleEditClick(contact)} title="Edit Contact">✎</button>
                                                <button
                                                    className="edit-icon-btn"
                                                    onClick={() => handleDeleteClick(contact)}
                                                    style={{ color: '#dc2626' }}
                                                    title="Delete Contact"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                        <div className="contact-card-body">
                                            <div className="info-row">
                                                <span className="label">Email:</span>
                                                <span className="value">{contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : "-"}</span>
                                            </div>
                                            <div className="info-row">
                                                <span className="label">Phone:</span>
                                                <span className="value">{contact.phone || "-"}</span>
                                            </div>
                                            <div className="info-row">
                                                <span className="label">Address:</span>
                                                <span className="value">
                                                    {contact.state ? contact.state : ""}
                                                    {contact.county ? `, ${contact.county}` : ""}
                                                    {!contact.state && !contact.county ? "-" : ""}
                                                </span>
                                            </div>
                                            <div className="info-row">
                                                <span className="label">Dept:</span>
                                                <span className="value">{contact.department || "-"}</span>
                                            </div>
                                            <div className="info-row">
                                                <span className="label">Links:</span>
                                                <span className="value-links">
                                                    {contact.stateUrl && <a href={contact.stateUrl.startsWith('http') ? contact.stateUrl : `https://${contact.stateUrl}`} target="_blank" rel="noopener noreferrer">State</a>}
                                                    {contact.stateUrl && contact.linkedinUrl && " | "}
                                                    {contact.linkedinUrl && <a href={contact.linkedinUrl.startsWith('http') ? contact.linkedinUrl : `https://${contact.linkedinUrl}`} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
                                                    {!contact.stateUrl && !contact.linkedinUrl && "-"}
                                                </span>
                                            </div>
                                            <div className="info-row source-row">
                                                <span className="label">Source Deal:</span>
                                                <Link to={`/lead/${contact.sourceLeadId}`} className="source-link">
                                                    {contact.sourceLeadName} ↗
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* State Filter Panel */}
                <StateFilter
                    items={allContacts}
                    selectedState={selectedState}
                    onStateSelect={setSelectedState}
                    getStateFromItem={(contact) => contact.state}
                />
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                title="Delete Contact"
                message={`Are you sure you want to delete ${contactToDelete?.name || 'this contact'}? This will remove the contact from the associated lead and cannot be undone.`}
                onConfirm={confirmDeleteContact}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </div >
    );
}
