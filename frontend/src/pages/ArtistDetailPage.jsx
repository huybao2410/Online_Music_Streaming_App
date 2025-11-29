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
          artist: artist?.name || "Unknown", // FIX artist id -> name
          cover: fixUrl(s.cover_url),

          // ❗ PLAYERCONTEXT YÊU CẦU AUDIO, KHÔNG PHẢI audio_url
          audio: fixUrl(s.audio_url),
        }));

        console.log("SONGS NORMALIZED:", normalized);

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
      <div className="artist-header">
        <img
          className="artist-avatar"
          src={artist.avatar || "https://placehold.co/200"}
          alt={artist.name}
        />

        <div className="artist-info">
          <h1>{artist.name}</h1>
          {artist.bio && <p className="artist-bio">{artist.bio}</p>}
          <p className="artist-count">{songs.length} bài hát</p>
        </div>
      </div>

      {/* SONG LIST */}
      <div className="song-list">
        {songs.map((song) => (
          <div
            key={song.id}
            className="song-row hover-highlight"
            onClick={() => playSongHandler(song)}
          >
            <img
              className="song-cover"
              src={song.cover || "https://placehold.co/80"}
              alt={song.title}
            />

            <div className="song-info">
              <h3>{song.title}</h3>
              <p>{song.artist}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default ArtistDetailPage;
