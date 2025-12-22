// POST /api/subscriptions/cancel
exports.cancelMySubscription = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    // Tìm gói active mới nhất
    const [rows] = await pool.query(
      `SELECT id, subscription_plan_id FROM user_subscriptions WHERE user_id = ? AND status = 'active' ORDER BY start_date DESC LIMIT 1`,
      [userId]
    );
    if (!rows.length) {
      return res.status(400).json({ success: false, message: "Bạn không có gói Premium đang hoạt động." });
    }
    const subId = rows[0].id;
    const planId = rows[0].subscription_plan_id;
    // Xóa tất cả bản ghi user_subscriptions với user_id, planId, id khác subId để tránh trùng unique
    await pool.query(
      `DELETE FROM user_subscriptions WHERE user_id = ? AND subscription_plan_id = ? AND id != ?`,
      [userId, planId, subId]
    );
    // Cập nhật trạng thái và ngày kết thúc, đảm bảo status là duy nhất
    await pool.query(
      `UPDATE user_subscriptions SET status = CONCAT('cancelled_', id), end_date = NOW() WHERE id = ?`,
      [subId]
    );
    return res.json({ success: true, message: "Đã hủy gói Premium thành công." });
  } catch (err) {
    console.error("cancelMySubscription error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
const pool = require("../config/db");
// POST /api/subscriptions/plans (admin)
exports.addPlan = async (req, res) => {
  try {
    const { name, price, duration, description } = req.body;
    if (!name || !price || !duration || !description) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin gói dịch vụ" });
    }
    // Kiểm tra trùng tên
    const [exist] = await pool.query("SELECT id FROM subscription_plans WHERE name = ?", [name]);
    if (exist.length > 0) {
      return res.status(400).json({ success: false, message: "Tên gói đã tồn tại" });
    }
    await pool.query(
      "INSERT INTO subscription_plans (name, price, duration_days, description) VALUES (?, ?, ?, ?)",
      [name, price, duration, description]
    );
    res.json({ success: true, message: "Thêm gói dịch vụ thành công" });
  } catch (err) {
    console.error("addPlan error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// GET /api/subscriptions/me
exports.getMySubscription = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const [rows] = await pool.query(
      `SELECT us.*, sp.name AS plan_name
       FROM user_subscriptions us
       LEFT JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
       WHERE us.user_id = ? AND us.status = 'active'
       ORDER BY us.start_date DESC
       LIMIT 1`,
      [userId]
    );

    if (!rows.length) {
      return res.json({ success: true, subscription: { is_premium: false } });
    }

    const sub = rows[0];
    const start = new Date(sub.start_date);
    const end = new Date(sub.end_date);
    const now = new Date();

    // Kiểm tra ngày hợp lệ
    const isValidDate = d => d instanceof Date && !isNaN(d);
    const startISO = isValidDate(start) ? start.toISOString() : null;
    const endISO = isValidDate(end) ? end.toISOString() : null;
    const daysLeft = isValidDate(end) ? Math.ceil((end - now) / (1000 * 60 * 60 * 24)) : 0;

    return res.json({
      success: true,
      subscription: {
        is_premium: daysLeft > 0,
        plan_id: sub.subscription_plan_id,
        plan_name: sub.plan_name,
        start_date: startISO,
        end_date: endISO,
        days_left: daysLeft
      }
    });

  } catch (err) {
    console.error("getMySubscription error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getPlans = async (req, res) => {
  try {
    const [plans] = await pool.query(
      "SELECT id, name, price, duration_days AS duration, description FROM subscription_plans ORDER BY price ASC"
    );

    res.json({
      success: true,
      plans,
    });
  } catch (err) {
    console.error("getPlans error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/subscriptions/plans/:id
exports.deletePlan = async (req, res) => {
  try {
    const planId = parseInt(req.params.id, 10);
    if (!planId) {
      return res.status(400).json({ success: false, message: "Plan id không hợp lệ" });
    }

    // Tùy việc thiết kế DB: nếu có user_subscriptions tham chiếu tới plan, ta có thể kiểm tra
    const [refs] = await pool.query(
      "SELECT id FROM user_subscriptions WHERE subscription_plan_id = ? LIMIT 1",
      [planId]
    );
    if (refs.length > 0) {
      // Không xóa nếu đang có user đang dùng gói (an toàn hơn)
      return res.status(400).json({
        success: false,
        message: "Không thể xóa gói vì đang có người dùng sử dụng gói này"
      });
    }

    const [result] = await pool.query("DELETE FROM subscription_plans WHERE id = ?", [planId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy gói cần xóa" });
    }

    return res.json({ success: true, message: "Xóa gói dịch vụ thành công" });
  } catch (err) {
    console.error("deletePlan error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};