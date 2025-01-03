import Roadtrip from '../models/Roadtrip.js';
import File from '../models/File.js';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadToGCS, deleteFromGCS } from '../utils/fileUtils.js';
import dotenv, { populate } from 'dotenv';

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

        // Extraire les données JSON du champ 'data' si elles existent
        let data = {};
        if (req.body.data) {
            try {
                data = JSON.parse(req.body.data);
            } catch (error) {
                return res.status(400).json({ msg: 'Invalid JSON in data field' });
            }
        }

        // Mettre à jour les champs du roadtrip
        if (data.startDateTime && data.endDateTime) {
            const days = calculateDays(data.startDateTime, data.endDateTime);
            roadtrip.days = days;
        }

        if (data.name) roadtrip.name = data.name;
        if (data.startLocation) roadtrip.startLocation = data.startLocation;
        if (data.startDateTime) roadtrip.startDateTime = data.startDateTime;
        if (data.endLocation) roadtrip.endLocation = data.endLocation;
        if (data.endDateTime) roadtrip.endDateTime = data.endDateTime;
        if (data.currency) roadtrip.currency = data.currency;
        if (data.notes) roadtrip.notes = data.notes;
        if (data.stages) roadtrip.stages = data.stages;
        if (data.stops) roadtrip.stops = data.stops;

        // Gérer les suppressions différées
        if (data.existingFiles) {
            console.log('Processing existing files:', data.existingFiles);
            const existingFiles = data.existingFiles;
            for (const file of existingFiles) {
                console.log('Processing file:', file);
                if (file.isDeleted) {
                    console.log('Deleting file:', file.fileId);
                    const fileId = new mongoose.Types.ObjectId(file.fileId);
                    const fileToDelete = await File.findById(fileId);
                    if (fileToDelete) {
                        console.log('File found, deleting from GCS and database:', fileToDelete.url);
                        await deleteFromGCS(fileToDelete.url);
                        await fileToDelete.deleteOne();
                        roadtrip.photos = roadtrip.photos.filter(f => f.toString() !== fileId.toString());
                        roadtrip.documents = roadtrip.documents.filter(f => f.toString() !== fileId.toString());
                        if (roadtrip.thumbnail && roadtrip.thumbnail.toString() === fileId.toString()) {
                            roadtrip.thumbnail = null;
                        }
                    } else {
                        console.log('File not found:', file.fileId);
                    }
                }
            }
        }

        // Télécharger les nouveaux fichiers
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
            if (req.files.photos && req.files.photos.length > 0) {
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
            if (req.files.documents && req.files.documents.length > 0) {
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
        }

        await roadtrip.save();
        console.log('Roadtrip saved with updated files:', roadtrip);
        res.json(roadtrip);

    } catch (err) {
        console.error('Error updating roadtrip:', err.message);
        res.status(500).send('Server error');
    }
};

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

        const fileId = new mongoose.Types.ObjectId(req.params.fileId);
        const file = await File.findById(fileId);

        if (!file) {
            return res.status(404).json({ msg: 'File not found' });
        }

        // Supprimer le fichier de GCS
        await deleteFromGCS(file.url);

        // Supprimer le fichier de la collection File
        await file.deleteOne();

        // Supprimer le fichier du tableau photos, documents ou thumbnail du roadtrip
        roadtrip.photos = roadtrip.photos.filter(f => f.toString() !== fileId.toString());
        roadtrip.documents = roadtrip.documents.filter(f => f.toString() !== fileId.toString());
        if (roadtrip.thumbnail && roadtrip.thumbnail.toString() === fileId.toString()) {
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
            })
            .populate('photos')
            .populate('documents')
            .populate('thumbnail');

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
            .populate('stops',)
            .populate({
                path: 'stages',
                populate: {
                    path: 'accommodations',
                    populate: [
                        { path: 'photos', model: 'File' },
                        { path: 'documents', model: 'File' },
                        { path: 'thumbnail', model: 'File' }
                    ]
                }
            })
            .populate({
                path: 'stages',
                populate: {
                    path: 'activities',
                    populate: [
                        { path: 'photos', model: 'File' },
                        { path: 'documents', model: 'File' },
                        { path: 'thumbnail', model: 'File' }
                    ]

                }
            })
            .populate({
                path: 'stops',
                populate: [
                    { path: 'photos', model: 'File' },
                    { path: 'documents', model: 'File' },
                    { path: 'thumbnail', model: 'File' }
                ]
            })
            .populate('photos')
            .populate('documents')
            .populate('thumbnail');

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