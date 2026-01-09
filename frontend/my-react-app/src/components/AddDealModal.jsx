import React, { useState } from "react";
import axios from "axios";
import PriorityStars from "./PriorityStars";
import "./AddDealModal.css";
import { useToast } from "../context/ToastContext";

export default function AddDealModal({ isOpen, onClose, onDealAdded }) {
    const { addToast } = useToast();
    const [formData, setFormData] = useState({
        name: "",
        value: "",
        stage: "opp sourced",
        dealType: "Forecast",
        state: "",
        opportunityId: "",
        opportunityUrl: "",
        opportunityStatus: "Open",
        responseMethod: "Electronic",
        sector: "State",
        incumbent: "",
        source: "",
        sourcedBy: "",
        priority: 3,
        estimatedRfpDate: "",
        awardDate: "",
        closeDate: "",
        captureActivities: "",
        keyContacts: "",
        actionItems: "",
        notes: "",
        description: "",
        department: "",
        winProbability: 0,
        contacts: [] // Structured contacts
    });

    // Temp state for new contact input in modal
    const [newContact, setNewContact] = useState({
        name: "", surname: "", role: "", email: "", phone: "", notes: "",
        state: "", county: "", agency: "", department: "", stateUrl: "", linkedinUrl: ""
    });

    const addContact = () => {
        if (!newContact.name) return addToast("Contact Name is required", "warning");
        setFormData(prev => ({
            ...prev,
            contacts: [...prev.contacts, newContact]
        }));
        setNewContact({
            name: "", surname: "", role: "", email: "", phone: "", notes: "",
            state: "", county: "", agency: "", department: "", stateUrl: "", linkedinUrl: ""
        });
    };

    const removeContact = (index) => {
        setFormData(prev => ({
            ...prev,
            contacts: prev.contacts.filter((_, i) => i !== index)
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePriorityChange = (val) => {
        setFormData(prev => ({ ...prev, priority: val }));
    };

    const handleSubmit = async () => {
        if (!formData.name) return alert("Deal Name is required");

        const token = localStorage.getItem("token");
        try {
            await axios.post(
                "http://localhost:5000/api/leads",
                {
                    ...formData,
                    value: Number(formData.value) || 0,
                    winProbability: Number(formData.winProbability) || 0,
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            onDealAdded();
            onClose(); // Close modal on success

            // Reset form
            setFormData({
                name: "",
                value: "",
                stage: "opp sourced",
                dealType: "Forecast",
                state: "",
                opportunityId: "",
                opportunityUrl: "",
                opportunityStatus: "Open",
                responseMethod: "Electronic",
                sector: "State",
                incumbent: "",
                source: "",
                sourcedBy: "",
                priority: 3,
                estimatedRfpDate: "",
                awardDate: "",
                closeDate: "",
                captureActivities: "",
                keyContacts: "",
                actionItems: "",
                notes: "",
                description: "",
                department: "",
                winProbability: 0,
                contacts: []
            });
            setNewContact({
                name: "", surname: "", role: "", email: "", phone: "", notes: "",
                state: "", county: "", agency: "", department: "", stateUrl: "", linkedinUrl: ""
            });
        } catch (err) {
            console.error(err);
            addToast("Failed to add deal", 'error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">➕ Add New Deal</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">


                    {/* SECTION 1: CORE DETAILS */}
                    <div className="form-section">
                        <div className="section-title">📌 Core Details</div>
                        <div className="form-row">
                            <div className="form-group" style={{ flex: 2 }}>
                                <label className="form-label">Opportunity Name *</label>
                                <input name="name" className="form-control" value={formData.name} onChange={handleChange} placeholder="Project Alpha" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Opportunity - Department</label>
                                <input name="department" className="form-control" value={formData.department} onChange={handleChange} placeholder="Department" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Value ($)</label>
                                <input name="value" type="number" className="form-control" value={formData.value} onChange={handleChange} placeholder="50000" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Deal Type</label>
                                <select name="dealType" className="form-control" value={formData.dealType} onChange={handleChange}>
                                    <option value="RFP">RFP</option>
                                    <option value="RFI">RFI</option>
                                    <option value="RFR">RFR</option>
                                    <option value="Solicitation">Solicitation</option>
                                    <option value="Notice">Notice</option>
                                    <option value="Forecast">Forecast</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Win Probability (%)</label>
                                <input name="winProbability" type="number" min="0" max="100" className="form-control" value={formData.winProbability || ''} onChange={handleChange} placeholder="50" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Deal Stage</label>
                                <select name="stage" className="form-control" value={formData.stage} onChange={handleChange}>
                                    <option value="opp sourced">Opportunity Sourced</option>
                                    <option value="opp Nurturing">Opportunity Nurturing</option>
                                    <option value="opp qualified">Opportunity Qualified</option>
                                    <option value="opp in-progress">Opportunity In-Progress</option>
                                    <option value="Win">Win</option>
                                    <option value="lost">Lost</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea name="description" className="form-control" rows="3" value={formData.description} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">State/Location</label>
                                <input name="state" className="form-control" value={formData.state} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: OPPORTUNITY INFO */}
                    <div className="form-section">
                        <div className="section-title">🔗 Opportunity Info</div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Opportunity ID</label>
                                <input name="opportunityId" className="form-control" value={formData.opportunityId} onChange={handleChange} />
                            </div>
                            <div className="form-group" style={{ flex: 2 }}>
                                <label className="form-label">Opportunity URL</label>
                                <input name="opportunityUrl" className="form-control" value={formData.opportunityUrl} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Opportunity Status</label>
                                <select name="opportunityStatus" className="form-control" value={formData.opportunityStatus} onChange={handleChange}>
                                    <option value="Open">Open</option>
                                    <option value="Closed">Closed</option>
                                    <option value="TBD">TBD</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Response Method</label>
                                <select name="responseMethod" className="form-control" value={formData.responseMethod} onChange={handleChange}>
                                    <option value="Electronic">Electronic</option>
                                    <option value="Manual">Manual</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Sector (Oppr)</label>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                    <label><input type="radio" name="sector" value="State" checked={formData.sector === "State"} onChange={handleChange} /> State</label>
                                    <label><input type="radio" name="sector" value="Federal" checked={formData.sector === "Federal"} onChange={handleChange} /> Federal</label>
                                    <label><input type="radio" name="sector" value="Others" checked={formData.sector === "Others"} onChange={handleChange} /> Others</label>
                                </div>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Incumbent</label>
                                <input name="incumbent" className="form-control" value={formData.incumbent} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Source</label>
                                <select name="source" className="form-control" value={formData.source} onChange={handleChange}>
                                    <option value="">Select Source</option>
                                    <option value="State Portal">State Portal</option>
                                    <option value="FED Portal">FED Portal</option>
                                    <option value="Others">Others</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Sourced By (Owner)</label>
                                <input name="sourcedBy" className="form-control" value={formData.sourcedBy} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Priority</label>
                                <div style={{ marginTop: '5px' }}>
                                    <PriorityStars value={formData.priority} onChange={handlePriorityChange} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: KEY DATES */}
                    <div className="form-section">
                        <div className="section-title">📅 Key Dates</div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Est. RFP Date</label>
                                <input name="estimatedRfpDate" type="date" className="form-control" value={formData.estimatedRfpDate} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Award Date</label>
                                <input name="awardDate" type="date" className="form-control" value={formData.awardDate} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Close Date</label>
                                <input name="closeDate" type="date" className="form-control" value={formData.closeDate} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: DETAILS & NOTES */}
                    <div className="form-section">
                        <div className="section-title">📝 Details & Notes</div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Capture Activities</label>
                                <textarea name="captureActivities" className="form-control" rows="2" value={formData.captureActivities} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Key Contacts</label>
                                <textarea name="keyContacts" className="form-control" rows="2" value={formData.keyContacts} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Action Items</label>
                                <textarea name="actionItems" className="form-control" rows="2" value={formData.actionItems} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">General Notes</label>
                                <textarea name="notes" className="form-control" rows="2" value={formData.notes} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    {/* SECTION: IMPORTANT CONTACTS */}
                    <div className="form-section">
                        <div className="section-title">👥 Important Contacts</div>
                        <div className="form-row">
                            <div className="contact-inputs-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', marginBottom: '10px' }}>
                                <input placeholder="Name" className="form-control" value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })} />
                                <input placeholder="Surname" className="form-control" value={newContact.surname} onChange={e => setNewContact({ ...newContact, surname: e.target.value })} />

                                <input placeholder="State" className="form-control" value={newContact.state} onChange={e => setNewContact({ ...newContact, state: e.target.value })} />
                                <input placeholder="County" className="form-control" value={newContact.county} onChange={e => setNewContact({ ...newContact, county: e.target.value })} />

                                <input placeholder="Agency" className="form-control" value={newContact.agency} onChange={e => setNewContact({ ...newContact, agency: e.target.value })} />
                                <input placeholder="Department" className="form-control" value={newContact.department} onChange={e => setNewContact({ ...newContact, department: e.target.value })} />

                                <input placeholder="Role" className="form-control" value={newContact.role} onChange={e => setNewContact({ ...newContact, role: e.target.value })} />
                                <input placeholder="Email" className="form-control" value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })} />
                                <input placeholder="Phone" className="form-control" value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} />

                                <input placeholder="State URL" className="form-control" value={newContact.stateUrl} onChange={e => setNewContact({ ...newContact, stateUrl: e.target.value })} />
                                <input placeholder="LinkedIn URL" className="form-control" value={newContact.linkedinUrl} onChange={e => setNewContact({ ...newContact, linkedinUrl: e.target.value })} />

                                <input placeholder="Notes" className="form-control" style={{ gridColumn: 'span 2' }} value={newContact.notes} onChange={e => setNewContact({ ...newContact, notes: e.target.value })} />
                            </div>
                            <button type="button" onClick={addContact} className="btn btn-secondary btn-sm" style={{ height: 'fit-content', alignSelf: 'flex-end', marginBottom: '10px' }}>+ Add Contact</button>
                        </div>

                        {formData.contacts.length > 0 && (
                            <div className="added-contacts-list" style={{ marginTop: '10px', background: '#f9fafc', padding: '10px', borderRadius: '4px' }}>
                                {formData.contacts.map((c, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                                        <span><strong>{c.name} {c.surname}</strong> ({c.role}, {c.agency}) - {c.email}</span>
                                        <span onClick={() => removeContact(i)} style={{ color: 'red', cursor: 'pointer' }}>&times;</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit}>Save Deal</button>
                </div>
            </div>
        </div>
    );
}
