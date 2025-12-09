import React, { useEffect, useState, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchAll } from "../services/searchService";
import { PlayerContext } from "../context/PLayerContext";
import { FaMusic, FaUser, FaCompactDisc } from "react-icons/fa";
import "./SearchPage.css";

export default function SearchPage() {
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchParams] = useSearchParams();
  const { setCurrentSong, setPlaylist } = useContext(PlayerContext);
  const navigate = useNavigate();

  const query = searchParams.get("query") || "";

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setSongs([]);
        setArtists([]);
        setAlbums([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const result = await searchAll(query, 1, 50);

        console.log("FULL RESULT:", result);

        if (result.success) {
          setSongs(result.songs || []);

          // ⛔ BỎ LỌC — SPOTIFY LUÔN HIỂN THỊ NGHỆ SĨ TRONG KẾT QUẢ
          setArtists(result.artists || []);

          setAlbums(result.albums || []);

          // Auto playlist
          if (result.songs && result.songs.length > 0) {
            const formattedPlaylist = result.songs.map((s) => ({
              id: s.id,
              title: s.title,
              artist: s.artist_name,
              cover: s.cover_url ? s.cover_url.replace("10.0.2.2", "localhost") : "",
              url: s.audio_url ? s.audio_url.replace("10.0.2.2", "localhost") : "",
              duration: s.duration,
            }));
            setPlaylist(formattedPlaylist);
          }
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, setPlaylist]);

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!query) return <div className="vivora-search-empty">Hãy nhập từ khóa để tìm kiếm</div>;
  if (loading) return <div className="vivora-search-loading">🔎 Đang tìm kiếm...</div>;

  const totalResults = songs.length + artists.length + albums.length;

  const filteredSongs = activeTab === "all" || activeTab === "songs" ? songs : [];
  const filteredArtists = activeTab === "all" || activeTab === "artists" ? artists : [];
  const filteredAlbums = activeTab === "all" || activeTab === "albums" ? albums : [];

  return (
    <div className="vivora-search-page">
      <div className="vivora-search-header">
        <h2>Kết quả cho "{query}"</h2>
        <p className="vivora-search-count">{totalResults} kết quả</p>
      </div>

      <div className="vivora-search-tabs">
        <button className={`vivora-tab-btn ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>Tất cả</button>
        <button className={`vivora-tab-btn ${activeTab === "songs" ? "active" : ""}`} onClick={() => setActiveTab("songs")}><FaMusic /> Bài hát ({songs.length})</button>
        <button className={`vivora-tab-btn ${activeTab === "artists" ? "active" : ""}`} onClick={() => setActiveTab("artists")}><FaUser /> Nghệ sĩ ({artists.length})</button>
        <button className={`vivora-tab-btn ${activeTab === "albums" ? "active" : ""}`} onClick={() => setActiveTab("albums")}><FaCompactDisc /> Album ({albums.length})</button>
      </div>

      <div className="vivora-search-results">

        {/* ARTISTS */}
        {filteredArtists.length > 0 && (
          <div className="vivora-result-section">
            <h3 className="vivora-section-title"><FaUser /> Nghệ sĩ</h3>
            <div className="vivora-artists-grid">
              {filteredArtists.map((artist) => (
                <div key={artist.id} className="vivora-artist-card" onClick={() => navigate(`/artist/${artist.id}`)}>
                  <div className="vivora-artist-avatar">
                    <img src={artist.avatar_url?.replace("10.0.2.2", "localhost")} alt={artist.name} />
                  </div>
                  <div className="vivora-artist-info">
                    <h4>{artist.name}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ALBUMS */}
        {filteredAlbums.length > 0 && (
          <div className="vivora-result-section">
            <h3 className="vivora-section-title"><FaCompactDisc /> Album</h3>
            <div className="vivora-albums-grid">
              {filteredAlbums.map((album) => (
                <div key={album.id} className="vivora-album-card" onClick={() => navigate(`/album/${album.id}`)}>
                  <div className="vivora-album-cover">
                    <img src={album.cover_url?.replace("10.0.2.2", "localhost")} alt={album.name} />
                  </div>
                  <div className="vivora-album-info">
                    <h4>{album.name}</h4>
                    <p>{album.artist_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SONGS */}
        {filteredSongs.length > 0 && (
          <div className="vivora-result-section">
            <h3 className="vivora-section-title"><FaMusic /> Bài hát</h3>
            <div className="vivora-songs-list">
              {filteredSongs.map((song, idx) => (
                <div key={song.id} className="vivora-song-row" onClick={() => setCurrentSong(song)}>
                  <div className="vivora-song-index">{idx + 1}</div>
                  <div className="vivora-song-main">
                    <div className="vivora-song-cover"><img src={song.cover_url?.replace("10.0.2.2", "localhost")} alt={song.title} /></div>
                    <div className="vivora-song-details">
                      <div className="vivora-song-title">{song.title}</div>
                      <div className="vivora-song-artist">{song.artist_name}</div>
                    </div>
                  </div>
                  <div className="vivora-song-genre">{song.genre_name}</div>
                  <div className="vivora-song-duration">{formatDuration(song.duration)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalResults === 0 && (
          <div className="vivora-no-results">
            <h3>Không tìm thấy kết quả</h3>
            <p>Hãy thử từ khóa khác</p>
          </div>
        )}
      </div>
    </div>
  );
}
