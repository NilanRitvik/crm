const mongoose = require('mongoose');

const stateCIOSchema = new mongoose.Schema({
    stateName: { type: String, required: true, unique: true }, // Full name or Code (e.g., "California" or "CA")
    cios: [{
        name: { type: String, default: '' },
        title: { type: String, default: '' },
        email: { type: String, default: '' },
        phone: { type: String, default: '' },
        photo: { type: String, default: '' } // Optional URL
    }]
});

module.exports = mongoose.model('StateCIO', stateCIOSchema);
