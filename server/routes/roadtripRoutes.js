import express from 'express';
import { auth } from '../middleware/auth.js';
import * as roadtripController from '../controllers/roadtripController.js';
import * as stageController from '../controllers/stageController.js';
import * as stopController from '../controllers/stopController.js';
import * as accommodationController from '../controllers/accommodationController.js';
import * as activityController from '../controllers/activityController.js';
import { uploadPhotos, uploadThumbnail } from '../utils/fileUtils.js';
import multer from 'multer';

const router = express.Router();

// Configuration de multer pour gérer les uploads de fichiers
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

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
// Route pour mettre à jour un roadtrip avec une vignette ou des photos
router.put('/:idRoadtrip', auth, upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'photos', maxCount: 10 }]), roadtripController.updateRoadtrip);

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

// Route protégée pour supprimer un fichier spécifique
router.delete('/:idRoadtrip/files/:fileId', auth, roadtripController.deleteFile);

export default router;