import mongoose from 'mongoose';

const { Schema } = mongoose;

const stageSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    roadtripId: { type: Schema.Types.ObjectId, ref: 'Roadtrip', required: true },
    name: { type: String, default: '' },
    address: { type: String, default: '' },
    nights: { type: Number, default: 1 },
    arrivalDateTime: { type: Date },
    departureDateTime: { type: Date },
    travelTime: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    files: [String],
    photos: [String],
    accommodations: [{ type: Schema.Types.ObjectId, ref: 'Accommodation' }],
    activities: [{ type: Schema.Types.ObjectId, ref: 'Activity' }]
});

export default mongoose.model('Stage', stageSchema);