const express = require("express");
const router = express.Router();

// import middlewares and controllers first
const { authenticate } = require("../middlewares/auth");
const { getMySubscription, getPlans, addPlan , deletePlan } = require("../controllers/subscriptions.controller");

// // Middleware kiểm tra quyền admin
// const isAdmin = (req, res, next) => {
//   if (!req.user || req.user.role !== 'admin') {
//     return res.status(403).json({ success: false, message: 'Chỉ admin mới được phép thao tác' });
//   }
//   next();
// };

// Thêm mới gói dịch vụ (admin)
router.post("/plans", authenticate, addPlan);

// GET subscription of logged-in user
router.get("/me", authenticate, getMySubscription);
// Đồng bộ route /current cho frontend
router.get("/current", authenticate, getMySubscription);

// ⭐ Route lấy danh sách gói Premium
router.get("/plans", getPlans);

// Xóa gói (authenticate required)
router.delete("/plans/:id", authenticate, deletePlan);

module.exports = router;