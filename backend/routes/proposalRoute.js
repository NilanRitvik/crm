const express = require('express');
const router = express.Router();
const Proposal = require('../models/Proposal');
const Lead = require('../models/Lead');
const auth = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/proposals');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

/* ================= GET ANALYTICS (KPIs) ================= */
router.get('/analytics', auth, async (req, res) => {
    try {
        const proposals = await Proposal.find({});

        const totalSubmitted = proposals.length;
        const totalWins = proposals.filter(p => p.status === 'Awarded').length;
        const totalLosses = proposals.filter(p => p.status === 'Lost').length;
        const totalSubmittedValue = proposals.reduce((acc, p) => acc + (p.submittedValue || 0), 0);
        const totalAwardedValue = proposals.reduce((acc, p) => p.status === 'Awarded' ? acc + (p.awardedValue || p.submittedValue || 0) : acc, 0);

        const winRate = totalSubmitted > 0 ? ((totalWins / (totalWins + totalLosses || 1)) * 100).toFixed(1) : 0;

        // Partner Usage Stats
        const partnerUsage = {};
        proposals.forEach(p => {
            p.partners.forEach(partner => {
                const name = partner.name || 'Unknown';
                partnerUsage[name] = (partnerUsage[name] || 0) + 1;
            });
        });

        // Loss Reasons
        const lossReasons = {};
        proposals.filter(p => p.status === 'Lost').forEach(p => {
            const reason = p.lossReason || 'Unknown';
            lossReasons[reason] = (lossReasons[reason] || 0) + 1;
        });

        res.json({
            kpis: {
                totalSubmitted,
                totalWins,
                totalLosses,
                totalSubmittedValue,
                totalAwardedValue,
                winRate
            },
            charts: {
                partnerUsage,
                lossReasons
            }
        });

    } catch (err) {
        console.error('Analytics Error:', err);
        res.status(500).json({ message: 'Failed to fetch analytics' });
    }
});

/* ================= GET ALL PROPOSALS ================= */
router.get('/', auth, async (req, res) => {
    try {
        const proposals = await Proposal.find({})
            .populate('lead', 'name agency value state')
            .populate('partners.partner', 'name')
            .sort({ submittedDate: -1 });
        console.log(`📋 Fetching ${proposals.length} proposals`);
        if (proposals.length > 0) {
            console.log('First proposal state:', proposals[0].state);
            console.log('First proposal lead state:', proposals[0].lead?.state);
        }
        res.json(proposals);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

/* ================= CREATE PROPOSAL ================= */
router.post('/', auth, async (req, res) => {
    try {
        console.log('✅ Create Proposal - Received data:', req.body);
        console.log('✅ State field:', req.body.state);

        const proposalData = {
            lead: req.body.lead,
            solicitationNumber: req.body.solicitationNumber || '',
            agency: req.body.agency || '',
            state: req.body.state || '',
            sector: req.body.sector || 'State',
            status: req.body.status || 'Draft',
            submittedDate: req.body.submittedDate,
            submittedValue: req.body.submittedValue || 0,
            role: req.body.role || 'Prime',
            createdBy: req.user.id,
            history: [{
                action: 'Created',
                user: req.user.id,
                details: 'Proposal record initialized'
            }]
        };

        console.log('📝 Creating proposal with data:', proposalData);
        const proposal = await Proposal.create(proposalData);
        console.log('✅ Proposal created successfully:', proposal._id);
        console.log('✅ Saved state:', proposal.state);

        // Optionally update Lead stage
        if (req.body.updateLeadStage && req.body.lead) {
            await Lead.findByIdAndUpdate(req.body.lead, { stage: 'opp in-progress' });
        }

        req.app.get('io').emit('proposals:updated');
        res.status(201).json(proposal);
    } catch (err) {
        console.error("❌ Create Proposal Error:", err);
        res.status(500).json({ message: 'Failed to create proposal', error: err.message });
    }
});

/* ================= UPDATE PROPOSAL ================= */
router.put('/:id', auth, async (req, res) => {
    try {
        console.log('✅ Update Proposal - Received data:', req.body);
        console.log('✅ State field:', req.body.state);

        const oldProposal = await Proposal.findById(req.params.id);
        if (!oldProposal) return res.status(404).json({ message: 'Proposal not found' });

        // Add history entry if status changed
        let historyEntry = null;
        if (req.body.status && req.body.status !== oldProposal.status) {
            historyEntry = {
                action: 'Status Change',
                user: req.user.id,
                details: `Changed from ${oldProposal.status} to ${req.body.status}`
            };
        }

        // Build update data
        const updateData = {
            lead: req.body.lead,
            solicitationNumber: req.body.solicitationNumber,
            agency: req.body.agency,
            state: req.body.state,
            sector: req.body.sector,
            status: req.body.status,
            submittedDate: req.body.submittedDate,
            submittedValue: req.body.submittedValue,
            role: req.body.role
        };

        if (historyEntry) {
            updateData.$push = { history: historyEntry };
        }

        console.log('📝 Updating proposal with data:', updateData);
        const proposal = await Proposal.findByIdAndUpdate(req.params.id, updateData, { new: true });
        console.log('✅ Proposal updated successfully');
        console.log('✅ Updated state:', proposal.state);

        req.app.get('io').emit('proposals:updated');
        res.json(proposal);
    } catch (err) {
        console.error("❌ Update Proposal Error:", err);
        res.status(500).json({ message: 'Failed to update proposal', error: err.message });
    }
});

/* ================= UPLOAD DOC ================= */
router.post('/:id/upload', auth, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    try {
        const document = {
            name: req.file.originalname,
            type: req.body.type || 'Other',
            url: `/uploads/proposals/${req.file.filename}`,
            uploadedBy: req.user.id
        };

        const proposal = await Proposal.findByIdAndUpdate(
            req.params.id,
            { $push: { documents: document } },
            { new: true }
        );

        res.json(proposal);
    } catch (err) {
        res.status(500).json({ message: 'Upload failed' });
    }
});

/* ================= DELETE DOCUMENT ================= */
router.delete('/:id/documents/:docId', auth, async (req, res) => {
    try {
        const proposal = await Proposal.findById(req.params.id);
        if (!proposal) return res.status(404).json({ message: 'Proposal not found' });

        // Find and remove document
        // We just pull from array by _id
        // (Assuming documents are subdocuments with _id, which Mongoose does by default if defined in schema or just pushed object)
        // If they are just objects without _id in schema definition, we might need to filter by other property, but usually they get _id.
        // Let's assume they have _id. If not, I'll need to check Schema.

        const docIndex = proposal.documents.findIndex(d => d._id.toString() === req.params.docId);
        if (docIndex === -1) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Optional: Delete file from filesystem?
        // const doc = proposal.documents[docIndex];
        // const filePath = path.join(__dirname, '..', doc.url);
        // if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        proposal.documents.splice(docIndex, 1);
        await proposal.save();

        res.json(proposal);
    } catch (err) {
        console.error("Delete Document fail:", err);
        res.status(500).json({ message: 'Failed to delete document' });
    }
});

/* ================= DELETE PROPOSAL ================= */
router.delete('/:id', auth, async (req, res) => {
    try {
        const proposal = await Proposal.findByIdAndDelete(req.params.id);
        if (!proposal) return res.status(404).json({ message: 'Proposal not found' });

        req.app.get('io').emit('proposals:updated');
        res.json({ message: 'Proposal deleted' });
    } catch (err) {
        console.error('Delete Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});



module.exports = router;
