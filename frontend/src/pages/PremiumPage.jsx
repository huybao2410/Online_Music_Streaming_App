import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BsCheckCircleFill } from 'react-icons/bs';
import { MdMusicNote, MdCloudDownload, MdBlock } from 'react-icons/md';
import axios from 'axios';
import './PremiumPage.css';
import API_URL from "../config";

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
      const response = await axios.get(`${API_URL}/api/subscriptions/plans`);

      if (response.data.success) {
        setPlans(response.data.plans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Vui lòng đăng nhập để nâng cấp Premium");
      navigate("/");
      return;
    }

    try {
      setProcessing(true);

      // Fix decode token
      const payload = JSON.parse(
        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      const userId = payload.id;

      const plan = plans[selectedPlan];

      const response = await axios.post(
        `${API_URL}/api/vnpay/create-payment`,
        {
          user_id: userId,
          plan_id: plan.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.paymentUrl) {
        // Redirect to VNPay
        window.location.href = response.data.paymentUrl;
      } else {
        alert("Không thể tạo thanh toán. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert(error.response?.data?.message || "Lỗi khi xử lý thanh toán");
    } finally {
      setProcessing(false);
    }
  };


  

  const benefits = [
    {
      icon: <MdBlock size={32} />,
      title: "Nghe nhạc không quảng cáo",
      description: "Trải nghiệm âm nhạc liền mạch không bị gián đoạn"
    },
    {
      icon: <MdCloudDownload size={32} />,
      title: "Tải nhạc nghe offline",
      description: "Nghe mọi lúc mọi nơi, không cần internet"
    },
    {
      icon: <MdMusicNote size={32} />,
      title: "Không giới hạn bài hát",
      description: "Thưởng thức toàn bộ thư viện nhạc"
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
        <div className="premium-content">

          {/* LEFT */}
          <div className="premium-left">
            <div className="premium-hero">
              <div className="premium-badge">
                <span className="badge-icon">👑</span>
                <span>PREMIUM</span>
              </div>
              <h1 className="premium-title">Nâng cấp tài khoản</h1>
              <p className="premium-subtitle">Trải nghiệm âm nhạc không giới hạn!</p>
            </div>

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
          </div>

          {/* RIGHT */}
          <div className="premium-right">
            <div className="plans-sticky">
              <h2 className="plans-title">Chọn gói Premium của bạn</h2>

              <div className="plans-list">
                {plans.map((plan, index) => (
                  <div
                    key={plan.id}
                    className={`plan-card ${selectedPlan === index ? "selected" : ""}`}
                    onClick={() => setSelectedPlan(index)}
                  >
                    <div className="plan-header">
                      <div className="plan-info">
                        <h3>{plan.name}</h3>
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
                        {new Intl.NumberFormat("vi-VN").format(plan.price)}đ
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button className="upgrade-button" onClick={handleUpgrade} disabled={processing}>
                {processing ? "Đang xử lý..." : "Nâng cấp ngay →"}
              </button>

              <p className="payment-note">Thanh toán qua VNPay</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
