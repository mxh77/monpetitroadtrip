const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const accommodationController = require('../controllers/accommodationController');

/********METHOD PUT ********/
//route pour modifier un hébergement
router.put('/:idAccommodation', auth, accommodationController.updateAccommodation);

/********METHOD GET********/
// Route protégée pour obtenir les informations d'un hébergement
router.get('/:idAccommodation', auth, accommodationController.getAccommodationById);

/********METHOD DELETE ********/
// Route protégée pour supprimer un hébergement
router.delete('/:idAccommodation', auth, accommodationController.deleteAccommodation);

module.exports = router;