
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HiHeart, HiOutlineHeart, HiArrowLeft } from "react-icons/hi2";
import {
  getAlbumSongs,
  getAlbumInfo,
  checkAlbumFavoriteStatus,
  toggleAlbumFavorite,
} from "../services/albumService";
import { PlayerContext } from "../context/PLayerContext";
import SongList from "../components/SongList";
import "./AlbumDetailPage.css";

const fixUrl = (url) => {
  if (!url) return "";
  // If running in emulator vs browser, normalize 10.0.2.2 -> localhost
  return url.replace("10.0.2.2", "localhost");
};

const AlbumDetailPage = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { setPlaylist, setCurrentSong } = useContext(PlayerContext);

  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [albumInfo, setAlbumInfo] = useState(null);

  useEffect(() => {
    loadAlbumData();
    // eslint-disable-next-line
  }, [albumId]);

  const loadAlbumData = async () => {
    try {
      setLoading(true);
      console.log("📡 Loading albumId:", albumId);




      // 1) songs
      const songsData = await getAlbumSongs(albumId);
      console.log("🎵 songsData:", songsData);
      // normalize cover/audio urls
      const normalizedSongs = (songsData || []).map(s => ({
        ...s,
        cover_url: s.cover_url ? fixUrl(s.cover_url) : "",
        audio_url: s.audio_url ? fixUrl(s.audio_url) : ""
      }));
      setSongs(normalizedSongs);

      // 2) album info
      const info = await getAlbumInfo(albumId);
      console.log("ℹ️ album info:", info);
      if (info) {
        setAlbumInfo({
          name: info.name || info.album_name || "Unknown album",
          artist: info.artist || info.artist_name || "",
          cover: fixUrl(info.cover_url || info.cover || ""),
        });
      } else {
        // Try to infer name/cover from first song (fallback)
        if (normalizedSongs.length > 0) {
          setAlbumInfo({
            name: normalizedSongs[0].artist || "Unknown album",
            artist: normalizedSongs[0].artist || "",
            cover: normalizedSongs[0].cover_url || "",
          });
        } else {
          setAlbumInfo(null);
        }
      }

      // 3) favorite status (if endpoint available)
      try {
        const fav = await checkAlbumFavoriteStatus(albumId);
        setIsFavorite(fav);
      } catch (e) {
        console.warn("Favorite endpoint error (ignored):", e);
      }

    } catch (err) {
      console.error("Lỗi load album:", err);
      setSongs([]);
      setAlbumInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const newStatus = !isFavorite;
      setIsFavorite(newStatus);
      await toggleAlbumFavorite(albumId, newStatus);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      setIsFavorite(!isFavorite);
    }
  };

  const handlePlaySong = (song, index) => {
    setPlaylist(songs);
    setCurrentSong(index);
  };

  if (loading) return <div className="album-detail-page"><p>Đang tải...</p></div>;
  if (!albumInfo) return <div className="album-detail-page"><p>Không tìm thấy album</p></div>;














  return (
    <div className="album-detail-page">
      <button className="back-button" onClick={() => navigate(-1)}>
        <HiArrowLeft size={24} />
      </button>











      <div className="album-header">
        <img
          src={albumInfo.cover || "https://placehold.co/300x300"}
          alt={albumInfo.name}
          className="album-cover"
          onError={(e) => (e.target.src = "https://placehold.co/300x300")}
        />

        <div className="album-info">
          <h1>{albumInfo.name}</h1>
          <p>{songs.length} bài hát</p>













        </div>


        <button className="favorite-button" onClick={handleToggleFavorite}>
          {isFavorite ? <HiHeart size={32} /> : <HiOutlineHeart size={32} />}
        </button>
      </div>

      <div className="song-list">

        {songs.length === 0 ? (
          <p>Chưa có bài hát nào trong album này</p>
        ) : (
          songs.map((song, idx) => (
            <div key={song.song_id} className="song-row" onClick={() => handlePlaySong(song, idx)}>
              <img src={song.cover_url || "https://placehold.co/80"} alt={song.title} className="song-cover" onError={(e)=> e.target.src="https://placehold.co/80"} />
              <div className="song-info">
                <h3>{song.title}</h3>
                <p>{song.artist}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlbumDetailPage;