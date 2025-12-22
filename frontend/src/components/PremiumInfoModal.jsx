
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./PremiumInfoModal.css";
import axios from "axios";
import { MdMusicNote, MdCloudDownload, MdSkipNext } from 'react-icons/md';
import { FaHeadphones, FaArrowLeft, FaDownload, FaForward } from 'react-icons/fa';
import API_URL from "../config";

export default function PremiumInfoModal() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const res = await axios.get(`${require('../config').default}/api/users/${userId}/check-premium`);
      if (res.data.success && res.data.is_premium) {
        setSubscription({
          start_date: res.data.start_date || null,
          end_date: res.data.end_date || null,
          subscription_id: null
        });
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCancelPremium = async () => {
    if (!window.confirm("Bạn có chắc muốn hủy gói Premium?")) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/subscriptions/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        alert("❌ Bạn đã hủy gói Premium thành công.");
        localStorage.setItem("is_premium", "0");
        window.dispatchEvent(new Event("premiumUpdated"));
        navigate("/premium-upgrade");
      } else {
        alert(res.data.message || "Không thể hủy gói Premium.");
      }
    } catch (err) {
      alert("Lỗi kết nối đến server!");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Không xác định';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loadingData) {
    return (
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'60vh'}}>
        <div className="premium-info-main">
          <div className="loading-spinner"></div>
          <p>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'60vh'}}>
        <div className="premium-info-main">
          <h2>❌ Không có gói Premium</h2>
          <p>Bạn chưa đăng ký gói Premium nào.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'60vh', background:'none'}}>
      <div className="premium-info-main premium-beauty" style={{background:'none', boxShadow:'none', maxWidth:900, width:'100%', margin:'0 auto', padding:'0'}}>
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', marginTop:32}}>
          <FaArrowLeft style={{fontSize:32, color:'#ccc', position:'absolute', left:40, top:40, cursor:'pointer'}} onClick={()=>navigate(-1)} />
          <div style={{margin:'0 0 18px 0'}}>
            <span style={{fontSize:70, display:'block', textAlign:'center'}}>💎</span>
          </div>
          <h1 style={{fontSize:44, fontWeight:900, color:'#ffe066', margin:'0 0 18px 0', textAlign:'center'}}>Thành viên Premium</h1>
          <div style={{display:'flex', justifyContent:'center', gap:32, width:'100%', marginBottom:32}}>
            <div style={{background:'#23243a', borderRadius:20, padding:'28px 38px', minWidth:180, textAlign:'center', border:'1px solid #444'}}>
              <div style={{color:'#bbb', fontWeight:600, fontSize:16, marginBottom:8}}>GÓI ĐANG SỬ DỤNG</div>
              <div style={{color:'#ffe066', fontWeight:900, fontSize:28}}>1 tháng</div>
            </div>
            <div style={{background:'#23243a', borderRadius:20, padding:'28px 38px', minWidth:180, textAlign:'center', border:'1px solid #444'}}>
              <div style={{color:'#bbb', fontWeight:600, fontSize:16, marginBottom:8}}>THỜI HẠN ĐẾN</div>
              <div style={{color:'#fff', fontWeight:900, fontSize:28}}>{formatDate(subscription.end_date)}</div>
            </div>
            <div style={{background:'#23243a', borderRadius:20, padding:'28px 38px', minWidth:180, textAlign:'center', border:'1px solid #444'}}>
              <div style={{color:'#bbb', fontWeight:600, fontSize:16, marginBottom:8}}>CHẤT LƯỢNG ÂM THANH</div>
              <div style={{color:'#fff', fontWeight:900, fontSize:28}}>320kbps</div>
            </div>
          </div>
          <div style={{background:'#23243a', borderRadius:24, padding:'32px 24px', width:'100%', maxWidth:800, margin:'0 auto 32px auto', border:'1px solid #444'}}>
            <h2 style={{color:'#fff', fontWeight:900, fontSize:28, textAlign:'center', marginBottom:24}}>Quyền lợi của bạn</h2>
            <div style={{display:'flex', flexWrap:'wrap', gap:24, justifyContent:'center'}}>
              <div style={{background:'#292b3d', borderRadius:16, padding:'18px 28px', minWidth:260, display:'flex', alignItems:'center', gap:16, marginBottom:12}}>
                <FaHeadphones style={{fontSize:32, color:'#fff'}} />
                <span style={{color:'#fff', fontWeight:600, fontSize:18}}>Nghe nhạc không quảng cáo</span>
              </div>
              <div style={{background:'#292b3d', borderRadius:16, padding:'18px 28px', minWidth:260, display:'flex', alignItems:'center', gap:16, marginBottom:12}}>
                <FaDownload style={{fontSize:32, color:'#fff'}} />
                <span style={{color:'#fff', fontWeight:600, fontSize:18}}>Tải nhạc nghe offline</span>
              </div>
              <div style={{background:'#292b3d', borderRadius:16, padding:'18px 28px', minWidth:260, display:'flex', alignItems:'center', gap:16, marginBottom:12}}>
                <FaForward style={{fontSize:32, color:'#fff'}} />
                <span style={{color:'#fff', fontWeight:600, fontSize:18}}>Bỏ qua bài hát không giới hạn</span>
              </div>
            </div>
          </div>
          <button
            className="cancel-premium-btn"
            onClick={handleCancelPremium}
            disabled={loading}
            style={{marginTop: 18, minWidth: 220, fontSize: 20, fontWeight:700, borderRadius:14, padding:'16px 0'}}>
            {loading ? "Đang xử lý..." : "Hủy gói Premium"}
          </button>
        </div>
      </div>
    </div>
  );
}
