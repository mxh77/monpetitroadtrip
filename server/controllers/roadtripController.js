const Roadtrip = require('../models/Roadtrip');
const Stage = require('../models/Stage');
const Stop = require('../models/Stop');

// Méthode pour créer un roadtrip
exports.createRoadtrip = async (req, res) => {
    try {
        const newRoadtrip = new Roadtrip({
            userId: req.user.id,
            name: req.body.name,
            days: req.body.days,
            startLocation: req.body.startLocation,
            startDate: req.body.startDate,
            startTime: req.body.startTime,
            endLocation: req.body.endLocation,
            endDate: req.body.endDate,
            endTime: req.body.endTime,
            currency: req.body.currency,
            notes: req.body.notes,
            files: req.body.files,
            stages: req.body.stages,
            stops: req.body.stops
        });

        const roadtrip = await newRoadtrip.save();
        res.json(roadtrip);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

//Méthode pour mettre à jour un roadtrip
exports.updateRoadtrip = async (req, res) => {
    try {
        const roadtrip = await Roadtrip.findById(req.params.idRoadtrip);

        if (!roadtrip) {
            return res.status(404).json({ msg: 'Roadtrip not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip
        if (roadtrip.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const updatedRoadtrip = {
            name: req.body.name,
            days: req.body.days,
            startLocation: req.body.startLocation,
            startDate: req.body.startDate,
            startTime: req.body.startTime,
            endLocation: req.body.endLocation,
            endDate: req.body.endDate,
            endTime: req.body.endTime,
            currency: req.body.currency,
            notes: req.body.notes
        };

        const roadtripUpdated = await Roadtrip.findByIdAndUpdate(
            req.params.idRoadtrip,
            { $set: updatedRoadtrip },
            { new: true }
        ).populate('stages').populate('stops');

        res.json(roadtripUpdated);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Méthode pour récupérer les roadtrips d'un user
exports.getUserRoadtrips = async (req, res) => {
    try {
        const roadtrips = await Roadtrip.find({ userId: req.user.id })
        .populate('stages')
        .populate('stops')
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

        res.json(roadtrips);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Méthode pour récupérer un roadtrip
exports.getRoadtripById = async (req, res) => {
    try {
        const roadtrip = await Roadtrip.findById(req.params.idRoadtrip)
            .populate('stages')
            .populate('stops')
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

        res.json(roadtrip);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Méthode pour supprimer un roadtrip
exports.deleteRoadtrip = async (req, res) => {
    try {
        const roadtrip = await Roadtrip.findById(req.params.idRoadtrip);

        if (!roadtrip) {
            return res.status(404).json({ msg: 'Roadtrip not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip
        if (roadtrip.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await Roadtrip.deleteOne({ _id: req.params.idRoadtrip });
        res.json({ msg: 'Roadtrip removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};