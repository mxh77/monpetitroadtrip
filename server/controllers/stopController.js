import Stage from '../models/Stage.js';
import Stop from '../models/Stop.js';
import Roadtrip from '../models/Roadtrip.js';
import { calculateTravelTime } from '../utils/googleMapsUtils.js';

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

        const stop = new Stop({
            name: req.body.name,
            address: req.body.address,
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
            files: req.body.files,
            photos: req.body.photos,
            roadtripId: req.params.idRoadtrip,
            userId: req.user.id,
            travelTime: travelTime // Stocker le temps de trajet
        });

        //Ajouter l'arrêt à la liste des arrêts du roadtrip
        roadtrip.stops.push(stop);
        await roadtrip.save();

        await stop.save();
        return res.status(201).json(stop); // Utilisez return pour arrêter l'exécution après avoir envoyé la réponse
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error'); // Utilisez return pour arrêter l'exécution après avoir envoyé la réponse
    }
};


// Méthode pour mettre à jour un arrêt
export const updateStop = async (req, res) => {
    try {
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

        // Récupérer le step précédent (stage ou stop) pour calculer le temps de trajet
        const lastStage = await Stage.find({ roadtripId: roadtrip._id, arrivalDateTime: { $lt: stop.arrivalDateTime } }).sort({ arrivalDateTime: -1 }).limit(1);
        const lastStop = await Stop.find({ roadtripId: roadtrip._id, arrivalDateTime: { $lt: stop.arrivalDateTime } }).sort({ arrivalDateTime: -1 }).limit(1);

        // Combiner les résultats et trouver le step le plus proche
        const lastSteps = [...lastStage, ...lastStop].sort((a, b) => new Date(b.arrivalDateTime) - new Date(a.arrivalDateTime));
        const lastStep = lastSteps.length > 0 ? lastSteps[0] : null;

        let travelTime = null;
        if (lastStep) {
            try {
                travelTime = await calculateTravelTime(lastStep.address, req.body.address);
            } catch (error) {
                console.error('Error calculating travel time:', error);
            }
        }

        const updatedStop = {
            name: req.body.name,
            address: req.body.address,
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
            travelTime: travelTime, // Stocker le temps de trajet
            files: req.body.files,
            photos: req.body.photos
        };

        const stopUpdated = await Stop.findByIdAndUpdate(
            req.params.idStop,
            { $set: updatedStop },
            { new: true }
        );

        res.json(stopUpdated);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

//Méthode pour obtenir les informations d'un arrêt
export const getStopById = async (req, res) => {
    try {
        const stop = await Stop.findById(req.params.idStop);

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

//Méthode pour supprimer un arrêt
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

        //Supprimer l'arrêt
        await Stop.deleteOne({ _id: req.params.idStop });

        res.json({ msg: 'Stop removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

