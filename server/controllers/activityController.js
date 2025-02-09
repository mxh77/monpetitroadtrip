import Activity from '../models/Activity.js';
import Step from '../models/Step.js';
import Roadtrip from '../models/Roadtrip.js';
import File from '../models/File.js';
import { getCoordinates } from '../utils/googleMapsUtils.js';
import { uploadToGCS, deleteFromGCS } from '../utils/fileUtils.js';

// Méthode pour créer une nouvelle activité pour une étape donnée
export const createActivityForStep = async (req, res) => {
    try {
        const roadtrip = await Roadtrip.findById(req.params.idRoadtrip);
        const step = await Step.findById(req.params.idStep);

        console.log("Roadtrip: ", roadtrip);
        console.log("Step", step);

        if (!roadtrip) {
            return res.status(404).json({ msg: 'Roadtrip not found' });
        }

        if (!step) {
            return res.status(404).json({ msg: 'Step not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip et de l'étape
        if (roadtrip.userId.toString() !== req.user.id || step.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

                // Vérifier si le type de l'étape est 'Stop' et retourner une erreur si des accommodations existent
                if (step.type === 'Stop') {
                    return res.status(400).json({ msg: "Erreur lors de la création du Step : un step de type 'Stop' ne peut pas contenir d'activités" });
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

        // Obtenir les coordonnées géographiques à partir de l'adresse
        let coordinates = {};
        if (data.address) {
            try {
                coordinates = await getCoordinates(data.address);
            } catch (error) {
                console.error('Error getting coordinates:', error);
            }
        }

        const activity = new Activity({
            name: data.name,
            address: data.address,
            latitude: coordinates.lat,
            longitude: coordinates.lng,
            website: data.website,
            phone: data.phone,
            email: data.email,
            startDateTime: data.startDateTime,
            endDateTime: data.endDateTime,
            typeDuration: data.typeDuration,
            duration: data.duration,
            reservationNumber: data.reservationNumber,
            price: data.price,
            notes: data.notes,
            stepId: req.params.idStep,
            userId: req.user.id
        });

        // Télécharger les nouveaux fichiers
        if (req.files) {
            if (req.files.thumbnail) {
                console.log('Uploading thumbnail...');
                const url = await uploadToGCS(req.files.thumbnail[0], activity._id);
                const file = new File({ url, type: 'thumbnail' });
                await file.save();
                activity.thumbnail = file._id;
            }
            if (req.files.photos && req.files.photos.length > 0) {
                console.log('Uploading photos...');
                const photos = await Promise.all(req.files.photos.map(async (photo) => {
                    const url = await uploadToGCS(photo, activity._id);
                    const file = new File({ url, type: 'photo' });
                    await file.save();
                    return file._id;
                }));
                activity.photos.push(...photos);
                console.log('Updated activity photos:', activity.photos);
            }
            if (req.files.documents && req.files.documents.length > 0) {
                console.log('Uploading documents...');
                const documents = await Promise.all(req.files.documents.map(async (document) => {
                    const url = await uploadToGCS(document, activity._id);
                    const file = new File({ url, type: 'document' });
                    await file.save();
                    return file._id;
                }));
                activity.documents.push(...documents);
                console.log('Updated activity documents:', activity.documents);
            }
        }

        // Ajouter l'activité à la liste des activités de l'étape
        step.activities.push(activity._id);
        await step.save();

        await activity.save();
        res.status(201).json(activity);
    } catch (err) {
        console.error(err.message);
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ errors });
        }
        res.status(500).send('Server Error');
    }
};

// Méthode pour mettre à jour une activité (utilisé par la route PUT)
export const updateActivity = async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.idActivity);

        if (!activity) {
            return res.status(404).json({ msg: 'Activité non trouvée' });
        }

        // Vérifier si l'utilisateur est le propriétaire de l'activité
        if (activity.userId.toString() !== req.user.id) {
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


        // Obtenir les coordonnées géographiques à partir de l'adresse
        let coordinates = {};
        if (data.address) {
            try {
                coordinates = await getCoordinates(data.address);
                activity.latitude = coordinates.lat;
                activity.longitude = coordinates.lng;
            } catch (error) {
                console.error('Error getting coordinates:', error);
            }
        }

        // Mettre à jour les champs de l'activité
        activity.name = data.name || activity.name //Obligatoire
        activity.address = data.address
        activity.website = data.website
        activity.phone = data.phone
        activity.email = data.email
        activity.startDateTime = data.startDateTime
        activity.endDateTime = data.endDateTime
        activity.duration = data.duration
        activity.typeDuration = data.typeDuration
        activity.reservationNumber = data.reservationNumber
        activity.price = data.price
        activity.notes = data.notes

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
                        activity.photos = activity.photos.filter(f => f.toString() !== fileId.toString());
                        activity.documents = activity.documents.filter(f => f.toString() !== fileId.toString());
                        if (activity.thumbnail && activity.thumbnail.toString() === fileId.toString()) {
                            activity.thumbnail = null;
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
                if (activity.thumbnail) {
                    const oldThumbnail = await File.findById(activity.thumbnail);
                    if (oldThumbnail) {
                        await deleteFromGCS(oldThumbnail.url);
                        await oldThumbnail.deleteOne();
                    }
                }
                const url = await uploadToGCS(req.files.thumbnail[0], activity._id);
                const file = new File({ url, type: 'thumbnail' });
                await file.save();
                activity.thumbnail = file._id;
            }
            if (req.files.photos && req.files.photos.length > 0) {
                console.log('Uploading photos...');
                const photos = await Promise.all(req.files.photos.map(async (photo) => {
                    const url = await uploadToGCS(photo, activity._id);
                    const file = new File({ url, type: 'photo' });
                    await file.save();
                    return file._id;
                }));
                activity.photos.push(...photos);
                console.log('Updated activity photos:', activity.photos);
            }
            if (req.files.documents && req.files.documents.length > 0) {
                console.log('Uploading documents...');
                const documents = await Promise.all(req.files.documents.map(async (document) => {
                    const url = await uploadToGCS(document, activity._id);
                    const file = new File({ url, type: 'document' });
                    await file.save();
                    return file._id;
                }));
                activity.documents.push(...documents);
                console.log('Updated activity documents:', activity.documents);
            }
        }

        await activity.save();

        res.status(200).json(activity);
    } catch (err) {
        console.error(err.message);
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ errors });
        }
        res.status(500).send('Server error');
    }
};

// Méthode pour mettre à jour les dates d'une activité (utilisé par la route PATCH)
export const updateActivityDates = async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.idActivity);

        if (!activity) {
            return res.status(404).json({ msg: 'Activité non trouvée' });
        }

        // Vérifier si l'utilisateur est le propriétaire de l'activité
        if (activity.userId.toString() !== req.user.id) {
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

        // Mettre à jour les dates de l'activité
        activity.startDateTime = data.startDateTime;
        activity.endDateTime = data.endDateTime;

        await activity.save();
        res.json(activity);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};


// Méthode pour obtenir les informations d'une activité
export const getActivityById = async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.idActivity);

        if (!activity) {
            return res.status(404).json({ msg: 'Activité non trouvée' });
        }

        // Vérifier si l'utilisateur est le propriétaire de l'activité
        if (activity.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Ajouter les URLs aux attributs thumbnail, photos et documents
        if (activity.thumbnail) {
            const thumbnailFile = await File.findById(activity.thumbnail);
            if (thumbnailFile) {
                activity.thumbnailUrl = thumbnailFile.url;
            }
        }

        if (activity.photos && activity.photos.length > 0) {
            activity.photos = await Promise.all(activity.photos.map(async (photoId) => {
                const photoFile = await File.findById(photoId);
                return photoFile ? { _id: photoId, url: photoFile.url } : { _id: photoId };
            }));
        }

        if (activity.documents && activity.documents.length > 0) {
            activity.documents = await Promise.all(activity.documents.map(async (documentId) => {
                const documentFile = await File.findById(documentId);
                return documentFile ? { _id: documentId, url: documentFile.url } : { _id: documentId };
            }));
        }

        res.json(activity);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Méthode pour supprimer une activité
export const deleteActivity = async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.idActivity);

        // Vérifier si l'activité existe
        if (!activity) {
            return res.status(404).json({ msg: 'Activité non trouvée' });
        }

        // Vérifier si l'utilisateur est le propriétaire de l'activité
        if (activity.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Supprimer l'activité de la liste des activités de l'étape
        if (activity.stepId) {
            const step = await Step.findById(activity.stepId);
            step.activities = step.activities.filter(activityId => activityId.toString() !== req.params.idActivity);
            await step.save();
        }

        // Supprimer les fichiers de Google Cloud Storage
        if (activity.thumbnail) {
            const thumbnailFile = await File.findById(activity.thumbnail);
            if (thumbnailFile) {
                await deleteFromGCS(thumbnailFile.url);
                await thumbnailFile.deleteOne();
            }
        }

        if (activity.photos && activity.photos.length > 0) {
            await Promise.all(activity.photos.map(async (photoId) => {
                const photoFile = await File.findById(photoId);
                if (photoFile) {
                    await deleteFromGCS(photoFile.url);
                    await photoFile.deleteOne();
                }
            }));
        }

        if (activity.documents && activity.documents.length > 0) {
            await Promise.all(activity.documents.map(async (documentId) => {
                const documentFile = await File.findById(documentId);
                if (documentFile) {
                    await deleteFromGCS(documentFile.url);
                    await documentFile.deleteOne();
                }
            }));
        }

        // Supprimer l'activité
        await Activity.deleteOne({ _id: req.params.idActivity });

        res.json({ msg: 'Activité supprimée' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};