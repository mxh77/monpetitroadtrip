import express from 'express';
import auth from '../middleware/auth.js';
import { updateStage, getStageById, deleteStage } from '../controllers/stageController.js';

const router = express.Router();

/********METHOD PUT ********/
//route pour modifier une étape
router.put('/:idStage', auth, updateStage);

/********METHOD GET********/
// Route protégée pour obtenir les informations d'une étape
router.get('/:idStage', auth, getStageById);

/********METHOD DELETE ********/
// Route protégée pour supprimer une étape
router.delete('/:idStage', auth, deleteStage);

export default router;