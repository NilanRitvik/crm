const express = require('express');
const router = express.Router();
const Partner = require('../models/Partner');
const auth = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');
const { analyzeCapabilityText } = require('../services/capabilityService');

// Multer Storage for Capability Statements
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// GET all partners
router.get('/', auth, async (req, res) => {
    try {
        const partners = await Partner.find().sort({ createdAt: -1 });
        console.log(`📋 Fetching ${partners.length} partners`);
        if (partners.length > 0) {
            console.log('First partner state:', partners[0].state);
        }
        res.json(partners);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE a new partner
router.post('/', auth, async (req, res) => {
    try {
        console.log('Create Partner Request Body:', req.body);
        console.log('State field value:', req.body.state);
        const newPartner = new Partner(req.body);
        const savedPartner = await newPartner.save();
        console.log('✅ Saved Partner:', JSON.stringify(savedPartner, null, 2));
        res.status(201).json(savedPartner);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// UPLOAD Capability Statement
router.post('/:id/upload', auth, upload.single('file'), async (req, res) => {
    try {
        const partner = await Partner.findById(req.params.id);
        if (!partner) return res.status(404).json({ msg: 'Partner not found' });

        const fileData = {
            name: req.file.originalname,
            url: `/uploads/${req.file.filename}`
        };

        partner.files.push(fileData);
        await partner.save();

        res.json(fileData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ANALYZE Capability Statement
router.post('/:id/analyze', auth, async (req, res) => {
    try {
        const partner = await Partner.findById(req.params.id);
        if (!partner) return res.status(404).json({ msg: 'Partner not found' });

        if (!partner.files || partner.files.length === 0) {
            return res.status(400).json({ msg: 'No files uploaded to analyze' });
        }

        // Get latest file (last in array)
        const latestFile = partner.files[partner.files.length - 1];
        // url is like /uploads/filename.
        // We need to robustly handle the leading slash for path.join
        const fileNameOnly = path.basename(latestFile.url); // Just get the filename
        const filePath = path.join(__dirname, '../uploads', fileNameOnly);

        if (!fs.existsSync(filePath)) {
            console.error("File not found at:", filePath);
            return res.status(400).json({ msg: `File not found on server at ${filePath}` });
        }

        let extractedText = "";
        if (latestFile.name.toLowerCase().endsWith('.pdf')) {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            extractedText = data.text;
        } else {
            // Skip non-PDFs for now
            return res.status(400).json({ msg: 'Only PDF analysis supported currently' });
        }

        const analysis = analyzeCapabilityText(extractedText);

        // Merge Unique
        partner.naicsCodes = [...new Set([...partner.naicsCodes, ...analysis.naics])];
        if (!partner.skills) partner.skills = [];
        partner.skills = [...new Set([...partner.skills, ...analysis.skills])];
        if (!partner.agencies) partner.agencies = [];
        partner.agencies = [...new Set([...partner.agencies, ...analysis.agencies])];

        await partner.save();
        res.json(partner);

    } catch (err) {
        console.error("Analysis Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// UPDATE a partner
router.put('/:id', auth, async (req, res) => {
    try {
        console.log('Update Partner Request Body:', req.body);
        console.log('State field value:', req.body.state);
        const updatedPartner = await Partner.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        console.log('✅ Updated Partner:', JSON.stringify(updatedPartner, null, 2));
        res.json(updatedPartner);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE a partner
router.delete('/:id', auth, async (req, res) => {
    try {
        await Partner.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Partner deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
