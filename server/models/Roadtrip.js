import mongoose from 'mongoose';

const { Schema } = mongoose;

const roadtripSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    startLocation: { type: String, default: '' },
    startDateTime: { type: Date }, 
    endLocation: { type: String, default: '' },
    endDateTime: { type: Date }, 
    currency: { type: String, default: 'EUR' },
    notes: { type: String, default: '' },
    photos: [{ type: Schema.Types.ObjectId, ref: 'File' }],
    documents: [{ type: Schema.Types.ObjectId, ref: 'File' }],
    thumbnail: { type: Schema.Types.ObjectId, ref: 'File' },
    steps: [{ type: Schema.Types.ObjectId, ref: 'Step' }]
});

export default mongoose.model('Roadtrip', roadtripSchema);