import mongoose from 'mongoose';

const { Schema } = mongoose;

const stepSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    roadtripId: { type: Schema.Types.ObjectId, ref: 'Roadtrip', required: true },
    type: { type: String, enum: ['Stage', 'Stop'], default: 'Stage' },
    name: { type: String, default: '' },
    address: { type: String, default: '' },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    arrivalDateTime: { type: Date },
    departureDateTime: { type: Date },
    travelTime: { type: Number, default: 0 },
    isArrivalTimeConsistent: { type: Boolean, default: true },
    notes: { type: String, default: '' },
    photos: [{ type: Schema.Types.ObjectId, ref: 'File' }],
    documents: [{ type: Schema.Types.ObjectId, ref: 'File' }],
    thumbnail: { type: Schema.Types.ObjectId, ref: 'File' },
    accommodations: {
        type: [{ type: Schema.Types.ObjectId, ref: 'Accommodation' }],
        validate: {
            validator: function(v) {
                return this.type !== 'Stop' || v.length === 0;
            },
            message: 'Accommodations should not exist when type is Stop'
        }
    },
    activities: {
        type: [{ type: Schema.Types.ObjectId, ref: 'Activity' }],
        validate: {
            validator: function(v) {
                return this.type !== 'Stop' || v.length === 0;
            },
            message: 'Activities should not exist when type is Stop'
        }
    }
});

export default mongoose.model('Step', stepSchema);