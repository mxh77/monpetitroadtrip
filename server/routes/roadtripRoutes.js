import express from 'express';
import { auth } from '../middleware/auth.js';
import * as roadtripController from '../controllers/roadtripController.js';
import * as stepController from '../controllers/stepController.js';
import * as accommodationController from '../controllers/accommodationController.js';
import * as activityController from '../controllers/activityController.js';
import multer from 'multer';

const router = express.Router();

// Configuration de multer pour gérer les uploads de fichiers
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

/***************************/
/********METHOD POST********/
/***************************/
// Route protégée pour créer un roadtrip
router.post('/', auth, upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'photos', maxCount: 10 },
    { name: 'documents', maxCount: 10 }
]), roadtripController.createRoadtrip);

// Route protégée pour créer un step pour un roadtrip
router.post('/:idRoadtrip/steps', auth, stepController.createStepForRoadtrip);

// Route protégée pour créer un hébergement lié à une étape de roadtrip
router.post('/:idRoadtrip/steps/:idStep/accommodations', auth, upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'photos', maxCount: 10 },
    { name: 'documents', maxCount: 10 }
]), accommodationController.createAccommodationForStep);

// Route protégée pour créer une activité liée à une étape de roadtrip
router.post('/:idRoadtrip/steps/:idStep/activities', auth, upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'photos', maxCount: 10 },
    { name: 'documents', maxCount: 10 }
]), activityController.createActivityForStep);

/***************************/
/********METHOD PUT*********/
/***************************/
// Route pour mettre à jour un roadtrip avec une vignette, des photos ou des documents
router.put('/:idRoadtrip', auth, upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'photos', maxCount: 10 },
    { name: 'documents', maxCount: 10 }
]), roadtripController.updateRoadtrip);

/***************************/
/********METHOD PATCH********/
/***************************/
// Route protégée pour réactualiser les temps de trajet entre chaque étape
router.patch('/:idRoadtrip/refresh-travel-times', auth, roadtripController.refreshTravelTimesForRoadtrip);


/***************************/
/********METHOD GET*********/
/***************************/
// Route protégée pour obtenir les roadtrips de l'utilisateur
router.get('/', auth, roadtripController.getUserRoadtrips);

// Route protégée pour obtenir un roadtrip spécifique
router.get('/:idRoadtrip', auth, roadtripController.getRoadtripById);

// Route protégée pour obtenir les étapes d'un roadtrip spécifique
router.get('/:idRoadtrip/steps', auth, stepController.getStepsByRoadtrip);


/***************************/
/********METHOD DELETE******/
/***************************/
// Route protégée pour supprimer un roadtrip
router.delete('/:idRoadtrip', auth, roadtripController.deleteRoadtrip);

// Route protégée pour supprimer un fichier spécifique
router.delete('/:idRoadtrip/files/:fileId', auth, roadtripController.deleteFile);

export default router;