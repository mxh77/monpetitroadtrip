import mongoose from 'mongoose';

const { Schema } = mongoose;

const ActivitySchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stepId: { type: Schema.Types.ObjectId, ref: 'Step', required: true },
    name: { type: String, required: true },
    address: { type: String, default: '' },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
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
    photos: [{ type: Schema.Types.ObjectId, ref: 'File' }],
    documents: [{ type: Schema.Types.ObjectId, ref: 'File' }],
    thumbnail: { type: Schema.Types.ObjectId, ref: 'File' }
});

export default mongoose.model('Activity', ActivitySchema);