const express = require('express');
const router = express.Router();
const StateCIO = require('../models/StateCIO');
const auth = require('../middleware/authMiddleware');

// GET all states CIOs
router.get('/', auth, async (req, res) => {
    try {
        const data = await StateCIO.find();
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET specific state
router.get('/:stateName', auth, async (req, res) => {
    try {
        let stateData = await StateCIO.findOne({ stateName: req.params.stateName });
        if (!stateData) {
            // Return empty structure if not found
            return res.json({ stateName: req.params.stateName, cios: [{}, {}] });
        }
        res.json(stateData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST/PUT Update state CIOs
router.post('/', auth, async (req, res) => {
    const { stateName, cios } = req.body;
    try {
        let stateData = await StateCIO.findOne({ stateName });
        if (stateData) {
            stateData.cios = cios;
            await stateData.save();
        } else {
            stateData = new StateCIO({ stateName, cios });
            await stateData.save();
        }
        res.json(stateData);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
