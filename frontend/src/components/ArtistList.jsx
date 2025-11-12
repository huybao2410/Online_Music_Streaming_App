// src/components/ArtistList.jsx
import React, { useEffect, useState } from "react";
import { getArtists } from "../services/artistService";
import "./ArtistList.css";

function ArtistList() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        setLoading(true);
        const data = await getArtists();
        setArtists(data);
      } catch (err) {
        console.error("Lỗi khi tải nghệ sĩ:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchArtists();
  }, []);

  if (loading) return <div className="artist-loading">Đang tải danh sách nghệ sĩ...</div>;
  if (error) return <div className="artist-error">Lỗi: {error}</div>;
  if (artists.length === 0) return <div>Không có nghệ sĩ nào</div>;

  return (
    <div className="artist-list-container">
      <h2>Danh sách Nghệ Sĩ ({artists.length})</h2>
      <div className="artist-grid">
        {artists.map((artist) => (
          <div key={artist.id} className="artist-card">
            <div className="artist-avatar">
              {artist.avatar ? (
                <img src={artist.avatar} alt={artist.name} />
              ) : (
                <div className="avatar-placeholder">🎤</div>
              )}
            </div>
            <div className="artist-info">
              <h3>{artist.name}</h3>
              <p>{artist.bio}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ArtistList;