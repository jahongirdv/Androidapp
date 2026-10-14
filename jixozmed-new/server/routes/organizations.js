const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/organizationsController');
const authMiddleware = require('../middleware/authMiddleware');

// Публичный список (нужен для карты)
router.get('/', ctrl.list);

// Создание / удаление — только для авторизованных
router.post('/',      authMiddleware, ctrl.create);
router.delete('/:id', authMiddleware, ctrl.remove);

module.exports = router;
