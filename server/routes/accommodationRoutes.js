import express from 'express';
import auth from '../middleware/auth.js';
import * as accommodationController from '../controllers/accommodationController.js';

const router = express.Router();

/********METHOD PUT ********/
//route pour modifier un hébergement
router.put('/:idAccommodation', auth, accommodationController.updateAccommodation);

/********METHOD GET********/
// Route protégée pour obtenir les informations d'un hébergement
router.get('/:idAccommodation', auth, accommodationController.getAccommodationById);

/********METHOD DELETE ********/
// Route protégée pour supprimer un hébergement
router.delete('/:idAccommodation', auth, accommodationController.deleteAccommodation);

export default router;