require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const organizationsRoutes = require('./routes/organizations'); 
const equipmentRoutes = require('./routes/equipment');
const classifierRoutes = require('./routes/classifier');
const uploadRoutes = require('./routes/upload');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'jixozmed-api', time: new Date().toISOString() });
});

// Статика — загруженные фото
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationsRoutes);  
app.use('/api/equipment', equipmentRoutes);
app.use('/api/classifier', classifierRoutes);
app.use('/api/upload', uploadRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error('❌', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
});
