const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roadtripController = require('../controllers/roadtripController');
const stageController = require('../controllers/stageController');
const stopController = require('../controllers/stopController');
const accommodationController = require('../controllers/accommodationController');
const activityController = require('../controllers/activityController');

/***************************/
/********METHOD POST********/
/***************************/
// Route protégée pour créer un roadtrip
router.post('/', auth, roadtripController.createRoadtrip);

// Route protégée pour créer une étape pour un roadtrip
router.post('/:idRoadtrip/stages', auth, stageController.createStageForRoadtrip);

// Route protégée pour créer un stop lié à un roadtrip
router.post('/:idRoadtrip/stops', auth, stopController.createStopForRoadtrip);

// Route protégée pour créer un hébergement lié à une étape de roadtrip
router.post('/:idRoadtrip/stages/:idStage/accommodations', auth, accommodationController.createAccommodationForStage);

// Route protégée pour créer une activité liée à une étape de roadtrip
router.post('/:idRoadtrip/stages/:idStage/activities', auth, activityController.createActivityForStage);



/***************************/
/********METHOD PUT*********/
/***************************/
// Route protégée pour modifier un roadtrip
router.put('/:idRoadtrip', auth, roadtripController.updateRoadtrip);



/***************************/
/********METHOD GET*********/
/***************************/
// Route protégée pour obtenir les roadtrips de l'utilisateur
router.get('/', auth, roadtripController.getUserRoadtrips);

// Route protégée pour obtenir un roadtrip spécifique
router.get('/:idRoadtrip', auth, roadtripController.getRoadtripById);

// Route protégée pour obtenir les étapes d'un roadtrip spécifique
router.get('/:idRoadtrip/stages', auth, stageController.getStagesByRoadtrip);



/***************************/
/********METHOD DELETE******/
/***************************/
// Route protégée pour supprimer un roadtrip
router.delete('/:idRoadtrip', auth, roadtripController.deleteRoadtrip);

module.exports = router;