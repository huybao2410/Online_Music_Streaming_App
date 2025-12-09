import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HiArrowLeft } from "react-icons/hi2";
import { PlayerContext } from "../context/PLayerContext";
import "./ArtistDetailPage.css";

const PHP_API_URL = "http://localhost:8081/music_API/online_music";
const fixUrl = (url) => (url ? url.replace("10.0.2.2", "localhost") : "");

// ====================== COMPONENT ======================== //
const ArtistDetailPage = () => {
  const { artistId } = useParams();
  const navigate = useNavigate();
  const { setPlaylist, setCurrentSong } = useContext(PlayerContext);

  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArtistData();
  }, [artistId]);

  // ================= FORMAT DURATION ===================== //
  const formatDuration = (seconds) => {
    seconds = Number(seconds);
    if (!seconds || isNaN(seconds)) return "--:--";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  // ================= LOAD ARTIST + SONGS ================= //
  const loadArtistData = async () => {
    try {
      setLoading(true);

      // 💿 GET ARTIST INFO
      const resArtist = await fetch(
        `${PHP_API_URL}/artist/get_artist_by_id.php?id=${artistId}`
      );
      const dataArtist = await resArtist.json();

      if (dataArtist.status) {
        setArtist({
          id: dataArtist.artist.artist_id,
          name: dataArtist.artist.name,
          bio: dataArtist.artist.bio,
          avatar: fixUrl(dataArtist.artist.avatar_url),
        });
      }

      // 🎵 GET SONGS BY ARTIST
      const resSongs = await fetch(
        `${PHP_API_URL}/song/get_songs_by_artist.php?id=${artistId}`
      );
      const dataSongs = await resSongs.json();

      if (dataSongs.status && Array.isArray(dataSongs.songs)) {
        const normalized = dataSongs.songs.map((s) => ({
          id: s.song_id,
          title: s.title,
          artist: dataArtist.artist.name,
          cover: fixUrl(s.cover_url),
          url: fixUrl(s.audio_url),
          genre: s.genre || "Unknown",
          duration: Number(s.duration) || 0,
        }));

        setSongs(normalized);
      } else {
        setSongs([]);
      }
    } catch (err) {
      console.error("Load artist failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ===================== PLAY SONG ======================= //
  const playSongHandler = (song) => {
    const playlistFormatted = songs.map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      cover: s.cover,
      url: s.url,
      duration: s.duration,
    }));

    setPlaylist(playlistFormatted);
    setCurrentSong(playlistFormatted.find((x) => x.id === song.id));
  };

  // ========================= UI ========================== //

  if (loading)
    return <div className="artist-detail-page"><p>Đang tải...</p></div>;

  if (!artist)
    return <div className="artist-detail-page"><p>Không tìm thấy nghệ sĩ</p></div>;

  return (
    <div className="artist-detail-page fade-in">

      {/* BACK BUTTON */}
      <button className="back-button" onClick={() => navigate(-1)}>
        <HiArrowLeft size={24} />
      </button>

      {/* ================= ARTIST HEADER (UI NHƯ CŨ) ================= */}
      <div className="artist-header" style={{ display: "flex", gap: 32, alignItems: "center" }}>
        
        <img
          src={artist.avatar || "https://placehold.co/220x220"}
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
        </div>

      </div>

      {/* ================= SONG LIST (UI NHƯ BẢN CŨ) ==================== */}
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
            <div className="song-index">{index + 1}</div>

            <div className="song-title-block">
              <img
                src={song.cover || "https://placehold.co/80"}
                className="song-cover-img"
              />
              <span className="song-title-text">{song.title}</span>
            </div>

            <div className="song-genre-text">{song.genre}</div>

            <div className="song-duration-text">
              {formatDuration(song.duration)}
            </div>
          </div>
        ))}

      </div>

    </div>
  );
};

export default ArtistDetailPage;