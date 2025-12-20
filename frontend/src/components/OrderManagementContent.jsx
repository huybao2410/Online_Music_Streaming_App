import React, { useEffect, useState } from 'react';
import './OrderManagementContent.css';
import { FaFileInvoiceDollar, FaTrash, FaSearch } from 'react-icons/fa';

const OrderManagementContent = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:5000/api/admin/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredOrders = orders.filter(order =>
    (order.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    order.email?.toLowerCase().includes(search.toLowerCase()) ||
    order.order_id?.toString().includes(search) ||
    order.plan_name?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="order-management-content">
      <div className="tab-header">
        <div className="order-title">
          <FaFileInvoiceDollar className="order-title-icon" />
          Quản lý hóa đơn
        </div>
        <div className="order-search-bar">
          <input
            type="text"
            className="order-search-input"
            placeholder="Tìm kiếm theo tên, email, mã hóa đơn..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <FaSearch className="order-search-icon" />
        </div>
      </div>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã hóa đơn</th>
              <th>Người dùng</th>
              <th>Email</th>
              <th>Gói dịch vụ</th>
              <th>Số tiền</th>
              <th>Ngày giao dịch</th>
              <th>Trạng thái</th>
              <th>Phương thức</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="loading-state">
                  <div className="spinner" /> Đang tải dữ liệu hóa đơn...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-state">
                  <p>Không có hóa đơn nào phù hợp.</p>
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => (
                <tr key={order.order_id}>
                  <td>{order.order_id}</td>
                  <td>{order.user_name}</td>
                  <td>{order.email}</td>
                  <td>{order.plan_name}</td>
                  <td>{order.amount?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>
                  <td>{
                    order.transaction_date
                      ? (() => {
                          let d = order.transaction_date;
                          // Nếu là số, chuyển sang string
                          if (typeof d === 'number') d = d.toString();
                          // Nếu là chuỗi số kiểu yyyymmddhhmmss (VNPay), convert
                          if (/^\d{14}$/.test(d)) {
                            // yyyyMMddHHmmss => yyyy-MM-ddTHH:mm:ss
                            d = `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}T${d.slice(8,10)}:${d.slice(10,12)}:${d.slice(12,14)}`;
                          }
                          const dateObj = new Date(d);
                          return isNaN(dateObj) ? '' : dateObj.toLocaleString('vi-VN');
                        })()
                      : ''
                  }</td>
                  <td>
                    <span
                      className={`status-badge ${
                        order.payment_status === 'completed'
                          ? 'active'
                          : order.payment_status === 'pending'
                          ? 'pending'
                          : 'inactive'
                      }`}
                    >
                      {order.payment_status === 'completed'
                        ? 'Thành công'
                        : order.payment_status === 'pending'
                        ? 'Đang xử lý'
                        : 'Thất bại'}
                    </span>
                  </td>
                  <td>{order.payment_gateway || ''}</td>
                  <td className="action-cell">
                    <button className="action-btn delete" title="Xóa hóa đơn">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderManagementContent;
