const express = require('express');
const router = express.Router();
const instructorController = require('../Controllers/instructorController');

router.post('/', instructorController.createInstructor);
router.put('/:id', instructorController.updateInstructor);
router.delete('/:id', instructorController.deleteInstructor);

module.exports = router;
