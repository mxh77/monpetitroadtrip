const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roadtripSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    days: { type: Number, required: true },
    startLocation: { type: String, default: '' },
    startDateTime: { type: Date }, 
    endLocation: { type: String, default: '' },
    endDateTime: { type: Date }, 
    currency: { type: String, default: 'EUR' },
    notes: { type: String, default: '' },
    files: [String],
    stages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Stage' }],
    stops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Stop' }]
});



module.exports = mongoose.model('Roadtrip', roadtripSchema);