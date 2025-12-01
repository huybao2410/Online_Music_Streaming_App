import React, { useEffect, useState } from "react";
import axios from "axios";
import { Line, Bar, Doughnut, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from "chart.js";
import "./AdminStatistics.css";
import { FaUsers, FaCrown, FaMoneyBillWave, FaChartLine, FaMusic } from "react-icons/fa";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, 
  Title, Tooltip, Legend, ArcElement, Filler
);

const AdminStatistics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/statistics", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Lỗi tải thống kê", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  if (loading) return <div className="stats-loading"><div className="spinner"></div></div>;
  if (!data) return <div className="stats-error">Không có dữ liệu thống kê.</div>;

  // Đảm bảo các trường là mảng rỗng nếu undefined
  const charts = data.charts || {};
  const revenueArr = Array.isArray(charts.revenue) ? charts.revenue : [];
  const newUsersArr = Array.isArray(charts.new_users) ? charts.new_users : [];
  const newPremiumArr = Array.isArray(charts.new_premium) ? charts.new_premium : [];
  const revenueByPlanArr = Array.isArray(charts.revenue_by_plan) ? charts.revenue_by_plan : [];
  const topSongsArr = Array.isArray(data.top_songs) ? data.top_songs : [];

  // --- Dữ liệu biểu đồ ---
  // Helper tạo mảng ngày 7 ngày gần nhất để label luôn đủ
  const getLast7Days = () => {
     const dates = [];
     for (let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toLocaleDateString('vi-VN'));
     }
     return dates;
  };
  
  const labels7Days = getLast7Days();

  // Map dữ liệu API vào label 7 ngày (để tránh chart bị lệch nếu ngày nào đó ko có data)
  // (Ở đây làm đơn giản, dùng dữ liệu API trả về, nếu cần chính xác từng ngày trống thì cần logic map phức tạp hơn)
  const revenueChartData = {
    labels: revenueArr.map(d => new Date(d.date).toLocaleDateString('vi-VN')),
    datasets: [{
      label: 'Doanh thu (VNĐ)',
      data: revenueArr.map(d => d.total),
      borderColor: '#8b5cf6',
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.5)');
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
        return gradient;
      },
      fill: true,
      tension: 0.4,
    }]
  };

  const userGrowthData = {
    labels: newUsersArr.map(d => new Date(d.date).toLocaleDateString('vi-VN')),
    datasets: [
      {
        label: 'User mới',
        data: newUsersArr.map(d => d.count),
        backgroundColor: '#3b82f6',
        borderRadius: 4,
      },
      {
        label: 'Premium mới',
        data: newPremiumArr.map(d => d.count),
        backgroundColor: '#f59e0b',
        borderRadius: 4,
      }
    ]
  };

  const userRatioData = {
    labels: ['Free', 'Premium'],
    datasets: [{
      data: [data.kpi.free_users, data.kpi.premium_users],
      backgroundColor: ['#e5e7eb', '#10b981'],
      borderWidth: 0,
    }]
  };

  const revenueByPlanData = {
    labels: revenueByPlanArr.map(p => p.plan_name),
    datasets: [{
      data: revenueByPlanArr.map(p => p.total),
      backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899'],
      borderWidth: 0
    }]
  };

  const commonOptions = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: '#f3f4f6' }, border: { display: false } } }
  };

  return (
    <div className="admin-stats-container">
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card total-users">
          <div className="kpi-icon"><FaUsers /></div>
          <div className="kpi-info">
            <h3>Tổng User</h3>
            <p>{data.kpi.total_users.toLocaleString()}</p>
          </div>
        </div>
        <div className="kpi-card premium-users">
          <div className="kpi-icon"><FaCrown /></div>
          <div className="kpi-info">
            <h3>User Premium</h3>
            <p>{data.kpi.premium_users.toLocaleString()}</p>
          </div>
          <div className="kpi-sub">{((data.kpi.premium_users / data.kpi.total_users) * 100).toFixed(1)}%</div>
        </div>
        <div className="kpi-card revenue">
          <div className="kpi-icon"><FaMoneyBillWave /></div>
          <div className="kpi-info">
            <h3>Tổng Doanh Thu</h3>
            <p>{parseInt(data.kpi.total_revenue).toLocaleString('vi-VN')} đ</p>
          </div>
        </div>
      </div>

      <div className="charts-row-large">
        <div className="chart-box main-chart">
          <div className="chart-header"><h4><FaChartLine /> Doanh thu 7 ngày qua</h4></div>
          <div className="chart-canvas-wrapper"><Line data={revenueChartData} options={commonOptions} /></div>
        </div>
        <div className="chart-box side-chart">
           <div className="chart-header"><h4>Gói đăng ký</h4></div>
           <div className="chart-canvas-wrapper-circle"><Pie data={revenueByPlanData} options={commonOptions} /></div>
        </div>
      </div>

      <div className="charts-row-equal">
        <div className="chart-box">
           <div className="chart-header"><h4>Tăng trưởng người dùng</h4></div>
          <Bar data={userGrowthData} options={commonOptions} />
        </div>
        
        {/* --- PHẦN MỚI: TOP BÀI HÁT --- */}
        <div className="chart-box top-songs-box">
           <div className="chart-header"><h4><FaMusic /> Top 5 Bài Hát Hot</h4></div>
           <div className="top-songs-list">
              {topSongsArr.length === 0 ? (
                <p style={{color:'#999', textAlign:'center'}}>Chưa có dữ liệu nghe nhạc</p>
              ) : (
                topSongsArr.map((song, idx) => (
                  <div key={song.song_id} className="top-song-item">
                    <div className="song-rank">{idx + 1}</div>
                    <img src={song.cover_url || 'https://placehold.co/40x40'} alt={song.title} className="song-thumb" />
                    <div className="song-info">
                      <div className="song-name">{song.title}</div>
                      <div className="song-artist">{song.artist_name}</div>
                    </div>
                    <div className="song-plays">{song.plays} lượt nghe</div>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatistics;