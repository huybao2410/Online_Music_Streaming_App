import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HiArrowLeft } from "react-icons/hi2";
import { PlayerContext } from "../context/PLayerContext";
import "./ArtistDetailPage.css";

const PHP_API_URL = "http://localhost:8081/music_API/online_music";
const fixUrl = (url) => (url ? url.replace("10.0.2.2", "localhost") : "");

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

  // Chuyển giây sang phút:giây
  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return "--:--";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const loadArtistData = async () => {
    try {
      setLoading(true);

      // === 1) Artist Info ===
      const resArtist = await fetch(
        `${PHP_API_URL}/artist/get_artist_by_id.php?id=${artistId}`
      );
      const dataArtist = await resArtist.json();

      console.log("ARTIST:", dataArtist);

      if (!dataArtist.status) {
        setArtist(null);
      } else {
        setArtist({
          id: dataArtist.artist.artist_id,
          name: dataArtist.artist.name,
          bio: dataArtist.artist.bio,
          avatar: fixUrl(dataArtist.artist.avatar_url),
        });
      }

      // === 2) Songs ===
      const resSongs = await fetch(
        `${PHP_API_URL}/song/get_songs_by_artist.php?id=${artistId}`
      );
      const dataSongs = await resSongs.json();

      console.log("SONGS RAW:", dataSongs);

      if (dataSongs.status && Array.isArray(dataSongs.songs)) {
        const normalized = dataSongs.songs.map((s) => ({
          id: s.song_id,
          title: s.title,
          cover: fixUrl(s.cover_url),
          audio: fixUrl(s.audio_url),
          genre: s.genre || "Unknown",
          duration: formatDuration(s.duration),
        }));
        setSongs(normalized);
      } else {
        setSongs([]);
      }
    } catch (err) {
      console.error("Lỗi load nghệ sĩ:", err);
    } finally {
      setLoading(false);
    }
  };

  // === PLAY SONG ===
  const playSongHandler = (song) => {
    console.log("PLAY SONG:", song);

    setPlaylist(songs);  // full list
    setCurrentSong(song); // pass đúng object bài hát
  };

  if (loading)
    return <div className="artist-detail-page"><p>Đang tải...</p></div>;

  if (!artist)
    return <div className="artist-detail-page"><p>Không tìm thấy nghệ sĩ</p></div>;

  return (
    <div className="artist-detail-page fade-in">

      <button className="back-button" onClick={() => navigate(-1)}>
        <HiArrowLeft size={24} />
      </button>

      {/* ARTIST HEADER */}
      <div className="artist-header" style={{display: 'flex', alignItems: 'center', gap: 32, position: 'relative'}}>
        <img
          src={artist.avatar || "https://placehold.co/220x220"}
          alt={artist.name}
          style={{width: 220, height: 220, borderRadius: 20, objectFit: 'cover', boxShadow: '0 4px 24px #0004'}}
        />
        <div style={{flex: 1}}>
          <div style={{fontSize: 18, color: '#b3b3b3', fontWeight: 500, marginBottom: 4}}>Nghệ sĩ · {songs.length} Bài hát</div>
          <h1 style={{fontSize: 44, fontWeight: 800, color: '#fff', margin: 0}}>{artist.name}</h1>
          {artist.bio && <p style={{color: '#b3b3b3', fontSize: 16, margin: '12px 0 0 0'}}>{artist.bio}</p>}
        </div>
      </div>

      {/* SONG LIST */}
      <div className="song-list" style={{marginTop: 32}}>
        {/* Header */}
        <div className="song-list-header" style={{display: 'flex', alignItems: 'center', padding: '8px 16px', fontWeight: 700, color: '#b3b3b3', borderBottom: '1px solid #222'}}>
          <div style={{width: 40, textAlign: 'center'}}>#</div>
          <div style={{flex: 2, display: 'flex', alignItems: 'center', gap: 12}}>Tiêu đề</div>
          <div style={{flex: 1, textAlign: 'left'}}>Thể loại</div>
          <div style={{width: 80, textAlign: 'right'}}>Thời lượng</div>
        </div>
        {/* Song rows */}
        {songs.map((song, idx) => (
          <div
            key={song.id}
            className="song-row hover-highlight"
            onClick={() => playSongHandler(song)}
            style={{display: 'flex', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid #222', cursor: 'pointer'}}
          >
            <div style={{width: 40, textAlign: 'center', fontWeight: 600, color: '#b3b3b3'}}>{idx + 1}</div>
            <div style={{flex: 2, display: 'flex', alignItems: 'center', gap: 12}}>
              <img
                src={song.cover || "https://placehold.co/80"}
                alt={song.title}
                style={{width: 48, height: 48, objectFit: 'cover', borderRadius: 6, boxShadow: '0 2px 8px #0002'}}
              />
              <span style={{fontWeight: 600, color: '#fff'}}>{song.title}</span>
            </div>
            <div style={{flex: 1, color: '#fff', fontWeight: 400}}>{song.genre}</div>
            <div style={{width: 80, textAlign: 'right', color: '#b3b3b3', fontWeight: 400}}>{song.duration}</div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default ArtistDetailPage;