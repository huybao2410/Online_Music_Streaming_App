import React, { useState } from "react";
import "./PremiumRegis.css";

const PremiumRegis = () => {
  const [selectedPlan, setSelectedPlan] = useState("1 tháng");

  const plans = [
    { id: 1, name: "1 tháng", price: "49.000đ / tháng" },
    { id: 2, name: "3 tháng", price: "129.000đ" },
    { id: 3, name: "1 năm", price: "499.000đ" },
  ];

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
              className={`plan-item ${
                selectedPlan === plan.name ? "active" : ""
              }`}
              onClick={() => setSelectedPlan(plan.name)}
            >
              <span>{plan.name}</span>
              <span>{plan.price}</span>
            </div>
          ))}
        </div>

        <button className="upgrade-btn">Nâng cấp ngay</button>
        <p className="note">Thanh toán qua Google Play. Hủy bất kỳ lúc nào.</p>
      </div>
    </div>
  );
};

export default PremiumRegis;
