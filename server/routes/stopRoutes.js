import express from 'express';
import { check, validationResult } from 'express-validator';
import { auth } from '../middleware/auth.js';
import * as stopController from '../controllers/stopController.js';

const router = express.Router();

/********METHOD PUT ********/
//route pour modifier un arrêt
router.put('/:idStop', auth, stopController.updateStop);

/********METHOD GET********/
// Route protégée pour obtenir les informations d'un arrêt
router.get('/:idStop', auth, stopController.getStopById);

/********METHOD DELETE ********/
// Route protégée pour supprimer un arrêt
router.delete('/:idStop', auth, stopController.deleteStop);

export default router;