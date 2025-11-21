// backend/src/routes/payments.js
const express = require('express');
const crypto = require('crypto');
const querystring = require('querystring');

const router = express.Router();

// VNPay configuration
const vnpay_config = {
  vnp_TmnCode: process.env.VNP_TMN_CODE || 'F7OIWXUC',
  vnp_HashSecret: process.env.VNP_HASH_SECRET || '3HPJ0FZBXRROEKVYUTXGRQVDAZKIJ44K', 
  vnp_Url: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  vnp_ReturnUrl: process.env.VNP_RETURN_URL || 'http://localhost:3000/premium-subscribe/check-payment-vnpay'
};

// Create VNPay payment URL
router.post('/create-qr', async (req, res) => {
  try {
    const { user_id, plan_id } = req.body;

    if (!user_id || !plan_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing user_id or plan_id'
      });
    }

    // Fetch plan details from database
    const pool = require('../config/db');
    const [plans] = await pool.query(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [plan_id]
    );
    if (plans.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    const plan = plans[0];

    // Create transaction reference and date
    const txnRef = Date.now().toString();
    const createDate = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expireDate = tomorrow.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);

    // Save pending transaction
    await pool.query(
      `INSERT INTO transactions (id, user_id, plan_id, plan_name, amount, status, payment_method, transaction_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        txnRef,
        user_id,
        plan_id,
        plan.name,
        plan.price,
        'pending',
        'VNPay',
        createDate
      ]
    );
    console.log('TRANSACTION DATE SAVED IN DB:', createDate);

    // Build VNPay params (PHP style)
    let vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_TmnCode: vnpay_config.vnp_TmnCode,
      vnp_Amount: parseInt(plan.price) * 100,
      vnp_Command: 'pay',
      vnp_CreateDate: createDate,
      vnp_CurrCode: 'VND',
      vnp_IpAddr: '127.0.0.1',
      vnp_Locale: 'vn',
      vnp_OrderInfo: `Thanh toan don hang ${txnRef}`,
      vnp_OrderType: 'billpayment',
      vnp_ReturnUrl: 'http://localhost:3000/return-vnpay',
      vnp_TxnRef: txnRef
    };

    // Sort params by key
    vnp_Params = sortObject(vnp_Params);

    // Debug log: show all params before signing
    console.log('VNPay Params (sorted):', vnp_Params);

    // Build hashData and query string (PHP style)
    let hashData = '';
    let query = '';
    let i = 0;
    for (const key in vnp_Params) {
      if (i === 1) {
        hashData += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(vnp_Params[key]);
      } else {
        hashData += encodeURIComponent(key) + '=' + encodeURIComponent(vnp_Params[key]);
        i = 1;
      }
      query += encodeURIComponent(key) + '=' + encodeURIComponent(vnp_Params[key]) + '&';
    }

    // Debug log: show hashData and query string
    console.log('VNPay hashData:', hashData);
    console.log('VNPay query string:', query);

    // Generate secure hash
    const vnpSecureHash = crypto.createHmac('sha512', vnpay_config.vnp_HashSecret)
      .update(hashData)
      .digest('hex');

    // Build payment URL
    const paymentUrl = vnpay_config.vnp_Url + '?' + query + 'vnp_SecureHash=' + vnpSecureHash;
    console.log('VNPay Payment URL:', paymentUrl);

    return res.json({
      success: true,
      paymentUrl: paymentUrl,
      txnRef: txnRef
    });

  } catch (error) {
    console.error('Error creating VNPay payment URL:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating payment URL',
      error: error.message
    });
  }
});

// VNPay callback handler
router.get('/vnpay-callback', async (req, res) => {
  try {
    let vnp_Params = req.query;
    const secureHash = vnp_Params['vnp_SecureHash'];

    // Log các tham số nhận về từ VNPay để debug
    console.log('VNPay Callback Params:', JSON.stringify(vnp_Params, null, 2));

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', vnpay_config.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
      // Valid signature
      const responseCode = vnp_Params['vnp_ResponseCode'];
      const txnRef = vnp_Params['vnp_TxnRef'];
      const amount = vnp_Params['vnp_Amount'];

      if (responseCode === '00') {
        // Payment successful - update transaction and create subscription
        const pool = require('../config/db');

        // Get transaction info
        const [[transaction]] = await pool.query('SELECT * FROM transactions WHERE id = ?', [txnRef]);
        if (!transaction) {
          return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        // Update transaction status
        await pool.query('UPDATE transactions SET status = ? WHERE id = ?', ['completed', txnRef]);

        // Create subscription
        await pool.query(
          `INSERT INTO user_subscriptions (user_id, subscription_plan_id, payment_status, duration_days)
           SELECT ?, ?, ?, duration_days FROM subscription_plans WHERE id = ?`,
          [transaction.user_id, transaction.plan_id, 'completed', transaction.plan_id]
        );

        return res.json({
          success: true,
          message: 'Payment successful',
          txnRef: txnRef,
          amount: amount / 100
        });
      } else {
        // Payment failed
        return res.json({
          success: false,
          message: 'Payment failed',
          responseCode: responseCode
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }
  } catch (error) {
    console.error('Error processing VNPay callback:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing callback',
      error: error.message
    });
  }
});

// Helper function to sort object keys
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  keys.forEach(key => {
    sorted[key] = obj[key];
  });
  return sorted;
}

module.exports = router;
