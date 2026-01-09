const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sector: { type: String, enum: ['State', 'Federal', 'Others'], default: 'State' },
    type: {
        type: String,
        enum: ['Prime', 'Sub', 'JV', 'Technology', 'Reseller', 'Other'],
        default: 'Sub'
    },
    contactName: { type: String },
    email: { type: String },
    phone: { type: String },
    website: { type: String },
    state: { type: String },

    // Capability Info
    capabilities: { type: String }, // Manual description
    naicsCodes: [{ type: String }],
    skills: [{ type: String }],     // Auto-extracted skills
    agencies: [{ type: String }],   // Auto-extracted agency experience

    // Scoring & Rating
    status: {
        type: String,
        enum: ['Active', 'Vetted', 'Blacklisted', 'Prospective'],
        default: 'Prospective'
    },
    performanceRating: { type: Number, min: 1, max: 100, default: 50 }, // AI-powered rating 1-100

    // Files (Capability Statements)
    files: [{
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now }
    }],

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Partner', partnerSchema);
