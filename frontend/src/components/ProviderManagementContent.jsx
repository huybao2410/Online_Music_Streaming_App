
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import "./SongManagementContent.css";

const NODE_API_URL = "http://localhost:5000/api";

export default function ProviderManagementContent() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [currentProvider, setCurrentProvider] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    contact_email: "",
    contact_phone: "",
    // website: "",
    address: "",
    status: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${NODE_API_URL}/providers`);
      if (res.data.success) {
        setProviders(res.data.providers);
      }
    } catch (err) {
      setError("Không thể tải nhà cung cấp từ server");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode, provider = null) => {
    setModalMode(mode);
    setCurrentProvider(provider);
    setFormData(provider ? {
      name: provider.name || "",
      contact_email: provider.contact_email || "",
      contact_phone: provider.contact_phone || "",
      // website: provider.website || "",
      address: provider.address || "",
      status:
        provider.status === 1 || provider.status === true || provider.status === "active" || provider.status === "ACTIVE"
          ? 1
          : 0
    } : {
      name: "",
      contact_email: "",
      contact_phone: "",
      // website: "",
      address: "",
      status: 1
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentProvider(null);
    setFormData({
      name: "",
      contact_email: "",
      contact_phone: "",
      // website: "",
      address: "",
      status: true
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Bạn chưa đăng nhập");
        return;
      }
      let res;
      const submitData = { ...formData, status: formData.status ? 1 : 0 };
      if (modalMode === "create") {
        res = await axios.post(`${NODE_API_URL}/providers`, submitData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        res = await axios.put(`${NODE_API_URL}/providers/${currentProvider.provider_id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      if (res.data.success) {
        setSuccess(modalMode === "create" ? "Thêm nhà cung cấp thành công" : "Cập nhật thành công");
        fetchProviders();
        closeModal();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (providerId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa nhà cung cấp này?")) return;
    try {
      const token = localStorage.getItem("token");
      const resp = await axios.delete(`${NODE_API_URL}/providers/${providerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.data.success) {
        setSuccess("Xóa nhà cung cấp thành công!");
        fetchProviders();
      } else {
        setError(resp.data.message || "Xóa thất bại");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi xóa nhà cung cấp");
    }
  };

  return (
    <div className="song-management-content">
      <div className="content-header">
        <div className="header-left">
          <h2>Quản lý Nhà Cung Cấp</h2>
          <p>Tổng số: <strong>{providers.length}</strong> nhà cung cấp</p>
        </div>
        <button className="btn-add" onClick={() => openModal("create")}> <FaPlus /> Thêm nhà cung cấp </button>
      </div>
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button onClick={() => setError("")}><FaTimes /></button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <span>{success}</span>
          <button onClick={() => setSuccess("")}><FaTimes /></button>
        </div>
      )}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : providers.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có nhà cung cấp nào</p>
          <button className="btn-add" onClick={() => openModal("create")}> <FaPlus /> Thêm nhà cung cấp đầu tiên </button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên nhà cung cấp</th>
                <th>Email liên lạc</th>
                <th>Điện thoại liên lạc</th>
                {/* <th>Website</th> */}
                <th>Địa chỉ</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p.provider_id}>
                  <td>{p.provider_id}</td>
                  <td>{p.name}</td>
                  <td>{p.contact_email || "—"}</td>
                  <td>{p.contact_phone || "—"}</td>
                  {/* <td>{p.website || "—"}</td> */}
                  <td>{p.address || "—"}</td>
                  <td>{(Number(p.status) === 1 || p.status === 'active' || p.status === 'ACTIVE') ? "Hoạt động" : "Ngừng"}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                      <button className="btn-icon edit" title="Sửa" onClick={() => openModal("edit", p)}><FaEdit /></button>
                      <button className="btn-icon delete" title="Xóa" onClick={() => handleDelete(p.provider_id)}><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalMode === "create" ? "Thêm nhà cung cấp mới" : "Chỉnh sửa nhà cung cấp"}</h3>
              <button className="close-btn" onClick={closeModal}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <form id="provider-form" onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label>Tên nhà cung cấp <span className="required">*</span></label>
                  <input type="text" name="name" placeholder="Nhập tên nhà cung cấp..." value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="contact_email" placeholder="Email liên hệ..." value={formData.contact_email} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Điện thoại</label>
                  <input type="text" name="contact_phone" placeholder="Số điện thoại..." value={formData.contact_phone} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Địa chỉ</label>
                  <input type="text" name="address" placeholder="Địa chỉ..." value={formData.address} onChange={handleInputChange} />
                </div>
                {modalMode === "edit" && (
                  <div className="form-group">
                    <label>Trạng thái</label>
                    <select
                      name="status"
                      value={formData.status ? 1 : 0}
                      onChange={e => setFormData(prev => ({ ...prev, status: Number(e.target.value) }))}
                    >
                      <option value={1}>Đang hoạt động</option>
                      <option value={0}>Ngưng hoạt động</option>
                    </select>
                  </div>
                )}
              </form>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={closeModal} disabled={isSubmitting}>Hủy</button>
              <button type="submit" form="provider-form" className="btn-submit" disabled={isSubmitting}>{isSubmitting ? "Đang xử lý..." : (modalMode === "create" ? "Thêm" : "Cập nhật")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
