// backend/src/controllers/vnpay.controller.js
const crypto = require("crypto");
const pool = require("../config/db");
const { buildPaymentUrl } = require("../vnpay/vnpay.service");

const VNP_TMN_CODE = process.env.VNPAY_TMNCODE;
const VNP_HASH_SECRET = process.env.VNPAY_HASHSECRET;
const VNP_URL = process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const VNP_RETURNURL = process.env.VNPAY_RETURNURL;

// Encode giống PHP's urlencode (space => +)
function phpUrlEncode(str) {
  if (str === null || str === undefined) return "";
  return encodeURIComponent(String(str)).replace(/%20/g, "+");
}

// Build hashData & query EXACTLY like PHP: urlencode(key)=urlencode(value) joined by &
function buildHashAndQuery(inputData) {
  const keys = Object.keys(inputData).sort();
  let hashData = "";
  let query = "";
  let i = 0;
  for (const key of keys) {
    const val = inputData[key];
    const eKey = phpUrlEncode(key);
    const eVal = phpUrlEncode(val);
    if (i === 1) {
      hashData += `&${eKey}=${eVal}`;
    } else {
      hashData += `${eKey}=${eVal}`;
      i = 1;
    }
    query += `${eKey}=${eVal}&`;
  }
  return { hashData, query };
}



exports.createPayment = async (req, res) => {
  try {
    const { user_id, plan_id } = req.body;
    if (!user_id || !plan_id) {
      return res.status(400).json({ message: "Missing params" });
    }

    const [plans] = await pool.query(
      "SELECT * FROM subscription_plans WHERE id = ? LIMIT 1",
      [plan_id]
    );

    if (!plans.length) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const plan = plans[0];

    // ✅ Fix IP (VNPay không nhận ::1)
    let ipAddr = "127.0.0.1";
    if (req.headers["x-forwarded-for"]) {
      ipAddr = req.headers["x-forwarded-for"].split(",")[0].trim();
    } else if (req.socket?.remoteAddress) {
      ipAddr = req.socket.remoteAddress;
    }
    if (ipAddr === "::1") ipAddr = "127.0.0.1";
    if (ipAddr.startsWith("::ffff:")) {
      ipAddr = ipAddr.replace("::ffff:", "");
    }

    const txnRef = `P${"OnlineMusicWeb"}_${Date.now()}_${Math.floor(Math.random()*1000)}`

    // ✅ KHÔNG DÙNG TIẾNG VIỆT CÓ DẤU
    const orderInfo = `Thanh toan goi ${plan.id} user ${user_id}`;

    const amount = Number(plan.price).toString();

    const paymentUrl = buildPaymentUrl({
      amount,
      ipAddr,
      txnRef,
      orderInfo,
      returnUrl: process.env.VNPAY_RETURNURL, // ví dụ: http://localhost:3000/vnpay-return
    });

    // Lưu transaction pending
    await pool.query(
      `INSERT INTO transactions 
      (id, user_id, plan_id, plan_name, amount, status, payment_method)
      VALUES (?, ?, ?, ?, ?, 'pending', 'VNPay')`,
      [txnRef, user_id, plan_id, plan.name, amount]
    );

    console.log("VNPay URL:", paymentUrl);

    return res.json({ paymentUrl, txnRef });
  } catch (err) {
    console.error("createPayment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


exports.vnpReturn = async (req, res) => {
  // redirect to frontend callback with the query string VNPay returned
  const query = Object.keys(req.query).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(req.query[k])}`).join('&');
  return res.redirect(`${VNP_RETURNURL}?${query}`);
};

exports.vnpIpn = async (req, res) => {
  res.json({ RspCode: "00", Message: "Success" });
};
