const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');

// API Endpoints
router.post('/analyze', resumeController.analyzeResume);
router.get('/jobs', resumeController.getJobRecommendations);

module.exports = router;