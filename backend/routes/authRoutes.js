const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Define Auth API endpoints
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/google', authController.googleLogin);
router.get('/google/callback', authController.googleCallback);

module.exports = router;
