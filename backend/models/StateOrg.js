const mongoose = require('mongoose');

const stateOrgSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sector: { type: String, enum: ['State', 'Federal', 'Others'], default: 'State' },
    state: {
        type: String,
        required: true,
        enum: [
            'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'District of Columbia', 'Florida', 'Georgia',
            'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
            'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
            'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
            'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
            'Federal' // Added Federal as it's implied by "State / Federal"
        ]
    },
    files: [{
        name: String,
        url: String,
        fileType: String,
        size: Number,
        uploadedAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StateOrg', stateOrgSchema);
