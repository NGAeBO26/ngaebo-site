/* src/app.js */
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// 1. 🎯 CLEAN ENVIRONMENT INTEGRATION (CORS Middleware)
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
  }));
}

// 2. REQUIRED INTERNAL DATA PARSING MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. 🚲 CORE ROUTE MOUNTING
// Imports your shop routes module cleanly
const shopRoutes = require('./routes/shopRoutes');

// Binds shopRoutes directly under the unified /api gateway prefix
// This explicitly mounts: /api/products
app.use('/api', shopRoutes);

// 4. 🗺️ STATIC VITE FRONTEND SERVICE PRODUCTION HANDLER
// When running live in the cloud, Express handles serving your compiled React app
if (process.env.NODE_ENV === 'production' || true) {
  // Path assumes: ngaebo-backend/src/app.js pointing out to project root level /dist
  const distPath = path.join(__dirname, '..', '..', 'dist');
  app.use(express.static(distPath));
  
  // Wildcard fallback lets React Router handle inner client-side page loads gracefully
  app.get('*', (req, res) => {
    // Prevent catching typo API requests accidentally
    if (req.originalUrl.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint route target not found on this router.' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 5. CLOUD RUNTIME PORT INTERPOLATION
// DigitalOcean automatically sets process.env.PORT. Fallback to 5001 to keep your local workflow working.
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 [PRODUCTION ENGINE ACTIVE]: Same-origin cluster live on port ${PORT}`);
});