const express = require('express');
const router = express.Router();
const StateOrg = require('../models/StateOrg');
const auth = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/orgchart');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Sanitize filename
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, Date.now() + '-' + safeName);
    }
});
const upload = multer({ storage: storage });

/* ================= GET ALL ENTRIES ================= */
router.get('/', auth, async (req, res) => {
    try {
        const entries = await StateOrg.find().sort({ state: 1, name: 1 });
        res.json(entries);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

/* ================= CREATE ENTRY WITH FILES ================= */
router.post('/', auth, upload.array('files'), async (req, res) => {
    try {
        console.log('📝 Creating State Org Entry');
        console.log('Body:', req.body);
        console.log('Files count:', req.files ? req.files.length : 0);

        const { name, state, sector } = req.body;

        if (!name || !state) {
            return res.status(400).json({ message: 'Name and State are required' });
        }

        const filesData = req.files ? req.files.map(file => ({
            name: file.originalname,
            url: `/uploads/orgchart/${file.filename}`,
            fileType: file.mimetype,
            size: file.size
        })) : [];

        const newEntry = new StateOrg({
            name,
            state,
            sector,
            files: filesData
        });

        const savedEntry = await newEntry.save();
        console.log('✅ Entry created:', savedEntry._id);
        res.status(201).json(savedEntry);

    } catch (err) {
        console.error('❌ Create Error:', err);
        res.status(500).json({ message: 'Failed to create entry', error: err.message });
    }
});

/* ================= ADD FILES TO ENTRY ================= */
router.post('/:id/files', auth, upload.array('files'), async (req, res) => {
    try {
        const entry = await StateOrg.findById(req.params.id);
        if (!entry) return res.status(404).json({ message: 'Entry not found' });

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const newFiles = req.files.map(file => ({
            name: file.originalname,
            url: `/uploads/orgchart/${file.filename}`,
            fileType: file.mimetype,
            size: file.size
        }));

        entry.files.push(...newFiles);
        await entry.save();

        console.log(`✅ Added ${newFiles.length} files to entry ${entry._id}`);
        res.json(entry);

    } catch (err) {
        console.error('❌ Add Files Error:', err);
        res.status(500).json({ message: 'Failed to upload files', error: err.message });
    }
});

/* ================= UPDATE ENTRY ================= */
router.put('/:id', auth, async (req, res) => {
    try {
        console.log('🔄 Updating Entry:', req.params.id);
        console.log('📦 Body:', req.body);

        const { name, state, sector } = req.body;

        const updatePayload = { name, state };
        if (sector) updatePayload.sector = sector;

        const entry = await StateOrg.findByIdAndUpdate(
            req.params.id,
            updatePayload,
            { new: true, runValidators: true }
        );

        if (!entry) return res.status(404).json({ message: 'Entry not found' });
        console.log(`✅ Updated entry ${entry._id} with sector: ${entry.sector}`);
        res.json(entry);
    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

/* ================= DELETE FILE FROM ENTRY ================= */
router.delete('/:id/files/:fileId', auth, async (req, res) => {
    try {
        const entry = await StateOrg.findById(req.params.id);
        if (!entry) return res.status(404).json({ message: 'Entry not found' });

        // Find file to get path (optional: delete from disk)
        const fileIndex = entry.files.findIndex(f => f._id.toString() === req.params.fileId);
        if (fileIndex === -1) return res.status(404).json({ message: 'File not found' });

        // Remove from array
        entry.files.splice(fileIndex, 1);
        await entry.save();

        console.log(`✅ Deleted file form entry ${entry._id}`);
        res.json(entry);

    } catch (err) {
        console.error('❌ Delete File Error:', err);
        res.status(500).json({ message: 'Failed to delete file', error: err.message });
    }
});

/* ================= DELETE ENTRY ================= */
router.delete('/:id', auth, async (req, res) => {
    try {
        const entry = await StateOrg.findByIdAndDelete(req.params.id);
        if (!entry) return res.status(404).json({ message: 'Entry not found' });

        console.log(`✅ Deleted entry ${req.params.id}`);
        res.json({ message: 'Entry deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

module.exports = router;
