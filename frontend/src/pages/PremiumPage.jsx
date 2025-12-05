import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BsCheckCircleFill } from 'react-icons/bs';
import { MdMusicNote, MdCloudDownload, MdBlock } from 'react-icons/md';
import axios from 'axios';
import './PremiumPage.css';
import API_URL from "../config";

export default function PremiumPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [subscription, setSubscription] = useState({
    is_premium: false,
    start: null,
    end: null,
    daysLeft: 0,
    error: null,
  });

  const fetchMySubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // not logged in
        setSubscription(prev => ({ ...prev, is_premium: false }));
        return;
      }
      const resp = await axios.get(`${API_URL}/api/subscriptions/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.data.success && resp.data.subscription) {
        const s = resp.data.subscription;
        setSubscription({
          is_premium: !!s.is_premium,
          start: s.start_date || null,
          end: s.end_date || null,
          daysLeft: s.end_date ? Math.max(0, Math.floor(
            (new Date(s.end_date) - new Date()) / (1000 * 60 * 60 * 24)
          )) : 0,
          error: null,
        });
      }
    } catch (err) {
      console.error('fetchMySubscription error:', err);
    }
  };

  useEffect(() => {
    // always fetch plans and subscription on mount/location change
    fetchPlans();
    fetchMySubscription();

    const params = new URLSearchParams(location.search);
    const status = params.get('status');

    if (status === 'success') {
      const start = params.get('start');
      const end = params.get('end');

      // 👉 Tự tính daysLeft dựa vào thời gian máy
      const daysLeft = end
        ? Math.max(
          0,
          Math.floor(
            (new Date(end) - new Date()) / (1000 * 60 * 60 * 24)
          )
        )
        : 0;

      setSubscription({
        is_premium: true,
        start,
        end,
        daysLeft,
        error: null,
      });

      // Đồng bộ trạng thái premium cho toàn app
      localStorage.setItem("is_premium", "1");
      window.dispatchEvent(new Event("storage"));

      window.history.replaceState({}, '', '/premium-upgrade');
      return;
    }

    if (status === 'failed') {
      setSubscription({ error: 'Thanh toán thất bại.' });
      window.history.replaceState({}, '', '/premium-upgrade');
      return;
    }
    // no further action
  }, [location]);

  const fetchPlans = async () => {
    try {
      const resp = await axios.get(`${API_URL}/api/subscriptions/plans`);
      if (resp.data.success) setPlans(resp.data.plans);
    } catch (err) {
      console.error('fetchPlans error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Vui lòng đăng nhập để nâng cấp Premium');
      navigate('/login');
      return;
    }

    try {
      setProcessing(true);
      const plan = plans[selectedPlan];
      const resp = await axios.post(
        `${API_URL}/api/vnpay/create-payment`,
        { plan_id: plan.id }, // only plan_id; backend uses token to find user
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (resp.data && resp.data.paymentUrl) {
        window.location.href = resp.data.paymentUrl;
      } else {
        console.error('create-payment response:', resp.data);
        alert('Không tạo được đường dẫn thanh toán. Thử lại sau.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert(err?.response?.data?.message || err.message || 'Lỗi xử lý thanh toán');
    } finally {
      setProcessing(false);
    }
  };

  const benefits = [
    { icon: <MdBlock size={32} />, title: 'Nghe nhạc không quảng cáo', description: 'Trải nghiệm âm nhạc liền mạch' },
    { icon: <MdCloudDownload size={32} />, title: 'Tải nhạc', description: 'Nghe offline mọi lúc' },
    { icon: <MdMusicNote size={32} />, title: 'Không giới hạn', description: 'Toàn bộ thư viện' },
  ];

  if (loading) return (
    <div className="premium-loading">
      <div className="loading-spinner" />
      <p>Đang tải...</p>
    </div>
  );

  return (
    <div className="premium-page">
      <div className="premium-container">
        <div className="premium-content">

          {subscription.error && (
            <div className="premium-banner error">
              <p>{subscription.error}</p>
            </div>
          )}



          <div className="premium-left">
            <div className="premium-hero">
              <div className="premium-badge"><span className="badge-icon">👑</span><span>PREMIUM</span></div>
              {subscription.is_premium && (
                <div className="premium-banner success">
                  <p>🎉 Bạn đang là Premium!</p>
                  <p>Bắt đầu: {subscription.start ? new Date(subscription.start).toLocaleString('vi-VN') : '-'}</p>
                  <p>Hết hạn: {subscription.end ? new Date(subscription.end).toLocaleString('vi-VN') : '-'}</p>
                  <p>Còn lại: {subscription.daysLeft} ngày</p>
                </div>
              )}
              <h1 className="premium-title">Nâng cấp tài khoản</h1>

              <p className="premium-subtitle">Trải nghiệm âm nhạc không giới hạn!</p>
            </div>



            <div className="benefits-list">
              {benefits.map((b, idx) => (
                <div className="benefit-item" key={idx}>
                  <div className="benefit-icon-small">{b.icon}</div>
                  <div className="benefit-content">
                    <h3>{b.title}</h3>
                    <p>{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>


          <div className="premium-right">
            <div className="plans-sticky">
              <h2 className="plans-title">Chọn gói Premium của bạn</h2>

              <div className="plans-list">
                {plans.map((plan, idx) => (
                  <div
                    key={plan.id}
                    className={`plan-card ${selectedPlan === idx ? 'selected' : ''}`}
                    onClick={() => !subscription.is_premium && setSelectedPlan(idx)}
                    style={{ pointerEvents: subscription.is_premium ? 'none' : 'auto', opacity: subscription.is_premium ? 0.6 : 1 }}
                  >
                    <div className="plan-header">
                      <div className="plan-info"><h3>{plan.name}</h3></div>
                      <div className="plan-check">
                        {selectedPlan === idx ? <BsCheckCircleFill className="check-icon" /> : <div className="check-circle" />}
                      </div>
                    </div>

                    <div className="plan-price">
                      <span className="price-amount">{new Intl.NumberFormat('vi-VN').format(plan.price)}đ</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="upgrade-button"
                onClick={handleUpgrade}
                disabled={processing || subscription.is_premium}
                style={{ opacity: (processing || subscription.is_premium) ? 0.6 : 1, cursor: (processing || subscription.is_premium) ? 'not-allowed' : 'pointer' }}
              >
                {subscription.is_premium ? 'Bạn đã là Premium' : processing ? 'Đang xử lý...' : 'Nâng cấp ngay →'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}