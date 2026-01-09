const express = require('express');
const router = express.Router();
const Credential = require('../models/Credential');
const auth = require('../middleware/authMiddleware'); // Assuming auth is required

// GET all credentials
router.get('/', auth, async (req, res) => {
    try {
        const credentials = await Credential.find().sort({ createdAt: -1 });
        res.json(credentials);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST new credential
router.post('/', auth, async (req, res) => {
    const { portalName, username, password } = req.body;
    try {
        const newCred = new Credential({
            portalName,
            username,
            password
        });
        const savedCred = await newCred.save();
        res.status(201).json(savedCred);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// UPDATE credential
router.put('/:id', auth, async (req, res) => {
    try {
        const { portalName, username, password } = req.body;
        const updatedCred = await Credential.findByIdAndUpdate(
            req.params.id,
            { portalName, username, password },
            { new: true }
        );
        if (!updatedCred) return res.status(404).json({ message: 'Credential not found' });
        res.json(updatedCred);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE credential
router.delete('/:id', auth, async (req, res) => {
    try {
        const cred = await Credential.findByIdAndDelete(req.params.id);
        if (!cred) return res.status(404).json({ message: 'Credential not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
