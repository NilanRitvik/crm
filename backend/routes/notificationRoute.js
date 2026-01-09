const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Event = require('../models/Event');
const auth = require('../middleware/authMiddleware');

// GET /api/notifications
// Retrieves leads and events that have upcoming critical dates within 7 days.
router.get('/', auth, async (req, res) => {
    try {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        // Reset times
        today.setHours(0, 0, 0, 0);
        nextWeek.setHours(23, 59, 59, 999);

        const notifications = [];

        // 1. Check LEADS (Dates) - Look 30 days back for overdue, and 7 days ahead
        const pastDate = new Date();
        pastDate.setDate(today.getDate() - 30); // Look back 30 days for overdue items

        const leads = await Lead.find({
            $or: [
                { estimatedRfpDate: { $gte: pastDate, $lte: nextWeek } },
                { awardDate: { $gte: pastDate, $lte: nextWeek } },
                { closeDate: { $gte: pastDate, $lte: nextWeek } },
                { "activities.dueDate": { $gte: pastDate, $lte: nextWeek }, "activities.status": "Pending" }
            ]
        }).select('name estimatedRfpDate awardDate closeDate activities');

        leads.forEach(lead => {
            const checkDate = (date, type) => {
                if (!date) return;
                const d = new Date(date);
                if (d >= pastDate && d <= nextWeek) {
                    const diffTime = d - today; // can be negative
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    const isOverdue = diffDays < 0;
                    const displayType = isOverdue ? `OVERDUE: ${type}` : `Pipeline: ${type}`;

                    // Only show overdue if not done (for dates, we assume they are milestones)
                    // For milestone dates, if it's passed, maybe we highlight it.

                    notifications.push({
                        id: `${lead._id}-${type}-${d.getTime()}`,
                        leadId: lead._id,
                        leadName: lead.name,
                        type: displayType,
                        date: date,
                        daysLeft: diffDays,
                        isOverdue
                    });
                }
            };

            // Only check milestones if they are in the future OR specifically relevant (logic can vary)
            // For simplicity, we show them as overdue if passed
            checkDate(lead.estimatedRfpDate, 'RFP Deadline');
            checkDate(lead.awardDate, 'Award Date');
            checkDate(lead.closeDate, 'Close Date');

            // Check Activities
            if (lead.activities) {
                lead.activities.forEach(act => {
                    if (act.status === 'Pending' && act.dueDate) {
                        const d = new Date(act.dueDate);
                        // If pending and date passed => OVERDUE
                        if (d >= pastDate && d <= nextWeek) {
                            const diffTime = d - today;
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            const isOverdue = diffDays < 0;

                            notifications.push({
                                id: `${lead._id}-${act.type}-${d.getTime()}`,
                                leadId: lead._id,
                                leadName: lead.name,
                                type: isOverdue ? `OVERDUE Activity: ${act.type}` : `Activity: ${act.type}`,
                                date: act.dueDate,
                                daysLeft: diffDays,
                                isOverdue
                            });
                        }
                    }
                });
            }
        });

        // 2. Check EVENTS (Calendar)
        const events = await Event.find({
            start: { $gte: pastDate, $lte: nextWeek }
        });

        events.forEach(event => {
            const d = new Date(event.start);
            const diffTime = d - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const isOverdue = diffDays < 0;

            notifications.push({
                id: `${event._id}-Event-${d.getTime()}`,
                leadId: null,
                isEvent: true,
                eventId: event._id,
                leadName: event.title,
                type: isOverdue ? 'PAST Event' : 'Calendar Event',
                date: event.start,
                daysLeft: diffDays,
                isOverdue
            });
        });

        res.json(notifications);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching notifications' });
    }
});

module.exports = router;
