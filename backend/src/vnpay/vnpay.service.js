// backend/src/vnpay/vnpay.service.js
const { VNPay, ignoreLogger, ProductCode, dateFormat } = require('vnpay');

const vnpay = new VNPay({
  tmnCode: process.env.VNPAY_TMNCODE,
  secureSecret: process.env.VNPAY_HASHSECRET,
  vnpayHost: process.env.VNP_HOST || 'https://sandbox.vnpayment.vn',
  testMode: process.env.VNP_TEST === 'true',
  hashAlgorithm: 'SHA512',
  loggerFn: ignoreLogger,
});

function buildPaymentUrl({ amount, ipAddr, txnRef, orderInfo, returnUrl, locale = 'vn', expireDate }) {
  const now = new Date();
  const createDate = dateFormat(now);
  const expire = expireDate || dateFormat(new Date(now.getTime() + 30 * 60 * 1000)); // 30 min
  return vnpay.buildPaymentUrl({
    vnp_Amount: amount,
    vnp_IpAddr: ipAddr || '127.0.0.1',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expire,
    vnp_OrderType: ProductCode.Other,
    vnp_ReturnUrl: returnUrl,
    vnp_Locale: locale,
  });
}

// Use library verify (matching build)
function verifySignature(params) {
  try {
    return vnpay.verifyReturnUrl(params);
  } catch (err) {
    console.error('verifySignature error:', err);
    return false;
  }
}

module.exports = { buildPaymentUrl, verifySignature };