const express = require("express");
const router = express.Router();

const { getMySubscription, getPlans, addPlan } = require("../controllers/subscriptions.controller");
// Middleware kiểm tra quyền admin
const isAdmin = (req, res, next) => {
	if (!req.user || req.user.role !== 'admin') {
		return res.status(403).json({ success: false, message: 'Chỉ admin mới được phép thao tác' });
	}
	next();
};
// Thêm mới gói dịch vụ (admin)
router.post("/plans", authenticate, isAdmin, addPlan);
const { authenticate } = require("../middlewares/auth");

// GET subscription of logged-in user
router.get("/me", authenticate, getMySubscription);
// Đồng bộ route /current cho frontend
router.get("/current", authenticate, getMySubscription);

// ⭐ Route lấy danh sách gói Premium
router.get("/plans", getPlans);

module.exports = router;