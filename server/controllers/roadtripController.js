import Roadtrip from '../models/Roadtrip.js';
import File from '../models/File.js';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadToGCS, deleteFromGCS } from '../utils/fileUtils.js';
import dotenv from 'dotenv';
import { calculateTravelTime } from '../utils/googleMapsUtils.js';
import Stage from '../models/Stage.js';
import Stop from '../models/Stop.js';
import { checkDateTimeConsistency } from '../utils/dateUtils.js';

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
        // Log pour vérifier le contenu de req.body
        console.log('req.body:', req.body);

        // Extraire les données JSON du champ 'data' si elles existent
        let data = {};
        if (req.body.data) {
            try {
                data = JSON.parse(req.body.data);
            } catch (error) {
                return res.status(400).json({ msg: 'Invalid JSON in data field' });
            }
        } else {
            // Si 'data' n'est pas présent, utiliser les champs individuels
            data = req.body;
        }

        // Log pour vérifier le contenu de data
        console.log('Data:', data);

        // Vérifier que les champs requis sont présents
        if (!data.name || !data.startDateTime || !data.endDateTime) {
            return res.status(400).json({ msg: 'Name, startDateTime, and endDateTime are required' });
        }

        const days = calculateDays(data.startDateTime, data.endDateTime);

        const newRoadtrip = new Roadtrip({
            userId: req.user.id,
            name: data.name,
            days: days, // Calcul automatique du nombre de jours
            startLocation: data.startLocation,
            startDateTime: data.startDateTime,
            endLocation: data.endLocation,
            endDateTime: data.endDateTime,
            currency: data.currency,
            notes: data.notes,
            stages: data.stages,
            stops: data.stops
        });

        // Télécharger le fichier thumbnail s'il existe
        if (req.files && req.files.thumbnail) {
            console.log('Uploading thumbnail...');
            const url = await uploadToGCS(req.files.thumbnail[0], newRoadtrip._id);
            const file = new File({ url, type: 'thumbnail' });
            await file.save();
            newRoadtrip.thumbnail = file._id;
        }
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
        } else {
            // Si 'data' n'est pas présent, utiliser les champs individuels
            data = req.body;
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
            .populate('stops')
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

        // Ajouter les URLs aux attributs thumbnail, photos et documents pour chaque accommodation et activity
        const stagesWithFiles = roadtrip.stages.map(stage => {
            stage.accommodations = stage.accommodations.map(accommodation => {
                if (accommodation.thumbnail) {
                    accommodation.thumbnailUrl = accommodation.thumbnail.url;
                }
                if (accommodation.photos && accommodation.photos.length > 0) {
                    accommodation.photos = accommodation.photos.map(photo => ({
                        _id: photo._id,
                        url: photo.url,
                        type: photo.type
                    }));
                }
                if (accommodation.documents && accommodation.documents.length > 0) {
                    accommodation.documents = accommodation.documents.map(document => ({
                        _id: document._id,
                        url: document.url,
                        type: document.type
                    }));
                }
                return accommodation;
            });

            stage.activities = stage.activities.map(activity => {
                if (activity.thumbnail) {
                    activity.thumbnailUrl = activity.thumbnail.url;
                }
                if (activity.photos && activity.photos.length > 0) {
                    activity.photos = activity.photos.map(photo => ({
                        _id: photo._id,
                        url: photo.url,
                        type: photo.type
                    }));
                }
                if (activity.documents && activity.documents.length > 0) {
                    activity.documents = activity.documents.map(document => ({
                        _id: document._id,
                        url: document.url,
                        type: document.type
                    }));
                }
                return activity;
            });

            return stage;
        });


        roadtrip.stages = stagesWithFiles;

        // Trier les `stages` par `arrivalDateTime`
        const sortedStages = roadtrip.stages
            .map(stage => stage.toObject())
            .sort((a, b) => new Date(a.arrivalDateTime) - new Date(b.arrivalDateTime));

        // Trier les `stops` par `arrivalDateTime`
        const sortedStops = roadtrip.stops
            .map(stop => stop.toObject())
            .sort((a, b) => new Date(a.arrivalDateTime) - new Date(b.arrivalDateTime));

        // Ajouter les listes triées à la réponse
        res.json({
            ...roadtrip.toObject(),
            stages: sortedStages,
            stops: sortedStops
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Méthode pour réactualiser les temps de trajet entre chaque étape
export const refreshTravelTimesForRoadtrip = async (req, res) => {
    try {
        const roadtrip = await Roadtrip.findById(req.params.idRoadtrip)
            .populate({
                path: 'stages',
                populate: [
                    {
                        path: 'accommodations',
                        populate: [
                            { path: 'photos', model: 'File' },
                            { path: 'documents', model: 'File' },
                            { path: 'thumbnail', model: 'File' }
                        ]
                    },
                    {
                        path: 'activities',
                        populate: [
                            { path: 'photos', model: 'File' },
                            { path: 'documents', model: 'File' },
                            { path: 'thumbnail', model: 'File' }
                        ]
                    }
                ]
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

        // Initialiser les stages et stops s'ils sont undefined
        roadtrip.stages = roadtrip.stages || [];
        roadtrip.stops = roadtrip.stops || [];

        // Combiner les stages et les stops dans un seul tableau
        const steps = [
            ...roadtrip.stages.map(stage => ({ ...stage.toObject(), type: 'stage' })),
            ...roadtrip.stops.map(stop => ({ ...stop.toObject(), type: 'stop' }))
        ];

        // Trier les étapes par ordre croissant de arrivalDateTime
        steps.sort((a, b) => new Date(a.arrivalDateTime) - new Date(b.arrivalDateTime));

        // Calculer et vérifier la cohérence des dates/heures pour chaque étape sauf la première
        const results = [];
        for (let i = 1; i < steps.length; i++) {
            const step = steps[i];
            const previousStep = steps[i - 1];

            const origin = previousStep.address;
            const destination = step.address;
            const arrivalDateTime = step.arrivalDateTime;

            console.log("Origin:", origin);
            console.log("Destination:", destination);
            const travelTime = await calculateTravelTime(origin, destination, arrivalDateTime);
            console.log("Travel time:", travelTime);

            // Vérifier la cohérence des dates/heures
            console.log("Previous Step Departure DateTime:", previousStep.departureDateTime);
            console.log("Step Arrival DateTime:", step.arrivalDateTime, "\n");
            const isConsistent = checkDateTimeConsistency(previousStep.departureDateTime, step.arrivalDateTime, travelTime);
            results.push({
                step: step,
                travelTime: travelTime,
                isConsistent: isConsistent
            });

            if (step.type === 'stage') {
                await Stage.findByIdAndUpdate(step._id, { travelTime });
            } else if (step.type === 'stop') {
                await Stop.findByIdAndUpdate(step._id, { travelTime });
            }
        }

        res.json({ steps: results });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
