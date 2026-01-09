const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    organization: { type: String },
    start: { type: Date, required: true },
    end: { type: Date }, // Optional, can default to start
    location: { type: String },
    url: { type: String },
    registrationStatus: {
        type: String,
        enum: ['Registered', 'Pending', 'Register Not Required'],
        default: 'Pending'
    },
    pointOfContact: { type: String },
    attendees: [{ type: String }],
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Owner
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
