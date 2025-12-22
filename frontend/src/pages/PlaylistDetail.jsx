import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BsMusicNoteBeamed, BsThreeDots, BsShuffle, BsPlus } from "react-icons/bs";
import { AiOutlineDelete } from "react-icons/ai";
import { BiPlay, BiPause, BiTime } from "react-icons/bi";
import { RiPlayListLine, RiGlobalLine, RiLock2Line } from "react-icons/ri";
import { FiEdit2 } from "react-icons/fi";
import axios from "axios";
import { deletePlaylist } from "../services/playlistService";
import { PlayerContext } from "../context/PLayerContext";
import AddSongToPlaylistModal from "../components/AddSongToPlaylistModal";
import EditPlaylistSongsModal from "../components/EditPlaylistSongsModal";
import EditPlaylistModal from "../components/EditPlaylistModal";
import "./PlaylistDetail.css";

/* ---------------------- FIX URL TỰ ĐỘNG ---------------------- */
const fixUrl = (url) => {
  if (!url) return null;
  let u = url.toString().replace("10.0.2.2", "localhost");

  if (!u.startsWith("http")) {
    if (u.startsWith("/uploads")) u = `http://localhost:5000${u}`;
    else u = `http://localhost:8081/music_API/online_music/${u.replace(/^\//, "")}`;
  }

  return u;
};
/* ------------------------------------------------------------- */

export default function PlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    currentSong,
    setCurrentSong,
    setPlaylist: setPlayerPlaylist,
    isPlaying
  } = useContext(PlayerContext);

  const [playlist, setPlaylist] = useState(null);
  const [bannerColor, setBannerColor] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  /* ------------------- LOAD PLAYLIST ------------------- */
  useEffect(() => {
    loadPlaylist();
  }, [id]);

  const loadPlaylist = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.get(`http://localhost:5000/api/playlists/${id}`, { headers });

      if (!res.data.success) throw new Error("Lỗi tải playlist");

      const data = res.data.playlist;

      /* FIX cover playlist */
      data.cover_url = fixUrl(data.cover_url);


      // Gộp các bài hát trùng song_id, gộp nghệ sĩ thành chuỗi (giống FavoriteSongs)
      const songMap = {};
      (data.songs || []).forEach((s, index) => {
        let nid = s.song_id ?? s.id ?? `song-${id}-${index}`;
        nid = String(nid);
        if (!songMap[nid]) {
          songMap[nid] = {
            ...s,
            _nid: nid,
            title: s.title || "Untitled",
            artist_name: s.artist_name || s.artist || "Unknown",
            album: s.album ? [s.album] : [],
            cover_url: fixUrl(s.cover_url),
            audio_url: fixUrl(s.audio_url),
            duration: Number(s.duration) || 0,
            added_at: s.added_at || null,
            _artistArr: s.artist_name ? [s.artist_name] : (s.artist ? [s.artist] : [])
          };
        } else {
          // Gộp nghệ sĩ nếu chưa có
          const artistVal = s.artist_name || s.artist;
          if (artistVal && !songMap[nid]._artistArr.includes(artistVal)) {
            songMap[nid]._artistArr.push(artistVal);
          }
          // Gộp album nếu chưa có
          if (s.album && !songMap[nid].album.includes(s.album)) {
            songMap[nid].album.push(s.album);
          }
        }
      });
      // Chuyển về mảng, gộp nghệ sĩ thành chuỗi
      const fixedSongs = Object.values(songMap).map(song => ({
        ...song,
        artist_name: song._artistArr.join(", ") || song.artist_name,
        album: song.album.filter(Boolean).join(", ")
      }));
      data.songs = fixedSongs;
      setPlaylist(data);

      /* Tạo màu nền */
      setBannerColor(stringToColor(data.name || "playlist"));

      /* Kiểm tra quyền sở hữu */
      if (token) {
        const userId = JSON.parse(atob(token.split(".")[1])).id;
        setIsOwner(data.user_id === userId);
      }

    } catch (err) {
      console.error("Lỗi load playlist:", err);
      setError("Không thể tải playlist");
    } finally {
      setIsLoading(false);
    }
  };

  const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++)
      hash = str.charCodeAt(i) + ((hash << 5) - hash);

    const color = (hash & 0xffffff).toString(16).toUpperCase();
    return `#${"000000".substring(0, 6 - color.length) + color}`;
  };

  /* ------------------- DELETE SONG ------------------- */
  const handleRemoveSong = async (songId) => {
    if (!window.confirm("Xóa bài hát này khỏi playlist?")) return;

    try {
      const token = localStorage.getItem("token");

      await axios.delete(
        `http://localhost:5000/api/playlists/${id}/songs/${encodeURIComponent(songId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      loadPlaylist();
    } catch (err) {
      alert("Xóa thất bại!");
    }
  };

  /* ------------------- PLAYER ------------------- */
  const formatSongForPlayer = (song) => ({
    id: song._nid,
    title: song.title,
    artist: song.artist_name,
    cover: song.cover_url,
    url: song.audio_url,
    duration: song.duration
  });

  const handlePlaySong = (song, index) => {
    const formatted = playlist.songs.map(formatSongForPlayer);
    setPlayerPlaylist(formatted);
    setCurrentSong(formatted[index]);
  };

  const handlePlayPlaylist = () => {
    const formatted = playlist.songs.map(formatSongForPlayer);
    setPlayerPlaylist(formatted);
    setCurrentSong(formatted[0]);
  };

  const handleShufflePlaylist = () => {
    const shuffled = [...playlist.songs].sort(() => Math.random() - 0.5);
    const formatted = shuffled.map(formatSongForPlayer);
    setPlayerPlaylist(formatted);
    setCurrentSong(formatted[0]);
  };

  const isCurrent = (s) =>
    currentSong && String(currentSong.id) === String(s._nid);

  /* ------------------- RENDER UI ------------------- */

  if (isLoading)
    return <div className="playlist-detail-loading"><p>Đang tải...</p></div>;

  if (error)
    return (
      <div className="playlist-detail-error">
        <p>{error}</p>
        <button onClick={() => navigate("/")}>Quay lại</button>
      </div>
    );

  if (!playlist) return null;

  const renderCover = () => {
    if (playlist.cover_url)
      return <img src={playlist.cover_url} className="cover-img" />;

    const covers = playlist.songs
      .map((s) => s.cover_url)
      .filter(Boolean)
      .slice(0, 4);

    if (covers.length >= 4)
      return (
        <div className="playlist-cover-grid">
          {covers.map((c, i) => (
            <img key={i} src={c} alt="" />
          ))}
        </div>
      );

    if (covers.length > 0)
      return <img src={covers[0]} />;

    return (
      <div className="playlist-cover-placeholder">
        <RiPlayListLine size={100} />
      </div>
    );
  };

  const formatDuration = (sec) => {
    sec = Number(sec) || 0;
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  };

  const totalDuration = () => {
    const total = playlist.songs.reduce((sum, s) => sum + s.duration, 0);
    return `${Math.floor(total / 60)} phút`;
  };

  return (
    <div className="playlist-detail-page">
      {/* BANNER */}
      <div className="playlist-banner" style={{ background: `linear-gradient(${bannerColor}, #0f0f1e)` }}>
        <div className="playlist-banner-content">
          <div className="playlist-cover-large">{renderCover()}</div>

          <div className="playlist-header-info">
            <span className="playlist-badge">
              {playlist.is_public ? <><RiGlobalLine /> Public</> : <><RiLock2Line /> Private</>}
            </span>

            <h1 className="playlist-title">{playlist.name}</h1>

            <div className="playlist-stats">
              <span>{playlist.songs.length} bài hát · {totalDuration()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="playlist-controls">
        <button className="play-button-large" onClick={handlePlayPlaylist}>
          {isPlaying ? <BiPause size={32} /> : <BiPlay size={32} />}
        </button>

        <button className="icon-button" onClick={handleShufflePlaylist}>
          <BsShuffle size={24} />
        </button>

        {isOwner && (
          <>
            <button className="icon-button" onClick={() => setShowAddModal(true)}>
              <BsPlus size={28} />
            </button>

            <button className="icon-button" onClick={() => setShowEditModal(true)}>
              <FiEdit2 size={22} />
            </button>

            <button className="icon-button" onClick={async () => {
              if (!window.confirm('Bạn có chắc muốn xóa playlist này?')) return;
              try {
                await deletePlaylist(id);
                alert('Đã xóa playlist!');
                navigate('/');
              } catch (err) {
                alert('Xóa playlist thất bại!');
              }
            }} title="Xóa playlist" style={{color:'#ff4d4f'}}>
              <AiOutlineDelete size={22} />
            </button>
          </>
        )}
      </div>

      {/* SONG LIST */}
      <div className="playlist-content">
        <div className="table-header" style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          height: 48,
          color: '#b3b3b3',
          fontWeight: 600,
          fontSize: 15,
          borderBottom: '1px solid #23232b',
          letterSpacing: 1.2
        }}>
          <div className="col-number" style={{width: 40, minWidth: 40, textAlign: 'center'}}>#</div>
          <div className="col-title" style={{flex: 2, display: 'flex', alignItems: 'center'}}>TIÊU ĐỀ</div>
          <div className="col-album" style={{flex: 1, display: 'flex', alignItems: 'center'}}>ALBUM</div>
          <div className="col-duration" style={{width: 70, minWidth: 70, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><BiTime /></div>
          {isOwner && <div className="col-actions" style={{width: 40, minWidth: 40}}></div>}
        </div>
        {playlist.songs.map((song, index) => (
          <div
            key={song._nid}
            className={`track-row ${isCurrent(song) ? "active" : ""}`}
            onClick={() => handlePlaySong(song, index)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              height: 56,
              borderRadius: 8,
              marginBottom: 2,
              cursor: 'pointer',
              background: isCurrent(song) ? '#18191c' : 'transparent',
              transition: 'background 0.2s'
            }}
          >
            <div className="col-number" style={{width: 40, minWidth: 40, textAlign: 'center'}}>{index + 1}</div>

            <div className="col-title" style={{flex: 2, display: 'flex', alignItems: 'center'}}>
              <div className="track-info" style={{display: 'flex', alignItems: 'center', gap: 12}}>
                {song.cover_url ? (
                  <img src={song.cover_url} className="track-image" style={{width: 40, height: 40, borderRadius: 6, objectFit: 'cover'}} />
                ) : (
                  <div className="track-placeholder" style={{width: 40, height: 40, borderRadius: 6, background: '#23232b', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><BsMusicNoteBeamed /></div>
                )}
                <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                  <div className="track-name" style={{fontWeight: 600, color: '#fff', fontSize: 16}}>{song.title}</div>
                  <div className="track-artist" style={{color: '#b3b3b3', fontSize: 13}}>{song.artist_name}</div>
                </div>
              </div>
            </div>

            <div className="col-album" style={{flex: 1, color: '#b3b3b3', fontSize: 15}}>{song.album}</div>

            <div className="col-duration" style={{width: 70, minWidth: 70, textAlign: 'center', color: '#b3b3b3', fontSize: 15}}>{formatDuration(song.duration)}</div>

            {isOwner && (
              <div className="col-actions" style={{width: 40, minWidth: 40, textAlign: 'center'}}>
                <button
                  className="action-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveSong(song._nid);
                  }}
                  style={{background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer'}}
                >
                  <AiOutlineDelete size={16} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODALS */}
      {showAddModal && (
        <AddSongToPlaylistModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          playlistId={id}
          onSongAdded={loadPlaylist}
        />
      )}

      {showEditModal && (
        <EditPlaylistModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          playlist={playlist}
          onSave={async (data) => {
            try {
              const token = localStorage.getItem('token');
              await axios.put(`http://localhost:5000/api/playlists/${id}`, data, {
                headers: { Authorization: `Bearer ${token}` }
              });
              loadPlaylist();
            } catch (err) {
              alert('Cập nhật playlist thất bại!');
            }
          }}
        />
      )}
    </div>
  );
}