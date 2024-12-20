const Activity = require('../models/Activity');
const Stage = require('../models/Stage');
const Roadtrip = require('../models/Roadtrip');

// Méthode pour créer une nouvelle activité pour une étape donnée
exports.createActivityForStage = async (req, res) => {
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

        const activity = new Activity({
            name: req.body.name,
            address: req.body.address,
            website: req.body.website,
            phone: req.body.phone,
            email: req.body.email,
            startDateTime: req.body.startDateTime,
            endDateTime:req.body.endDateTime,
            typeDuration: req.body.typeDuration,
            duration: req.body.duration,
            reservationNumber: req.body.reservationNumber,
            price: req.body.price,
            notes: req.body.notes,
            files: req.body.files,
            photos: req.body.photos,
            stageId: req.params.idStage,
            userId: req.user.id
        });

        //Ajouter l'arrêt à la liste des arrêts de l'étape  
        stage.activities.push(activity);
        await stage.save();

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

// Méthode pour mettre à jour une activité
exports.updateActivity = async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.idActivity);

        if (!activity) {
            return res.status(404).json({ msg: 'Activité non trouvée' });
        }

        // Vérifier si l'utilisateur est le propriétaire de l'activité
        if (activity.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }
        // Mettre à jour les champs de l'activité
        activity.name = req.body.name || activity.name;
        activity.address = req.body.address || activity.address;
        activity.website = req.body.website || activity.website;
        activity.phone = req.body.phone || activity.phone;
        activity.email = req.body.email || activity.email;
        activity.startDateTime = req.body.startDateTime || activity.startDateTime;
        activity.endDateTime = req.body.endDateTime || activity.endDateTime;
        activity.duration = req.body.duration || activity.duration;
        activity.typeDuration = req.body.typeDuration || activity.typeDuration;
        activity.reservationNumber = req.body.reservationNumber || activity.reservationNumber;
        activity.price = req.body.price || activity.price;
        activity.notes = req.body.notes || activity.notes;
        activity.files = req.body.files || activity.files;
        activity.photos = req.body.photos || activity.photos;

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

//Méthode pour obtenir les informations d'une activité
exports.getActivityById = async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.idActivity);

        if (!activity) {
            return res.status(404).json({ msg: 'Activité non trouvée' });
        }

        // Vérifier si l'utilisateur est le propriétaire de l'activité
        if (activity.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        res.json(activity);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

//Méthode pour supprimer une activité
exports.deleteActivity = async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.idActivity);

        //Vérifier si l'activité existe
        if (!activity) {
            return res.status(404).json({ msg: 'Activité non trouvée' });
        }

        // Vérifier si l'utilisateur est le propriétaire de l'activité
        if (activity.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Supprimer l'activité de la liste des activités de l'étape
        if (activity.stageId) {
            const stage = await Stage.findById(activity.stageId);
            stage.activities = stage.activities.filter(activityId => activityId.toString() !== req.params.idActivity);
            await stage.save();
        }

        //Supprimer l'activité
        await Activity.deleteOne({ _id: req.params.idActivity });

        res.json({ msg: 'Activité supprimée' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};