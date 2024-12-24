import Roadtrip from '../models/Roadtrip.js';

// Méthode pour créer un roadtrip
export const createRoadtrip = async (req, res) => {
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
            startDateTime: req.body.startDateTime,
            endDateTime: req.body.endDateTime,
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

// Méthode pour mettre à jour un roadtrip
export const updateRoadtrip = async (req, res) => {
    try {
        
        console.log('Données reçues pour la mise à jour:', req.body);
        
        const roadtrip = await Roadtrip.findById(req.params.idRoadtrip);

        if (!roadtrip) {
            return res.status(404).json({ msg: 'Roadtrip not found' });
        }

        // Vérifier si l'utilisateur est le propriétaire du roadtrip
        if (roadtrip.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Mettre à jour les champs du roadtrip
        roadtrip.name = req.body.name || roadtrip.name;
        roadtrip.days = req.body.days || roadtrip.days;
        roadtrip.startLocation = req.body.startLocation || roadtrip.startLocation;
        roadtrip.startDate = req.body.startDate || roadtrip.startDate;
        roadtrip.startTime = req.body.startTime || roadtrip.startTime;
        roadtrip.endLocation = req.body.endLocation || roadtrip.endLocation;
        roadtrip.endDate = req.body.endDate || roadtrip.endDate;
        roadtrip.endTime = req.body.endTime || roadtrip.endTime;
        roadtrip.startDateTime = req.body.startDateTime || roadtrip.startDateTime;
        roadtrip.endDateTime = req.body.endDateTime || roadtrip.endDateTime;
        roadtrip.currency = req.body.currency || roadtrip.currency;
        roadtrip.notes = req.body.notes || roadtrip.notes;
        roadtrip.stages = req.body.stages || roadtrip.stages;
        roadtrip.stops = req.body.stops || roadtrip.stops;

        const roadtripUpdated = await roadtrip.save();

        res.json(roadtripUpdated);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Méthode pour récupérer les roadtrips d'un user
export const getUserRoadtrips = async (req, res) => {
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
export const getRoadtripById = async (req, res) => {
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
export const deleteRoadtrip = async (req, res) => {
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