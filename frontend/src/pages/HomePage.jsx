import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getSongs, getSongsByGenre } from "../services/songService";
import { getArtists } from "../services/artistService";
import { getAlbumsByFavoriteArtists } from "../services/albumService";
import { PlayerContext } from "../context/PLayerContext";
import "../layout/Layout.css";
import SongList from "../components/SongList";

const HomePage = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [allSongs, setAllSongs] = useState([]);
  const [dailyMixes, setDailyMixes] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genreSongs, setGenreSongs] = useState([]); // 🆕 bài hát theo thể loại
  const [selectedGenre, setSelectedGenre] = useState(null); // 🆕 thể loại đang chọn
  const [artists, setArtists] = useState([]); // 🆕 danh sách nghệ sĩ
  const [loadingArtists, setLoadingArtists] = useState(false);
  const [albums, setAlbums] = useState([]); // 🆕 danh sách albums
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [artistSongs, setArtistSongs] = useState([]); // 🆕 bài hát của nghệ sĩ
  const [selectedArtist, setSelectedArtist] = useState(null); // 🆕 nghệ sĩ đang chọn

  const { setPlaylist, setCurrentSong } = useContext(PlayerContext);
  const navigate = useNavigate();

  // 🆕 Kiểm tra localStorage khi component mount
  useEffect(() => {
    const savedGenre = localStorage.getItem('selectedGenre');
    if (savedGenre) {
      console.log('🎵 HomePage: Found saved genre in localStorage:', savedGenre);
      const event = new CustomEvent("genreSelected", { detail: savedGenre });
      window.dispatchEvent(event);
      localStorage.removeItem('selectedGenre');
    }

    const savedArtist = localStorage.getItem('selectedArtist');
    if (savedArtist) {
      console.log('🎵 HomePage: Found saved artist in localStorage:', savedArtist);
      const artist = JSON.parse(savedArtist);
      const event = new CustomEvent("artistSelected", { detail: artist });
      window.dispatchEvent(event);
      localStorage.removeItem('selectedArtist');
    }
  }, []);

  // 🆕 Lắng nghe sự kiện từ Sidebar khi người dùng chọn thể loại
  useEffect(() => {
    const handleGenreSelected = async (event) => {
      const genre = event.detail;
      console.log('🎵 HomePage: Received genre event:', genre);
      setSelectedGenre(genre);
      setActiveTab("genre");
      setLoading(true);

      try {
        let data;
        if (genre === "Tất cả bài hát") {
          console.log('📥 Loading all songs...');
          data = await getSongs();
        } else {
          console.log('📥 Loading songs for genre:', genre);
          data = await getSongsByGenre(genre);
        }
        console.log('✅ Songs loaded:', data?.length || 0);
        setGenreSongs(data || []);
      } catch (err) {
        console.error("❌ Lỗi khi tải bài hát theo thể loại:", err);
        setGenreSongs([]);
      } finally {
        setLoading(false);
      }
    };

    console.log('🔧 HomePage: Setting up genreSelected event listener');
    window.addEventListener("genreSelected", handleGenreSelected);
    return () => {
      console.log('🔧 HomePage: Removing genreSelected event listener');
      window.removeEventListener("genreSelected", handleGenreSelected);
    };
  }, []);

  // 🆕 Lắng nghe sự kiện từ Sidebar khi người dùng chọn nghệ sĩ
  useEffect(() => {
    const handleArtistSelected = async (event) => {
      const artist = event.detail;
      console.log('🎤 HomePage: Received artist event:', artist);
      setSelectedArtist(artist);
      setActiveTab("artist");
      setLoading(true);

      try {
        console.log('📥 Loading songs for artist:', artist.name);
        const response = await fetch(
          `http://localhost:8081/music_API/online_music/song/get_songs_by_artist.php?id=${artist.artist_id}`
        );
        const data = await response.json();
        
        if (data.status && Array.isArray(data.songs)) {
          const songs = data.songs.map(s => ({
            id: s.song_id || s.id,
            title: s.title,
            artist: s.artist || artist.name,
            url: s.audio,
            cover: s.cover,
            duration: s.duration || 0
          }));
          console.log('✅ Artist songs loaded:', songs.length);
          setArtistSongs(songs);
        } else {
          setArtistSongs([]);
        }
      } catch (err) {
        console.error("❌ Lỗi khi tải bài hát của nghệ sĩ:", err);
        setArtistSongs([]);
      } finally {
        setLoading(false);
      }
    };

    console.log('🔧 HomePage: Setting up artistSelected event listener');
    window.addEventListener("artistSelected", handleArtistSelected);
    return () => {
      console.log('🔧 HomePage: Removing artistSelected event listener');
      window.removeEventListener("artistSelected", handleArtistSelected);
    };
  }, []);

  // 🟢 Load nghệ sĩ
  useEffect(() => {
    const loadArtists = async () => {
      try {
        setLoadingArtists(true);
        const data = await getArtists();
        setArtists(data);
      } catch (error) {
        console.error("Error loading artists:", error);
      } finally {
        setLoadingArtists(false);
      }
    };
    loadArtists();
  }, []);

  // 🟢 Load albums
  useEffect(() => {
    const loadAlbums = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        setLoadingAlbums(true);
        const data = await getAlbumsByFavoriteArtists();
        setAlbums(data);
      } catch (error) {
        console.error("Error loading albums:", error);
      } finally {
        setLoadingAlbums(false);
      }
    };
    loadAlbums();
  }, []);

  // 🟢 Load tất cả bài hát + Daily Mix + Gợi ý
  useEffect(() => {
    const loadSongs = async () => {
      try {
        setLoading(true);
        const songs = await getSongs();
        setAllSongs(songs);

        if (songs.length > 0) {
          const shuffled = [...songs].sort(() => Math.random() - 0.5);
          const mixSize = Math.ceil(songs.length / 4);

          const mixes = [
            {
              id: 1,
              name: "Daily Mix 1",
              description: "Những bài hát bạn yêu thích",
              songs: shuffled.slice(0, mixSize),
              cover: shuffled[0]?.cover || "https://placehold.co/300x300",
            },
            {
              id: 2,
              name: "Daily Mix 2",
              description: "Khám phá âm nhạc mới",
              songs: shuffled.slice(mixSize, mixSize * 2),
              cover: shuffled[mixSize]?.cover || "https://placehold.co/300x300",
            },
            {
              id: 3,
              name: "Daily Mix 3",
              description: "Thư giãn cùng nhạc nhẹ",
              songs: shuffled.slice(mixSize * 2, mixSize * 3),
              cover: shuffled[mixSize * 2]?.cover || "https://placehold.co/300x300",
            },
            {
              id: 4,
              name: "Daily Mix 4",
              description: "Năng động cả ngày",
              songs: shuffled.slice(mixSize * 3),
              cover: shuffled[mixSize * 3]?.cover || "https://placehold.co/300x300",
            },
          ];

          setDailyMixes(mixes);

          const recShuffled = [...songs].sort(() => Math.random() - 0.5);
          const recSize = Math.ceil(songs.length / 4);

          const recs = [
            {
              id: 1,
              name: "Top Hits Tuần",
              description: "Những bài hát hot nhất",
              songs: recShuffled.slice(0, recSize),
              cover: recShuffled[0]?.cover || "https://placehold.co/300x300",
            },
            {
              id: 2,
              name: "Nhạc Việt Hay",
              description: "V-Pop đang trending",
              songs: recShuffled.slice(recSize, recSize * 2),
              cover: recShuffled[recSize]?.cover || "https://placehold.co/300x300",
            },
            {
              id: 3,
              name: "Chill Vibes",
              description: "Thư giãn cuối tuần",
              songs: recShuffled.slice(recSize * 2, recSize * 3),
              cover: recShuffled[recSize * 2]?.cover || "https://placehold.co/300x300",
            },
            {
              id: 4,
              name: "Party Mode",
              description: "Đốt cháy sàn nhảy",
              songs: recShuffled.slice(recSize * 3),
              cover: recShuffled[recSize * 3]?.cover || "https://placehold.co/300x300",
            },
          ];

          setRecommendations(recs);
        }
      } catch (error) {
        console.error("Error loading songs:", error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === "all") {
      loadSongs();
    }
  }, [activeTab]);

  const handlePlayMix = (mix) => {
    if (mix.songs && mix.songs.length > 0) {
      setPlaylist(mix.songs);
      setCurrentSong(mix.songs[0]);
    }
  };

  return (
    <div className="home-container">
      {/* Thanh category */}
      <div className="category-filters">
        <button
          className={`filter-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("all");
            setSelectedGenre(null);
          }}
        >
          All
        </button>

        <button
          className={`filter-btn ${activeTab === "music" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("music");
            setSelectedGenre(null);
          }}
        >
          Music
        </button>

        <button
          className={`filter-btn ${activeTab === "albums" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("albums");
            setSelectedGenre(null);
          }}
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

        {/* 🆕 Hiện thêm tab ảo khi chọn thể loại */}
        {selectedGenre && (
          <button className="filter-btn active" disabled>
            {selectedGenre}
          </button>
        )}
      </div>

      {/* 🔹 Khi chọn tab Music → gọi component SongList */}
      {activeTab === "music" && <SongList />}

      {/* 💿 Khi chọn tab Albums */}
      {activeTab === "albums" && (
        <section className="albums-section">
          <div className="section-header">
            <h2>💿 Albums từ nghệ sĩ yêu thích</h2>
          </div>
          {loadingAlbums ? (
            <div style={{ padding: "30px", textAlign: "center" }}>
              <p>Đang tải albums...</p>
            </div>
          ) : albums.length === 0 ? (
            <div style={{ padding: "30px", textAlign: "center" }}>
              <p>Chưa có album nào. Hãy chọn nghệ sĩ yêu thích!</p>
            </div>
          ) : (
            <div className="playlist-grid">
              {albums.map((album) => (
                <div
                  key={album.album_id}
                  className="playlist-item"
                  onClick={() => navigate(`/album/${album.album_id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="playlist-cover" style={{ position: "relative" }}>
                    <img
                      src={album.cover_url}
                      alt={album.album_name}
                      onError={(e) => {
                        e.target.src = "https://placehold.co/300x300";
                      }}
                    />
                    {/* Badge "Album" */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "10px",
                        right: "10px",
                        background: "rgba(0, 0, 0, 0.7)",
                        color: "#fff",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Album
                    </div>
                  </div>
                  <div className="playlist-info">
                    <h3>{album.album_name}</h3>
                    <p>{album.song_count} bài hát</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 🎤 Khi chọn tab Nghệ sĩ */}
      {activeTab === "artists" && (
        <section className="artists-section">
          <div className="section-header">
            <h2>🎤 Tất cả nghệ sĩ</h2>
          </div>
          {loadingArtists ? (
            <div style={{ padding: "30px", textAlign: "center" }}>
              <p>Đang tải nghệ sĩ...</p>
            </div>
          ) : artists.length === 0 ? (
            <div style={{ padding: "30px", textAlign: "center" }}>
              <p>Không có nghệ sĩ nào</p>
            </div>
          ) : (
            <div className="playlist-grid">
              {artists.map((artist) => (
                <div
                  key={artist.id}
                  className="playlist-item"
                  onClick={() => navigate(`/artist/${artist.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="playlist-cover artist-cover">
                    {artist.avatar ? (
                      <img
                        src={artist.avatar}
                        alt={artist.name}
                        style={{ borderRadius: "50%" }}
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML = 
                            '<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; font-size: 48px; border-radius: 50%;">🎤</div>';
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "48px",
                          borderRadius: "50%",
                        }}
                      >
                        🎤
                      </div>
                    )}
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

      {/* 🆕 Khi chọn nghệ sĩ từ Sidebar */}
      {activeTab === "artist" && selectedArtist && (
        <section className="artist-section">
          <div className="artist-header" style={{
            background: "linear-gradient(180deg, rgba(102,126,234,0.3) 0%, transparent 100%)",
            padding: "40px 30px",
            borderRadius: "12px",
            marginBottom: "30px",
            display: "flex",
            alignItems: "center",
            gap: "30px"
          }}>
            <div style={{
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
            }}>
              {selectedArtist.cover_url ? (
                <img 
                  src={selectedArtist.cover_url.startsWith('http') 
                    ? selectedArtist.cover_url 
                    : `http://localhost:8081/music_API/${selectedArtist.cover_url}`
                  } 
                  alt={selectedArtist.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                    e.target.parentElement.style.display = 'flex';
                    e.target.parentElement.style.alignItems = 'center';
                    e.target.parentElement.style.justifyContent = 'center';
                    e.target.parentElement.innerHTML = '<span style="font-size: 80px;">🎤</span>';
                  }}
                />
              ) : (
                <div style={{
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "80px"
                }}>
                  🎤
                </div>
              )}
            </div>
            <div>
              <p style={{ color: "#b3b3b3", fontSize: "14px", marginBottom: "8px" }}>NGHỆ SĨ</p>
              <h1 style={{ fontSize: "48px", fontWeight: "bold", margin: "0 0 16px 0" }}>
                {selectedArtist.name}
              </h1>
              <p style={{ color: "#b3b3b3", fontSize: "16px", lineHeight: "1.6" }}>
                {selectedArtist.bio || `Khám phá những bài hát hay nhất của ${selectedArtist.name}`}
              </p>
            </div>
          </div>

          <div className="section-header">
            <h2>🎵 Bài hát của {selectedArtist.name}</h2>
          </div>
          {loading ? (
            <p style={{ padding: "30px" }}>Đang tải bài hát...</p>
          ) : artistSongs.length === 0 ? (
            <p style={{ padding: "30px" }}>Nghệ sĩ này chưa có bài hát nào.</p>
          ) : (
            <div className="playlist-grid">
              {artistSongs.map((song) => (
                <div
                  key={song.id}
                  className="playlist-item"
                  onClick={() => {
                    setPlaylist(artistSongs);
                    setCurrentSong(song);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="playlist-cover">
                    <img
                      src={
                        song.cover?.startsWith("http")
                          ? song.cover
                          : `http://localhost:8081/music_API/${song.cover}`
                      }
                      alt={song.title}
                      onError={(e) =>
                        (e.target.src =
                          "https://placehold.co/300x300/1a1a1a/4a9b9b?text=♪")
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
          )}
        </section>
      )}

      {/* 🆕 Khi chọn thể loại từ Sidebar */}
      {activeTab === "genre" && (
        <section className="genre-section">
          <div className="section-header">
            <h2>🎶 Thể loại: {selectedGenre}</h2>
          </div>
          {loading ? (
            <p style={{ padding: "30px" }}>Đang tải bài hát...</p>
          ) : genreSongs.length === 0 ? (
            <p style={{ padding: "30px" }}>Không có bài hát nào trong thể loại này.</p>
          ) : (
            <div className="playlist-grid">
              {genreSongs.map((song) => (
                <div
                  key={song.id}
                  className="playlist-item"
                  onClick={() => {
                    setPlaylist(genreSongs);
                    setCurrentSong(song);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="playlist-cover">
                    <img
                      src={
                        song.cover?.startsWith("http")
                          ? song.cover
                          : `http://localhost:8081/music_API/${song.cover}`
                      }
                      alt={song.title}
                      onError={(e) =>
                        (e.target.src =
                          "https://placehold.co/300x300/1a1a1a/4a9b9b?text=♪")
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
          )}
        </section>
      )}

      {/* 🔹 Khi chọn tab All - Giống Flutter */}
      {activeTab === "all" && (
        <>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <p>Đang tải danh sách bài hát...</p>
            </div>
          ) : (
            <>
              {/* Section 1: Để bạn bắt đầu - Albums scroll ngang */}
              {albums.length > 0 && (
                <section className="discover-section" style={{ marginBottom: "30px" }}>
                  <div className="section-header">
                    <h2>💿 Để bạn bắt đầu</h2>
                  </div>
                  <div className="horizontal-scroll">
                    {albums.map((album) => (
                      <div
                        key={album.album_id}
                        className="album-card"
                        onClick={() => navigate(`/album/${album.album_id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="album-cover-wrapper">
                          <img
                            src={album.cover_url}
                            alt={album.album_name}
                            onError={(e) => {
                              e.target.src = "https://placehold.co/300x300";
                            }}
                          />
                          <div className="album-badge">Album</div>
                        </div>
                        <div className="album-info">
                          <h4>{album.album_name}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Section 2: Gợi ý cho bạn - Bài hát theo cột */}
              {allSongs.length > 0 && (
                <section className="recommended-section">
                  <div className="section-header">
                    <h2>🎵 Gợi ý cho bạn</h2>
                  </div>
                  <div className="songs-horizontal-scroll">
                    {Array.from({ length: Math.ceil(allSongs.length / 3) }).map((_, colIndex) => {
                      const startIdx = colIndex * 3;
                      const columnSongs = allSongs.slice(startIdx, startIdx + 3);
                      
                      return (
                        <div key={colIndex} className="song-column">
                          {columnSongs.map((song, idx) => (
                            <div
                              key={song.id || startIdx + idx}
                              className="song-row-item"
                              onClick={() => {
                                setPlaylist(allSongs);
                                setCurrentSong(song);
                              }}
                            >
                              <img
                                src={song.cover || "https://placehold.co/60x60"}
                                alt={song.title}
                                className="song-thumbnail"
                                onError={(e) => {
                                  e.target.src = "https://placehold.co/60x60";
                                }}
                              />
                              <div className="song-details">
                                <h4>{song.title}</h4>
                                <p>{song.artist}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Featured Songs Section */}
              <section className="featured-section" style={{ marginTop: "30px" }}>
                <div className="section-header">
                  <h2>🎵 Bài Hát Được Yêu Thích</h2>
                  <button className="show-all">Xem tất cả</button>
                </div>
                <div className="playlist-grid">
                  {allSongs.slice(0, 12).map((song) => (
                    <div
                      key={song.url || song.id}
                      className="playlist-item"
                      onClick={() => {
                        setPlaylist(allSongs);
                        setCurrentSong(song);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="playlist-cover">
                        {song.cover ? (
                          <img
                            src={song.cover}
                            alt={song.title}
                            onError={(e) => {
                              e.target.src =
                                "https://placehold.co/300x300/1a1a1a/4a9b9b?text=♪";
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              background:
                                "linear-gradient(135deg, #1a1a1a, #2a2a2a)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "48px",
                            }}
                          >
                            ♪
                          </div>
                        )}
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

              {/* Daily Mix Section */}
              <section className="made-for-section">
                <div className="section-header">
                  <h2>Dành cho bạn</h2>
                  <button className="show-all">Xem tất cả</button>
                </div>
                <div className="playlist-grid">
                  {dailyMixes.map((mix) => (
                    <div
                      key={mix.id}
                      className="playlist-item"
                      onClick={() => handlePlayMix(mix)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="playlist-cover">
                        <img
                          src={mix.cover}
                          alt={mix.name}
                          onError={(e) => {
                            e.target.src =
                              "https://placehold.co/300x300/1a1a1a/4a9b9b?text=Mix";
                          }}
                        />
                        <div className="play-hover">
                          <button className="play-btn">▶</button>
                        </div>
                      </div>
                      <div className="playlist-info">
                        <h3>{mix.name}</h3>
                        <p>
                          {mix.description} • {mix.songs.length} bài
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Recommendations Section */}
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
                      style={{ cursor: "pointer" }}
                    >
                      <div className="playlist-cover">
                        <img
                          src={rec.cover}
                          alt={rec.name}
                          onError={(e) => {
                            e.target.src =
                              "https://placehold.co/300x300/1a1a1a/4a9b9b?text=♪";
                          }}
                        />
                        <div className="play-hover">
                          <button className="play-btn">▶</button>
                        </div>
                      </div>
                      <div className="playlist-info">
                        <h3>{rec.name}</h3>
                        <p>
                          {rec.description} • {rec.songs.length} bài
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default HomePage;