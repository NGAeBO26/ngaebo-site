/* src/routes/shopRoutes.js */
const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');

// Mapping GET requests directly to the product compiler
router.get('/products', shopController.getAllProducts);

module.exports = router;