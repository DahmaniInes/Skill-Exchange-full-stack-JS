const express = require('express');
const router = express.Router();
const messengerController = require('../Controllers/Messengers');
const messageController = require('../Controllers/messageController');
const { audioUpload, upload, callRecordingUpload } = require('../Config/cloudinaryMessenger');
const verifyToken = require('../middleware/verifySession');




router.post('/upload', upload.single('file'), messageController.uploadFile);
router.get('/users', messengerController.getAllUsers);
router.post('/upload-audio', audioUpload.single('file'), messageController.uploadAudio);
router.post(
    '/upload-call-recording',
    verifyToken,
    callRecordingUpload.single('recording'),
    messageController.uploadCallRecording
  );

  
module.exports = router;