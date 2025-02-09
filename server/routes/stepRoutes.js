import express from 'express';
import multer from 'multer';
import { auth } from '../middleware/auth.js';
import * as stepController from '../controllers/stepController.js';

const router = express.Router();

// Configuration de multer pour gérer les uploads de fichiers
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

/********METHOD POST ********/

/********METHOD PUT ********/
// Route pour mettre à jour un step avec une vignette, des photos ou des documents
router.put('/:idStep', auth, upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'photos', maxCount: 10 },
    { name: 'documents', maxCount: 10 }
]), stepController.updateStep);

/********METHOD PATCH ********/
// Route pour calculer le travelTime d'un step par rapport au step précédent
router.patch('/:idStep/refresh-travel-time', auth, stepController.refreshTravelTimeForStepWrapper);


/********METHOD GET********/
// Route protégée pour obtenir les informations d'un step
router.get('/:idStep', auth, stepController.getStepById);

/********METHOD DELETE ********/
// Route protégée pour supprimer un step
router.delete('/:idStep', auth, stepController.deleteStep);

export default router;