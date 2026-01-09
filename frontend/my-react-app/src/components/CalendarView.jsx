import React, { useMemo, useState } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarView.css';

const localizer = momentLocalizer(moment);

const eventStyleGetter = (event, start, end, isSelected) => {
    let backgroundColor = '#3174ad';

    switch (event.type) {
        case 'Call':
            backgroundColor = '#0052cc';
            break;
        case 'Meeting':
            backgroundColor = '#36B37E';
            break;
        case 'Email':
            backgroundColor = '#FFAB00';
            break;
        case 'Task':
            backgroundColor = '#6554C0';
            break;
        default:
            backgroundColor = '#0052cc';
    }

    return {
        style: {
            backgroundColor,
            borderRadius: '4px',
            opacity: 0.8,
            color: 'white',
            border: '0px',
            display: 'block'
        }
    };
};

export default function CalendarView({ leads }) {
    const navigate = useNavigate();
    const [view, setView] = useState(Views.MONTH);
    const [date, setDate] = useState(new Date());

    const handleNavigate = (newDate) => {
        setDate(newDate);
    };

    const handleViewChange = (newView) => {
        setView(newView);
    };

    const events = useMemo(() => {
        const allEvents = [];
        leads.forEach(lead => {
            if (lead.activities && lead.activities.length > 0) {
                lead.activities.forEach(activity => {
                    if (activity.status === 'Done') return;

                    if (activity.dueDate) {
                        const start = moment(activity.dueDate).toDate();
                        const end = moment(activity.dueDate).add(1, 'hours').toDate();

                        let title = `${activity.type} - ${lead.name}`;
                        if (activity.note) title += ` (${activity.note})`;

                        allEvents.push({
                            id: activity._id,
                            title: title,
                            start,
                            end,
                            resource: lead._id,
                            type: activity.type,
                            status: activity.status
                        });
                    }
                });
            }
        });
        return allEvents;
    }, [leads]);

    const handleSelectEvent = (event) => {
        navigate(`/lead/${event.resource}`);
    };

    const eventStyleGetter = (event) => {
        // Calculate days until deadline
        const now = new Date();
        const eventDate = new Date(event.start);
        const daysUntil = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));

        let backgroundColor = '#0052cc';

        // Priority: Deadline color overrides type color
        if (daysUntil < 7 && daysUntil >= 0) {
            backgroundColor = '#ef4444'; // Red - Urgent (<7 days)
        } else if (daysUntil >= 7 && daysUntil <= 15) {
            backgroundColor = '#22c55e'; // Green - Soon (7-15 days)
        } else if (daysUntil > 15) {
            backgroundColor = '#eab308'; // Yellow - Later (16+ days)
        } else {
            // Past due - keep red but darker
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
                fontWeight: daysUntil < 7 ? '600' : '400',
                fontSize: '0.85rem',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }
        };
    };



    return (
        <div className="calendar-view-container">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 600 }}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={handleSelectEvent}
                popup
                views={['month', 'week', 'day', 'agenda']}
                view={view}
                date={date}
                onNavigate={handleNavigate}
                onView={handleViewChange}
            />
        </div>
    );
}
