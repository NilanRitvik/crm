const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
    // Link to existing Lead/Opportunity
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
    solicitationNumber: String,
    agency: String, // Can autopopulate from Lead
    state: String, // Location/State
    sector: { type: String, enum: ['State', 'Federal', 'Others'], default: 'State' }, // Updated to 'Others'

    // Proposal Tracking
    status: {
        type: String,
        enum: ['Draft', 'Submitted', 'Under Evaluation', 'Awarded', 'Lost', 'Cancelled'],
        default: 'Draft'
    },
    submittedDate: Date,
    expectedAwardDate: Date,
    decisionDate: Date,

    // Financials
    submittedValue: Number,
    awardedValue: Number,
    currency: { type: String, default: 'USD' },

    // Teaming & Subcontractors
    role: { type: String, enum: ['Prime', 'Subcontractor', 'JV'], default: 'Prime' },
    partners: [{
        partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' }, // Optional link
        name: String, // For non-linked partners
        worksharePercentage: Number,
        subcontractValue: Number,
        role: String // e.g., 'Tech Sub', 'Staffing'
    }],
    totalTeamingPartners: { type: Number, default: 0 },

    // Document Management
    documents: [{
        name: String,
        type: { type: String, enum: ['Technical Volume', 'Pricing Volume', 'Past Performance', 'Solicitation', 'Amendment', 'Final Proposal', 'Other'] },
        url: String,
        version: { type: Number, default: 1 },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now }
    }],

    // Win/Loss Intelligence
    winProbability: Number, // Snapshot at submission
    outcome: { type: String, enum: ['Pending', 'Won', 'Lost', 'Cancelled'] },
    lossReason: {
        type: String,
        enum: ['Price', 'Technical', 'Past Performance', 'Incumbent Recompete', 'Compliance', 'Client Relationship', 'Unknown', 'N/A']
    },
    lossNotes: String,
    debriefDocumentUrl: String,

    // Audit Trail
    history: [{
        action: String, // e.g., 'Status Changed to Submitted'
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        details: String
    }],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Middleware removed to prevent 'next is not a function' error
// proposalSchema.pre('save', function (next) {
//     if (this.partners) {
//         this.totalTeamingPartners = this.partners.length;
//     }
//     next();
// });

module.exports = mongoose.model('Proposal', proposalSchema);
