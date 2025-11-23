import React, { useEffect, useState } from "react";
import axios from "axios";
import API_URL from "../config";
import { useNavigate } from "react-router-dom";

export default function PremiumSuccess() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/");

      try {
        const res = await axios.get(`${API_URL}/api/subscriptions/current`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.is_premium) {
          setSubscription(res.data.subscription);
        }
      } catch (err) {
        console.error(err);
      }

      setLoading(false);
    };

    load();
  }, []);

  if (loading) return <div className="loading">Đang xác nhận thanh toán...</div>;

  return (
    <div className="premium-success-page">
      <h1>🎉 Nâng cấp thành công!</h1>
      <p>Bạn đã trở thành thành viên PREMIUM</p>

      {subscription && (
        <>
          <p>Gói: <strong>{subscription.subscription_plan_id}</strong></p>
          <p>Hết hạn: <strong>{new Date(subscription.end_date).toLocaleString()}</strong></p>
        </>
      )}

      <button onClick={() => navigate("/")}>Về trang chủ</button>
    </div>
  );
}
