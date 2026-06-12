/* src/app.js */
const express = require('express');
const cors = require('cors');
const shopRoutes = require('./routes/shopRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware Configurations
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

/* 🖼️ STATIC ASSET STREAMING
   This allows your database to store paths like '/assets/products/bike.png' 
   and serves those image files directly out of your local public backend directory */
app.use('/assets', express.static('public/assets'));

// API Routing Mount
app.use('/api', shopRoutes);

app.listen(PORT, () => {
  console.log(`Ecosystem API Server running smoothly on port ${PORT}`);
});