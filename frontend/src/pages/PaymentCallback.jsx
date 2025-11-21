import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BsCheckCircleFill, BsXCircleFill } from 'react-icons/bs';
import './PaymentCallback.css';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Đang xử lý thanh toán...');

  useEffect(() => {
    const responseCode = searchParams.get('vnp_ResponseCode');
    const amount = searchParams.get('vnp_Amount');
    const orderId = searchParams.get('vnp_TxnRef');

    if (responseCode === '00') {
      setStatus('success');
      setMessage('Thanh toán thành công!');
    } else {
      setStatus('failed');
      setMessage('Thanh toán thất bại!');
    }
  }, [searchParams]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleRetry = () => {
    navigate('/premium-upgrade');
  };

  return (
    <div className="payment-callback-page">
      <div className="callback-container">
        {status === 'processing' && (
          <div className="callback-content">
            <div className="spinner"></div>
            <h2>{message}</h2>
          </div>
        )}

        {status === 'success' && (
          <div className="callback-content success">
            <BsCheckCircleFill className="callback-icon success-icon" />
            <h1>Thanh toán thành công!</h1>
            <p>Bạn đã nâng cấp Premium thành công.</p>
            <p className="subtitle">Bắt đầu trải nghiệm âm nhạc không giới hạn!</p>
            
            <button className="callback-button primary" onClick={handleGoHome}>
              Về trang chủ
            </button>
          </div>
        )}

        {status === 'failed' && (
          <div className="callback-content failed">
            <BsXCircleFill className="callback-icon failed-icon" />
            <h1>Thanh toán thất bại!</h1>
            <p>Đã có lỗi xảy ra trong quá trình thanh toán.</p>
            <p className="subtitle">Vui lòng thử lại hoặc liên hệ hỗ trợ.</p>
            
            <div className="callback-buttons">
              <button className="callback-button secondary" onClick={handleGoHome}>
                Về trang chủ
              </button>
              <button className="callback-button primary" onClick={handleRetry}>
                Thử lại
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
