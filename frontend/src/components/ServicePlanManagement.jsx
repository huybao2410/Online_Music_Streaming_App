import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ServicePlanManagement.css";

const ServicePlanManagement = () => {
  const [plans, setPlans] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPlans();
    // eslint-disable-next-line
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/api/subscriptions/plans", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlans(res.data.plans || []);
    } catch (err) {
      setError("Không thể tải danh sách gói dịch vụ.");
    }
    setLoading(false);
  };

  const handleAddPlan = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!name || !price || !duration) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    try {
      setLoading(true);
      await axios.post(
        "/api/subscriptions/plans",
        { name, price, duration },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Thêm gói dịch vụ thành công!");
      setName("");
      setPrice("");
      setDuration("");
      fetchPlans();
    } catch (err) {
      setError("Lỗi khi thêm gói dịch vụ.");
    }
    setLoading(false);
  };

  return (
    <div className="tab-content">
      <h2>Quản lý Gói dịch vụ</h2>
      <form onSubmit={handleAddPlan} style={{ marginBottom: 24 }}>
        <div className="service-plan-form">
          <input
            type="text"
            placeholder="Tên gói"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            type="number"
            placeholder="Giá (VNĐ)"
            value={price}
            onChange={e => setPrice(e.target.value)}
          />
          <input
            type="number"
            placeholder="Thời hạn (ngày)"
            value={duration}
            onChange={e => setDuration(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            Thêm mới
          </button>
        </div>
        {error && <div className="service-plan-error">{error}</div>}
        {success && <div className="service-plan-success">{success}</div>}
      </form>
      <div>
        <h3>Danh sách gói dịch vụ</h3>
        {loading ? (
          <div>Đang tải...</div>
        ) : (
          <table className="service-plan-table">
            <thead>
              <tr>
                <th>Tên gói</th>
                <th>Giá (VNĐ)</th>
                <th>Thời hạn (ngày)</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan, idx) => (
                <tr key={idx}>
                  <td>{plan.name}</td>
                  <td>{plan.price}</td>
                  <td>{plan.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ServicePlanManagement;
