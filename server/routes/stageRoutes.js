const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const stageController = require('../controllers/stageController');

/********METHOD PUT ********/
//route pour modifier une étape
router.put('/:idStage', auth, stageController.updateStage);

/********METHOD GET********/
// Route protégée pour obtenir les informations d'une étape
router.get('/:idStage', auth, stageController.getStageById);

/********METHOD DELETE ********/
// Route protégée pour supprimer une étape
router.delete('/:idStage', auth, stageController.deleteStage);

module.exports = router;