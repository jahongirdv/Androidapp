const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/equipmentController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/',         ctrl.list);
router.get('/counts',   ctrl.counts);
router.post('/',        authMiddleware, ctrl.create);
router.delete('/:id',   authMiddleware, ctrl.remove);

module.exports = router;
