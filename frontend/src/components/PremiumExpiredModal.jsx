import React from "react";
import "./PremiumExpiredModal.css";
import { useNavigate } from "react-router-dom";

export default function PremiumExpiredModal({ onClose }) {
  const navigate = useNavigate();

  return (
    <div className="premium-expired-overlay" onClick={onClose}>
      <div className="premium-expired-modal" onClick={(e) => e.stopPropagation()}>
        <h2>⚠️ Gói Premium của bạn đã hết hạn</h2>
        <p>Hãy gia hạn ngay để tiếp tục nghe nhạc không quảng cáo và tải nhạc offline.</p>

        <div className="modal-actions">
          <button
            className="renew-btn"
            onClick={() => {
              onClose();
              navigate("/premium");
            }}
          >
            Gia hạn ngay
          </button>
          <button className="cancel-btn" onClick={onClose}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
