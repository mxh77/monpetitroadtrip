const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const activityController= require('../controllers/activityController');

/********METHOD PUT ********/
//route pour modifier un hébergement
router.put('/:idActivity', auth, activityController.updateActivity);

/********METHOD GET********/
// Route protégée pour obtenir les informations d'un hébergement
router.get('/:idActivity', auth, activityController.getActivityById);

/********METHOD DELETE ********/
// Route protégée pour supprimer un hébergement
router.delete('/:idActivity', auth, activityController.deleteActivity);

module.exports = router;