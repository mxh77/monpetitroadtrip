import Accommodation from '../models/Accommodation.js';
import Stage from '../models/Stage.js';
import Roadtrip from '../models/Roadtrip.js';

// Méthode pour créer un nouvel hébergement pour une étape donnée
//format ES6
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

        const accommodation = new Accommodation({
            name: req.body.name,
            address: req.body.address,
            website: req.body.website,
            phone: req.body.phone,
            email: req.body.email,
            arrivalDateTime: req.body.arrivalDateTime,
            departureDateTime:req.body.departureDateTime,
            confirmationDateTime: req.body.confirmationDateTime,
            reservationNumber: req.body.reservationNumber,
            nights: req.body.nights,
            price: req.body.price,
            notes: req.body.notes,
            files: req.body.files,
            photos: req.body.photos,
            stageId: req.params.idStage,
            userId: req.user.id
        });

        //Ajouter l'hébergement à la liste des hébergements de l'étape
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

        const updatedAccommodation = {
            name: req.body.name ,
            address: req.body.address,
            website: req.body.website,
            phone: req.body.phone ,
            email: req.body.email ,
            arrivalDateTime: req.body.arrivalDateTime ,
            departureDateTime: req.body.departureDateTime,
            confirmationDateTime: req.body.confirmationDateTime,
            reservationNumber: req.body.reservationNumber ,
            nights: req.body.nights ,
            price: req.body.price ,
            notes: req.body.notes ,
            files: req.body.files ,
            photos: req.body.photos 
        };

        const accommodationUpdated = await Accommodation.findByIdAndUpdate(
            req.params.idAccommodation,
            { $set: updatedAccommodation },
            { new: true }
        );

        res.json(accommodationUpdated);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

//Méthode pour obtenir les informations d'un hébergement
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

        res.json(accommodation);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

//Méthode pour supprimer un hébergement
export const deleteAccommodation = async (req, res) => {
    try {
        const accommodation = await Accommodation.findById(req.params.idAccommodation);

        //Vérifier si l'hébergement existe
        if (!accommodation) {
            return res.status(404).json({ msg: 'Hébergement non trouvé !' });
        }

        // Vérifier si l'utilisateur est le propriétaire de l'hébergement'
        if (accommodation.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Supprimer l'hébergement de la liste des hébergements de l'étape
        if (accommodation.stageId) {
            const stage = await Stage.findById(accommodation.stageId);
            stage.accommodations = stage.accommodations.filter(accommodationId => accommodationId.toString() !== req.params.idAccommodation);
            await stage.save();
        }

        //Supprimer l'hébergement
        await Accommodation.deleteOne({ _id: req.params.idAccommodation });

        res.json({ msg: 'Stop removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
