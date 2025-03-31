const express = require('express');
const router = express.Router();
const messengerController = require('../Controllers/Messengers');
const messageController = require('../Controllers/messageController');
const { audioUpload,upload } = require('../Config/cloudinaryMessenger');

router.post('/upload', upload.single('file'), messageController.uploadFile);
router.get('/users', messengerController.getAllUsers);
router.post('/upload-audio', audioUpload.single('file'), messageController.uploadAudio);

module.exports = router;