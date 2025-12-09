import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminTopSongs.css";

const API = "http://localhost:5000";

export default function AdminTopSongs() {
  const [songs, setSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [selectedTop, setSelectedTop] = useState([]);

  const [searchText, setSearchText] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedTopFilter, setSelectedTopFilter] = useState("all");

  const [genres, setGenres] = useState([]); // danh sách thể loại

  const [currentPage, setCurrentPage] = useState(1);
  const songsPerPage = 10;

  useEffect(() => {
    loadSongs();
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      const res = await axios.get(`${API}/api/genres`);
      if (res.data.success) {
        setGenres(res.data.genres);
      }
    } catch (err) {
      console.error(err);
      console.warn("Không load được thể loại");
    }
  };

  const loadSongs = async () => {
    try {
      const res = await axios.get(`${API}/api/songs`);

      if (res.data.success && Array.isArray(res.data.songs)) {
        const result = res.data.songs;

        const converted = result.map((song) => ({
          ...song,
          cover_url: song.cover_url?.replace("10.0.2.2", "localhost"),
          audio_url: song.audio_url?.replace("10.0.2.2", "localhost"),
        }));

        setSongs(converted);
        setFilteredSongs(converted);

        const topIds = converted
          .filter((s) => s.is_top === 1)
          .map((s) => s.song_id);

        setSelectedTop(topIds);
      }
    } catch (error) {
      console.error("Load songs failed:", error);
    }
  };

  // 🎯 Hàm lọc tổng hợp
  const applyFilters = (search, genre, topStatus) => {
    let list = [...songs];

    // 1️⃣ Lọc theo tìm kiếm
    const lower = search.toLowerCase();
    list = list.filter((song) => {
      const title = song.title?.toLowerCase() || "";
      const artist = song.artist_names?.toLowerCase() || "";
      return title.includes(lower) || artist.includes(lower);
    });

    // 2️⃣ Lọc theo thể loại
    if (genre !== "all") {
      list = list.filter(song => song.genre_id === Number(genre));
    }

    // 3️⃣ Lọc theo is_top
    if (topStatus !== "all") {
      const topValue = topStatus === "top" ? 1 : 0;
      list = list.filter((song) => song.is_top === topValue);
    }

    setFilteredSongs(list);
    setCurrentPage(1);
  };

  // SEARCH
  const handleSearch = (value) => {
    setSearchText(value);
    applyFilters(value, selectedGenre, selectedTopFilter);
  };

  // GENRE FILTER
  const handleGenreChange = (value) => {
    setSelectedGenre(value);
    applyFilters(searchText, value, selectedTopFilter);
  };

  // TOP FILTER
  const handleTopFilterChange = (value) => {
    setSelectedTopFilter(value);
    applyFilters(searchText, selectedGenre, value);
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

  const totalPages = Math.ceil(filteredSongs.length / songsPerPage);
  const indexStart = (currentPage - 1) * songsPerPage;
  const pageSongs = filteredSongs.slice(indexStart, indexStart + songsPerPage);

  const changePage = (p) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  return (
    <div className="admin-top-songs">
      <div className="header-row">
        <h2>Quản Lý Top Songs</h2>
        {/* Ô tìm kiếm */}
        <input
          type="text"
          className="search-input"
          placeholder="Tìm bài hát hoặc nghệ sĩ..."
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
        />

        {/* Bộ lọc thể loại */}
        <select
          className="filter-select"
          value={selectedGenre}
          onChange={(e) => handleGenreChange(e.target.value)}
        >
          <option value="all">Tất cả thể loại</option>
          {genres.map((g) => (
            <option key={g.genre_id} value={g.genre_id}>
              {g.name}
            </option>
          ))}
        </select>

        {/* Bộ lọc Top */}
        <select
          className="filter-select"
          value={selectedTopFilter}
          onChange={(e) => handleTopFilterChange(e.target.value)}
        >
          <option value="all">Tất cả</option>
          <option value="top">Chỉ bài Top</option>
          <option value="non-top">Chỉ bài không Top</option>
        </select>

        <button className="btn-save-hot-songs" onClick={saveTopSongs}>
          Lưu
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

      {/* Pagination */}
      <div className="pagination">
        <button
          onClick={() => changePage(currentPage - 1)}
          disabled={currentPage === 1}
        >
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
