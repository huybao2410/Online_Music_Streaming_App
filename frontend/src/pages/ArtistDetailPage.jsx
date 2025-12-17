import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HiArrowLeft } from "react-icons/hi2";
import { PlayerContext } from "../context/PLayerContext";
import { fixMediaUrl } from "../utils/media";
import "./ArtistDetailPage.css";

const API_URL = "http://localhost:5000/api";

const ArtistDetailPage = () => {
  const { artistId } = useParams();
  const navigate = useNavigate();
  const { setPlaylist, setCurrentSong } = useContext(PlayerContext);

  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [followed, setFollowed] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    loadAll();
    // eslint-disable-next-line
  }, [artistId]);

  const loadAll = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadArtist(),
        loadSongs(),
        checkFollow(),
      ]);
    } catch (err) {
      console.error("Load artist detail failed:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= API ================= */

  const loadArtist = async () => {
    const res = await fetch(`${API_URL}/artists/${artistId}`);
    if (!res.ok) throw new Error("Artist API error");
    const data = await res.json();
    setArtist(data.artist);
  };

  const loadSongs = async () => {
    const res = await fetch(`${API_URL}/artists/${artistId}/songs`);
    if (!res.ok) throw new Error("Songs API error");

    const data = await res.json();

    const fixedSongs = data.map(song => ({
      id: song.id,
      title: song.title,
      artist: song.artist,        // ✅ TỪ BACKEND
      genre: song.genre,
      duration: song.duration,
      url: fixMediaUrl(song.audio_url),
      cover: fixMediaUrl(song.cover),
    }));

    console.log("🎵 FIXED SONGS:", fixedSongs);
    setSongs(fixedSongs);
  };


  const checkFollow = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch(
      `${API_URL}/artists/${artistId}/follow`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) return;
    const data = await res.json();
    setFollowed(data.followed);
  };

  const toggleFollow = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Vui lòng đăng nhập");

    const res = await fetch(
      `${API_URL}/artists/${artistId}/follow`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();
    setFollowed(data.followed);
  };

  /* ================= PLAYER ================= */

  const playSongHandler = (song) => {
    if (!song.url) {
      console.error("❌ Bài hát không có audio url:", song);
      return;
    }

    console.log("🎵 PLAY SONG:", song.url);

    setPlaylist(songs);
    setCurrentSong(song);
  };

  /* ================= UTILS ================= */

  const formatDuration = (seconds) => {
    if (!seconds) return "--:--";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  /* ================= UI ================= */

  if (loading) return <p>Đang tải...</p>;
  if (!artist) return <p>Không tìm thấy nghệ sĩ</p>;

  return (
    <div className="artist-detail-page fade-in">

      {/* BACK */}
      <button className="back-button" onClick={() => navigate(-1)}>
        <HiArrowLeft size={24} />
      </button>

      {/* ARTIST HEADER */}
      <div className="artist-header">
        <img
          src={fixMediaUrl(artist.avatar_url) || "https://placehold.co/220x220"}
          alt={artist.name}
          className="artist-avatar"
        />

        <div className="artist-info-block">
          <div className="artist-subtitle">
            Nghệ sĩ · {songs.length} bài hát
          </div>

          <h1 className="artist-name-title">{artist.name}</h1>

          {artist.bio && (
            <p className="artist-bio-text">{artist.bio}</p>
          )}

          <button
            className={`follow-btn ${followed ? "followed" : ""}`}
            onClick={toggleFollow}
          >
            {followed ? "❤️ Đã theo dõi" : "🤍 Theo dõi"}
          </button>
        </div>
      </div>

      {/* SONG LIST */}
      <div className="song-list-container">
        <div className="song-list-header-row">
          <div>#</div>
          <div style={{ flex: 2 }}>Tiêu đề</div>
          <div style={{ flex: 1 }}>Thể loại</div>
          <div style={{ width: 80, textAlign: "right" }}>Thời lượng</div>
        </div>

        {songs.map((song, index) => (
          <div
            key={song.id}
            className="song-row-item"
            onClick={() => playSongHandler(song)}
          >
            <div>{index + 1}</div>

            <div className="song-title-block">
              <img
                src={song.cover || "https://placehold.co/80"}
                className="song-cover-img"
                alt={song.title}
              />
              <span>{song.title}</span>
            </div>

            <div>{song.genre || "Unknown"}</div>
            <div>{formatDuration(song.duration)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArtistDetailPage;
