const express = require("express");
const router = express.Router();

const { getMySubscription, getPlans } = require("../controllers/subscriptions.controller");
const { authenticate } = require("../middlewares/auth");

// GET subscription of logged-in user
router.get("/me", authenticate, getMySubscription);
// Đồng bộ route /current cho frontend
router.get("/current", authenticate, getMySubscription);

// ⭐ Route lấy danh sách gói Premium
router.get("/plans", getPlans);

module.exports = router;