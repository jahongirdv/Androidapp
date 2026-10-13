const db = require('../db/queries.js');

const messagesCreateGet = (req, res) => {
  res.json({
    title: 'Create message',
    message: {},
  });
};

const messagesGetmessages = async (req, res) => {
  const messages = await db.getAllmessages();
  res.json({
    title: 'Create message',
    data: messages,
  });
};
const messageGet = async (req, res) => {
  const messageId = req.params.id;
  if (!messageId) throw new Error('No message id provided');
  try {
    const message = await db.getMessages(messageId);
    res.status(200).json({
      message: 'message exist',
      data: message,
    });
  } catch (err) {
    throw new Error('Error while fetching message:' + err);
  }
};
const messagesCreatePost = async (req, res) => {
  const message = req.body;
  if (!message || !message.name || !message.text)
    throw new Error('No message name provided');
  try {
    const row = await db.insertmessagename(message);
    res.status(201).json({
      message: 'message created',
      data: row,
    });
  } catch (err) {
    throw new Error('Error while creating message:' + err);
  }
};

const messageDelete = async (req, res) => {
  const messageId = req.params.id;
  if (!messageId) throw new Error('No message id provided');
  try {
    await db.deletMessage(id);
  } catch (err) {
    throw new Error('Error while deleting message:' + err);
  }
  res.status(200).json({
    message: 'message deleted',
    id: messageId,
  });
};
const messageUpdate = async (req, res) => {
  const { id } = req.params;
  const { name, text } = req.body;

  if (!id || !name || !text) throw new Error('Failed to update message');
  try {
    await db.updateMessage({ id, name, text });
  } catch (err) {
    throw new Error('Error while deleting message:' + err);
  }
  res.status(200).json({
    message: 'message updated',
    id,
  });
};

module.exports = {
  messagesCreateGet,
  messagesGetmessages,
  messagesCreatePost,
  messageDelete,
  messageUpdate,
  messageGet,
};
