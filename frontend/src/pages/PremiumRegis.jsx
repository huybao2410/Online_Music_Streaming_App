import React, { useState } from "react";
import axios from "axios";
import "./PremiumRegis.css";

const PremiumRegis = () => {
  const [selectedPlan, setSelectedPlan] = useState("1 tháng");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const plans = [
    { id: 1, name: "1 tháng", price: "49.000đ / tháng" },
    { id: 2, name: "3 tháng", price: "129.000đ" },
    { id: 3, name: "1 năm", price: "499.000đ" },
  ];

  const handleUpgrade = async () => {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      alert("Vui lòng đăng nhập để nâng cấp Premium!");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8081/music_API/user/premium_upgrade.php", {
        user_id: userId,
        plan: selectedPlan,
      });

      if (response.data.status === "success") {
        setSuccess(true);
        localStorage.setItem("isPremium", "true");
        localStorage.setItem("premiumExpire", response.data.expire);
      } else {
        alert(response.data.message || "Đăng ký thất bại!");
      }
    } catch (err) {
      alert("Lỗi kết nối đến máy chủ!");
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
          {loading ? "Đang xử lý..." : "Nâng cấp ngay"}
        </button>
        <p className="note">Thanh toán qua Google Play. Hủy bất kỳ lúc nào.</p>
      </div>
    </div>
  );
};

export default PremiumRegis;
