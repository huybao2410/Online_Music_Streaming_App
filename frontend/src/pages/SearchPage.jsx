
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchAll } from "../services/songService";
import { useContext } from "react";
import { PlayerContext } from "../context/PLayerContext";
import "./SearchPage.css";

export default function SearchPage() {
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { setCurrentSong, setPlaylist } = useContext(PlayerContext);

  const query = searchParams.get("query");

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;
      setLoading(true);
      const { songs, albums } = await searchAll(query);
      setSongs(songs);
      setAlbums(albums);
      setPlaylist(songs);
      setLoading(false);
    };

    fetchResults();
  }, [query, setPlaylist]);

  if (!query) return <div className="search-empty">Hãy nhập từ khóa để tìm kiếm</div>;
  if (loading) return <div className="search-loading">🔎 Đang tìm kiếm...</div>;

  return (
    <div className="search-container">
      <h2>Kết quả tìm kiếm cho “{query}”</h2>

      {albums.length > 0 && (
        <div className="album-section">
          <h3>🎵 Album</h3>
          <div className="album-grid">
            {albums.map((album) => (
              <div key={album.id} className="album-card">
                <img src={album.cover} alt={album.name} />
                <div className="album-info">
                  <h4>{album.name}</h4>
                  <p>{album.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="song-section">
        <h3>🎶 Bài hát</h3>
        {songs.length === 0 ? (
          <p>Không tìm thấy bài hát nào.</p>
        ) : (
          <div className="songs-grid">
            {songs.map((song) => (
              <div
                key={song.id}
                className="song-item"
                onClick={() => setCurrentSong(song)}
              >
                <img src={song.cover} alt={song.title} />
                <div className="song-info">
                  <h4>{song.title}</h4>
                  <p>{song.artist}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
