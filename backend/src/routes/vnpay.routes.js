// backend/src/routes/vnpay.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/vnpay.controller');
const { authenticate } = require('../middlewares/auth');

// create-payment: require auth
router.post('/create-payment', authenticate, controller.createPayment);

// VNPay redirect (GET) - VNPay will call this (no auth)
router.get('/return', controller.vnpReturn);

// IPN (optional)
router.post('/ipn', controller.vnpIpn);

module.exports = router;