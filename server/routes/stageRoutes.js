import express from 'express';
import { auth } from '../middleware/auth.js';
import * as stageController from '../controllers/stageController.js';

const router = express.Router();

/********METHOD POST ********/
//route pour ajouter des photos à une étape
router.post('/:idStage/photos', auth, stageController.uploadPhotos, stageController.uploadStagePhotos);

/********METHOD PUT ********/
//route pour modifier une étape
router.put('/:idStage', auth, stageController.updateStage);

/********METHOD GET********/
// Route protégée pour obtenir les informations d'une étape
router.get('/:idStage', auth, stageController.getStageById);

/********METHOD DELETE ********/
// Route protégée pour supprimer une étape
router.delete('/:idStage', auth, stageController.deleteStage);

// Route protégée pour supprimer une photo d'une étape
router.delete('/:idStage/photos', auth, stageController.deleteStagePhoto);

export default router;