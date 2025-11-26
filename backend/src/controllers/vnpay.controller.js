// backend/src/controllers/vnpay.controller.js
const crypto = require("crypto");
const pool = require("../config/db");

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
    if (!user_id || !plan_id) return res.status(400).json({ message: "Missing user_id or plan_id" });

    // load plan
    const [planRows] = await pool.query("SELECT * FROM subscription_plans WHERE id = ? LIMIT 1", [plan_id]);
    if (!planRows || planRows.length === 0) return res.status(404).json({ message: "Plan not found" });
    const plan = planRows[0];

    // createDate like PHP date('YmdHis')
    const now = new Date();
    const pad = (n) => (n < 10 ? "0" + n : "" + n);
    const createDate =
      now.getFullYear().toString() +
      pad(now.getMonth() + 1) +
      pad(now.getDate()) +
      pad(now.getHours()) +
      pad(now.getMinutes()) +
      pad(now.getSeconds());

    const txnRef = String(Date.now()); // unique ref

    const ipAddr =
      (req.headers["x-forwarded-for"] || req.connection?.remoteAddress || req.socket?.remoteAddress || "127.0.0.1")
        .split(",")[0];

    const inputData = {
      vnp_Version: "2.1.0",
      vnp_TmnCode: VNP_TMN_CODE,
      vnp_Amount: String(Math.round(Number(plan.price) * 100)), // integer string
      vnp_Command: "pay",
      vnp_CreateDate: createDate,
      vnp_CurrCode: "VND",
      vnp_IpAddr: ipAddr,
      vnp_Locale: "vn",
      vnp_OrderInfo: `Thanh toan goi ${plan.name} (user ${user_id})`,
      vnp_OrderType: "billpayment",
      vnp_ReturnUrl: VNP_RETURNURL,
      vnp_TxnRef: txnRef,
    };

    const { hashData, query } = buildHashAndQuery(inputData);

    // compute secure hash using secret (sha512)
    const vnpSecureHash = crypto.createHmac("sha512", VNP_HASH_SECRET).update(hashData).digest("hex");

    const paymentUrl = `${VNP_URL}?${query}vnp_SecureHash=${vnpSecureHash}`;

    // optional save transaction pending
    try {
      await pool.query(
        `INSERT INTO transactions (id, user_id, plan_id, plan_name, amount, status, payment_method, transaction_date)
         VALUES (?, ?, ?, ?, ?, 'pending', 'VNPay', ?)`,
        [txnRef, user_id, plan_id, plan.name, inputData.vnp_Amount, createDate]
      );
    } catch (err) {
      console.warn("Save transaction failed (non-fatal):", err.message);
    }

    // debug logs (you can remove later)
    console.log("VNPay -> signData:", hashData);
    console.log("VNPay -> secureHash:", vnpSecureHash);
    console.log("VNPay -> paymentUrl:", paymentUrl);

    return res.json({ paymentUrl, txnRef });
  } catch (err) {
    console.error("createPayment error:", err);
    return res.status(500).json({ message: "VNPay create error", error: err.message });
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
