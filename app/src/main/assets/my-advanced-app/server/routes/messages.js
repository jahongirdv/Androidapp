const Router = require('express');
const messagesController = require('../controllers/messageController.js');

const router = Router();

router.get('/messages', messagesController.messagesGetmessages);

router.post('/messages', messagesController.messagesCreatePost);

router.get('/messages/:id', messagesController.messageGet);

router.delete('/messages/:id', messagesController.messageDelete);

router.put('/messages/:id', messagesController.messageUpdate);

module.exports = router;
