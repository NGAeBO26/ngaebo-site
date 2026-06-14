/* src/app.js */
const express = require('express');
const cors = require('cors');
const shopRoutes = require('./routes/shopRoutes');
require('dotenv').config();

const app = express();
const PORT = 5001;

// Middleware Configurations
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

/* 🖼️ STATIC ASSET STREAMING */
app.use('/assets', express.static('public/assets'));

// API Routing Mount targeting live PostgreSQL via shopRoutes.js
app.use('/api', shopRoutes);

app.listen(PORT, () => {
  console.log(`📦 [PG DATABASE API ENGINE RUNNING]: Listening on port ${PORT}`);
});