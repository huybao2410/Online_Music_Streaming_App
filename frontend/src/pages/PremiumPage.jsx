import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BsCheckCircleFill } from 'react-icons/bs';
import { MdMusicNote, MdCloudDownload, MdBlock } from 'react-icons/md';
import axios from 'axios';
import './PremiumPage.css';

export default function PremiumPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      console.log('Fetching plans from Node.js API...');
      const response = await axios.get('http://localhost:5000/api/subscriptions/plans');
      
      console.log('Plans response:', response.data);
      
      if (response.data.success && response.data.plans) {
        console.log('Plans loaded:', response.data.plans);
        setPlans(response.data.plans);
      } else {
        console.error('No plans found in response');
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Vui lòng đăng nhập để nâng cấp Premium');
      navigate('/');
      return;
    }

    try {
      setProcessing(true);
      const userId = JSON.parse(atob(token.split('.')[1])).id;
      const plan = plans[selectedPlan];

      const response = await axios.post(
        'http://localhost:5000/api/create-qr',
        {
          user_id: userId.toString(),
          plan_id: plan.id,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.paymentUrl) {
        // Open payment URL in new window
        window.open(response.data.paymentUrl, '_blank');
      } else {
        alert('Không thể tạo thanh toán. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert(error.response?.data?.message || 'Lỗi khi xử lý thanh toán');
    } finally {
      setProcessing(false);
    }
  };

  const benefits = [
    {
      icon: <MdBlock size={32} />,
      title: 'Nghe nhạc không quảng cáo',
      description: 'Trải nghiệm âm nhạc liền mạch không bị gián đoạn'
    },
    {
      icon: <MdCloudDownload size={32} />,
      title: 'Tải nhạc nghe offline',
      description: 'Tải xuống và nghe mọi lúc mọi nơi, không cần internet'
    },
    {
      icon: <MdMusicNote size={32} />,
      title: 'Không giới hạn bài hát',
      description: 'Thưởng thức toàn bộ thư viện nhạc không giới hạn'
    }
  ];

  if (loading) {
    return (
      <div className="premium-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="premium-page">
      <div className="premium-container">
        {/* Two Column Layout */}
        <div className="premium-content">
          {/* Left Column - Info */}
          <div className="premium-left">
            <div className="premium-hero">
              <div className="premium-badge">
                <span className="badge-icon">👑</span>
                <span>PREMIUM</span>
              </div>
              <h1 className="premium-title">
                Nâng cấp tài khoản
              </h1>
              <p className="premium-subtitle">
                Trải nghiệm âm nhạc không giới hạn!
              </p>
            </div>

            {/* Benefits List */}
            <div className="benefits-list">
              {benefits.map((benefit, index) => (
                <div key={index} className="benefit-item">
                  <div className="benefit-icon-small">{benefit.icon}</div>
                  <div className="benefit-content">
                    <h3 className="benefit-title">{benefit.title}</h3>
                    <p className="benefit-description">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* FAQ Section */}
            <div className="faq-section">
              <h3>Câu hỏi thường gặp</h3>
              <div className="faq-list">
                <details className="faq-item">
                  <summary>Tôi có thể hủy Premium bất kỳ lúc nào không?</summary>
                  <p>Có, bạn có thể hủy Premium bất kỳ lúc nào và vẫn được sử dụng đến hết chu kỳ đã thanh toán.</p>
                </details>
                <details className="faq-item">
                  <summary>Phương thức thanh toán nào được hỗ trợ?</summary>
                  <p>Chúng tôi hỗ trợ thanh toán qua VNPay với các thẻ ATM nội địa, thẻ Visa/Mastercard và ví điện tử.</p>
                </details>
                <details className="faq-item">
                  <summary>Tôi có thể đổi gói Premium không?</summary>
                  <p>Có, bạn có thể nâng cấp hoặc chuyển đổi gói Premium bất kỳ lúc nào trong phần cài đặt tài khoản.</p>
                </details>
              </div>
            </div>
          </div>

          {/* Right Column - Plans */}
          <div className="premium-right">
            <div className="plans-sticky">
              <h2 className="plans-title">Chọn gói Premium của bạn</h2>
              
              <div className="plans-list">
                {plans.map((plan, index) => (
                  <div
                    key={plan.id}
                    className={`plan-card ${selectedPlan === index ? 'selected' : ''}`}
                    onClick={() => setSelectedPlan(index)}
                  >
                    <div className="plan-header">
                      <div className="plan-info">
                        <h3>{plan.name}</h3>
                        {plan.name === '1 tháng' && (
                          <span className="plan-badge">Phổ biến nhất</span>
                        )}
                        {plan.name === '1 năm' && (
                          <span className="plan-badge best-value">Tiết kiệm nhất</span>
                        )}
                      </div>
                      <div className="plan-check">
                        {selectedPlan === index ? (
                          <BsCheckCircleFill className="check-icon" />
                        ) : (
                          <div className="check-circle"></div>
                        )}
                      </div>
                    </div>
                    <div className="plan-price">
                      <span className="price-amount">
                        {new Intl.NumberFormat('vi-VN').format(plan.price)}đ
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="upgrade-button"
                onClick={handleUpgrade}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <div className="button-spinner"></div>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <span>Nâng cấp ngay</span>
                    <span className="arrow">→</span>
                  </>
                )}
              </button>
              
              <p className="payment-note">
                Thanh toán qua VNPay
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
