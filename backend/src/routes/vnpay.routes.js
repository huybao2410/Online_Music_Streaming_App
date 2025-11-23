const express = require("express");
const router = express.Router();
const controller = require("../controllers/vnpay.controller");

// POST create payment
router.post("/create-payment", controller.createPayment);

// VNPay redirect (GET)
router.get("/return", controller.vnpReturn);

// VNPay IPN (POST)
router.post("/ipn", controller.vnpIpn);

module.exports = router;
