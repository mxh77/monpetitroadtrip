import mongoose from 'mongoose';

const { Schema } = mongoose;

const roadtripSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    days: { type: Number, required: true },
    startLocation: { type: String, default: '' },
    startDateTime: { type: Date }, 
    endLocation: { type: String, default: '' },
    endDateTime: { type: Date }, 
    currency: { type: String, default: 'EUR' },
    notes: { type: String, default: '' },
    files: [String],
    photos: [String],
    stages: [{ type: Schema.Types.ObjectId, ref: 'Stage' }],
    stops: [{ type: Schema.Types.ObjectId, ref: 'Stop' }]
});

export default mongoose.model('Roadtrip', roadtripSchema);