import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaSearch,
  FaEdit,
  FaTrash,
  FaBan,
  FaCheckCircle,
  FaTimes,
  FaUser,
  FaUserShield,
  FaGoogle,
} from "react-icons/fa";
import "./UserManagementContent.css";

const NODE_API_URL = "http://localhost:5000/api";

const UserManagementContent = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter states
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [authFilter, setAuthFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    role: "user",
    status: "active",
  });

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${NODE_API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setUsers(response.data.users);
        setFilteredUsers(response.data.users);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.response?.data?.message || "Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter and search
  useEffect(() => {
    let result = [...users];

    // Search by name/email/phone
    if (searchTerm) {
      result = result.filter(
        (user) =>
          user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone_number?.includes(searchTerm)
      );
    }

    // Filter by role
    if (roleFilter !== "all") {
      result = result.filter((user) => user.role === roleFilter);
    }

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((user) => user.status === statusFilter);
    }

    // Filter by auth type
    if (authFilter !== "all") {
      if (authFilter === "local") {
        result = result.filter((user) => user.password_hash !== null);
      } else if (authFilter === "google") {
        result = result.filter((user) => user.password_hash === null);
      }
    }

    setFilteredUsers(result);
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, authFilter, users]);

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Get auth type badge
  const getAuthBadge = (user) => {
    if (user.password_hash === null) {
      return (
        <span className="auth-badge google">
          <FaGoogle /> Google
        </span>
      );
    }
    return (
      <span className="auth-badge local">
        <FaUser /> Local
      </span>
    );
  };

  // Get role badge
  const getRoleBadge = (role) => {
    if (role === "admin") {
      return (
        <span className="role-badge admin">
          <FaUserShield /> Admin
        </span>
      );
    }
    return (
      <span className="role-badge user">
        <FaUser /> User
      </span>
    );
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      active: { icon: <FaCheckCircle />, className: "status-badge active", text: "Hoạt động" },
      inactive: { icon: <FaBan />, className: "status-badge inactive", text: "Không hoạt động" },
      banned: { icon: <FaBan />, className: "status-badge banned", text: "Bị cấm" },
    };
    const s = statusMap[status] || statusMap.active;
    return (
      <span className={s.className}>
        {s.icon} {s.text}
      </span>
    );
  };

  // Open edit modal
  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      role: user.role,
      status: user.status,
    });
    setShowEditModal(true);
    setError("");
    setSuccess("");
  };

  // Save user changes
  const handleSaveUser = async () => {
    if (!editingUser) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");

      // Update role if changed
      if (formData.role !== editingUser.role) {
        await axios.patch(
          `${NODE_API_URL}/admin/users/${editingUser.id}/role`,
          { role: formData.role },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // Update status if changed
      if (formData.status !== editingUser.status) {
        await axios.patch(
          `${NODE_API_URL}/admin/users/${editingUser.id}/status`,
          { status: formData.status },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setSuccess("Cập nhật người dùng thành công!");
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      console.error("Error updating user:", err);
      setError(err.response?.data?.message || "Không thể cập nhật người dùng");
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Bạn có chắc muốn xóa người dùng "${username}"?`)) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${NODE_API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("Xóa người dùng thành công!");
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(err.response?.data?.message || "Không thể xóa người dùng");
    } finally {
      setLoading(false);
    }
  };

  // Toggle ban/unban
  const handleToggleBan = async (user) => {
    const newStatus = user.status === "banned" ? "active" : "banned";
    const action = newStatus === "banned" ? "cấm" : "bỏ cấm";

    if (!window.confirm(`Bạn có chắc muốn ${action} người dùng "${user.username || user.email}"?`)) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${NODE_API_URL}/admin/users/${user.id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(`${action.charAt(0).toUpperCase() + action.slice(1)} người dùng thành công!`);
      fetchUsers();
    } catch (err) {
      console.error("Error toggling ban:", err);
      setError(err.response?.data?.message || `Không thể ${action} người dùng`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-management-container">
      {/* Header */}
      <div className="management-header">
        <h2>Quản lý người dùng</h2>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError("")} className="alert-close">
            <FaTimes />
          </button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess("")} className="alert-close">
            <FaTimes />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select value={authFilter} onChange={(e) => setAuthFilter(e.target.value)}>
            <option value="all">Tất cả loại tài khoản</option>
            <option value="local">Local (Email/SĐT)</option>
            <option value="google">Google</option>
          </select>

          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">Tất cả vai trò</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
            <option value="banned">Bị cấm</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading && !users.length ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải danh sách người dùng...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <FaUser className="empty-icon" />
          <p>Không tìm thấy người dùng nào</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Avatar</th>
                  <th>Tên người dùng</th>
                  <th>Email/SĐT</th>
                  <th>Loại TK</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Premium</th>
                  <th>Ngày tạo</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.username} className="user-avatar" />
                      ) : (
                        <div className="no-avatar">
                          <FaUser />
                        </div>
                      )}
                    </td>
                    <td>{user.username || <em className="text-muted">Chưa đặt</em>}</td>
                    <td>
                      {user.email && <div>{user.email}</div>}
                      {user.phone_number && <div className="text-muted">{user.phone_number}</div>}
                    </td>
                    <td>{getAuthBadge(user)}</td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td>{getStatusBadge(user.status)}</td>
                    <td>
                      {user.is_premium ? (
                        <span className="premium-badge">⭐ Premium</span>
                      ) : (
                        <span className="text-muted">Free</span>
                      )}
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString("vi-VN")}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEdit(user)}
                          className="btn-icon btn-edit"
                          title="Chỉnh sửa"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleToggleBan(user)}
                          className={`btn-icon ${user.status === "banned" ? "btn-unban" : "btn-ban"}`}
                          title={user.status === "banned" ? "Bỏ cấm" : "Cấm"}
                        >
                          <FaBan />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.username || user.email)}
                          className="btn-icon btn-delete"
                          title="Xóa"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Trước
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => handlePageChange(index + 1)}
                  className={`pagination-btn ${currentPage === index + 1 ? "active" : ""}`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chỉnh sửa người dùng</h3>
              <button onClick={() => setShowEditModal(false)} className="modal-close-btn">
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="user-info-display">
                <p>
                  <strong>ID:</strong> {editingUser.id}
                </p>
                <p>
                  <strong>Tên:</strong> {editingUser.username || <em>Chưa đặt</em>}
                </p>
                <p>
                  <strong>Email:</strong> {editingUser.email || <em>Không có</em>}
                </p>
                <p>
                  <strong>SĐT:</strong> {editingUser.phone_number || <em>Không có</em>}
                </p>
                <p>
                  <strong>Loại TK:</strong> {getAuthBadge(editingUser)}
                </p>
              </div>

              <form className="modal-form">
                <div className="form-group">
                  <label>Vai trò</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                    <option value="banned">Bị cấm</option>
                  </select>
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowEditModal(false)} className="btn-secondary">
                Hủy
              </button>
              <button onClick={handleSaveUser} className="btn-primary" disabled={loading}>
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementContent;
