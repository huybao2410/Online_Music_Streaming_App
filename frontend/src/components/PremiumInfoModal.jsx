import React, { useState, useEffect } from "react";
import "./PremiumInfoModal.css";
import axios from "axios";

export default function PremiumInfoModal({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/subscriptions/current', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success && res.data.subscription) {
        setSubscription(res.data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCancelPremium = async () => {
    if (!window.confirm("Bạn có chắc muốn hủy gói Premium?")) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/subscriptions/cancel',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        alert("❌ Bạn đã hủy gói Premium thành công.");
        localStorage.setItem("is_premium", "0");
        window.dispatchEvent(new Event("premiumUpdated"));
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Không xác định';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loadingData) {
    return (
      <div className="premium-modal-overlay" onClick={onClose}>
        <div className="premium-modal" onClick={(e) => e.stopPropagation()}>
          <div className="loading-spinner"></div>
          <p>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="premium-modal-overlay" onClick={onClose}>
        <div className="premium-modal" onClick={(e) => e.stopPropagation()}>
          <h2>❌ Không có gói Premium</h2>
          <p>Bạn chưa đăng ký gói Premium nào.</p>
          <button className="close-btn" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-modal-overlay" onClick={onClose}>
      <div className="premium-modal" onClick={(e) => e.stopPropagation()}>
        <h2>💎 Thành viên Premium</h2>
        <p>
          Bạn đang sử dụng gói <strong>{subscription.plan_name}</strong> với các quyền lợi:
        </p>
        <ul>
          <li>🎧 Nghe nhạc không quảng cáo</li>
          <li>⬇️ Tải nhạc nghe offline</li>
          <li>💽 Chất lượng cao {subscription.audio_quality || '320kbps'}</li>
          <li>⏭️ Bỏ qua bài hát không giới hạn</li>
        </ul>

        <div className="premium-expire">
          <strong>Thời hạn đến:</strong> {formatDate(subscription.end_date)}
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
