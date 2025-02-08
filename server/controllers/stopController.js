import Stage from '../models/Stage.js';
import Stop from '../models/Stop.js';
import Roadtrip from '../models/Roadtrip.js';
import File from '../models/File.js';
import { calculateTravelTime, getCoordinates } from '../utils/googleMapsUtils.js';
import { uploadToGCS, deleteFromGCS } from '../utils/fileUtils.js';
import { checkDateTimeConsistency } from '../utils/dateUtils.js';

// Méthode pour créer un nouvel arrêt pour un roadtrip donné
export const createStopForRoadtrip = async (req, res) => {
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

        const stop = new Stop({
            name: req.body.name,
            address: req.body.address,
            latitude: coordinates.lat,
            longitude: coordinates.lng,
            website: req.body.website,
            phone: req.body.phone,
            email: req.body.email,
            arrivalDateTime: req.body.arrivalDateTime,
            departureDateTime: req.body.departureDateTime,
            duration: req.body.duration,
            typeDuration: req.body.typeDuration,
            reservationNumber: req.body.reservationNumber,
            price: req.body.price,
            notes: req.body.notes,
            roadtripId: req.params.idRoadtrip,
            userId: req.user.id,
            travelTime: travelTime // Stocker le temps de trajet
        });

        // Ajouter l'arrêt à la liste des arrêts du roadtrip
        roadtrip.stops.push(stop);
        await roadtrip.save();

        await stop.save();

        // Télécharger les nouveaux fichiers
        if (req.files) {
            if (req.files.thumbnail) {
                console.log('Uploading thumbnail...');
                const url = await uploadToGCS(req.files.thumbnail[0], stop._id);
                const file = new File({ url, type: 'thumbnail' });
                await file.save();
                stop.thumbnail = file._id;
            }
            if (req.files.photos && req.files.photos.length > 0) {
                console.log('Uploading photos...');
                const photos = await Promise.all(req.files.photos.map(async (photo) => {
                    const url = await uploadToGCS(photo, stop._id);
                    const file = new File({ url, type: 'photo' });
                    await file.save();
                    return file._id;
                }));
                stop.photos.push(...photos);
                console.log('Updated stop photos:', stop.photos);
            }
            if (req.files.documents && req.files.documents.length > 0) {
                console.log('Uploading documents...');
                const documents = await Promise.all(req.files.documents.map(async (document) => {
                    const url = await uploadToGCS(document, stop._id);
                    const file = new File({ url, type: 'document' });
                    await file.save();
                    return file._id;
                }));
                stop.documents.push(...documents);
                console.log('Updated stop documents:', stop.documents);
            }
        }

        await stop.save();

        res.status(201).json(stop);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Méthode pour mettre à jour un arrêt
export const updateStop = async (req, res) => {
    try {
        console.log('Updating stop:', req.params.idStop);
        const stop = await Stop.findById(req.params.idStop);

        if (!stop) {
            return res.status(404).json({ msg: 'Stop not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip de l'étape 
        const roadtrip = await Roadtrip.findById(stop.roadtripId);

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

        // Mettre à jour les champs de l'arrêt
        if (updateData.name) stop.name = updateData.name;
        if (updateData.address) {
            stop.address = updateData.address;
            // Obtenir les coordonnées géographiques à partir de l'adresse
            try {
                const coordinates = await getCoordinates(updateData.address);
                stop.latitude = coordinates.lat;
                stop.longitude = coordinates.lng;
            } catch (error) {
                console.error('Error getting coordinates:', error);
            }
        }
        if (updateData.website) stop.website = updateData.website;
        if (updateData.phone) stop.phone = updateData.phone;
        if (updateData.email) stop.email = updateData.email;
        if (updateData.arrivalDateTime) stop.arrivalDateTime = updateData.arrivalDateTime;
        if (updateData.departureDateTime) stop.departureDateTime = updateData.departureDateTime;
        if (updateData.duration) stop.duration = updateData.duration;
        if (updateData.typeDuration) stop.typeDuration = updateData.typeDuration;
        if (updateData.reservationNumber) stop.reservationNumber = updateData.reservationNumber;
        if (updateData.price) stop.price = updateData.price;
        if (updateData.notes) stop.notes = updateData.notes;

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
                        stop.photos = stop.photos.filter(f => f.toString() !== fileId.toString());
                        stop.documents = stop.documents.filter(f => f.toString() !== fileId.toString());
                        if (stop.thumbnail && stop.thumbnail.toString() === fileId.toString()) {
                            stop.thumbnail = null;
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
                if (stop.thumbnail) {
                    const oldThumbnail = await File.findById(stop.thumbnail);
                    if (oldThumbnail) {
                        await deleteFromGCS(oldThumbnail.url);
                        await oldThumbnail.deleteOne();
                    }
                }
                const url = await uploadToGCS(req.files.thumbnail[0], stop._id);
                const file = new File({ url, type: 'thumbnail' });
                await file.save();
                stop.thumbnail = file._id;
            }
            if (req.files.photos && req.files.photos.length > 0) {
                console.log('Uploading photos...');
                const photos = await Promise.all(req.files.photos.map(async (photo) => {
                    const url = await uploadToGCS(photo, stop._id);
                    const file = new File({ url, type: 'photo' });
                    await file.save();
                    return file._id;
                }));
                stop.photos.push(...photos);
                console.log('Updated stop photos:', stop.photos);
            }
            if (req.files.documents && req.files.documents.length > 0) {
                console.log('Uploading documents...');
                const documents = await Promise.all(req.files.documents.map(async (document) => {
                    const url = await uploadToGCS(document, stop._id);
                    const file = new File({ url, type: 'document' });
                    await file.save();
                    return file._id;
                }));
                stop.documents.push(...documents);
                console.log('Updated stop documents:', stop.documents);
            }
        }

        const stopUpdated = await stop.save();

        // Ajouter les URLs aux attributs thumbnail, photos et documents
        if (stopUpdated.thumbnail) {
            const thumbnailFile = await File.findById(stopUpdated.thumbnail);
            if (thumbnailFile) {
                stopUpdated.thumbnailUrl = thumbnailFile.url;
            }
        }

        if (stopUpdated.photos && stopUpdated.photos.length > 0) {
            stopUpdated.photos = await Promise.all(stopUpdated.photos.map(async (photoId) => {
                const photoFile = await File.findById(photoId);
                return photoFile ? { _id: photoId, url: photoFile.url } : { _id: photoId };
            }));
        }

        if (stopUpdated.documents && stopUpdated.documents.length > 0) {
            stopUpdated.documents = await Promise.all(stopUpdated.documents.map(async (documentId) => {
                const documentFile = await File.findById(documentId);
                return documentFile ? { _id: documentId, url: documentFile.url } : { _id: documentId };
            }));
        }

        // Réactualiser le temps de trajet pour l'étape mise à jour
        console.log('Refreshing travel time for stop:', stopUpdated._id);
        await refreshTravelTimeForStep(stopUpdated);

        res.json(stopUpdated);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Méthode pour obtenir les informations de tous les arrêts d'un roadtrip
export const getStopsByRoadtrip = async (req, res) => {
    try {
        const roadtrip = await Roadtrip.findById(req.params.idRoadtrip);

        if (!roadtrip) {
            return res.status(404).json({ msg: 'Roadtrip not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip
        if (roadtrip.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const stops = await Stop.find({ roadtripId: req.params.idRoadtrip })
            .populate('photos')
            .populate('documents')
            .populate('thumbnail');

        res.json(stops);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};


// Méthode pour obtenir les informations d'un arrêt
export const getStopById = async (req, res) => {
    try {
        const stop = await Stop.findById(req.params.idStop)
            .populate('photos')
            .populate('documents')
            .populate('thumbnail');;

        if (!stop) {
            return res.status(404).json({ msg: 'Stop not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire de l'arrêt
        if (stop.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        res.json(stop);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Méthode pour supprimer un arrêt
export const deleteStop = async (req, res) => {
    try {
        const stop = await Stop.findById(req.params.idStop);

        // Vérifier si l'arrêt existe
        if (!stop) {
            return res.status(404).json({ msg: 'Stop not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire de l'arrêt
        if (stop.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Supprimer l'arrêt de la liste des arrêts du roadtrip et/ou de l'étape
        if (stop.roadtripId) {
            const roadtrip = await Roadtrip.findById(stop.roadtripId);
            roadtrip.stops = roadtrip.stops.filter(stopId => stopId.toString() !== req.params.idStop);
            await roadtrip.save();
        }

        // Supprimer l'arrêt
        await Stop.deleteOne({ _id: req.params.idStop });

        res.json({ msg: 'Stop removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Wrapper pour appeler refreshTravelTimeForStep avec req et res
export const refreshTravelTimeForStepWrapper = async (req, res) => {
    try {
        const stop = await Stop.findById(req.params.idStop);

        if (!stop) {
            return res.status(404).json({ msg: 'Stop not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip de l'arrêt
        const roadtrip = await Roadtrip.findById(stop.roadtripId);

        if (!roadtrip) {
            return res.status(404).json({ msg: 'Roadtrip not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip
        if (roadtrip.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const updatedStop = await refreshTravelTimeForStep(stop);
        res.json(updatedStop);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Méthode pour réactualiser le temps de trajet d'un arrêt par rapport à l'étape précédente
export const refreshTravelTimeForStep = async (stop) => {
    try {
        console.log('Refreshing travel time for stop:', stop._id);

        // Vérifier si l'utilisateur est le propriétaire du roadtrip de l'arrêt
        const roadtrip = await Roadtrip.findById(stop.roadtripId);

        if (!roadtrip) {
            throw new Error('Roadtrip not found');
        }

        // Récupérer le step précédent (stage ou stop) pour calculer le temps de trajet
        const lastStages = await Stage.find({ roadtripId: roadtrip._id, arrivalDateTime: { $lt: stop.arrivalDateTime } }).sort({ arrivalDateTime: -1 }).limit(1);
        const lastStops = await Stop.find({ roadtripId: roadtrip._id, arrivalDateTime: { $lt: stop.arrivalDateTime } }).sort({ arrivalDateTime: -1 }).limit(1);

        // Combiner les résultats et trouver le step le plus proche
        const lastSteps = [...lastStages, ...lastStops].sort((a, b) => new Date(b.arrivalDateTime) - new Date(a.arrivalDateTime));
        const lastStep = lastSteps.length > 0 ? lastSteps[0] : null;

        let travelTime = null;
        let isArrivalTimeConsistent = true;
        if (lastStep) {
            try {
                travelTime = await calculateTravelTime(lastStep.address, stop.address);
                console.log('Travel time:', travelTime);

                // Vérifier la cohérence des dates/heures
                isArrivalTimeConsistent = checkDateTimeConsistency(lastStep.departureDateTime, stop.arrivalDateTime, travelTime);
            } catch (error) {
                console.error('Error calculating travel time:', error);
            }
        }

        stop.travelTime = travelTime;
        stop.isArrivalTimeConsistent = isArrivalTimeConsistent;
        const updatedStop = await stop.save();

        return updatedStop;
    } catch (err) {
        console.error(err.message);
        throw new Error('Error refreshing travel time for stop');
    }
};