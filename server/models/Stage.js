import mongoose from 'mongoose';

const { Schema } = mongoose;

const stageSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    roadtripId: { type: Schema.Types.ObjectId, ref: 'Roadtrip', required: true },
    name: { type: String, default: '' },
    address: { type: String, default: '' },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    arrivalDateTime: { type: Date },
    departureDateTime: { type: Date },
    travelTime: { type: Number, default: 0 },
    isArrivalTimeConsistent: { type: Boolean, default: true }, // Nouveau champ pour stocker l'information de cohérence
    notes: { type: String, default: '' },
    photos: [{ type: Schema.Types.ObjectId, ref: 'File' }],
    documents: [{ type: Schema.Types.ObjectId, ref: 'File' }],
    thumbnail: { type: Schema.Types.ObjectId, ref: 'File' },
    accommodations: [{ type: Schema.Types.ObjectId, ref: 'Accommodation' }],
    activities: [{ type: Schema.Types.ObjectId, ref: 'Activity' }]
});

export default mongoose.model('Stage', stageSchema);