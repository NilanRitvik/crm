import React, { useState, useEffect } from 'react';
import './EventModal.css';

export default function EventModal({ isOpen, onClose, onSave, onDelete, initialData }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        organization: '',
        start: '',
        location: '',
        url: '',
        registrationStatus: 'Pending',
        pointOfContact: '',
        attendees: []
    });

    const [newAttendee, setNewAttendee] = useState("");

    useEffect(() => {
        if (initialData) {
            // Format date for input type="datetime-local" roughly
            // Note: simplistic handling. 
            // Better to use a proper date picker library but native is requested/simpler
            const d = new Date(initialData.start);
            const dateStr = d.toISOString().slice(0, 16); // yyyy-MM-ddThh:mm

            setFormData({
                ...initialData,
                start: dateStr
            });
        } else {
            setFormData({
                title: '',
                organization: '',
                start: '',
                location: '',
                url: '',
                registrationStatus: 'Pending',
                pointOfContact: '',
                attendees: []
            });
        }
    }, [initialData, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addAttendee = () => {
        if (newAttendee.trim()) {
            setFormData(prev => ({
                ...prev,
                attendees: [...prev.attendees, newAttendee.trim()]
            }));
            setNewAttendee("");
        }
    };

    const removeAttendee = (index) => {
        setFormData(prev => ({
            ...prev,
            attendees: prev.attendees.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Fix: Ensure proper Date handling and prevent stale 'end' date causing multi-day graphical glitches
        // If we only have one date picker, we assume a standard 1-hour duration (or specific point).
        const startDate = new Date(formData.start);
        const endDate = new Date(startDate);
        endDate.setHours(startDate.getHours() + 1);

        const payload = {
            ...formData,
            start: startDate,
            end: endDate
        };

        onSave(payload);
    };

    if (!isOpen) return null;

    return (
        <div className="event-modal-overlay" onClick={onClose}>
            <div className="event-modal-content" onClick={e => e.stopPropagation()}>
                <div className="event-modal-header">
                    <h2>{initialData ? "Edit Event" : "Create New Event"}</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="event-modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Event Name *</label>
                            <input name="title" value={formData.title} onChange={handleChange} required />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Organization</label>
                                <input name="organization" value={formData.organization} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Date & Time *</label>
                                <input type="datetime-local" name="start" value={formData.start} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Location</label>
                                <input name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Zoom or Address" />
                            </div>
                            <div className="form-group">
                                <label>Registration</label>
                                <select name="registrationStatus" value={formData.registrationStatus} onChange={handleChange}>
                                    <option value="Pending">Pending</option>
                                    <option value="Registered">Registered</option>
                                    <option value="Register Not Required">Register Not Required</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>URL</label>
                            <input name="url" value={formData.url} onChange={handleChange} placeholder="https://..." />
                        </div>

                        <div className="form-group">
                            <label>Point of Contact</label>
                            <input name="pointOfContact" value={formData.pointOfContact} onChange={handleChange} />
                        </div>

                        <div className="form-group">
                            <label>Attendees</label>
                            <div className="attendee-input-group">
                                <input
                                    value={newAttendee}
                                    onChange={(e) => setNewAttendee(e.target.value)}
                                    placeholder="Add name..."
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
                                />
                                <button type="button" onClick={addAttendee} className="add-btn">+</button>
                            </div>
                            <div className="attendee-list">
                                {formData.attendees.map((att, i) => (
                                    <span key={i} className="attendee-tag">
                                        {att}
                                        <button type="button" onClick={() => removeAttendee(i)}>&times;</button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description || ''}
                                onChange={handleChange}
                                placeholder="Add event details..."
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #dfe1e6', minHeight: '80px', fontFamily: 'inherit' }}
                            />
                        </div>

                        <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
                            {initialData && onDelete ? (
                                <button type="button" className="delete-btn-left" onClick={() => {
                                    if (window.confirm("Delete this event?")) {
                                        onDelete(initialData._id);
                                    }
                                }} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                            ) : <div></div>}

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
                                <button type="submit" className="save-btn">{initialData ? "Update Event" : "Create Event"}</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
