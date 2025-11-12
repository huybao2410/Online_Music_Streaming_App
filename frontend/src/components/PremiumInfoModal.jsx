import React, { useState } from "react";
import "./PremiumInfoModal.css";
import axios from "axios";

export default function PremiumInfoModal({ onClose }) {
  const [loading, setLoading] = useState(false);
  const userId = localStorage.getItem("user_id");
  const premiumExpire = localStorage.getItem("premiumExpire");

  const handleCancelPremium = async () => {
    if (!window.confirm("Bạn có chắc muốn hủy gói Premium?")) return;

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8081/music_API/online_music/user/cancel_premium.php", {
        user_id: userId,
      });

      if (res.data.status === "success") {
        alert("❌ Bạn đã hủy gói Premium thành công.");
        localStorage.setItem("is_premium", "0");
        localStorage.removeItem("premiumExpire");
        window.dispatchEvent(new Event("storage"));
        onClose();
      } else {
        alert(res.data.message || "Không thể hủy gói Premium.");
      }
    } catch (err) {
      alert("Lỗi kết nối đến server!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-modal-overlay" onClick={onClose}>
      <div className="premium-modal" onClick={(e) => e.stopPropagation()}>
        <h2>💎 Thành viên Premium</h2>
        <p>
          Bạn đang sử dụng gói <strong>Premium</strong> với các quyền lợi:
        </p>
        <ul>
          <li>🎧 Nghe nhạc không quảng cáo</li>
          <li>⬇️ Tải nhạc nghe offline</li>
          <li>💽 Chất lượng cao 320kbps</li>
          <li>⏭️ Bỏ qua bài hát không giới hạn</li>
        </ul>

        <div className="premium-expire">
          <strong>Thời hạn đến:</strong> {premiumExpire || "Không xác định"}
        </div>

        <button
          className="cancel-premium-btn"
          onClick={handleCancelPremium}
          disabled={loading}
        >
          {loading ? "Đang xử lý..." : "Hủy gói Premium"}
        </button>

        <button className="close-btn" onClick={onClose}>
          Đóng
        </button>
      </div>
    </div>
  );
}
