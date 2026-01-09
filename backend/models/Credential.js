const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema({
    portalName: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Credential', credentialSchema);
