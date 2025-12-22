import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaMusic,
  FaCompactDisc,
  FaUser,
  FaPlay,
} from "react-icons/fa";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar } from "react-chartjs-2";

/* ================= CHART SETUP ================= */
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

/* ================= MAIN COMPONENT ================= */
export default function FavoriteManagementContent() {
  const token = localStorage.getItem("token");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await axios.get(
        "/api/admin/favorites/summary",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setData(res.data);
    } catch (err) {
      console.error("Load favorite dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Đang tải thống kê...</p>;
  if (!data) return <p>Không có dữ liệu</p>;

  return (
    <div style={styles.dashboard}>
      {/* ================= SUMMARY ================= */}
      <div style={styles.summaryGrid}>
        <SummaryBox icon={<FaPlay />} label="Tổng lượt nghe" value={data.total.songPlays} />
        <SummaryBox icon={<FaMusic />} label="Lượt thích bài hát" value={data.total.songLikes} />
        <SummaryBox icon={<FaCompactDisc />} label="Lượt thích album" value={data.total.albumLikes} />
        <SummaryBox icon={<FaUser />} label="Lượt thích nghệ sĩ" value={data.total.artistLikes} />
      </div>

      {/* ================= TOP LIST ================= */}
      <div style={styles.topGrid}>
        <TopList title="💿 Album được thích nhiều" items={data.topAlbums} valueKey="likes" />
        <TopList title="🎤 Nghệ sĩ được thích nhiều" items={data.topArtists} valueKey="likes" />
      </div>

      {/* ================= CHART: TOP SONGS ================= */}
      {/* ================= CHART: TOP SONGS ================= */}
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Top bài hát theo lượt nghe</h3>
        <Bar
          data={{
            labels: data.topSongs.map((s) => s.name),
            datasets: [
              {
                label: "Lượt nghe",
                data: data.topSongs.map((s) => s.play_count),
                backgroundColor: data.topSongs.map(
                  (_, i) => `hsl(${i * 60}, 70%, 55%)`
                ),
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: {
              legend: { display: false },
            },
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          }}
        />
      </div>

    </div>
  );
}

/* ================= SUB COMPONENTS ================= */

function SummaryBox({ icon, label, value }) {
  return (
    <div style={styles.summaryBox}
      onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
      onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
    >
      <div style={styles.summaryIcon}>{icon}</div>
      <div>
        <div style={styles.summaryLabel}>{label}</div>
        <div style={styles.summaryValue}>{value}</div>
      </div>
    </div>
  );
}

function TopList({ title, items, valueKey }) {
  return (
    <div style={styles.topCard}>
      <h3 style={styles.topTitle}>{title}</h3>
      <ul style={styles.topList}>
        {items.map((item, i) => (
          <li key={item.id} style={styles.topItem}>
            <span>{i + 1}. {item.name}</span>
            <strong>{item[valueKey]}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  dashboard: {
    padding: 24,
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
    marginBottom: 32,
  },

  summaryBox: {
    background: "#ffffff",
    color: "#111827",
    padding: 16,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    gap: 16,
    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
    transition: "all 0.2s ease",
    cursor: "pointer",
  },


  summaryIcon: {
    fontSize: 28,
    color: "#2563eb",
  },

  summaryLabel: {
    fontSize: 14,
    opacity: 0.85,
  },

  summaryValue: {
    fontSize: 22,
    fontWeight: "bold",
  },

  chartCard: {
    background: "#ffffff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
  },

  chartTitle: {
    marginBottom: 16,
    fontWeight: "bold",
  },

  topGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
    marginBottom: 32,
  },

  topCard: {
    background: "#ffffff",
    color: "#111827",
    padding: 16,
    borderRadius: 14,
    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
  },

  topTitle: {
    marginBottom: 12,
  },

  topList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },

  topItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid #e5e7eb",
  },
};
