import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminTopSongs.css";

const API = "http://localhost:5000";

export default function AdminTopSongs() {
  const [songs, setSongs] = useState([]);
  const [selectedTop, setSelectedTop] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const songsPerPage = 10;

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      // 🔥 Load tất cả bài hát
      const res = await axios.get(`${API}/songs`);

      if (res.data.success && Array.isArray(res.data.songs)) {
        const result = res.data.songs;

        const converted = result.map((song) => ({
          ...song,
          cover_url: song.cover_url?.replace("10.0.2.2", "localhost"),
          audio_url: song.audio_url?.replace("10.0.2.2", "localhost"),
        }));

        setSongs(converted);

        // 🎯 Tự động tick bài nào is_top = 1
        const topIds = converted
          .filter((s) => s.is_top === 1)
          .map((s) => s.song_id);

        setSelectedTop(topIds);
      }
    } catch (error) {
      console.error("Load songs failed:", error);
    }
  };

  const toggleTop = (id) => {
    setSelectedTop((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const saveTopSongs = async () => {
    try {
      await axios.post(`${API}/top-songs/set-top-songs`, {
        top_songs: selectedTop,
      });

      alert("Đã cập nhật Top Songs!");
      loadSongs();
    } catch (error) {
      alert("Không thể cập nhật Top Songs");
    }
  };

  const totalPages = Math.ceil(songs.length / songsPerPage);
  const indexStart = (currentPage - 1) * songsPerPage;
  const pageSongs = songs.slice(indexStart, indexStart + songsPerPage);

  const changePage = (p) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  return (
    <div className="admin-top-songs">
      <div className="header-row">
        <h2>🔥 Quản Lý Top Songs</h2>
        <button className="btn-save" onClick={saveTopSongs}>
          💾 Lưu Top Songs
        </button>
      </div>

      <table className="top-songs-table">
        <thead>
          <tr>
            <th>Top</th>
            <th>Ảnh</th>
            <th>Bài hát</th>
            <th>Nghệ sĩ</th>
            <th>Thể loại</th>
            <th>Lượt nghe</th>
          </tr>
        </thead>

        <tbody>
          {pageSongs.map((song) => (
            <tr key={song.song_id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedTop.includes(song.song_id)}
                  onChange={() => toggleTop(song.song_id)}
                />
              </td>

              <td>
                <img
                  src={song.cover_url || "https://placehold.co/60"}
                  className="cover-img"
                  alt="cover"
                />
              </td>

              <td><strong>{song.title}</strong></td>

              <td>{song.artist_names || "Không rõ"}</td>

              <td>{song.genre_name || "-"}</td>

              <td>{(song.play_count || 0).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1}>
          ◀
        </button>

        {[...Array(totalPages)].map((_, i) => {
          const page = i + 1;
          return (
            <button
              key={page}
              className={page === currentPage ? "active" : ""}
              onClick={() => changePage(page)}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={() => changePage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          ▶
        </button>
      </div>
    </div>
  );
}
