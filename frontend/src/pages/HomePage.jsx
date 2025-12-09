import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getSongs, getSongsByGenre } from "../services/songService";
import { getArtists } from "../services/artistService";
import {
  getAllAlbums,
  toggleAlbumFavorite,
  getFavoriteAlbumIds,
} from "../services/albumService";
import { PlayerContext } from "../context/PLayerContext";
import "../layout/Layout.css";
import "./HomePage.css";
import SongList from "../components/SongList";
import TopChartBox from "../components/TopChartBox";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { FaPlay } from "react-icons/fa";

// === TIỆN ÍCH URL ===
const fixLocalUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url.replace("10.0.2.2", "localhost");
  return `http://localhost:8081/music_API/online_music/${url}`;
};

const fixAlbumUrl = (url) => {
  if (!url) return "";
  return url.replace("10.0.2.2", "localhost");
};

const HomePage = () => {
  // STATE
  const [activeTab, setActiveTab] = useState("all");
  const [allSongs, setAllSongs] = useState([]);
  const [dailyMixes, setDailyMixes] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genreSongs, setGenreSongs] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [artists, setArtists] = useState([]);
  const [loadingArtists, setLoadingArtists] = useState(false);
  const [albums, setAlbums] = useState([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [artistSongs, setArtistSongs] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);

  const { setPlaylist, setCurrentSong } = useContext(PlayerContext);
  const navigate = useNavigate();

  // === LOAD ALBUMS ===
  const handleLoadAlbums = async () => {
    setActiveTab("albums");
    setSelectedGenre(null);
    setLoadingAlbums(true);

    try {
      const allAlbums = await getAllAlbums(); // lấy album
      let favSet = new Set();
      const token = localStorage.getItem("token");

      if (token) {
        try {
          const favIds = await getFavoriteAlbumIds();
          favSet = new Set(favIds.map((id) => String(id)));
        } catch {}
      }

      const merged = allAlbums.map((album) => ({
        ...album,
        is_favorite: favSet.has(String(album.album_id)),
      }));

      setAlbums(merged || []);
    } catch {
      setAlbums([]);
    } finally {
      setLoadingAlbums(false);
    }
  };

  // === TOGGLE FAVORITE ===
  const handleToggleFavorite = async (e, album) => {
    e.stopPropagation();

    if (!localStorage.getItem("token")) {
      alert("Vui lòng đăng nhập để thêm vào yêu thích!");
      return;
    }

    const newStatus = !album.is_favorite;

    setAlbums((prev) =>
      prev.map((a) =>
        a.album_id === album.album_id ? { ...a, is_favorite: newStatus } : a
      )
    );

    try {
      await toggleAlbumFavorite(album.album_id);
      window.dispatchEvent(new Event("playlistUpdated"));
    } catch {
      // backup
      setAlbums((prev) =>
        prev.map((a) =>
          a.album_id === album.album_id
            ? { ...a, is_favorite: !newStatus }
            : a
        )
      );
    }
  };

  // === LISTENERS GENRE + ARTIST ===
  useEffect(() => {
    const g = localStorage.getItem("selectedGenre");
    if (g) {
      window.dispatchEvent(new CustomEvent("genreSelected", { detail: g }));
      localStorage.removeItem("selectedGenre");
    }

    const a = localStorage.getItem("selectedArtist");
    if (a) {
      const obj = JSON.parse(a);
      window.dispatchEvent(new CustomEvent("artistSelected", { detail: obj }));
      localStorage.removeItem("selectedArtist");
    }
  }, []);

  // GENRE
  useEffect(() => {
  const handle = async (event) => {
    const genre = event.detail;  // {id, name}

    setSelectedGenre(genre.name);  
    setActiveTab("genre");
    setLoading(true);

    try {
      let data;

      // 🔥 Nếu id = 0 → tất cả bài hát
      if (genre.id === 0) {
        data = await getSongs();
      } else {
        // 🔥 Gửi tên thể loại cho API
        data = await getSongsByGenre(genre.name);
      }

      setGenreSongs(data || []);
    } catch (err) {
      console.error("Lỗi load thể loại:", err);
      setGenreSongs([]);
    } finally {
      setLoading(false);
    }
  };

  window.addEventListener("genreSelected", handle);
  return () => window.removeEventListener("genreSelected", handle);
}, []);

  // ARTIST
  useEffect(() => {
    const handle = async (event) => {
      const artist = event.detail;
      setSelectedArtist(artist);
      setActiveTab("artist");
      setLoading(true);

      try {
        const response = await fetch(
          `http://localhost:8081/music_API/online_music/song/get_songs_by_artist.php?id=${artist.artist_id}`
        );
        const data = await response.json();

        if (data.status && Array.isArray(data.songs)) {
          setArtistSongs(
            data.songs.map((s) => ({
              id: s.song_id || s.id,
              title: s.title,
              artist: s.artist || artist.name,
              url: s.audio,
              cover: s.cover,
              duration: s.duration || 0,
            }))
          );
        } else setArtistSongs([]);
      } catch {
        setArtistSongs([]);
      } finally {
        setLoading(false);
      }
    };

    window.addEventListener("artistSelected", handle);
    return () => window.removeEventListener("artistSelected", handle);
  }, []);

  // === INITIAL LOAD ===
  useEffect(() => {
    const load = async () => {
      setLoadingArtists(true);
      setLoadingAlbums(true);

      try {
        const [artistData, albumData] = await Promise.all([
          getArtists(),
          getAllAlbums(),
        ]);
        setArtists(artistData || []);
        setAlbums(albumData || []);
      } catch {}

      setLoadingArtists(false);
      setLoadingAlbums(false);
    };

    load();
  }, []);

  // === LOAD SONGS TAB ALL ===
  useEffect(() => {
    if (activeTab === "all") {
      const run = async () => {
        try {
          setLoading(true);
          const songs = await getSongs();
          setAllSongs(songs);

          if (songs.length > 0) {
            const shuffled = [...songs].sort(() => Math.random() - 0.5);
            const size = Math.ceil(songs.length / 4);

            setDailyMixes([
              {
                id: 1,
                name: "Daily Mix 1",
                description: "Yêu thích",
                songs: shuffled.slice(0, size),
                cover: shuffled[0]?.cover,
              },
              {
                id: 2,
                name: "Daily Mix 2",
                description: "Khám phá",
                songs: shuffled.slice(size, size * 2),
                cover: shuffled[size]?.cover,
              },
              {
                id: 3,
                name: "Daily Mix 3",
                description: "Thư giãn",
                songs: shuffled.slice(size * 2, size * 3),
                cover: shuffled[size * 2]?.cover,
              },
              {
                id: 4,
                name: "Daily Mix 4",
                description: "Năng động",
                songs: shuffled.slice(size * 3),
                cover: shuffled[size * 3]?.cover,
              },
            ]);

            const recShuffled = [...songs].sort(() => Math.random() - 0.5);
            setRecommendations(
              Array.from({ length: 4 }).map((_, i) => ({
                id: i + 1,
                name: ["Top Hits", "Nhạc Việt", "Chill", "Party"][i],
                description: ["Hot nhất", "V-Pop", "Cuối tuần", "Sôi động"][i],
                songs: recShuffled.slice(i * size, (i + 1) * size),
                cover: recShuffled[i * size]?.cover,
              }))
            );
          }
        } catch {}
        setLoading(false);
      };

      run();
    }
  }, [activeTab]);

  // === PLAY MIX ===
  const handlePlayMix = (mix) => {
    if (mix.songs?.length > 0) {
      setPlaylist(mix.songs);
      setCurrentSong(mix.songs[0]);
    }
  };

  // ============================================================
  // RENDER BẮT ĐẦU
  // ============================================================

  return (
    <div className="home-container">
      {/* FILTERS */}
      <div className="category-filters">
        <button
          className={`filter-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("all");
            setSelectedGenre(null);
          }}
        >
          Trang chủ
        </button>

        <button
          className={`filter-btn ${activeTab === "music" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("music");
            setSelectedGenre(null);
          }}
        >
          Bài hát
        </button>

        <button
          className={`filter-btn ${activeTab === "albums" ? "active" : ""}`}
          onClick={handleLoadAlbums}
        >
          Albums
        </button>

        <button
          className={`filter-btn ${activeTab === "artists" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("artists");
            setSelectedGenre(null);
          }}
        >
          Nghệ sĩ
        </button>

        {selectedGenre && (
          <button className="filter-btn active" disabled>
            {selectedGenre}
          </button>
        )}
      </div>

      {/* TAB MUSIC */}
      {activeTab === "music" && <SongList />}

      {/* TAB ALBUMS */}
      {activeTab === "albums" && (
        <section className="albums-section">
          <div className="section-header">
            <h2>💿 Albums từ nghệ sĩ yêu thích</h2>
          </div>

          {loadingAlbums ? (
            <p style={{ textAlign: "center" }}>Đang tải albums...</p>
          ) : albums.length === 0 ? (
            <p style={{ textAlign: "center" }}>Chưa có album nào.</p>
          ) : (
            <div className="playlist-grid">
              {albums.map((album) => (
                <div
                  key={album.album_id}
                  className="playlist-item music-style-card"
                  onClick={() => navigate(`/album/${album.album_id}`)}
                >
                  <div className="card-image-wrapper">
                    <img
                      src={fixAlbumUrl(album.cover_url)}
                      alt={album.name}
                      onError={(e) =>
                        (e.target.src = "https://placehold.co/300x300")
                      }
                    />
                    <div className="card-badge">Album</div>
                  </div>

                  <div className="card-info">
                    <h3 className="card-title">{album.name}</h3>
                    <p className="card-artist">
                      {album.artist_name || "Nghệ sĩ"} •{" "}
                      {album.song_count || 0} bài
                    </p>
                  </div>

                  <div className="card-actions">
                    <button
                      className={`action-btn-circle heart ${
                        album.is_favorite ? "active" : ""
                      }`}
                      onClick={(e) => handleToggleFavorite(e, album)}
                    >
                      {album.is_favorite ? <AiFillHeart /> : <AiOutlineHeart />}
                    </button>

                    <button
                      className="action-btn-circle play"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/album/${album.album_id}`);
                      }}
                    >
                      <FaPlay size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB ARTISTS */}
      {activeTab === "artists" && (
        <section className="artists-section">
          <div className="section-header">
            <h2>Tất cả nghệ sĩ</h2>
          </div>

          {loadingArtists ? (
            <p style={{ textAlign: "center" }}>Đang tải...</p>
          ) : (
            <div className="playlist-grid">
              {artists.map((artist) => (
                <div
                  key={artist.id}
                  className="playlist-item"
                  onClick={() => navigate(`/artist/${artist.id}`)}
                >
                  <div className="playlist-cover artist-cover">
                    <img
                      src={fixLocalUrl(artist.avatar)}
                      alt={artist.name}
                      style={{ borderRadius: "50%" }}
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.parentElement.innerHTML =
                          '<div style="width:100%;height:100%;background:#667eea;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:40px">🎤</div>';
                      }}
                    />
                  </div>

                  <div className="playlist-info">
                    <h3>{artist.name}</h3>
                    <p>Nghệ sĩ</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB ALL */}
      {activeTab === "all" && (
        <>
          {/* ALBUM START SECTION */}
          {albums.length > 0 && (
            <section className="discover-section" style={{ marginBottom: 30 }}>
              <div className="section-header">
                <h2>💿 Để bạn bắt đầu</h2>
              </div>

              <div className="horizontal-scroll">
                {albums.map((album) => (
                  <div
                    key={album.album_id}
                    className="album-card"
                    onClick={() => navigate(`/album/${album.album_id}`)}
                  >
                    <div className="album-cover-wrapper">
                      <img
                        src={fixAlbumUrl(album.cover_url)}
                        alt={album.name}
                        onError={(e) =>
                          (e.target.src = "https://placehold.co/300x300")
                        }
                      />
                      <div className="album-badge">Album</div>
                    </div>
                    <div className="album-info">
                      <h4>{album.name}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* BẢNG XẾP HẠNG */}
          <section className="top-charts-section" style={{marginBottom: 30}}>
            <div className="section-header">
              <h2>Bảng Xếp Hạng</h2>
            </div>
            <div className="top-charts-grid" style={{display: 'flex', gap: 24, width: '100%'}}>
              {/* Top 50 Bài Hát Thịnh Hành */}
              <TopChartBox
                title="Top 50 Bài Hát Thịnh Hành"
                apiUrl="http://localhost:8081/music_API/online_music/song/get_top_songs_web.php"
                color="#5c3a3a"
              />
              {/* Top 50 Nhạc Việt */}
              <TopChartBox
                title="Top 50 Nhạc Việt"
                apiUrl="http://localhost:8081/music_API/online_music/song/get_top_songs_web.php?genre_name=V-Pop"
                color="#5c5c3a"
              />
              {/* Top 50 Nhạc Hoa */}
              <TopChartBox
                title="Top 50 Nhạc Hoa"
                apiUrl="http://localhost:8081/music_API/online_music/song/get_top_songs_web.php?genre_name=K-Pop"
                color="#3a3a5c"
              />
            </div>
          </section>

          {/* GỢI Ý CHO BẠN */}
          {allSongs.length > 0 && (
            <section className="recommended-section">
              <div className="section-header">
                <h2>🎵 Gợi ý cho bạn</h2>
                <button className="show-all">Xem tất cả</button>
              </div>

              <div className="playlist-grid">
                {allSongs.slice(0, 12).map((song) => (
                  <div
                    key={song.id}
                    className="playlist-item"
                    onClick={() => {
                      setPlaylist(allSongs);
                      setCurrentSong(song);
                    }}
                  >
                    <div className="playlist-cover">
                      <img
                        src={fixLocalUrl(song.cover)}
                        alt={song.title}
                        onError={(e) =>
                          (e.target.src = "https://placehold.co/300x300")
                        }
                      />
                      <div className="play-hover">
                        <button className="play-btn">▶</button>
                      </div>
                    </div>

                    <div className="playlist-info">
                      <h3>{song.title}</h3>
                      <p>{song.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* YÊU THÍCH */}
          <section className="featured-section" style={{ marginTop: 10 }}>
            <div className="section-header">
              <h2>🎵 Bài Hát Được Yêu Thích</h2>
              <button className="show-all">Xem tất cả</button>
            </div>

            <div className="playlist-grid">
              {allSongs.slice(0, 12).map((song) => (
                <div
                  key={song.id}
                  className="playlist-item"
                  onClick={() => {
                    setPlaylist(allSongs);
                    setCurrentSong(song);
                  }}
                >
                  <div className="playlist-cover">
                    <img
                      src={fixLocalUrl(song.cover)}
                      alt={song.title}
                      onError={(e) =>
                        (e.target.src = "https://placehold.co/300x300")
                      }
                    />
                    <div className="play-hover">
                      <button className="play-btn">▶</button>
                    </div>
                  </div>

                  <div className="playlist-info">
                    <h3>{song.title}</h3>
                    <p>{song.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* GỢI Ý HÔM NAY */}
          <section className="recommended-section">
            <div className="section-header">
              <h2>Gợi ý hôm nay</h2>
              <button className="show-all">Xem tất cả</button>
            </div>

            <div className="playlist-grid">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="playlist-item"
                  onClick={() => handlePlayMix(rec)}
                >
                  <div className="playlist-cover">
                    <img
                      src={fixLocalUrl(rec.cover)}
                      alt={rec.name}
                      onError={(e) =>
                        (e.target.src = "https://placehold.co/300x300")
                      }
                    />
                    <div className="play-hover">
                      <button className="play-btn">▶</button>
                    </div>
                  </div>

                  <div className="playlist-info">
                    <h3>{rec.name}</h3>
                    <p>{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ARTIST TAB PAGE */}
      {activeTab === "artist" && selectedArtist && (
        <section className="artist-section">
          <div className="section-header">
            <h2>Bài hát của {selectedArtist.name}</h2>
          </div>

          <div className="playlist-grid">
            {artistSongs.map((song) => (
              <div
                key={song.id}
                className="playlist-item"
                onClick={() => {
                  setPlaylist(artistSongs);
                  setCurrentSong(song);
                }}
              >
                <div className="playlist-cover">
                  <img src={fixLocalUrl(song.cover)} alt={song.title} />
                </div>
                <div className="playlist-info">
                  <h3>{song.title}</h3>
                  <p>{song.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* GENRE TAB PAGE */}
      {activeTab === "genre" && (
        <section className="genre-section">
          <div className="section-header">
            <h2>🎶 Thể loại: {selectedGenre}</h2>
          </div>

          <div className="playlist-grid">
            {genreSongs.map((song) => (
              <div
                key={song.id}
                className="playlist-item"
                onClick={() => {
                  setPlaylist(genreSongs);
                  setCurrentSong(song);
                }}
              >
                <div className="playlist-cover">
                  <img src={fixLocalUrl(song.cover)} alt={song.title} />
                  <div className="play-hover">
                    <button className="play-btn">▶</button>
                  </div>
                </div>

                <div className="playlist-info">
                  <h3>{song.title}</h3>
                  <p>{song.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;