import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HiHeart, HiOutlineHeart, HiArrowLeft } from "react-icons/hi2";
import { getAlbumSongs, checkAlbumFavoriteStatus, toggleAlbumFavorite } from "../services/albumService";
import { PlayerContext } from "../context/PLayerContext";
import SongList from "../components/SongList";
import "./AlbumDetailPage.css";

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
  }, [albumId]);

  const loadAlbumData = async () => {
    try {
      setLoading(true);
      
      // Load songs
      const songsData = await getAlbumSongs(albumId);
      setSongs(songsData);

      // Get album info from first song
      if (songsData.length > 0) {
        setAlbumInfo({
          name: songsData[0].artist,
          cover: songsData[0].cover_url,
          artist_id: songsData[0].artist_id
        });
      }

      // Check favorite status
      const favoriteStatus = await checkAlbumFavoriteStatus(albumId);
      setIsFavorite(favoriteStatus);
    } catch (error) {
      console.error("Error loading album:", error);
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
      setIsFavorite(!isFavorite); // Revert on error
    }
  };

  const handlePlaySong = (song, index) => {
    setPlaylist(songs);
    setCurrentSong(index);
  };

  if (loading) {
    return (
      <div className="album-detail-page">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (!albumInfo) {
    return (
      <div className="album-detail-page">
        <div className="error">Không tìm thấy album</div>
      </div>
    );
  }

  return (
    <div className="album-detail-page">
      {/* Header with album cover and info */}
      <div className="album-header">
        <div className="album-cover-wrapper">
          <img 
            src={albumInfo.cover} 
            alt={albumInfo.name}
            className="album-cover"
            onError={(e) => {
              e.target.src = 'https://placehold.co/300x300';
            }}
          />
          <div className="album-overlay"></div>
        </div>

        <button className="back-button" onClick={() => navigate(-1)}>
          <HiArrowLeft size={24} />
        </button>

        <div className="album-info">
          <div className="album-details">
            <h1 className="album-name">{albumInfo.name}</h1>
            <p className="album-meta">{songs.length} bài hát</p>
          </div>
          
          <button 
            className="favorite-button"
            onClick={handleToggleFavorite}
          >
            {isFavorite ? (
              <HiHeart size={32} className="heart-icon filled" />
            ) : (
              <HiOutlineHeart size={32} className="heart-icon" />
            )}
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="divider"></div>

      {/* Song list */}
      <div className="album-songs">
        {songs.length === 0 ? (
          <p className="no-songs">Chưa có bài hát nào trong album này</p>
        ) : (
          <SongList songs={songs} onPlay={handlePlaySong} />
        )}
      </div>
    </div>
  );
};

export default AlbumDetailPage;
