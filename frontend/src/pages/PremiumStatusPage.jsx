import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PremiumStatusPage.css';

export default function PremiumStatusPage() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

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
      setLoading(false);
    }
  };

  const handleCancelPremium = async () => {
    if (!window.confirm("Bạn có chắc muốn hủy gói Premium?")) return;

    setCancelling(true);
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
        navigate('/');
      } else {
        alert(res.data.message || "Không thể hủy gói Premium.");
      }
    } catch (err) {
      alert("Lỗi kết nối đến server!");
    } finally {
      setCancelling(false);
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

  if (loading) {
    return (
      <div className="premium-status-page">
        <div className="premium-status-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Đang tải thông tin...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="premium-status-page">
        <div className="premium-status-container">
          <div className="no-premium-state">
            <div className="premium-icon">❌</div>
            <h1>Chưa có gói Premium</h1>
            <p>Bạn chưa đăng ký gói Premium nào.</p>
            <button className="upgrade-btn" onClick={() => navigate('/premium-upgrade')}>
              Nâng cấp Premium
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-status-page">
      <div className="premium-status-container">
        <div className="premium-header">
          <div className="premium-icon">💎</div>
          <h1>Thành viên Premium</h1>
        </div>

        <div className="subscription-info">
          <div className="info-card">
            <h3>Gói đang sử dụng</h3>
            <p className="plan-name">{subscription.plan_name}</p>
          </div>

          <div className="info-card">
            <h3>Thời hạn đến</h3>
            <p className="expire-date">{formatDate(subscription.end_date)}</p>
          </div>

          <div className="info-card">
            <h3>Chất lượng âm thanh</h3>
            <p className="audio-quality">{subscription.audio_quality || '320kbps'}</p>
          </div>
        </div>

        <div className="benefits-section">
          <h2>Quyền lợi của bạn</h2>
          <ul className="benefits-list">
            <li>
              <span className="benefit-icon">🎧</span>
              <span>Nghe nhạc không quảng cáo</span>
            </li>
            <li>
              <span className="benefit-icon">⬇️</span>
              <span>Tải nhạc nghe offline</span>
            </li>
            <li>
              <span className="benefit-icon">💽</span>
              <span>Chất lượng cao {subscription.audio_quality || '320kbps'}</span>
            </li>
            <li>
              <span className="benefit-icon">⏭️</span>
              <span>Bỏ qua bài hát không giới hạn</span>
            </li>
          </ul>
        </div>

        <div className="actions-section">
          <button
            className="cancel-btn"
            onClick={handleCancelPremium}
            disabled={cancelling}
          >
            {cancelling ? "Đang xử lý..." : "Hủy gói Premium"}
          </button>

          <button className="back-btn" onClick={() => navigate('/')}>
            Quay lại trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
