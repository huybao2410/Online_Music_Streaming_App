import React, { useState } from "react";
import axios from "axios";
import "./PremiumRegis.css";

const PremiumRegis = () => {
  const [selectedPlan, setSelectedPlan] = useState("1 tháng");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const plans = [
    { id: 1, name: "1 tháng", price: "49.000đ / tháng", days: 30 },
    { id: 2, name: "3 tháng", price: "129.000đ", days: 90 },
    { id: 3, name: "1 năm", price: "499.000đ", days: 365 },
  ];

  const handleUpgrade = () => {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      alert("Vui lòng đăng nhập để nâng cấp Premium!");
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async () => {
    const userId = localStorage.getItem("user_id");
    const plan = plans.find((p) => p.name === selectedPlan);

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:8081/music_API/online_music/user/premium_upgrade.php",
        {
          user_id: userId,
          plan: selectedPlan,
          days: plan.days,
        }
      );

      if (response.data.status === "success") {
        setSuccess(true);
        localStorage.setItem("isPremium", "true");
        localStorage.setItem("premiumExpire", response.data.expire);
        setShowPaymentModal(false);
      } else {
        alert(response.data.message || "Thanh toán thất bại!");
      }
    } catch (err) {
      console.error(err);
      alert("Không thể kết nối máy chủ!");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="premium-success">
        <h2>🎉 Bạn đã nâng cấp Premium thành công!</h2>
        <p>Gói của bạn: <strong>{selectedPlan}</strong></p>
        <p>Hiệu lực đến: <strong>{localStorage.getItem("premiumExpire")}</strong></p>
        <p>Giờ bạn có thể nghe nhạc không quảng cáo ❤️</p>
      </div>
    );
  }

  return (
    <div className="premium-container">
      <div className="premium-card">
        <h2 className="premium-title">Nâng cấp Premium</h2>
        <p className="premium-subtitle">Trải nghiệm âm nhạc không giới hạn!</p>

        <ul className="premium-features">
          <li>🎵 Nghe nhạc không quảng cáo</li>
          <li>⬇️ Tải nhạc nghe offline</li>
          <li>💽 Chất lượng cao 320kbps</li>
          <li>⏭️ Bỏ qua bài không giới hạn</li>
        </ul>

        <h3 className="premium-choose">Chọn gói Premium của bạn</h3>
        <div className="plan-list">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`plan-item ${selectedPlan === plan.name ? "active" : ""}`}
              onClick={() => setSelectedPlan(plan.name)}
            >
              <span>{plan.name}</span>
              <span>{plan.price}</span>
            </div>
          ))}
        </div>

        <button className="upgrade-btn" onClick={handleUpgrade} disabled={loading}>
          {loading ? "Đang xử lý..." : "Thanh toán ngay"}
        </button>
        <p className="note">Thanh toán qua Google Play hoặc Momo giả lập.</p>
      </div>

      {showPaymentModal && (
        <div className="payment-overlay">
          <div className="payment-modal">
            <h3>💳 Thanh toán {selectedPlan}</h3>
            <p>Giá: {plans.find((p) => p.name === selectedPlan)?.price}</p>
            <p>Phương thức: <strong>Momo / ZaloPay / Visa</strong></p>

            <div className="payment-buttons">
              <button onClick={handlePaymentConfirm} disabled={loading}>
                {loading ? "Đang xử lý..." : "Xác nhận thanh toán"}
              </button>
              <button onClick={() => setShowPaymentModal(false)} disabled={loading}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumRegis;
