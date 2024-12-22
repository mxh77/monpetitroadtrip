import mongoose from 'mongoose';
const { Schema } = mongoose;

export const AccommodationSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stageId: { type: Schema.Types.ObjectId, ref: 'Stage', required: true },
    name: { type: String, required: true },
    address: { type: String, default: '' },
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
    files: { type: [String] },
    photos: { type: [String] }
});

export default mongoose.model('Accommodation', AccommodationSchema);
