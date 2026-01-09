const mongoose = require('mongoose');

const portalSchema = new mongoose.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true },
    category: { type: String, enum: ['State', 'Federal', 'Paid', 'Others'], required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Portal', portalSchema);
