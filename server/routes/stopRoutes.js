const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const stopController = require('../controllers/stopController');

/********METHOD PUT ********/
//route pour modifier un arrêt
router.put('/:idStop', auth, stopController.updateStop);

/********METHOD GET********/
// Route protégée pour obtenir les informations d'un arrêt
router.get('/:idStop', auth, stopController.getStopById);

/********METHOD DELETE ********/
// Route protégée pour supprimer un arrêt
router.delete('/:idStop', auth, stopController.deleteStop);

module.exports = router;