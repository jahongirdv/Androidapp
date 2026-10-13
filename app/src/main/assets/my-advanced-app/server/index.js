const dotenv = require('dotenv');
const express = require('express');
const db = require('./db/pools');
const initExpressApp = require('./expressInit.js');
const registerRoutes = require('./routes/index.js');
dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;

// Initialize express settings and middleware

initExpressApp(app);
registerRoutes(app);


app.get('/api/health', (req, res) => {
  res.send('Server is healthy');
});

// 404 capture
app.use((req, res, next) => {
  const err = new Error('Not found');
  next(err);
});

// Error handler
app.use((err, req, res, next) => {
  res.status(404).json({
    error: true,
    status: 404,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
