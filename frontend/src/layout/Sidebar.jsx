import React, { useState, useEffect } from "react";
import { AiFillHeart } from "react-icons/ai";
import { BsFillPinAngleFill } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { HiPlus, HiHeart, HiMusicalNote } from "react-icons/hi2";
import { FaCompactDisc } from "react-icons/fa";
import CreatePlaylistModal from "../components/CreatePlaylistModal";
import { getGenres } from "../services/genreService";
import "./Sidebar.css";

export default function Sidebar({ isLoginOpen, setIsLoginOpen }) {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [likedCount, setLikedCount] = useState(0);
  const [activeTab, setActiveTab] = useState("playlist");
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loadingGenres, setLoadingGenres] = useState(false);
  const [likedAlbumsCount, setLikedAlbumsCount] = useState(0);
  const navigate = useNavigate();

  /* -------------------------------
      EVENT: reload playlist sidebar
  --------------------------------*/
  useEffect(() => {
    const handler = () => fetchUserPlaylists();
    window.addEventListener("playlistUpdated", handler);
    return () => window.removeEventListener("playlistUpdated", handler);
  }, []);

  /* -------------------------------
      LOGIN STATE LISTENER
  --------------------------------*/
  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  /* -------------------------------
      LOAD PLAYLISTS AFTER LOGIN
  --------------------------------*/
  useEffect(() => {
    if (isLoggedIn) {
      fetchUserPlaylists();
      fetchLikedSongs();
      fetchLikedAlbums();
    }
  }, [isLoggedIn]);

  // Fetch liked albums count
  const fetchLikedAlbums = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return setLikedAlbumsCount(0);
      const res = await fetch("http://localhost:5000/api/favorite-albums", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.favorites)) {
        setLikedAlbumsCount(data.favorites.length);
      } else {
        setLikedAlbumsCount(0);
      }
    } catch {
      setLikedAlbumsCount(0);
    }
  };

  // Fetch liked songs count
  const fetchLikedSongs = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return setLikedCount(0);
      const res = await fetch("http://localhost:5000/api/favorite-songs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.favorites)) {
        setLikedCount(data.favorites.length);
      } else {
        setLikedCount(0);
      }
    } catch {
      setLikedCount(0);
    }
  };

  /* -------------------------------
      LOAD GENRES WHEN SWITCH TAB
  --------------------------------*/
  useEffect(() => {
    if (activeTab === "genre") fetchGenres();
  }, [activeTab]);

  /* -------------------------------
      FIX URL CHUẨN HOÁ (hỗ trợ mobile)
  --------------------------------*/
  const fixUrl = (url) => {
    if (!url) return null;
    if (url.includes("10.0.2.2")) url = url.replace("10.0.2.2", "localhost");
    if (url.startsWith("http")) return url;

    if (url.startsWith("/uploads")) return `http://localhost:5000${url}`;
    return `http://localhost:8081/music_API/online_music/${url.replace(/^\//, "")}`;
  };

  /* -------------------------------
      LẤY COVER TỪ BÀI HÁT (generate collage nếu >=4 bài)
  --------------------------------*/
  const getPlaylistCoverAuto = (playlist) => {
    if (!playlist?.songs || playlist.songs.length === 0) return null;

    const covers = playlist.songs
      .map((s) => fixUrl(s.cover_url))
      .filter((u) => u)
      .slice(0, 4);

    if (covers.length === 0) return null;

    // Nếu có 4 ảnh → trả về mảng để UI biết render dạng ghép 2x2
    if (covers.length >= 4) return covers.slice(0, 4);

    // Nếu có 1 ảnh → trả về 1 ảnh
    return covers[0];
  };

  /* -------------------------------
      FETCH PLAYLISTS
  --------------------------------*/
  // ---- FETCH PLAYLISTS + SONGS ----
const fetchUserPlaylists = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch("http://localhost:5000/api/playlists/my-playlists", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!data.success) return;

    const basePlaylists = data.playlists;

    // ---- LẤY THÊM BÀI HÁT CHO MỖI PLAYLIST (CHỈ LẤY 4 BÀI ĐẦU) ----
    const playlistsWithSongs = await Promise.all(
      basePlaylists.map(async (p) => {
        try {
          const detailRes = await fetch(
            `http://localhost:5000/api/playlists/${p.playlist_id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const detailData = await detailRes.json();
          const songs = detailData?.playlist?.songs ?? [];

          return { ...p, songs };
        } catch {
          return { ...p, songs: [] };
        }
      })
    );

    // ---- TẠO ẢNH GHÉP HOẶC LẤY COVER ----
    const fixed = playlistsWithSongs.map((p) => {
      let img = null;

      // 1. có cover_url
      if (p.cover_url) img = fixUrl(p.cover_url);

      // 2. có danh sách ảnh từ bài hát
      else if (p.songs.length >= 4) {
        img = p.songs
          .slice(0, 4)
          .map((s) => fixUrl(s.cover_url))
          .filter((u) => u);
      }

      // 3. chỉ có 1 ảnh bài hát
      else if (p.songs.length >= 1) {
        img = fixUrl(p.songs[0].cover_url);
      }

      return {
        ...p,
        cover_url: img,
        song_count: p.song_count ?? p.songs.length ?? 0,
      };
    });

    setPlaylists(fixed);

  } catch (err) {
    console.error("FETCH playlist error:", err);
  }
};


  /* -------------------------------
      FETCH GENRES
  --------------------------------*/
  const fetchGenres = async () => {
    try {
      setLoadingGenres(true);
      const data = await getGenres();
      setGenres(data);
    } finally {
      setLoadingGenres(false);
    }
  };

  const handleGenreSelect = (genre) => {
    window.dispatchEvent(new CustomEvent("genreSelected", { detail: genre }));
  };

  return (
        <aside className="sidebar">
      <div className="sidebar-library">
        <div className="library-header"><span>Thư Viện Nhạc</span></div>

        <div className="filter-tabs">
          <button className={`filter-tab ${activeTab === "playlist" ? "active" : ""}`}
                  onClick={() => setActiveTab("playlist")}>
            Playlist
          </button>

          <button className={`filter-tab ${activeTab === "genre" ? "active" : ""}`}
                  onClick={() => setActiveTab("genre")}>
            Thể loại
          </button>
        </div>

        <div className="library-content">
          {/* TAB PLAYLIST */}
          {activeTab === "playlist" && (
            <>
              {isLoggedIn ? (
                <>
                  {/* CREATE PLAYLIST */}
                  <div className="create-playlist-section">
                    <button className="create-playlist-btn-logged"
                            onClick={() => setShowCreatePlaylist(true)}>
                      <HiPlus size={20} /> <span>Tạo playlist</span>
                    </button>
                  </div>

                  {/* LIKED SONGS - styled as image */}
                  <button onClick={() => navigate("/favorites")} className="library-item">
                    <div className="item-cover liked-songs"><AiFillHeart size={32} /></div>
                    <div className="item-info">
                      <span className="item-title">Bài Hát Yêu Thích</span>
                      <span className="item-subtitle" style={{display: 'flex', alignItems: 'center', gap: 6, color: '#b3b3b3', fontSize: 15, marginTop: 2}}>
                        <BsFillPinAngleFill size={15} style={{marginRight: 2, color: '#6ee7b7'}} />
                        Playlist
                        <span style={{fontWeight: 500, margin: '0 4px'}}>•</span>
                        {likedCount} bài hát
                      </span>
                    </div>
                  </button>

                  {/* ALBUMS - styled as image */}
                  <button onClick={() => navigate("/favorite-albums")} className="library-item">
                    <div className="item-cover"
                         style={{
                           background: "linear-gradient(135deg, #450af5, #8e44ad)",
                           display: "flex",
                           alignItems: "center",
                           justifyContent: "center",
                         }}>
                      <FaCompactDisc size={28} color="white" />
                    </div>
                    <div className="item-info">
                      <span className="item-title">Album Yêu Thích</span>
                      <span className="item-subtitle" style={{display: 'flex', alignItems: 'center', gap: 6, color: '#b3b3b3', fontSize: 15, marginTop: 2}}>
                        <BsFillPinAngleFill size={15} style={{marginRight: 2, color: '#6ee7b7'}} />
                        Album
                        <span style={{fontWeight: 500, margin: '0 4px'}}>•</span>
                        {likedAlbumsCount} albums
                      </span>
                    </div>
                  </button>

                  {/* LIST PLAYLISTS */}
                  {playlists.map((p) => (
                    <button key={p.playlist_id}
                            className="library-item"
                            onClick={() => navigate(`/playlist/${p.playlist_id}`)}>

                      {/* COVER (image or 4-grid) */}
                      <div className="item-cover playlist">
                        {Array.isArray(p.cover_url) ? (
                          // GHÉP 4 ẢNH
                          <div className="cover-grid-2x2">
                            {p.cover_url.map((img, i) => (
                              <img key={i} src={img} alt="" />
                            ))}
                          </div>
                        ) : p.cover_url ? (
                          <img src={p.cover_url} alt="" />
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

          {/* TAB GENRE */}
          {activeTab === "genre" && (
            <div className="genre-section">
              {loadingGenres ? (
                <p>Đang tải...</p>
              ) : (
                genres.map((genre) => (
                  <div key={genre.id}
                       className="library-item genre-item"
                       onClick={() => handleGenreSelect(genre)}>
                    <div className="item-cover genre">
                      <HiMusicalNote size={26} />
                    </div>
                    <div className="item-info">
                      <span className="item-title">{genre.name}</span>
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