import Roadtrip from '../models/Roadtrip.js';
import Step from '../models/Step.js';
import Accommodation from '../models/Accommodation.js';
import Activity from '../models/Activity.js';
import File from '../models/File.js';
import { calculateTravelTime, getCoordinates } from '../utils/googleMapsUtils.js';
import { uploadToGCS, deleteFromGCS } from '../utils/fileUtils.js';
import e from 'express';
import { checkDateTimeConsistency } from '../utils/dateUtils.js';

// Méthode pour créer un nouveau step pour un roadtrip donné
export const createStepForRoadtrip = async (req, res) => {
    try {
        const roadtrip = await Roadtrip.findById(req.params.idRoadtrip);

        if (!roadtrip) {
            return res.status(404).json({ msg: 'Roadtrip not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip
        if (roadtrip.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Récupérer le step précédent (stage ou stop) pour calculer le temps de trajet
        const lastSteps = await Step.find({ roadtripId: roadtrip._id }).sort({ arrivalDateTime: -1 }).limit(1);
        const lastStep = lastSteps.length > 0 ? lastSteps[0] : null;

        let travelTime = null;
        if (lastStep) {
            try {
                travelTime = await calculateTravelTime(lastStep.address, req.body.address);
            } catch (error) {
                console.error('Error calculating travel time:', error);
            }
        }

        // Obtenir les coordonnées géographiques à partir de l'adresse
        let coordinates = {};
        if (req.body.address) {
            try {
                coordinates = await getCoordinates(req.body.address);
            } catch (error) {
                console.error('Error getting coordinates:', error);
            }
        }

        const newStep = new Step({
            type: req.body.type, // Type par défaut si non fourni
            name: req.body.name, // Nom par défaut si non fourni
            address: req.body.address, // Adresse par défaut si non fournie
            latitude: coordinates.lat,
            longitude: coordinates.lng,
            nights: req.body.nights, // Nombre de nuits par défaut si non fourni
            arrivalDateTime: req.body.arrivalDateTime, // Date et heure d'arrivée
            departureDateTime: req.body.departureDateTime, // Date et heure de départ
            notes: req.body.notes, // Notes par défaut si non fournies
            accommodations: req.body.accommodations, // Hébergements par défaut si non fournis
            activities: req.body.activities, // Activités par défaut si non fournies
            stops: req.body.stops,
            roadtripId: req.params.idRoadtrip,
            userId: req.user.id,
            travelTime: travelTime // Stocker le temps de trajet
        });

        const step = await newStep.save();

        // Ajouter l'ID de la nouvelle étape au tableau steps du roadtrip
        roadtrip.steps.push(step);
        await roadtrip.save();

        res.json(step);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Méthode pour mettre à jour un step
export const updateStep = async (req, res) => {
    try {
        const step = await Step.findById(req.params.idStep);

        if (!step) {
            return res.status(404).json({ msg: 'step not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip de l'étape 
        const roadtrip = await Roadtrip.findById(step.roadtripId);

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

        // Fusionner les données JSON et les champs directs
        const updateData = { ...data, ...req.body };

        // Mettre à jour les champs de l'étape
        if (updateData.name) step.name = updateData.name;
        if ('address' in updateData) {
            if (updateData.address) {
                step.address = updateData.address;
                // Obtenir les coordonnées géographiques à partir de l'adresse
                try {
                    const coordinates = await getCoordinates(updateData.address);
                    step.latitude = coordinates.lat;
                    step.longitude = coordinates.lng;
                } catch (error) {
                    console.error('Error getting coordinates:', error);
                }
            } else {
                step.address = '';
                step.latitude = null;
                step.longitude = null;
            }
        }
        if ('arrivalDateTime' in updateData) step.arrivalDateTime = updateData.arrivalDateTime;
        if ('departureDateTime' in updateData) step.departureDateTime = updateData.departureDateTime;
        if ('nights' in updateData) step.nights = updateData.nights;
        if ('notes' in updateData) step.notes = updateData.notes;


        // Mettre à jour les hébergements si type = 'stage'
        if (updateData.type === 'stage') {
            if (Array.isArray(updateData.accommodations)) {
                for (const accommodation of updateData.accommodations) {
                    if (accommodation._id) {
                        // Obtenir les coordonnées géographiques à partir de l'adresse de l'hébergement
                        if (accommodation.address) {
                            try {
                                const coordinates = await getCoordinates(accommodation.address);
                                accommodation.latitude = coordinates.lat;
                                accommodation.longitude = coordinates.lng;
                            } catch (error) {
                                console.error('Error getting coordinates for accommodation:', error);
                            }
                        }
                        // Mettre à jour l'hébergement existant
                        await Accommodation.findByIdAndUpdate(accommodation._id, accommodation, { new: true, runValidators: true });
                    } else {
                        // Ajouter un nouvel hébergement
                        const newAccommodation = new Accommodation(accommodation);
                        newAccommodation.stepId = step._id;
                        newAccommodation.userId = req.user.id; // Assurez-vous que l'utilisateur est défini
                        await newAccommodation.save();
                        step.accommodations.push(newAccommodation._id);
                    }
                }
            }
        }
        // Mettre à jour les activités si type = 'stage'
        if (updateData.type === 'stage') {
            if (Array.isArray(updateData.activities)) {
                for (const activity of updateData.activities) {
                    if (activity._id) {
                        // Obtenir les coordonnées géographiques à partir de l'adresse de l'activité
                        if (activity.address) {
                            try {
                                const coordinates = await getCoordinates(activity.address);
                                activity.latitude = coordinates.lat;
                                activity.longitude = coordinates.lng;
                            } catch (error) {
                                console.error('Error getting coordinates for activity:', error);
                            }
                        }
                        // Mettre à jour l'activité existante   
                        await Activity.findByIdAndUpdate(activity._id, activity, { new: true, runValidators: true });
                    } else {
                        // Ajouter une nouvelle activité
                        const newActivity = new Activity(activity);
                        newActivity.stepId = step._id;
                        newActivity.userId = req.user.id; // Assurez-vous que l'utilisateur est défini
                        await newActivity.save();
                        step.activities.push(newActivity._id);
                    }
                }
            }
        }

        // Gérer les suppressions différées
        if (updateData.existingFiles) {
            console.log('Processing existing files:', updateData.existingFiles);
            const existingFiles = updateData.existingFiles;
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
                        step.photos = step.photos.filter(f => f.toString() !== fileId.toString());
                        step.documents = step.documents.filter(f => f.toString() !== fileId.toString());
                        if (step.thumbnail && step.thumbnail.toString() === fileId.toString()) {
                            step.thumbnail = null;
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
                if (step.thumbnail) {
                    const oldThumbnail = await File.findById(step.thumbnail);
                    if (oldThumbnail) {
                        await deleteFromGCS(oldThumbnail.url);
                        await oldThumbnail.deleteOne();
                    }
                }
                const url = await uploadToGCS(req.files.thumbnail[0], step._id);
                const file = new File({ url, type: 'thumbnail' });
                await file.save();
                step.thumbnail = file._id;
            }
            if (req.files.photos && req.files.photos.length > 0) {
                console.log('Uploading photos...');
                const photos = await Promise.all(req.files.photos.map(async (photo) => {
                    const url = await uploadToGCS(photo, step._id);
                    const file = new File({ url, type: 'photo' });
                    await file.save();
                    return file._id;
                }));
                step.photos.push(...photos);
                console.log('Updated step photos:', step.photos);
            }
            if (req.files.documents && req.files.documents.length > 0) {
                console.log('Uploading documents...');
                const documents = await Promise.all(req.files.documents.map(async (document) => {
                    const url = await uploadToGCS(document, step._id);
                    const file = new File({ url, type: 'document' });
                    await file.save();
                    return file._id;
                }));
                step.documents.push(...documents);
                console.log('Updated step documents:', step.documents);
            }
        }

        const stepUpdated = await step.save();

        // Ajouter les URLs aux attributs thumbnail, photos et documents
        if (stepUpdated.thumbnail) {
            const thumbnailFile = await File.findById(stepUpdated.thumbnail);
            if (thumbnailFile) {
                stepUpdated.thumbnailUrl = thumbnailFile.url;
            }
        }

        if (stepUpdated.photos && stepUpdated.photos.length > 0) {
            stepUpdated.photos = await Promise.all(stepUpdated.photos.map(async (photoId) => {
                const photoFile = await File.findById(photoId);
                return photoFile ? { _id: photoId, url: photoFile.url } : { _id: photoId };
            }));
        }

        if (stepUpdated.documents && stepUpdated.documents.length > 0) {
            stepUpdated.documents = await Promise.all(stepUpdated.documents.map(async (documentId) => {
                const documentFile = await File.findById(documentId);
                return documentFile ? { _id: documentId, url: documentFile.url } : { _id: documentId };
            }));
        }

        // Récupérer les accommodations et activities associés
        const populatedStep = await Step.findById(stepUpdated._id)
            .populate('accommodations')
            .populate('activities');

        // Réactualiser le temps de trajet pour l'étape mise à jour
        await refreshTravelTimeForStep(populatedStep);

        res.json(populatedStep);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Méthode pour obtenir les informations de toutes les étapes d'un roadtrip
export const getStepsByRoadtrip = async (req, res) => {
    try {
        const roadtrip = await Roadtrip.findById(req.params.idRoadtrip);

        if (!roadtrip) {
            return res.status(404).json({ msg: 'Roadtrip not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip
        if (roadtrip.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        //récupérer les steps du roadtrip
        const steps = await Step.find({ roadtripId: req.params.idRoadtrip })
            .populate({
                path: 'accommodations',
                populate: [
                    { path: 'photos', model: 'File' },
                    { path: 'documents', model: 'File' },
                    { path: 'thumbnail', model: 'File' }
                ]
            })
            .populate({
                path: 'activities',
                populate: [
                    { path: 'photos', model: 'File' },
                    { path: 'documents', model: 'File' },
                    { path: 'thumbnail', model: 'File' }
                ]
            })
            .populate('photos')
            .populate('documents')
            .populate('thumbnail');

        res.json(steps);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Méthode pour obtenir les informations d'un step
export const getStepById = async (req, res) => {
    try {
        const step = await Step.findById(req.params.idStep)
            .populate({
                path: 'accommodations',
                populate: [
                    { path: 'photos', model: 'File' },
                    { path: 'documents', model: 'File' },
                    { path: 'thumbnail', model: 'File' }
                ]
            })
            .populate({
                path: 'activities',
                populate: [
                    { path: 'photos', model: 'File' },
                    { path: 'documents', model: 'File' },
                    { path: 'thumbnail', model: 'File' }
                ]
            })
            .populate('photos')
            .populate('documents')
            .populate('thumbnail');
        console.log("ID Step en paramètre : " + req.params.idStep);

        if (!step) {
            return res.status(404).json({ msg: 'Step not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip de l'étape 
        const roadtrip = await Roadtrip.findById(step.roadtripId);

        if (!roadtrip) {
            return res.status(404).json({ msg: 'Roadtrip not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip
        if (roadtrip.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        res.json(step);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

//Méthode pour supprimer une étape
export const deleteStep = async (req, res) => {
    try {
        const step = await Step.findById(req.params.idStep);

        if (!step) {
            return res.status(404).json({ msg: 'Step not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip de l'étape 
        const roadtrip = await Roadtrip.findById(step.roadtripId);

        if (!roadtrip) {
            return res.status(404).json({ msg: 'Roadtrip not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip
        if (roadtrip.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Supprimer le step de la liste des étapes du roadtrip
        roadtrip.steps = roadtrip.steps.filter(stepId => stepId.toString() !== req.params.idStep);
        await roadtrip.save();

        //Supprimer les fichiers associés
        if (step.thumbnail) {
            const thumbnail = await File.findById(step.thumbnail);
            if (thumbnail) {
                await deleteFromGCS(thumbnail.url);
                await thumbnail.deleteOne();
            }
        }

        if (step.photos && step.photos.length > 0) {
            for (const photoId of step.photos) {
                const photo = await File.findById(photoId);
                if (photo) {
                    await deleteFromGCS(photo.url);
                    await photo.deleteOne();
                }
            }
        }

        if (step.documents && step.documents.length > 0) {
            for (const documentId of step.documents) {
                const document = await File.findById(documentId);
                if (document) {
                    await deleteFromGCS(document.url);
                    await document.deleteOne();
                }
            }
        }

        // Supprimer les hébergements associés
        if (step.accommodations && step.accommodations.length > 0) {
            for (const accommodationId of step.accommodations) {
                const accommodation = await Accommodation.findById(accommodationId);
                if (accommodation) {
                    await accommodation.deleteOne();
                }
            }
        }

        // Supprimer les activités associées    
        if (step.activities && step.activities.length > 0) {
            for (const activityId of step.activities) {
                const activity = await Activity.findById(activityId);
                if (activity) {
                    await activity.deleteOne();
                }
            }
        }

        // Supprimer le step
        await Step.deleteOne({ _id: req.params.idStep });

        res.json({ msg: 'Step removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Wrapper pour appeler refreshTravelTimeForStep avec req et res
export const refreshTravelTimeForStepWrapper = async (req, res) => {
    try {
        const step = await Step.findById(req.params.idStep);

        if (!step) {
            return res.status(404).json({ msg: 'step not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip de l'étape
        const roadtrip = await Roadtrip.findById(step.roadtripId);

        if (!roadtrip) {
            return res.status(404).json({ msg: 'Roadtrip not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip
        if (roadtrip.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const updatedStep = await refreshTravelTimeForStep(step);
        res.json(updatedStep);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

//Méthode pour réactualiser le temps de trajet d'une étape par rapport à la précédente
export const refreshTravelTimeForStep = async (step) => {
    try {
        console.log('Refreshing travel time for step:', step._id);

        // Vérifier si l'utilisateur est le propriétaire du roadtrip de l'arrêt
        const roadtrip = await Roadtrip.findById(step.roadtripId);

        if (!roadtrip) {
            throw new Error('Roadtrip not found');
        }

        // Récupérer le step précédent (stage ou stop) pour calculer le temps de trajet
        const lastSteps = await Step.find({ roadtripId: roadtrip._id }).sort({ arrivalDateTime: -1 }).limit(2);
        const lastStep = lastSteps.length > 1 ? lastSteps[1] : null;
        
        let travelTime = null;
        let isArrivalTimeConsistent = true;
        if (lastStep) {
            try {
                travelTime = await calculateTravelTime(lastStep.address, step.address);
                console.log('Travel time:', travelTime);

                // Vérifier la cohérence des dates/heures
                isArrivalTimeConsistent = checkDateTimeConsistency(lastStep.departureDateTime, step.arrivalDateTime, travelTime);
            } catch (error) {
                console.error('Error calculating travel time:', error);
            }
        }

        step.travelTime = travelTime;
        step.isArrivalTimeConsistent = isArrivalTimeConsistent;
        const updatedStep = await step.save();

        return updatedStep;
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};