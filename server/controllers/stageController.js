const Roadtrip = require('../models/Roadtrip');
const Stage = require('../models/Stage');
const Stop = require('../models/Stop');
const Accommodation = require('../models/Accommodation');
const Activity = require('../models/Activity');
const { calculateTravelTime } = require('../utils/googleMapsUtils');


// Méthode pour créer une nouvelle étape pour un roadtrip donné
exports.createStageForRoadtrip = async (req, res) => {
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

        const newStage = new Stage({
            name: req.body.name, // Nom par défaut si non fourni
            address: req.body.address, // Adresse par défaut si non fournie
            nights: req.body.nights, // Nombre de nuits par défaut si non fourni
            arrivalDateTime: req.body.arrivalDateTime, // Date et heure d'arrivée
            departureDateTime: req.body.departureDateTime, // Date et heure de départ
            notes: req.body.notes, // Notes par défaut si non fournies
            files: req.body.files, // Fichiers par défaut si non fournis
            photos: req.body.photos, // Photos par défaut si non fournies 
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
exports.updateStage = async (req, res) => {
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

        // Récupérer le step précédent (stage ou stop) pour calculer le temps de trajet
        const lastStage = await Stage.find({ roadtripId: roadtrip._id, arrivalDateTime: { $lt: stage.arrivalDateTime } }).sort({ arrivalDateTime: -1 }).limit(1);
        const lastStop = await Stop.find({ roadtripId: roadtrip._id, arrivalDateTime: { $lt: stage.arrivalDateTime } }).sort({ arrivalDateTime: -1 }).limit(1);

        // Combiner les résultats et trouver le step le plus proche
        const lastSteps = [...lastStage, ...lastStop].sort((a, b) => new Date(b.arrivalDateTime) - new Date(a.arrivalDateTime));
        const lastStep = lastSteps.length > 0 ? lastSteps[0] : null;

        console.log("Last step : ", lastStep);

        let travelTime = null;
        if (lastStep) {
            try {
                travelTime = await calculateTravelTime(lastStep.address, req.body.address);
            } catch (error) {
                console.error('Error calculating travel time:', error);
            }
        }

        // Mettre à jour les champs de l'étape
        stage.name = req.body.name;
        stage.address = req.body.address;
        stage.arrivalDateTime = req.body.arrivalDateTime
        stage.departureDateTime = req.body.departureDateTime;
        stage.nights = req.body.nights;
        stage.notes = req.body.notes;
        stage.travelTime = travelTime; // Mettre à jour le temps de trajet


        // Mettre à jour les hébergements
        for (const accommodation of req.body.accommodations) {
            if (accommodation._id) {
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

        // Mettre à jour les activités
        for (const activity of req.body.activities) {
            if (activity._id) {
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

        const stageUpdated = await stage.save();

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
exports.getStagesByRoadtrip = async (req, res) => {
    try {
        const roadtrip = await Roadtrip.findById(req.params.idRoadtrip)
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

        res.json(roadtrip.stages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Méthode pour obtenir les informations d'une étape
exports.getStageById = async (req, res) => {
    try {
        const stage = await Stage.findById(req.params.idStage)
            .populate('accommodations')
            .populate('activities');

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
exports.deleteStage = async (req, res) => {
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
}