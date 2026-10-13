// expressInit.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const messageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000,
  message: 'Too many requests overall. Please try again later.'
});

function initExpressApp(app) {
  // Locals
  app.locals.appName = 'SaraWebs PostgreSQL';
  app.locals.links = [
    { href: '/', text: 'Home' },
    { href: '/new', text: 'Create User' },
  ];
  app.use(cors());

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  // Logger
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    req.body ? console.log(req.body) : '';
    next();
  });
  // Static files
  const clientBuildPath = path.resolve(__dirname, '../client/dist');
  app.use(express.static(clientBuildPath));
  // rate limit
  app.use('/api/messages', messageLimiter);
  app.use(globalLimiter);

}

module.exports = initExpressApp;
