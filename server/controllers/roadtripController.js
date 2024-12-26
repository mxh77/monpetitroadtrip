import Roadtrip from '../models/Roadtrip.js';
import File from '../models/File.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadPhotos, uploadThumbnail, uploadToGCS, deleteFromGCS, uploadEntityImage } from '../utils/fileUtils.js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

dotenv.config();

// Obtenir le répertoire courant
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fonction pour calculer le nombre de jours entre deux dates
const calculateDays = (startDateTime, endDateTime) => {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

// Méthode pour créer un roadtrip
export const createRoadtrip = async (req, res) => {
    try {
        const days = calculateDays(req.body.startDateTime, req.body.endDateTime);

        const newRoadtrip = new Roadtrip({
            userId: req.user.id,
            name: req.body.name,
            days: days, // Calcul automatique du nombre de jours
            startLocation: req.body.startLocation,
            startDateTime: req.body.startDateTime,
            endLocation: req.body.endLocation,
            endDateTime: req.body.endDateTime,
            currency: req.body.currency,
            notes: req.body.notes,
            stages: req.body.stages,
            stops: req.body.stops
        });

        const roadtrip = await newRoadtrip.save();

        res.json(roadtrip);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};


// Méthode pour mettre à jour un roadtrip existant
export const updateRoadtrip = async (req, res) => {
    try {
        const roadtrip = await Roadtrip.findById(req.params.idRoadtrip);

        if (!roadtrip) {
            return res.status(404).json({ msg: 'Roadtrip not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip
        if (roadtrip.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Mettre à jour les champs du roadtrip
        if (req.body.startDateTime && req.body.endDateTime) {
            const days = calculateDays(req.body.startDateTime, req.body.endDateTime);
            roadtrip.days = days;
        }

        if (req.body.name) roadtrip.name = req.body.name;
        if (req.body.startLocation) roadtrip.startLocation = req.body.startLocation;
        if (req.body.startDateTime) roadtrip.startDateTime = req.body.startDateTime;
        if (req.body.endLocation) roadtrip.endLocation = req.body.endLocation;
        if (req.body.endDateTime) roadtrip.endDateTime = req.body.endDateTime;
        if (req.body.currency) roadtrip.currency = req.body.currency;
        if (req.body.notes) roadtrip.notes = req.body.notes;
        if (req.body.stages) roadtrip.stages = req.body.stages;
        if (req.body.stops) roadtrip.stops = req.body.stops;

        // Enregistrer les modifications avant de télécharger les fichiers
        await roadtrip.save();

        // Télécharger la vignette, les photos ou les documents uniquement après avoir confirmé que les modifications ont été enregistrées
        if (req.files) {
            if (req.files.thumbnail) {
                console.log('Uploading thumbnail...');
                // Supprimer l'ancienne image thumbnail si elle existe
                if (roadtrip.thumbnail) {
                    const oldThumbnail = await File.findById(roadtrip.thumbnail);
                    if (oldThumbnail) {
                        await deleteFromGCS(oldThumbnail.url);
                        await oldThumbnail.deleteOne();
                    }
                }
                const url = await uploadToGCS(req.files.thumbnail[0], roadtrip._id);
                const file = new File({ url, type: 'thumbnail' });
                await file.save();
                roadtrip.thumbnail = file._id;
            }
            if (req.files.photos) {
                console.log('Uploading photos...');
                const photos = await Promise.all(req.files.photos.map(async (photo) => {
                    const url = await uploadToGCS(photo, roadtrip._id);
                    const file = new File({ url, type: 'photo' });
                    await file.save();
                    return file._id;
                }));
                roadtrip.photos.push(...photos);
                console.log('Updated roadtrip photos:', roadtrip.photos);
            }
            if (req.files.documents) {
                console.log('Uploading documents...');
                const documents = await Promise.all(req.files.documents.map(async (document) => {
                    const url = await uploadToGCS(document, roadtrip._id);
                    const file = new File({ url, type: 'document' });
                    await file.save();
                    return file._id;
                }));
                roadtrip.documents.push(...documents);
                console.log('Updated roadtrip documents:', roadtrip.documents);
            }
            await roadtrip.save();
            console.log('Roadtrip saved with updated files:', roadtrip);
            res.json(roadtrip);
        } else {
            res.json(roadtrip);
        }

    } catch (err) {
        console.error('Error updating roadtrip:', err.message);
        res.status(500).send('Server error');
    }
};

// Middleware pour gérer l'upload des photos
export { uploadPhotos, uploadThumbnail };


// Méthode pour supprimer un fichier spécifique
export const deleteFile = async (req, res) => {
    try {
        const roadtrip = await Roadtrip.findById(req.params.idRoadtrip);

        if (!roadtrip) {
            return res.status(404).json({ msg: 'Roadtrip not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip
        if (roadtrip.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const fileId = req.params.fileId;
        const file = await File.findById(fileId);

        if (!file) {
            return res.status(404).json({ msg: 'File not found' });
        }

        // Supprimer le fichier de GCS
        await deleteFromGCS(file.url);

        // Supprimer le fichier de la collection File
        await file.deleteOne();

        // Supprimer le fichier du tableau photos, documents ou thumbnail du roadtrip
        roadtrip.photos = roadtrip.photos.filter(f => f.toString() !== fileId);
        roadtrip.documents = roadtrip.documents.filter(f => f.toString() !== fileId);
        if (roadtrip.thumbnail && roadtrip.thumbnail.toString() === fileId) {
            roadtrip.thumbnail = null;
        }

        await roadtrip.save();

        res.json({ msg: 'File removed' });
    } catch (err) {
        console.error('Error deleting file:', err.message);
        res.status(500).send('Server error');
    }
};

// Méthode pour supprimer un roadtrip
export const deleteRoadtrip = async (req, res) => {
    try {
        const roadtrip = await Roadtrip.findById(req.params.idRoadtrip);

        if (!roadtrip) {
            return res.status(404).json({ msg: 'Roadtrip not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip
        if (roadtrip.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await Roadtrip.deleteOne({ _id: req.params.idRoadtrip });

        res.json({ msg: 'Roadtrip removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Méthode pour récupérer les roadtrips d'un user
export const getUserRoadtrips = async (req, res) => {
    try {
        const roadtrips = await Roadtrip.find({ userId: req.user.id })
            .populate('stages')
            .populate('stops')
            .populate({
                path: 'stages',
                populate: {
                    path: 'accommodations',
                    model: 'Accommodation'
                }
            })
            .populate({
                path: 'stages',
                populate: {
                    path: 'activities',
                    model: 'Activity'
                }
            });

        res.json(roadtrips);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Méthode pour récupérer un roadtrip
export const getRoadtripById = async (req, res) => {
    try {
        const roadtrip = await Roadtrip.findById(req.params.idRoadtrip)
            .populate('stages')
            .populate('stops')
            .populate({
                path: 'stages',
                populate: {
                    path: 'accommodations',
                    model: 'Accommodation'
                }
            })
            .populate({
                path: 'stages',
                populate: {
                    path: 'activities',
                    model: 'Activity'
                }
            });

        if (!roadtrip) {
            return res.status(404).json({ msg: 'Roadtrip not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip
        if (roadtrip.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        res.json(roadtrip);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};