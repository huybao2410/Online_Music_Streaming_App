import React, { useState, useEffect, useContext } from "react";
import { getSongs } from "../services/songService";
import { PlayerContext } from "../context/PLayerContext";
import "../layout/Layout.css";
import SongList from "../components/SongList";

const HomePage = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [allSongs, setAllSongs] = useState([]);
  const [dailyMixes, setDailyMixes] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setPlaylist, setCurrentSong } = useContext(PlayerContext);

  useEffect(() => {
    const loadSongs = async () => {
      try {
        setLoading(true);
        const songs = await getSongs();
        setAllSongs(songs);

        // Tạo Daily Mix: chia ngẫu nhiên thành 4 mix
        if (songs.length > 0) {
          const shuffled = [...songs].sort(() => Math.random() - 0.5);
          const mixSize = Math.ceil(songs.length / 4);
          
          const mixes = [
            {
              id: 1,
              name: "Daily Mix 1",
              description: "Những bài hát bạn yêu thích",
              songs: shuffled.slice(0, mixSize),
              cover: shuffled[0]?.cover || "https://placehold.co/300x300"
            },
            {
              id: 2,
              name: "Daily Mix 2",
              description: "Khám phá âm nhạc mới",
              songs: shuffled.slice(mixSize, mixSize * 2),
              cover: shuffled[mixSize]?.cover || "https://placehold.co/300x300"
            },
            {
              id: 3,
              name: "Daily Mix 3",
              description: "Thư giãn cùng nhạc nhẹ",
              songs: shuffled.slice(mixSize * 2, mixSize * 3),
              cover: shuffled[mixSize * 2]?.cover || "https://placehold.co/300x300"
            },
            {
              id: 4,
              name: "Daily Mix 4",
              description: "Năng động cả ngày",
              songs: shuffled.slice(mixSize * 3),
              cover: shuffled[mixSize * 3]?.cover || "https://placehold.co/300x300"
            }
          ];
          
          setDailyMixes(mixes);

          // Tạo Recommendations: lấy ngẫu nhiên
          const recShuffled = [...songs].sort(() => Math.random() - 0.5);
          const recSize = Math.ceil(songs.length / 4);
          
          const recs = [
            {
              id: 1,
              name: "Top Hits Tuần",
              description: "Những bài hát hot nhất",
              songs: recShuffled.slice(0, recSize),
              cover: recShuffled[0]?.cover || "https://placehold.co/300x300"
            },
            {
              id: 2,
              name: "Nhạc Việt Hay",
              description: "V-Pop đang trending",
              songs: recShuffled.slice(recSize, recSize * 2),
              cover: recShuffled[recSize]?.cover || "https://placehold.co/300x300"
            },
            {
              id: 3,
              name: "Chill Vibes",
              description: "Thư giãn cuối tuần",
              songs: recShuffled.slice(recSize * 2, recSize * 3),
              cover: recShuffled[recSize * 2]?.cover || "https://placehold.co/300x300"
            },
            {
              id: 4,
              name: "Party Mode",
              description: "Đốt cháy sàn nhảy",
              songs: recShuffled.slice(recSize * 3),
              cover: recShuffled[recSize * 3]?.cover || "https://placehold.co/300x300"
            }
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
          onClick={() => setActiveTab("all")}
        >
          All
        </button>

        <button
          className={`filter-btn ${activeTab === "music" ? "active" : ""}`}
          onClick={() => setActiveTab("music")}
        >
          Music
        </button>

        <button
          className={`filter-btn ${activeTab === "podcasts" ? "active" : ""}`}
          onClick={() => setActiveTab("podcasts")}
        >
          Podcasts
        </button>
      </div>

      {/* 🔹 Khi chọn tab Music → gọi component MusicList */}
      {activeTab === "music" && <SongList />}

      {/* 🔹 Khi chọn tab All */}
      {activeTab === "all" && (
        <>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p>Đang tải danh sách bài hát...</p>
            </div>
          ) : (
            <>
              {/* Featured Songs Section */}
              <section className="featured-section">
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
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="playlist-cover">
                        {song.cover ? (
                          <img
                            src={song.cover}
                            alt={song.title}
                            onError={(e) => {
                              e.target.src = 'https://placehold.co/300x300/1a1a1a/4a9b9b?text=♪';
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '48px'
                          }}>♪</div>
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
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="playlist-cover">
                        <img
                          src={mix.cover}
                          alt={mix.name}
                          onError={(e) => {
                            e.target.src = 'https://placehold.co/300x300/1a1a1a/4a9b9b?text=Mix';
                          }}
                        />
                        <div className="play-hover">
                          <button className="play-btn">▶</button>
                        </div>
                      </div>
                      <div className="playlist-info">
                        <h3>{mix.name}</h3>
                        <p>{mix.description} • {mix.songs.length} bài</p>
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
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="playlist-cover">
                        <img
                          src={rec.cover}
                          alt={rec.name}
                          onError={(e) => {
                            e.target.src = 'https://placehold.co/300x300/1a1a1a/4a9b9b?text=♪';
                          }}
                        />
                        <div className="play-hover">
                          <button className="play-btn">▶</button>
                        </div>
                      </div>
                      <div className="playlist-info">
                        <h3>{rec.name}</h3>
                        <p>{rec.description} • {rec.songs.length} bài</p>
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