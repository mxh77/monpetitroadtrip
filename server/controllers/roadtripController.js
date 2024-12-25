import Roadtrip from '../models/Roadtrip.js';
import { Storage } from '@google-cloud/storage';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Obtenir le répertoire courant
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration de Google Cloud Storage
const storage = new Storage({
    keyFilename: process.env.GOOGLE_CLOUD_KEYFILE, // Utilisez une variable d'environnement pour le chemin du fichier de clé
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID // Utilisez une variable d'environnement pour l'ID du projet
});

const bucket = storage.bucket('monpetitroadtrip'); // Remplacez par le nom de votre bucket

// Configuration de multer pour gérer les uploads de fichiers
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

// Fonction pour calculer le nombre de jours entre deux dates
const calculateDays = (startDateTime, endDateTime) => {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

// Fonction pour uploader un fichier sur Google Cloud Storage
const uploadToGCS = (file, roadtripId) => {
    return new Promise((resolve, reject) => {
        const newFileName = `${roadtripId}/${uuidv4()}-${path.extname(file.originalname)}`;
        const blob = bucket.file(newFileName);
        const blobStream = blob.createWriteStream({
            resumable: false,
            contentType: file.mimetype,
            metadata: {
                contentType: file.mimetype
            }
        });

        blobStream.on('error', (err) => {
            reject(err);
        });

        blobStream.on('finish', async () => {
            const [url] = await blob.getSignedUrl({
                action: 'read',
                expires: '03-01-2500' // Vous pouvez ajuster la date d'expiration selon vos besoins
            });
            resolve(url);
        });

        blobStream.end(file.buffer);
    });
};

// Fonction pour supprimer un fichier de Google Cloud Storage
const deleteFromGCS = (fileUrl) => {
    return new Promise((resolve, reject) => {
        let fileName;
        if (fileUrl.startsWith('https://storage.googleapis.com/')) {
            fileName = fileUrl.split('/').slice(4).join('/').split('?')[0];
        } else if (fileUrl.startsWith('https://storage.cloud.google.com/')) {
            fileName = fileUrl.split('/').slice(4).join('/').split('?')[0];
        } else if (fileUrl.startsWith('gs://')) {
            fileName = fileUrl.split('/').slice(3).join('/');
        } else {
            return reject(new Error('Invalid URL format'));
        }

        console.log(`Deleting file: ${fileName}`);

        const file = bucket.file(fileName);

        file.delete((err) => {
            if (err) {
                console.error(`Error deleting file: ${err.message}`);
                if (err.code === 404) {
                    reject(new Error('No such object'));
                } else {
                    reject(err);
                }
            } else {
                console.log(`File deleted successfully: ${fileName}`);
                resolve();
            }
        });
    });
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

// Nouvelle méthode pour uploader des photos pour un roadtrip existant
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

        const photoUrls = await Promise.all(req.files.map(file => uploadToGCS(file, roadtrip._id)));

        roadtrip.photos = roadtrip.photos.concat(photoUrls);
        await roadtrip.save();

        res.json(roadtrip);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Nouvelle méthode pour supprimer une photo d'un roadtrip
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

        const photoUrl = req.body.photoUrl;
        try {
            await deleteFromGCS(photoUrl);
        } catch (err) {
            if (err.message === 'No such object') {
                return res.status(404).json({ msg: 'Photo not found in Google Cloud Storage' });
            } else {
                throw err;
            }
        }

        roadtrip.photos = roadtrip.photos.filter(url => url !== photoUrl);
        await roadtrip.save();

        res.json(roadtrip);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Middleware pour gérer l'upload des photos
export const uploadPhotos = upload.array('photos', 10); // Limite à 10 fichiers

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