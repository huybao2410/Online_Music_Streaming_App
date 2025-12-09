import React, { useEffect, useState, useContext } from "react";
import { PlayerContext } from "../context/PLayerContext";
import { FaPlay } from "react-icons/fa";
import "./TopChartBox.css";

const fixUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url.replace("10.0.2.2", "localhost");
  return `http://localhost:8081/music_API/online_music/song/${url}`;
};

export default function TopChartBox({ title, apiUrl, color }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSongs = async () => {
      setLoading(true);
      try {
        const res = await fetch(apiUrl);
        const data = await res.json();
        if (data.status && Array.isArray(data.songs)) {
          setSongs(data.songs.slice(0, 50));
        } else setSongs([]);
      } catch {
        setSongs([]);
      }
      setLoading(false);
    };
    fetchSongs();
  }, [apiUrl]);

  const { setPlaylist, setCurrentSong } = useContext(PlayerContext);

  // Chuẩn hóa dữ liệu cho player
  const normalizeSong = (song) => ({
    id: song.song_id || song.id,
    title: song.title,
    artist: song.artist || song.artist_name,
    cover: fixUrl(song.cover_url),
    url: fixUrl(song.audio_url),
    duration: song.duration || 0,
  });

  const handlePlaySong = (idx) => {
    const playlist = songs.map(normalizeSong);
    setPlaylist(playlist);
    setCurrentSong(playlist[idx]);
  };

  const handlePlayAll = () => {
    if (songs.length === 0) return;
    const playlist = songs.map(normalizeSong);
    setPlaylist(playlist);
    setCurrentSong(playlist[0]);
  };

  return (
    <div className="top-chart-box" style={{flex: 1, background: color, borderRadius: 16, padding: 18, minWidth: 0}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
        <h3 style={{fontSize: 20, fontWeight: 700, color: '#fff', margin: 0}}>{title}</h3>
        <button
          style={{background: '#1ed760', color: '#222', border: 'none', borderRadius: 20, padding: '6px 18px', fontWeight: 700, cursor: 'pointer'}}
          onClick={handlePlayAll}
        >Phát</button>
      </div>
      {loading ? (
        <div style={{textAlign: 'center', color: '#fff'}}>Đang tải...</div>
      ) : (
        <div>
          {songs.slice(0, 5).map((song, idx) => (
            <div key={song.song_id || song.id || idx} style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14}}>
              <div style={{fontWeight: 700, color: '#fff', width: 24, textAlign: 'center'}}>{idx + 1}</div>
              <img src={fixUrl(song.cover_url)} alt={song.title} style={{width: 48, height: 48, borderRadius: 8, objectFit: 'cover'}} />
              <div style={{flex: 1, minWidth: 0}}>
                <div className="marquee-title">
                  <span>{song.title}</span>
                </div>
                <div style={{color: '#e0e0e0', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{song.artist || song.artist_name}</div>
                {song.label && <div style={{color: '#b3b3b3', fontSize: 11}}>{song.label}</div>}
              </div>
              <button
                style={{background: 'none', border: 'none', color: '#1ed760', fontSize: 18, cursor: 'pointer'}}
                onClick={() => handlePlaySong(idx)}
              >
                <FaPlay />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
