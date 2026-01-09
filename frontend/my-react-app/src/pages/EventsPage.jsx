import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import Navbar from '../components/Navbar';
import EventModal from '../components/EventModal';
import './EventsPage.css';
import { useToast } from '../context/ToastContext';

// Setup localizer for Big Calendar
const localizer = momentLocalizer(moment);

export default function EventsPage() {
    const { addToast } = useToast();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());

    const handleNavigate = (newDate) => setDate(newDate);
    const handleViewChange = (newView) => setView(newView);

    // Fetch Events on Mount
    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:5000/api/events", {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Ideally map fields if they differ, but we used standard start/end
            const formatted = res.data.map(evt => ({
                ...evt,
                start: new Date(evt.start),
                end: new Date(evt.end),
                resourceId: evt._id
            }));
            setEvents(formatted);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSlot = ({ start, end }) => {
        setSelectedEvent(null);
        // Pre-fill date in modal if we wanted, for now just open empty
        // Or create an object with just start time
        // setInitialData({ start: start })
        setShowModal(true);
    };

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        setShowModal(true);
    };

    const handleSaveEvent = async (formData) => {
        const token = localStorage.getItem("token");
        try {
            if (selectedEvent) {
                // UPDATE
                await axios.put(`http://localhost:5000/api/events/${selectedEvent._id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                // CREATE
                await axios.post("http://localhost:5000/api/events", formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setShowModal(false);
            fetchEvents();
        } catch (err) {
            addToast("Failed to save event", 'error');
        }
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm("Delete this event?")) return;
        const token = localStorage.getItem("token");
        try {
            await axios.delete(`http://localhost:5000/api/events/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowModal(false);
            fetchEvents();
        } catch (err) {
            addToast("Failed to delete event", 'error');
        }
    };

    // Card View Component (Left Side)
    const EventCard = ({ event }) => (
        <div className="event-card" onClick={() => handleSelectEvent(event)}>
            <div className="event-card-header">
                <span className="event-date">
                    {moment(event.start).format("MMM D, YYYY")}
                </span>
                <span className={`event-status status-${event.registrationStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                    {event.registrationStatus === "Register Not Required" ? "No Reg Req" : event.registrationStatus}
                </span>
            </div>
            <h4 className="event-title">{event.title}</h4>
            <div className="event-meta">
                {event.location && <span>📍 {event.location}</span>}
                {event.organization && <span>🏢 {event.organization}</span>}
                {event.url && (
                    <a
                        href={event.url.startsWith('http') ? event.url : `https://${event.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: '#0052cc', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontSize: '0.85rem' }}
                    >
                        🔗 {event.url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]} ↗
                    </a>
                )}
            </div>
        </div>
    );

    // Event Styling with Deadline Colors
    const eventStyleGetter = (event) => {
        // Calculate days until event
        const now = new Date();
        const eventDate = new Date(event.start);
        const daysUntil = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));

        let backgroundColor = '#0052cc';

        // Deadline-based colors (priority over status)
        if (daysUntil < 7 && daysUntil >= 0) {
            backgroundColor = '#ef4444'; // Red - Urgent (<7 days)
        } else if (daysUntil >= 7 && daysUntil <= 15) {
            backgroundColor = '#22c55e'; // Green - Soon (7-15 days)
        } else if (daysUntil > 15) {
            backgroundColor = '#eab308'; // Yellow - Later (16+ days)
        } else {
            // Past due - dark red
            backgroundColor = '#991b1b';
        }

        return {
            style: {
                backgroundColor,
                borderRadius: '4px',
                opacity: 0.9,
                color: 'white',
                border: '0px',
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: daysUntil < 7 ? '600' : '400'
            }
        };
    };

    return (
        <div className="events-page">
            <Navbar />

            <div className="events-container">
                {/* LEFT: Event List */}
                <div className="events-sidebar">
                    <div className="sidebar-header">
                        <h3>Upcoming Events</h3>
                        <button className="create-event-btn" onClick={() => { setSelectedEvent(null); setShowModal(true); }}>
                            + Create Event
                        </button>
                    </div>

                    <div className="events-list">
                        {loading ? <p>Loading...</p> : (
                            events.length > 0 ? (
                                events.map(evt => <EventCard key={evt._id} event={evt} />)
                            ) : (
                                <p className="no-events">No events scheduled.</p>
                            )
                        )}
                    </div>
                </div>

                {/* RIGHT: Calendar */}
                <div className="events-calendar-wrapper">
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        onSelectEvent={handleSelectEvent}
                        onSelectSlot={handleSelectSlot}
                        selectable
                        views={['month', 'week', 'day']}
                        view={view}
                        date={date}
                        onNavigate={handleNavigate}
                        onView={handleViewChange}
                        eventPropGetter={eventStyleGetter}
                    />
                </div>
            </div>

            {/* Modal */}
            <EventModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSaveEvent}
                onDelete={handleDeleteEvent}
                initialData={selectedEvent}
            />
        </div>
    );
}
