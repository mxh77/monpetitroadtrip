import Roadtrip from '../models/Roadtrip.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { uploadPhotos, uploadEntityPhotos, deleteEntityPhoto } from '../utils/fileUtils.js';

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
            days: days,
            startLocation: req.body.startLocation,
            startDateTime: req.body.startDateTime,
            endLocation: req.body.endLocation,
            endDateTime: req.body.endDateTime,
            currency: req.body.currency,
            notes: req.body.notes,
            files: req.body.files,
            stages: req.body.stages,
            stops: req.body.stops
        });

        const roadtrip = await newRoadtrip.save();

        const photoUrls = await Promise.all(req.files.map(file => uploadToGCS(file, roadtrip._id)));

        roadtrip.photos = photoUrls;
        await roadtrip.save();

        res.json(roadtrip);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Méthode pour uploader des photos pour un roadtrip existant
export const uploadRoadtripPhotos = async (req, res) => {
    try {
        const roadtrip = await Roadtrip.findById(req.params.idRoadtrip);

        if (!roadtrip) {
            return res.status(404).json({ msg: 'Roadtrip not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip
        if (roadtrip.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await uploadEntityPhotos(req, res, roadtrip, roadtrip._id);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Méthode pour supprimer une photo d'un roadtrip
export const deleteRoadtripPhoto = async (req, res) => {
    try {
        const roadtrip = await Roadtrip.findById(req.params.idRoadtrip);

        if (!roadtrip) {
            return res.status(404).json({ msg: 'Roadtrip not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip
        if (roadtrip.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await deleteEntityPhoto(req, res, roadtrip);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Middleware pour gérer l'upload des photos
export { uploadPhotos };

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