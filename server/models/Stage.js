const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const stageSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    roadtripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadtrip', required: true },
    name: { type: String, default: '' },
    address: { type: String, default: '' },
    nights: { type: Number, default: 1 },
    arrivalDateTime: { type: Date },
    departureDateTime: { type: Date },
    travelTime: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    files: [String],
    photos: [String],
    accommodations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Accommodation' }],
    activities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Activity' }]
});

module.exports = mongoose.model('Stage', stageSchema);