const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/classifierController');

router.get('/search',   ctrl.search);
router.get('/sections', ctrl.sections);
router.get('/points',   ctrl.points);
router.get('/names',    ctrl.names);
router.get('/models',   ctrl.modelsSearch);

module.exports = router;
