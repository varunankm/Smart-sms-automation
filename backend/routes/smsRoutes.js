const express = require('express');
const router = express.Router();
const multer = require('multer');
const smsController = require('../controllers/smsController');

const upload = multer({ dest: 'uploads/' });

// API routes for SMS app
router.post('/upload', upload.single('file'), smsController.uploadExcel);
router.post('/send', smsController.sendSms);
router.get('/status', smsController.getStatus);

module.exports = router;
