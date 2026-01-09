const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const auth = require('../middleware/authMiddleware');

// GET all events
router.get('/', auth, async (req, res) => {
    try {
        const events = await Event.find().sort({ start: 1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching events' });
    }
});

// POST create event
router.post('/', auth, async (req, res) => {
    try {
        const newEvent = new Event({
            ...req.body,
            user: req.user.id
        });
        // If no end date, set to start date (all day or point in time)
        if (!newEvent.end) {
            newEvent.end = newEvent.start;
        }
        const savedEvent = await newEvent.save();
        res.json(savedEvent);
    } catch (err) {
        res.status(400).json({ message: 'Error creating event' });
    }
});

// PUT update event
router.put('/:id', auth, async (req, res) => {
    try {
        const updated = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: 'Error updating event' });
    }
});

// DELETE event
router.delete('/:id', auth, async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Event deleted' });
    } catch (err) {
        res.status(400).json({ message: 'Error deleting event' });
    }
});

module.exports = router;
