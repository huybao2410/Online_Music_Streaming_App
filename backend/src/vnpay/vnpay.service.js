// backend/src/vnpay/vnpay.service.js
const crypto = require("crypto");
const { VNPay, ignoreLogger, ProductCode, dateFormat } = require("vnpay");

const vnpay = new VNPay({
  tmnCode: process.env.VNPAY_TMNCODE,        // ✅ đúng tên
  secureSecret: process.env.VNPAY_HASHSECRET, // ✅ đúng tên
  vnpayHost: process.env.VNP_HOST || "https://sandbox.vnpayment.vn",
  testMode: process.env.VNP_TEST === "true",
  hashAlgorithm: "SHA512",
  loggerFn: ignoreLogger,
});


function buildPaymentUrl({ amount, ipAddr, txnRef, orderInfo, returnUrl, locale = "vn", expireDate }) {
  const now = new Date();
  const createDate = dateFormat(now);
  const expire = expireDate || dateFormat(new Date(now.getTime() + 30 * 60 * 1000)); // 30 min default

  return vnpay.buildPaymentUrl({
    vnp_Amount: amount,
    vnp_IpAddr: ipAddr || "127.0.0.1",
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expire,
    vnp_OrderType: ProductCode.Other,
    vnp_ReturnUrl: returnUrl,
    vnp_Locale: locale,
  });
}

// verify signature for return/ipn
function verifySignature(params) {
  // params is object (req.query or req.body)
  // build string same as VNPay expects: sort vnp_ keys and join key=value
  const secureHash = params.vnp_SecureHash || params.vnp_SecureHashType && params.vnp_SecureHash;
  if (!secureHash) return false;

  const data = {};
  Object.keys(params).forEach((k) => {
    if (k === "vnp_SecureHash" || k === "vnp_SecureHashType") return;
    if (k.startsWith("vnp_")) data[k] = params[k];
  });

  const sorted = Object.keys(data).sort();
  const hashData = sorted.map(k => `${k}=${data[k]}`).join("&");
  const computed = crypto.createHmac("sha512", process.env.VNPAY_HASHSECRET).update(hashData).digest("hex");
  return computed.toLowerCase() === (secureHash || "").toLowerCase();
}

module.exports = {
  buildPaymentUrl,
  verifySignature,
};
    