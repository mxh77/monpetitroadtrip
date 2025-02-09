import express from 'express';
import multer from 'multer';
import { auth } from '../middleware/auth.js';
import * as stageController from '../controllers/stageController.js';

const router = express.Router();

// Configuration de multer pour gérer les uploads de fichiers
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

/********METHOD POST ********/

/********METHOD PUT ********/
// Route pour mettre à jour un stage avec une vignette, des photos ou des documents
router.put('/:idStage', auth, upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'photos', maxCount: 10 },
    { name: 'documents', maxCount: 10 }
]), stageController.updateStage);

/********METHOD PATCH ********/
// Route pour calculer le travelTime d'une étape par rapport à la précédente
router.patch('/:idStage/refresh-travel-time', auth, stageController.refreshTravelTimeForStepWrapper);


/********METHOD GET********/
// Route protégée pour obtenir les informations d'une étape
router.get('/:idStage', auth, stageController.getStageById);

/********METHOD DELETE ********/
// Route protégée pour supprimer une étape
router.delete('/:idStage', auth, stageController.deleteStage);

export default router;