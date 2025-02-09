import mongoose from 'mongoose';
const { Schema } = mongoose;

export const AccommodationSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stepId: { type: Schema.Types.ObjectId, ref: 'Step', required: true },
    name: { type: String, required: true },
    address: { type: String, default: '' },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    website: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    reservationNumber: { type: String, default: '' },
    confirmationDateTime: { type: Date, default: '' },
    arrivalDateTime: { type: Date },
    departureDateTime: { type: Date },
    nights: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    photos: [{ type: Schema.Types.ObjectId, ref: 'File' }],
    documents: [{ type: Schema.Types.ObjectId, ref: 'File' }],
    thumbnail: { type: Schema.Types.ObjectId, ref: 'File' },
});

export default mongoose.model('Accommodation', AccommodationSchema);
