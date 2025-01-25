import Roadtrip from '../models/Roadtrip.js';
import Stage from '../models/Stage.js';
import Stop from '../models/Stop.js';
import Accommodation from '../models/Accommodation.js';
import Activity from '../models/Activity.js';
import File from '../models/File.js';
import { calculateTravelTime, getCoordinates } from '../utils/googleMapsUtils.js';
import { uploadToGCS, deleteFromGCS } from '../utils/fileUtils.js';

// Méthode pour créer une nouvelle étape pour un roadtrip donné
export const createStageForRoadtrip = async (req, res) => {
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
        const lastStages = await Stage.find({ roadtripId: req.params.idRoadtrip }).sort({ arrivalDateTime: -1 }).limit(1);
        const lastStops = await Stop.find({ roadtripId: req.params.idRoadtrip }).sort({ arrivalDateTime: -1 }).limit(1);

        // Combiner les résultats et trouver le step le plus proche
        const lastSteps = [...lastStages, ...lastStops].sort((a, b) => new Date(b.arrivalDateTime) - new Date(a.arrivalDateTime));
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

        const newStage = new Stage({
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

        const stage = await newStage.save();

        // Ajouter l'ID de la nouvelle étape au tableau stages du roadtrip
        roadtrip.stages.push(stage);
        await roadtrip.save();

        res.json(stage);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Méthode pour mettre à jour une étape
export const updateStage = async (req, res) => {
    try {
        const stage = await Stage.findById(req.params.idStage);

        if (!stage) {
            return res.status(404).json({ msg: 'Stage not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip de l'étape 
        const roadtrip = await Roadtrip.findById(stage.roadtripId);

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
        if (updateData.name) stage.name = updateData.name;
        if ('address' in updateData) {
            if (updateData.address) {
                stage.address = updateData.address;
                // Obtenir les coordonnées géographiques à partir de l'adresse
                try {
                    const coordinates = await getCoordinates(updateData.address);
                    stage.latitude = coordinates.lat;
                    stage.longitude = coordinates.lng;
                } catch (error) {
                    console.error('Error getting coordinates:', error);
                }
            } else {
                stage.address = '';
                stage.latitude = null;
                stage.longitude = null;
            }
        }
        if ('arrivalDateTime' in updateData) stage.arrivalDateTime = updateData.arrivalDateTime;
        if ('departureDateTime' in updateData) stage.departureDateTime = updateData.departureDateTime;
        if ('nights' in updateData) stage.nights = updateData.nights;
        if ('notes' in updateData) stage.notes = updateData.notes;


        // Mettre à jour les hébergements
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
                    newAccommodation.stageId = stage._id;
                    newAccommodation.userId = req.user.id; // Assurez-vous que l'utilisateur est défini
                    await newAccommodation.save();
                    stage.accommodations.push(newAccommodation._id);
                }
            }
        }

        // Mettre à jour les activités
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
                    newActivity.stageId = stage._id;
                    newActivity.userId = req.user.id; // Assurez-vous que l'utilisateur est défini
                    await newActivity.save();
                    stage.activities.push(newActivity._id);
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
                        stage.photos = stage.photos.filter(f => f.toString() !== fileId.toString());
                        stage.documents = stage.documents.filter(f => f.toString() !== fileId.toString());
                        if (stage.thumbnail && stage.thumbnail.toString() === fileId.toString()) {
                            stage.thumbnail = null;
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
                if (stage.thumbnail) {
                    const oldThumbnail = await File.findById(stage.thumbnail);
                    if (oldThumbnail) {
                        await deleteFromGCS(oldThumbnail.url);
                        await oldThumbnail.deleteOne();
                    }
                }
                const url = await uploadToGCS(req.files.thumbnail[0], stage._id);
                const file = new File({ url, type: 'thumbnail' });
                await file.save();
                stage.thumbnail = file._id;
            }
            if (req.files.photos && req.files.photos.length > 0) {
                console.log('Uploading photos...');
                const photos = await Promise.all(req.files.photos.map(async (photo) => {
                    const url = await uploadToGCS(photo, stage._id);
                    const file = new File({ url, type: 'photo' });
                    await file.save();
                    return file._id;
                }));
                stage.photos.push(...photos);
                console.log('Updated stage photos:', stage.photos);
            }
            if (req.files.documents && req.files.documents.length > 0) {
                console.log('Uploading documents...');
                const documents = await Promise.all(req.files.documents.map(async (document) => {
                    const url = await uploadToGCS(document, stage._id);
                    const file = new File({ url, type: 'document' });
                    await file.save();
                    return file._id;
                }));
                stage.documents.push(...documents);
                console.log('Updated stage documents:', stage.documents);
            }
        }

        const stageUpdated = await stage.save();

        // Ajouter les URLs aux attributs thumbnail, photos et documents
        if (stageUpdated.thumbnail) {
            const thumbnailFile = await File.findById(stageUpdated.thumbnail);
            if (thumbnailFile) {
                stageUpdated.thumbnailUrl = thumbnailFile.url;
            }
        }

        if (stageUpdated.photos && stageUpdated.photos.length > 0) {
            stageUpdated.photos = await Promise.all(stageUpdated.photos.map(async (photoId) => {
                const photoFile = await File.findById(photoId);
                return photoFile ? { _id: photoId, url: photoFile.url } : { _id: photoId };
            }));
        }

        if (stageUpdated.documents && stageUpdated.documents.length > 0) {
            stageUpdated.documents = await Promise.all(stageUpdated.documents.map(async (documentId) => {
                const documentFile = await File.findById(documentId);
                return documentFile ? { _id: documentId, url: documentFile.url } : { _id: documentId };
            }));
        }

        // Récupérer les accommodations et activities associés
        const populatedStage = await Stage.findById(stageUpdated._id)
            .populate('accommodations')
            .populate('activities');

        res.json(populatedStage);

        // Log de l'étape mise à jour avec le détail complet des accommodations et activities
        //console.log("Stage updated : ", JSON.stringify(populatedStage, null, 2));


    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Méthode pour obtenir les informations de toutes les étapes d'un roadtrip
export const getStagesByRoadtrip = async (req, res) => {
    try {
        const roadtrip = await Roadtrip.findById(req.params.idRoadtrip);

        if (!roadtrip) {
            return res.status(404).json({ msg: 'Roadtrip not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip
        if (roadtrip.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        //récupérer les étapes du roadtrip
        const stages = await Stage.find({ roadtripId: req.params.idRoadtrip })
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

        res.json(stages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Méthode pour obtenir les informations d'une étape
export const getStageById = async (req, res) => {
    try {
        const stage = await Stage.findById(req.params.idStage)
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
        console.log("ID Stage en paramètre : " + req.params.idStage);

        if (!stage) {
            return res.status(404).json({ msg: 'Stage not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip de l'étape 
        const roadtrip = await Roadtrip.findById(stage.roadtripId);

        if (!roadtrip) {
            return res.status(404).json({ msg: 'Roadtrip not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip
        if (roadtrip.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }



        res.json(stage);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

//Méthode pour supprimer une étape
export const deleteStage = async (req, res) => {
    try {
        const stage = await Stage.findById(req.params.idStage);

        if (!stage) {
            return res.status(404).json({ msg: 'Stage not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip de l'étape 
        const roadtrip = await Roadtrip.findById(stage.roadtripId);

        if (!roadtrip) {
            return res.status(404).json({ msg: 'Roadtrip not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip
        if (roadtrip.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Supprimer l'étape de la liste des étapes du roadtrip
        roadtrip.stages = roadtrip.stages.filter(stageId => stageId.toString() !== req.params.idStage);
        await roadtrip.save();

        await Stage.deleteOne({ _id: req.params.idStage });
        res.json({ msg: 'Stage removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};