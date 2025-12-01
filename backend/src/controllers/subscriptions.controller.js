const pool = require("../config/db");

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

    const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

    return res.json({
      success: true,
      subscription: {
        is_premium: daysLeft > 0,
        plan_id: sub.subscription_plan_id,
        plan_name: sub.plan_name,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
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
      "SELECT * FROM subscription_plans ORDER BY price ASC"
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