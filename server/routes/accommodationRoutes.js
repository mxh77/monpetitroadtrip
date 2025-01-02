import express from 'express';
import multer from 'multer';
import { auth } from '../middleware/auth.js';
import * as accommodationController from '../controllers/accommodationController.js';

const router = express.Router();

// Configuration de multer pour gérer les uploads de fichiers
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

/********METHOD PUT ********/
//route pour modifier un hébergement avec une vignette, des photos ou des documents
router.put('/:idAccommodation', auth, upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'photos', maxCount: 10 },
    { name: 'documents', maxCount: 10 }
]), accommodationController.updateAccommodation);

/********METHOD GET********/
// Route protégée pour obtenir les informations d'un hébergement
router.get('/:idAccommodation', auth, accommodationController.getAccommodationById);

/********METHOD DELETE ********/
// Route protégée pour supprimer un hébergement
router.delete('/:idAccommodation', auth, accommodationController.deleteAccommodation);

export default router;