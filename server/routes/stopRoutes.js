import express from 'express';
import multer from 'multer';
import { auth } from '../middleware/auth.js';
import * as stopController from '../controllers/stopController.js';

const router = express.Router();

// Configuration de multer pour gérer les uploads de fichiers
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

/********METHOD PUT ********/
// Route pour mettre à jour un arrêt avec une vignette, des photos ou des documents
router.put('/:idStop', auth, upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'photos', maxCount: 10 },
    { name: 'documents', maxCount: 10 }
]), stopController.updateStop);

/********METHOD PATCH ********/
// Route pour calculer le travelTime d'une étape par rapport à la précédente
router.patch('/:idStop/refresh-travel-time', auth, stopController.refreshTravelTimeForStepWrapper);

/********METHOD GET********/
// Route protégée pour obtenir les informations d'un arrêt
router.get('/:idStop', auth, stopController.getStopById);

/********METHOD DELETE ********/
// Route protégée pour supprimer un arrêt
router.delete('/:idStop', auth, stopController.deleteStop);

export default router;