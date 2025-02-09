import Accommodation from '../models/Accommodation.js';
import Step from '../models/Step.js';
import Roadtrip from '../models/Roadtrip.js';
import File from '../models/File.js';
import { getCoordinates } from '../utils/googleMapsUtils.js';
import { uploadToGCS, deleteFromGCS } from '../utils/fileUtils.js';

// Méthode pour créer un nouvel hébergement pour une étape donnée
export const createAccommodationForStep = async (req, res) => {
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
            return res.status(400).json({ msg: "Erreur lors de la création du Step : un step de type 'Stop' ne peut pas avoir d'hébergements" });
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

        console.log("Created Data: ", data);

        // Obtenir les coordonnées géographiques à partir de l'adresse
        let coordinates = {};
        if (data.address) {
            try {
                coordinates = await getCoordinates(data.address);
            } catch (error) {
                console.error('Error getting coordinates:', error);
            }
        }

        const accommodation = new Accommodation({
            name: data.name,
            address: data.address,
            latitude: coordinates.lat,
            longitude: coordinates.lng,
            website: data.website,
            phone: data.phone,
            email: data.email,
            arrivalDateTime: data.arrivalDateTime,
            departureDateTime: data.departureDateTime,
            confirmationDateTime: data.confirmationDateTime,
            reservationNumber: data.reservationNumber,
            nights: data.nights,
            price: data.price,
            notes: data.notes,
            stepId: req.params.idStep,
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
        step.accommodations.push(accommodation._id);
        await step.save();

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

        console.log("Updated Data: ", data);

        // Obtenir les coordonnées géographiques à partir de l'adresse
        let coordinates = {};
        if (data.address) {
            try {
                coordinates = await getCoordinates(data.address);
                accommodation.latitude = coordinates.lat;
                accommodation.longitude = coordinates.lng;
            } catch (error) {
                console.error('Error getting coordinates:', error);
            }
        }

        // Mettre à jour les champs de l'hébergement
        accommodation.name = data.name || accommodation.name; //Obligatoire
        accommodation.address = data.address;
        accommodation.website = data.website;
        accommodation.phone = data.phone;
        accommodation.email = data.email;
        accommodation.arrivalDateTime = data.arrivalDateTime;
        accommodation.departureDateTime = data.departureDateTime;
        accommodation.confirmationDateTime = data.confirmationDateTime;
        accommodation.reservationNumber = data.reservationNumber;
        accommodation.nights = data.nights;
        accommodation.price = data.price;
        accommodation.notes = data.notes;

        console.log("Accommodation: ", accommodation);

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
        if (accommodation.stepId) {
            const step = await Step.findById(accommodation.stepId);
            step.accommodations = step.accommodations.filter(accommodationId => accommodationId.toString() !== req.params.idAccommodation);
            await step.save();
        }

        // Supprimer les fichiers de Google Cloud Storage
        if (accommodation.thumbnail) {
            const thumbnailFile = await File.findById(accommodation.thumbnail);
            if (thumbnailFile) {
                await deleteFromGCS(thumbnailFile.url);
                await thumbnailFile.deleteOne();
            }
        }

        if (accommodation.photos && accommodation.photos.length > 0) {
            await Promise.all(accommodation.photos.map(async (photoId) => {
                const photoFile = await File.findById(photoId);
                if (photoFile) {
                    await deleteFromGCS(photoFile.url);
                    await photoFile.deleteOne();
                }
            })
            );
        }

        if (accommodation.documents && accommodation.documents.length > 0) {
            await Promise.all(accommodation.documents.map(async (documentId) => {
                const documentFile = await File.findById(documentId);
                if (documentFile) {
                    await deleteFromGCS(documentFile.url);
                    await documentFile.deleteOne();
                }
            })
            );
        }

        // Supprimer l'hébergement
        await Accommodation.deleteOne({ _id: req.params.idAccommodation });

        res.json({ msg: 'Accommodation removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};