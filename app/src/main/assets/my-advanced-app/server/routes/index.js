const messagesRoutes = require('./messages.js');

function registerRoutes(app) {
  app.use('/api', messagesRoutes);
}

module.exports = registerRoutes;
