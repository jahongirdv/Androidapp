const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/equipmentController');
const authMiddleware = require('../middleware/authMiddleware');

// Публичные (для чтения)
router.get('/',        ctrl.list);
router.get('/counts',  ctrl.counts);
router.get('/:id',     ctrl.getOne);

// Защищённые (изменение)
router.post('/',       authMiddleware, ctrl.create);
router.put('/:id',     authMiddleware, ctrl.update);
router.delete('/:id',  authMiddleware, ctrl.remove);

module.exports = router;
