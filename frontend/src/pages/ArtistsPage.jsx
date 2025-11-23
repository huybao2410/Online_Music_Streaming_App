import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaMusic } from "react-icons/fa";
import "./ArtistsPage.css";

const PHP_API_URL = "http://localhost:8081/music_API/online_music";

export default function ArtistsPage() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      setLoading(true);

      const songsResponse = await axios.get(`${PHP_API_URL}/song/get_songs.php`);

      if (songsResponse.data.status === "success") {
        const artistsMap = new Map();

        songsResponse.data.songs.forEach((song) => {
          if (song.artist_id && song.artist) {
            if (!artistsMap.has(song.artist_id)) {
              artistsMap.set(song.artist_id, {
                artist_id: song.artist_id,
                name: song.artist,
                cover_url: song.cover || null,
                song_count: 0,
              });
            }
            artistsMap.get(song.artist_id).song_count++;
          }
        });

        setArtists(
          Array.from(artistsMap.values()).sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );
      }
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách nghệ sĩ");
    } finally {
      setLoading(false);
    }
  };

  const fixLocalUrl = (url) => (url ? url.replace("10.0.2.2", "localhost") : null);

  return (
    <div className="artists-page">
      <h1 className="artists-title">Tất cả nghệ sĩ</h1>

      {loading ? (
        <p className="loading">Đang tải...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <div className="artists-grid">
          {artists.map((artist) => (
            <div
              key={artist.artist_id}
              className="artist-card"
              onClick={() => navigate(`/artist/${artist.artist_id}`)}
            >
              <div className="artist-img-wrapper">
                {artist.cover_url ? (
                  <img
                    src={fixLocalUrl(artist.cover_url)}
                    alt={artist.name}
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.parentElement.querySelector(
                        ".artist-placeholder"
                      ).style.display = "flex";
                    }}
                  />
                ) : null}

                <div className="artist-placeholder">
                  <FaMusic size={40} />
                </div>
              </div>

              <h3 className="artist-name">{artist.name}</h3>
              <p className="artist-count">{artist.song_count} bài hát</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
