import express from 'express';
import multer from 'multer';
import { auth } from '../middleware/auth.js';
import * as activityController from '../controllers/activityController.js';

const router = express.Router();

// Configuration de multer pour gérer les uploads de fichiers
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

/********METHOD PUT ********/
//route pour modifier une activité avec une vignette, des photos ou des documents
router.put('/:idActivity', auth, upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'photos', maxCount: 10 },
    { name: 'documents', maxCount: 10 }
]), activityController.updateActivity);

/********METHOD PATCH********/
// Route protégée pour modifier les dates d'une activité
router.patch('/:idActivity/dates', auth, activityController.updateActivityDates);

/********METHOD GET********/
// Route protégée pour obtenir les informations d'une activité
router.get('/:idActivity', auth, activityController.getActivityById);

/********METHOD DELETE ********/
// Route protégée pour supprimer un activité
router.delete('/:idActivity', auth, activityController.deleteActivity);

export default router;