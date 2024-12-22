import express from 'express';
import { check, validationResult } from 'express-validator';
import auth from '../middleware/auth.js';
import activityController from '../controllers/activityController.js';

const router = express.Router();

/********METHOD PUT ********/
//route pour modifier un hébergement
router.put('/:idActivity', auth, activityController.updateActivity);

/********METHOD GET********/
// Route protégée pour obtenir les informations d'un hébergement
router.get('/:idActivity', auth, activityController.getActivityById);

/********METHOD DELETE ********/
// Route protégée pour supprimer un hébergement
router.delete('/:idActivity', auth, activityController.deleteActivity);

export default router;