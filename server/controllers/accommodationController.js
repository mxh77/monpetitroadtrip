import Accommodation from '../models/Accommodation.js';
import Stage from '../models/Stage.js';
import Roadtrip from '../models/Roadtrip.js';
import File from '../models/File.js';
import { getCoordinates } from '../utils/googleMapsUtils.js';
import { uploadToGCS, deleteFromGCS } from '../utils/fileUtils.js';

// Méthode pour créer un nouvel hébergement pour une étape donnée
export const createAccommodationForStage = async (req, res) => {
    try {
        const roadtrip = await Roadtrip.findById(req.params.idRoadtrip);
        const stage = await Stage.findById(req.params.idStage);

        console.log("Roadtrip: ", roadtrip);
        console.log("Stage", stage);

        if (!roadtrip) {
            return res.status(404).json({ msg: 'Roadtrip not found' });
        }

        if (!stage) {
            return res.status(404).json({ msg: 'Stage not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip et de l'étape
        if (roadtrip.userId.toString() !== req.user.id || stage.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
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

        const accommodation = new Accommodation({
            name: req.body.name,
            address: req.body.address,
            latitude: coordinates.lat,
            longitude: coordinates.lng,
            website: req.body.website,
            phone: req.body.phone,
            email: req.body.email,
            arrivalDateTime: req.body.arrivalDateTime,
            departureDateTime: req.body.departureDateTime,
            confirmationDateTime: req.body.confirmationDateTime,
            reservationNumber: req.body.reservationNumber,
            nights: req.body.nights,
            price: req.body.price,
            notes: req.body.notes,
            stageId: req.params.idStage,
            userId: req.user.id
        });

        // Télécharger les nouveaux fichiers
        if (req.files) {
            if (req.files.thumbnail) {
                console.log('Uploading thumbnail...');
                const url = await uploadToGCS(req.files.thumbnail[0], accommodation._id);
                const file = new File({ url, type: 'thumbnail' });
                await file.save();
                accommodation.thumbnail = file._id;
            }
            if (req.files.photos && req.files.photos.length > 0) {
                console.log('Uploading photos...');
                const photos = await Promise.all(req.files.photos.map(async (photo) => {
                    const url = await uploadToGCS(photo, accommodation._id);
                    const file = new File({ url, type: 'photo' });
                    await file.save();
                    return file._id;
                }));
                accommodation.photos.push(...photos);
                console.log('Updated accommodation photos:', accommodation.photos);
            }
            if (req.files.documents && req.files.documents.length > 0) {
                console.log('Uploading documents...');
                const documents = await Promise.all(req.files.documents.map(async (document) => {
                    const url = await uploadToGCS(document, accommodation._id);
                    const file = new File({ url, type: 'document' });
                    await file.save();
                    return file._id;
                }));
                accommodation.documents.push(...documents);
                console.log('Updated accommodation documents:', accommodation.documents);
            }
        }

        // Ajouter l'hébergement à la liste des hébergements de l'étape
        stage.accommodations.push(accommodation._id);
        await stage.save();

        await accommodation.save();
        res.status(201).json(accommodation);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Méthode pour mettre à jour un hébergement
export const updateAccommodation = async (req, res) => {
    try {
        const accommodation = await Accommodation.findById(req.params.idAccommodation);

        if (!accommodation) {
            return res.status(404).json({ msg: 'Accommodation not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire de l'hébergement
        if (accommodation.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Obtenir les coordonnées géographiques à partir de l'adresse
        let coordinates = {};
        if (req.body.address) {
            try {
                coordinates = await getCoordinates(req.body.address);
                accommodation.latitude = coordinates.lat;
                accommodation.longitude = coordinates.lng;
            } catch (error) {
                console.error('Error getting coordinates:', error);
            }
        }

        // Mettre à jour les champs de l'hébergement
        if (req.body.name) accommodation.name = req.body.name;
        if (req.body.address) accommodation.address = req.body.address;
        if (req.body.website) accommodation.website = req.body.website;
        if (req.body.phone) accommodation.phone = req.body.phone;
        if (req.body.email) accommodation.email = req.body.email;
        if (req.body.arrivalDateTime) accommodation.arrivalDateTime = req.body.arrivalDateTime;
        if (req.body.departureDateTime) accommodation.departureDateTime = req.body.departureDateTime;
        if (req.body.confirmationDateTime) accommodation.confirmationDateTime = req.body.confirmationDateTime;
        if (req.body.reservationNumber) accommodation.reservationNumber = req.body.reservationNumber;
        if (req.body.nights) accommodation.nights = req.body.nights;
        if (req.body.price) accommodation.price = req.body.price;
        if (req.body.notes) accommodation.notes = req.body.notes;

        // Gérer les suppressions différées
        if (req.body.existingFiles) {
            console.log('Processing existing files:', req.body.existingFiles);
            const existingFiles = req.body.existingFiles;
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
                        accommodation.photos = accommodation.photos.filter(f => f.toString() !== fileId.toString());
                        accommodation.documents = accommodation.documents.filter(f => f.toString() !== fileId.toString());
                        if (accommodation.thumbnail && accommodation.thumbnail.toString() === fileId.toString()) {
                            accommodation.thumbnail = null;
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
                if (accommodation.thumbnail) {
                    const oldThumbnail = await File.findById(accommodation.thumbnail);
                    if (oldThumbnail) {
                        await deleteFromGCS(oldThumbnail.url);
                        await oldThumbnail.deleteOne();
                    }
                }
                const url = await uploadToGCS(req.files.thumbnail[0], accommodation._id);
                const file = new File({ url, type: 'thumbnail' });
                await file.save();
                accommodation.thumbnail = file._id;
            }
            if (req.files.photos && req.files.photos.length > 0) {
                console.log('Uploading photos...');
                const photos = await Promise.all(req.files.photos.map(async (photo) => {
                    const url = await uploadToGCS(photo, accommodation._id);
                    const file = new File({ url, type: 'photo' });
                    await file.save();
                    return file._id;
                }));
                accommodation.photos.push(...photos);
                console.log('Updated accommodation photos:', accommodation.photos);
            }
            if (req.files.documents && req.files.documents.length > 0) {
                console.log('Uploading documents...');
                const documents = await Promise.all(req.files.documents.map(async (document) => {
                    const url = await uploadToGCS(document, accommodation._id);
                    const file = new File({ url, type: 'document' });
                    await file.save();
                    return file._id;
                }));
                accommodation.documents.push(...documents);
                console.log('Updated accommodation documents:', accommodation.documents);
            }
        }

        await accommodation.save();

        // Ajouter les URLs aux attributs thumbnail, photos et documents
        if (accommodation.thumbnail) {
            const thumbnailFile = await File.findById(accommodation.thumbnail);
            if (thumbnailFile) {
                accommodation.thumbnailUrl = thumbnailFile.url;
            }
        }

        if (accommodation.photos && accommodation.photos.length > 0) {
            accommodation.photos = await Promise.all(accommodation.photos.map(async (photoId) => {
                const photoFile = await File.findById(photoId);
                return photoFile ? { _id: photoId, url: photoFile.url } : { _id: photoId };
            }));
        }

        if (accommodation.documents && accommodation.documents.length > 0) {
            accommodation.documents = await Promise.all(accommodation.documents.map(async (documentId) => {
                const documentFile = await File.findById(documentId);
                return documentFile ? { _id: documentId, url: documentFile.url } : { _id: documentId };
            }));
        }

        res.json(accommodation);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Méthode pour obtenir les informations d'un hébergement
export const getAccommodationById = async (req, res) => {
    try {
        const accommodation = await Accommodation.findById(req.params.idAccommodation);

        if (!accommodation) {
            return res.status(404).json({ msg: 'Hébergement non trouvé !' });
        }

        // Vérifier si l'utilisateur est le propriétaire de l'hébergement
        if (accommodation.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Ajouter les URLs aux attributs thumbnail, photos et documents
        if (accommodation.thumbnail) {
            const thumbnailFile = await File.findById(accommodation.thumbnail);
            if (thumbnailFile) {
                accommodation.thumbnailUrl = thumbnailFile.url;
            }
        }

        if (accommodation.photos && accommodation.photos.length > 0) {
            accommodation.photos = await Promise.all(accommodation.photos.map(async (photoId) => {
                const photoFile = await File.findById(photoId);
                return photoFile ? { _id: photoId, url: photoFile.url } : { _id: photoId };
            }));
        }

        if (accommodation.documents && accommodation.documents.length > 0) {
            accommodation.documents = await Promise.all(accommodation.documents.map(async (documentId) => {
                const documentFile = await File.findById(documentId);
                return documentFile ? { _id: documentId, url: documentFile.url } : { _id: documentId };
            }));
        }

        res.json(accommodation);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Méthode pour supprimer un hébergement
export const deleteAccommodation = async (req, res) => {
    try {
        const accommodation = await Accommodation.findById(req.params.idAccommodation);

        // Vérifier si l'hébergement existe
        if (!accommodation) {
            return res.status(404).json({ msg: 'Hébergement non trouvé !' });
        }

        // Vérifier si l'utilisateur est le propriétaire de l'hébergement
        if (accommodation.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Supprimer l'hébergement de la liste des hébergements de l'étape
        if (accommodation.stageId) {
            const stage = await Stage.findById(accommodation.stageId);
            stage.accommodations = stage.accommodations.filter(accommodationId => accommodationId.toString() !== req.params.idAccommodation);
            await stage.save();
        }

        // Supprimer l'hébergement
        await Accommodation.deleteOne({ _id: req.params.idAccommodation });

        res.json({ msg: 'Accommodation removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};