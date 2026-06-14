const express = require('express');
const cors = require('cors');
const app = express();

// 🎯 CLEAN ENVIRONMENT INTEGRATION:
// Allow CORS requests only during separate local dev execution. 
// In live staging/production cloud deployments, Same-Origin rules apply naturally.
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
  }));
}