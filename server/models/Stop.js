const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StopSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    roadtripId: { type: Schema.Types.ObjectId, ref: 'Roadtrip', required: true },
    name: { type: String, required: true },
    address: { type: String, default: '' },
    website: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    arrivalDateTime: { type: Date },
    departureDateTime: { type: Date },
    travelTime: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    typeDuration: {
        type: String,
        default: 'M',
        enum: {
            values: ['M', 'H', 'J'],
            message: 'Le type de durée doit être soit "M (Minutes)", "H (Heures)" ou "J (Jours)"'
        }
    },
    reservationNumber: { type: String, default: '' },
    price: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    files: { type: [String] },
    photos: { type: [String] }
});


module.exports = mongoose.model('Stop', StopSchema);