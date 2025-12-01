// backend/src/controllers/vnpay.controller.js
const pool = require('../config/db');
const { buildPaymentUrl, verifySignature } = require('../vnpay/vnpay.service');

// Create payment: user from token (authenticate middleware required)
exports.createPayment = async (req, res) => {
  try {
    const user_id = req.user && req.user.id;
    const { plan_id } = req.body;

    if (!user_id) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!plan_id) return res.status(400).json({ success: false, message: 'Missing plan_id' });

    const [plans] = await pool.query('SELECT * FROM subscription_plans WHERE id = ? LIMIT 1', [plan_id]);
    if (!plans.length) return res.status(404).json({ success: false, message: 'Plan not found' });

    const plan = plans[0];
    // Build txnRef
    const txnRef = `POnlineMusicWeb_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Fix IP
    let ipAddr = '127.0.0.1';
    if (req.headers['x-forwarded-for']) ipAddr = req.headers['x-forwarded-for'].split(',')[0].trim();
    else if (req.socket?.remoteAddress) ipAddr = req.socket.remoteAddress;
    if (ipAddr === '::1') ipAddr = '127.0.0.1';
    if (ipAddr.startsWith('::ffff:')) ipAddr = ipAddr.replace('::ffff:', '');

    const orderInfo = `Thanh toan goi ${plan.id} user ${user_id}`;
    const amount = Number(plan.price).toString();

    const paymentUrl = buildPaymentUrl({
      amount,
      ipAddr,
      txnRef,
      orderInfo,
      returnUrl: process.env.VNPAY_RETURNURL,
    });

    // Save pending transaction
    await pool.query(
      `INSERT INTO transactions (id, user_id, plan_id, plan_name, amount, status, payment_method)
       VALUES (?, ?, ?, ?, ?, 'pending', 'VNPay')`,
      [txnRef, user_id, plan_id, plan.name, amount]
    );

    console.log('VNPay URL:', paymentUrl);
    return res.json({ success: true, paymentUrl, txnRef });
  } catch (err) {
    console.error('createPayment error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// VNPay return (user browser redirect here after payment)
exports.vnpReturn = async (req, res) => {
  try {
    const params = req.query;
    console.log('[vnpReturn] params:', params);

    const isValid = verifySignature(params);
    console.log('[vnpReturn] Signature valid:', isValid);

    if (!isValid) {
      return res.redirect(`${process.env.FRONTEND_URL}/premium-upgrade?status=invalid_signature`);
    }

    const responseCode = params['vnp_ResponseCode'];
    const txnRef = params['vnp_TxnRef'];

    // Load transaction
    const [txRows] = await pool.query('SELECT * FROM transactions WHERE id = ? LIMIT 1', [txnRef]);
    if (!txRows.length) {
      return res.redirect(`${process.env.FRONTEND_URL}/premium-upgrade?status=transaction_not_found`);
    }
    const transaction = txRows[0];
    const userId = transaction.user_id;
    const planId = transaction.plan_id;

    // Load plan
    const [planRows] = await pool.query('SELECT * FROM subscription_plans WHERE id = ? LIMIT 1', [planId]);
    if (!planRows.length) {
      return res.redirect(`${process.env.FRONTEND_URL}/premium-upgrade?status=plan_not_found`);
    }
    const plan = planRows[0];
    const durationDays = plan.duration_days;

    if (responseCode === '00') {
      // Update transaction
      const payDate = params["vnp_PayDate"];  // '20251130085311'

      await pool.query(
              `UPDATE transactions 
              SET status = 'completed', transaction_date = ?
              WHERE id = ?`,
              [payDate, txnRef]
            );

      // Insert or update subscription
      await pool.query(
        `INSERT INTO user_subscriptions
          (user_id, subscription_plan_id, duration_days, status, payment_status, payment_gateway)
         VALUES (?, ?, ?, 'active', 'completed', 'vnpay')
         ON DUPLICATE KEY UPDATE
           duration_days = VALUES(duration_days),
           status = 'active',
           payment_status = 'completed',
           updated_at = NOW()`,
        [userId, planId, durationDays]
      );

      // Get subscription (generated end_date)
      const [subs] = await pool.query(
        `SELECT start_date, end_date FROM user_subscriptions WHERE user_id = ? AND subscription_plan_id = ? AND status = 'active' LIMIT 1`,
        [userId, planId]
      );
      if (!subs.length) {
        return res.redirect(`${process.env.FRONTEND_URL}/premium-upgrade?status=success_no_sub`);
      }
      const sub = subs[0];
      const start = new Date(sub.start_date).toISOString();
      const end = new Date(sub.end_date).toISOString();
      const daysLeft = Math.max(0, Math.ceil((new Date(end) - new Date()) / (1000 * 60 * 60 * 24)));

      return res.redirect(
        `${process.env.FRONTEND_URL}/premium-upgrade?status=success&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&days_left=${daysLeft}`
      );
    }

    // Failed
    await pool.query(`UPDATE transactions SET status = 'failed', transaction_date = NOW() WHERE id = ?`, [txnRef]);
    return res.redirect(`${process.env.FRONTEND_URL}/premium-upgrade?status=failed`);
  } catch (err) {
    console.error('vnpReturn error:', err);
    return res.redirect(`${process.env.FRONTEND_URL}/premium-upgrade?status=server_error`);
  }
};

// IPN (optional server-to-server)
exports.vnpIpn = async (req, res) => {
  // implement if needed
  return res.json({ RspCode: '00', Message: 'Success' });
};