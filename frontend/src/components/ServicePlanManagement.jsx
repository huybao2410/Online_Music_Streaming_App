import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ServicePlanManagement.css";
import { FaTrash } from "react-icons/fa";

const ServicePlanManagement = () => {
  const [plans, setPlans] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
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
    // check duration nữa
    if (!name || !price || !description || !duration) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    try {
      setLoading(true);
      // gửi duration cùng body
      const res = await axios.post(
        "/api/subscriptions/plans",
        { name, price, duration, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(res.data?.message || "Thêm gói dịch vụ thành công!");
      setName("");
      setPrice("");
      setDuration("");
      setDescription("");
      fetchPlans();
    } catch (err) {
      console.log("ADD PLAN ERROR:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Lỗi khi thêm gói dịch vụ.");
    } finally {
      setLoading(false);
    }
  };

  // ở trên component, thêm hàm:
  const handleDeletePlan = async (planId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa gói này? Hành động không thể hoàn tác.")) return;

    setError("");
    setSuccess("");
    try {
      setLoading(true);
      const res = await axios.delete(`/api/subscriptions/plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(res.data?.message || "Xóa gói thành công");
      // loại bỏ plan khỏi state
      setPlans(prev => prev.filter(p => p.id !== planId));
    } catch (err) {
      console.log("DELETE PLAN ERROR:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Lỗi khi xóa gói dịch vụ.");
    } finally {
      setLoading(false);
    }
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
            placeholder="Số ngày sử dụng"
            value={duration}
            onChange={e => setDuration(e.target.value)}
          />
          <input
            type="text"
            placeholder="Mô tả"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            Thêm mới
          </button>
        </div>
        {error && <div className="service-plan-error">{error}</div>}
        {success && <div className="service-plan-success">{success}</div>}
      </form>
      <div>
        <h3 className="name-subscription-title">Danh sách gói dịch vụ</h3>
        {loading ? (
          <div>Đang tải...</div>
        ) : (
          <table className="service-plan-table">
            <thead>
              <tr>
                <th>Tên gói</th>
                <th>Giá (VNĐ)</th>
                <th>Số ngày sử dụng</th>
                <th>Mô tả</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan, idx) => (
                <tr key={plan.id || idx}>
                  <td>{plan.name}</td>
                  <td>{plan.price}</td>
                  <td>{plan.duration}</td>
                  <td>{plan.description}</td>
                  <td className="action-cell">
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeletePlan(plan.id)}
                      disabled={loading}
                      title="Xóa gói dịch vụ"
                    >
                      <FaTrash />
                    </button>
                  </td>
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