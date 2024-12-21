const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ActivitySchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stageId: { type: Schema.Types.ObjectId, ref: 'Stage', required: true },
    name: { type: String, required: true },
    address: { type: String, default: '' },
    website: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    startDateTime: { type: Date },
    endDateTime: { type: Date }, 
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


module.exports = mongoose.model('Activity', ActivitySchema);