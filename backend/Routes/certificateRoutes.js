const express = require('express');
const { generateCertificate } = require('../Controllers/certificateController');
const router = express.Router();

router.post('/generate-certificate', generateCertificate);

module.exports = router;
