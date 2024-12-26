import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const { Schema } = mongoose;

const fileSchema = new Schema({
    fileId: { type: String, default: uuidv4, unique: true },
    url: { type: String, required: true },
    type: { type: String, enum: ['photo', 'document', 'thumbnail'], required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('File', fileSchema);