import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiPlus,
  HiHeart,
  HiMusicalNote,
} from "react-icons/hi2";
import { FaCompactDisc } from "react-icons/fa";
import CreatePlaylistModal from "../components/CreatePlaylistModal";
import { getFavoriteArtists } from "../services/favoriteArtistService";
import { getGenres } from "../services/genreService";
import "./Sidebar.css";

export default function Sidebar({ isLoginOpen, setIsLoginOpen }) {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [activeTab, setActiveTab] = useState("playlist");
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [favoriteArtists, setFavoriteArtists] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loadingGenres, setLoadingGenres] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    if (isLoggedIn) fetchUserPlaylists();
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) fetchFavoriteArtists();
  }, [isLoggedIn]);

  useEffect(() => {
    if (activeTab === "genre") fetchGenres();
  }, [activeTab]);

  const fetchUserPlaylists = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:5000/api/playlists/my-playlists", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setPlaylists(data.playlists);
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
  };

  const fetchFavoriteArtists = async () => {
    try {
      const data = await getFavoriteArtists();
      setFavoriteArtists(data);
    } catch (error) {}
  };

  const fetchGenres = async () => {
    try {
      setLoadingGenres(true);
      const data = await getGenres();
      setGenres([{ id: 0, name: "Tất cả bài hát" }, ...data]);
    } catch {}
    finally { setLoadingGenres(false); }
  };

  const handleCreatePlaylist = () => setShowCreatePlaylist(true);

  const handleGenreSelect = (genre) => {
    // Gửi genre object {id, name} cho HomePage
    window.dispatchEvent(new CustomEvent("genreSelected", { detail: genre }));

    // ❌ KHÔNG navigate("/") nữa — đây là lỗi khiến nó bị nhảy trang!
    // navigate("/");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-library">
        <div className="library-header">
          <div className="library-title">
            <span>Thư viện</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${activeTab === "playlist" ? "active" : ""}`}
            onClick={() => setActiveTab("playlist")}
          >
            Playlist
          </button>

          {/* ❌ TAB NGHỆ SĨ ĐÃ ẨN THEO ĐÚNG YÊU CẦU */}
          {/* 
          <button
            className={`filter-tab ${activeTab === "artists" ? "active" : ""}`}
            onClick={() => setActiveTab("artists")}
          >
            Nghệ sĩ
          </button>
          */}

          <button
            className={`filter-tab ${activeTab === "genre" ? "active" : ""}`}
            onClick={() => setActiveTab("genre")}
          >
            Thể loại
          </button>
        </div>

        <div className="library-content">
          {/* PLAYLIST TAB */}
          {activeTab === "playlist" && (
            <>
              {isLoggedIn ? (
                <>
                  <div className="create-playlist-section">
                    <button
                      className="create-playlist-btn-logged"
                      onClick={handleCreatePlaylist}
                    >
                      <HiPlus size={20} />
                      <span>Tạo playlist</span>
                    </button>
                  </div>

                  {/* Bài hát đã thích */}
                  <button onClick={() => navigate("/favorites")} className="library-item">
                    <div className="item-cover liked-songs">
                      <HiHeart size={32} />
                    </div>
                    <div className="item-info">
                      <span className="item-title">Bài hát đã thích</span>
                      <span className="item-subtitle">Playlist</span>
                    </div>
                  </button>

                  {/* ALBUM YÊU THÍCH */}
                  <button onClick={() => navigate("/favorite-albums")} className="library-item">
                    <div className="item-cover" style={{
                      background: "linear-gradient(135deg, #450af5, #8e44ad)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <FaCompactDisc size={28} color="white" />
                    </div>
                    <div className="item-info">
                      <span className="item-title">Album đã thích</span>
                      <span className="item-subtitle">Album</span>
                    </div>
                  </button>

                  {/* Đã bỏ nút nghệ sĩ yêu thích ở sidebar */}

                  {/* Danh sách playlist */}
                  {playlists.map((p) => (
                    <button
                      key={p.playlist_id}
                      className="library-item"
                      onClick={() => navigate(`/playlist/${p.playlist_id}`)}
                    >
                      <div className="item-cover playlist">
                        {p.cover_url ? (
                          <img src={p.cover_url} alt={p.name} />
                        ) : (
                          <div className="playlist-placeholder">
                            <HiMusicalNote size={24} />
                          </div>
                        )}
                      </div>
                      <div className="item-info">
                        <span className="item-title">{p.name}</span>
                        <span className="item-subtitle">{p.song_count} bài hát</span>
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <div className="login-prompt">
                  <h3>Tạo playlist đầu tiên</h3>
                  <button onClick={() => setIsLoginOpen(true)} className="create-playlist-btn">
                    Tạo playlist
                  </button>
                </div>
              )}
            </>
          )}

          {/* THỂ LOẠI */}
          {activeTab === "genre" && (
            <div className="genre-section">
              {loadingGenres ? (
                <p style={{ color: "#aaa" }}>Đang tải...</p>
              ) : (
                genres.map((genre) => (
                  <div
                    key={genre.id}
                    className="library-item genre-item"
                    onClick={() => handleGenreSelect(genre)}
                  >
                    <div className="item-cover genre">
                      <HiMusicalNote size={26} />
                    </div>
                    <div className="item-info">
                      <span className="item-title">{typeof genre.name === 'string' ? genre.name : JSON.stringify(genre.name)}</span>
                      <span className="item-subtitle">Thể loại</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <CreatePlaylistModal
        isOpen={showCreatePlaylist}
        onClose={() => setShowCreatePlaylist(false)}
        onSuccess={fetchUserPlaylists}
      />
    </aside>
  );
}