import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getSongs, getSongsByGenre } from "../services/songService";
import { getArtists } from "../services/artistService";
import { getAllAlbums, toggleAlbumFavorite, getFavoriteAlbumIds } from "../services/albumService";
import { PlayerContext } from "../context/PLayerContext";
import "../layout/Layout.css";
import "./HomePage.css";
import SongList from "../components/SongList";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { FaPlay } from "react-icons/fa";


const fixLocalUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) {
    return url.replace("10.0.2.2", "localhost");
  }
  return `http://localhost:8081/music_API/online_music/${url}`;
};

const fixAlbumUrl = (url) => {
  if (!url) return "";
  return url.replace("10.0.2.2", "localhost");
};

const HomePage = () => {
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

  // --- LOGIC ALBUMS ---
  const handleLoadAlbums = async () => {
    setActiveTab("albums");
    setSelectedGenre(null);
    setLoadingAlbums(true);

    try {
      const allAlbums = await getAllAlbums();
      let favSet = new Set();
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const favIds = await getFavoriteAlbumIds();
          favSet = new Set(favIds.map(id => String(id)));
        } catch (e) {
          console.warn("Không tải được danh sách yêu thích");
        }
      }

      const mergedAlbums = allAlbums.map(album => ({
        ...album,
        is_favorite: favSet.has(String(album.album_id))
      }));

      setAlbums(mergedAlbums || []);
    } catch (error) {
      console.error("❌ Lỗi khi load albums:", error);
      setAlbums([]);
    } finally {
      setLoadingAlbums(false);
    }
  };

  const handleToggleFavorite = async (e, album) => {
    e.stopPropagation(); 
    
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Vui lòng đăng nhập!");
      return;
    }
    
    // 1. Cập nhật giao diện NGAY LẬP TỨC
    const newStatus = !album.is_favorite;
    setAlbums(prevAlbums => 
      prevAlbums.map(a => 
        a.album_id === album.album_id 
          ? { ...a, is_favorite: newStatus } 
          : a
      )
    );

    try {
      // 2. Gọi API (Đảm bảo hàm toggleAlbumFavorite trong service hoạt động)
      // Truyền đúng tham số mà service yêu cầu
      await toggleAlbumFavorite(album.album_id, newStatus); 
      
      // Dispatch event
      window.dispatchEvent(new Event("playlistUpdated"));
    } catch (err) {
      console.error("Lỗi toggle favorite:", err);
      // Revert nếu lỗi
      setAlbums(prevAlbums => 
        prevAlbums.map(a => 
          a.album_id === album.album_id 
            ? { ...a, is_favorite: !newStatus } 
            : a
        )
      );
    }
  };

  // --- INITIAL LOAD & EVENTS ---
  useEffect(() => {
    const savedGenre = localStorage.getItem('selectedGenre');
    if (savedGenre) {
      const event = new CustomEvent("genreSelected", { detail: savedGenre });
      window.dispatchEvent(event);
      localStorage.removeItem('selectedGenre');
    }
    const savedArtist = localStorage.getItem('selectedArtist');
    if (savedArtist) {
      const artist = JSON.parse(savedArtist);
      const event = new CustomEvent("artistSelected", { detail: artist });
      window.dispatchEvent(event);
      localStorage.removeItem('selectedArtist');
    }
  }, []);

  useEffect(() => {
    const handleGenreSelected = async (event) => {
      const genre = event.detail;
      setSelectedGenre(genre);
      setActiveTab("genre");
      setLoading(true);
      try {
        let data;
        if (genre === "Tất cả bài hát") data = await getSongs();
        else data = await getSongsByGenre(genre);
        setGenreSongs(data || []);
      } catch (err) { setGenreSongs([]); } 
      finally { setLoading(false); }
    };
    window.addEventListener("genreSelected", handleGenreSelected);
    return () => window.removeEventListener("genreSelected", handleGenreSelected);
  }, []);

  useEffect(() => {
    const handleArtistSelected = async (event) => {
      const artist = event.detail;
      setSelectedArtist(artist);
      setActiveTab("artist");
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:8081/music_API/online_music/song/get_songs_by_artist.php?id=${artist.artist_id}`);
        const data = await response.json();
        if (data.status && Array.isArray(data.songs)) {
          setArtistSongs(data.songs.map(s => ({
            id: s.song_id || s.id,
            title: s.title,
            artist: s.artist || artist.name,
            url: s.audio,
            cover: s.cover,
            duration: s.duration || 0
          })));
        } else { setArtistSongs([]); }
      } catch (err) { setArtistSongs([]); } 
      finally { setLoading(false); }
    };
    window.addEventListener("artistSelected", handleArtistSelected);
    return () => window.removeEventListener("artistSelected", handleArtistSelected);
  }, []);

  useEffect(() => {
    const initLoad = async () => {
      setLoadingArtists(true);
      setLoadingAlbums(true);
      try {
        const [artistsData, albumsData] = await Promise.all([getArtists(), getAllAlbums()]);
        setArtists(artistsData || []);
        setAlbums(albumsData || []);
      } catch (e) { console.error(e); }
      finally { setLoadingArtists(false); setLoadingAlbums(false); }
    };
    initLoad();
  }, []);

  useEffect(() => {
    if (activeTab === "all") {
      const loadSongs = async () => {
        try {
          setLoading(true);
          const songs = await getSongs();
          setAllSongs(songs);
          if (songs.length > 0) {
             const shuffled = [...songs].sort(() => Math.random() - 0.5);
             const mixSize = Math.ceil(songs.length / 4);
             setDailyMixes([
                { id: 1, name: "Daily Mix 1", description: "Yêu thích", songs: shuffled.slice(0, mixSize), cover: shuffled[0]?.cover },
                { id: 2, name: "Daily Mix 2", description: "Khám phá", songs: shuffled.slice(mixSize, mixSize * 2), cover: shuffled[mixSize]?.cover },
                { id: 3, name: "Daily Mix 3", description: "Thư giãn", songs: shuffled.slice(mixSize * 2, mixSize * 3), cover: shuffled[mixSize * 2]?.cover },
                { id: 4, name: "Daily Mix 4", description: "Năng động", songs: shuffled.slice(mixSize * 3), cover: shuffled[mixSize * 3]?.cover },
             ]);
             setRecommendations([
                { id: 1, name: "Top Hits", description: "Hot nhất", songs: shuffled.slice(0, 5), cover: shuffled[0]?.cover },
                { id: 2, name: "Nhạc Việt", description: "V-Pop", songs: shuffled.slice(5, 10), cover: shuffled[5]?.cover },
                { id: 3, name: "Chill", description: "Cuối tuần", songs: recShuffled.slice(recSize * 2, recSize * 3), cover: recShuffled[recSize * 2]?.cover }, // Add missing parts if any
                { id: 4, name: "Party", description: "Sôi động", songs: recShuffled.slice(recSize * 3), cover: recShuffled[recSize * 3]?.cover },
             ]);
             // Fix lại recShuffled vì biến này không tồn tại ở trên
             const recShuffled = [...songs].sort(() => Math.random() - 0.5);
             const recSize = Math.ceil(songs.length / 4);
             const recs = [
              { id: 1, name: "Top Hits", description: "Hot nhất", songs: recShuffled.slice(0, recSize), cover: recShuffled[0]?.cover },
              { id: 2, name: "Nhạc Việt", description: "V-Pop", songs: recShuffled.slice(recSize, recSize * 2), cover: recShuffled[recSize]?.cover },
              { id: 3, name: "Chill", description: "Cuối tuần", songs: recShuffled.slice(recSize * 2, recSize * 3), cover: recShuffled[recSize * 2]?.cover },
              { id: 4, name: "Party", description: "Sôi động", songs: recShuffled.slice(recSize * 3), cover: recShuffled[recSize * 3]?.cover },
             ];
             setRecommendations(recs);
          }
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
      };
      loadSongs();
    }
  }, [activeTab]);

  const handlePlayMix = (mix) => {
    if (mix.songs?.length > 0) {
      setPlaylist(mix.songs);
      setCurrentSong(mix.songs[0]);
    }
  };

  return (
    <div className="home-container">
      <div className="category-filters">
        <button className={`filter-btn ${activeTab === "all" ? "active" : ""}`} onClick={() => { setActiveTab("all"); setSelectedGenre(null); }}>All</button>
        <button className={`filter-btn ${activeTab === "music" ? "active" : ""}`} onClick={() => { setActiveTab("music"); setSelectedGenre(null); }}>Music</button>
        <button className={`filter-btn ${activeTab === "albums" ? "active" : ""}`} onClick={handleLoadAlbums}>Albums</button>
        <button className={`filter-btn ${activeTab === "artists" ? "active" : ""}`} onClick={() => { setActiveTab("artists"); setSelectedGenre(null); }}>Nghệ sĩ</button>
        {selectedGenre && <button className="filter-btn active" disabled>{selectedGenre}</button>}
      </div>

      {activeTab === "music" && <SongList />}

      {/* 💿 TAB ALBUMS (Giao diện mới) */}
      {activeTab === "albums" && (
        <section className="albums-section">
          <div className="section-header">
            <h2>💿 Albums từ nghệ sĩ yêu thích</h2>
          </div>
          {loadingAlbums ? (
            <div style={{ padding: "30px", textAlign: "center" }}><p>Đang tải albums...</p></div>
          ) : albums.length === 0 ? (
            <div style={{ padding: "30px", textAlign: "center" }}><p>Chưa có album nào.</p></div>
          ) : (
            <div className="playlist-grid">
              {albums.map((album) => (
                <div
                  key={album.album_id}
                  className="playlist-item music-style-card"
                  onClick={() => navigate(`/album/${album.album_id}`)}
                >
                  <div className="card-image-wrapper">
                    <img src={fixAlbumUrl(album.cover_url)} alt={album.name} onError={(e) => (e.target.src = "https://placehold.co/300x300")} />
                    <div className="card-badge">Album</div>
                  </div>
                  <div className="card-info">
                    <h3 className="card-title" title={album.name}>{album.name}</h3>
                    <p className="card-artist">{album.artist_name || "Nghệ sĩ"} • {album.song_count || 0} bài</p>
                  </div>
                  <div className="card-actions">
                    <button className={`action-btn-circle heart ${album.is_favorite ? 'active' : ''}`} onClick={(e) => handleToggleFavorite(e, album)} title={album.is_favorite ? "Bỏ thích" : "Thích"}>
                      {album.is_favorite ? <AiFillHeart /> : <AiOutlineHeart />}
                    </button>
                    <button className="action-btn-circle play" onClick={(e) => { e.stopPropagation(); navigate(`/album/${album.album_id}`); }} title="Xem chi tiết">
                      <FaPlay size={12} style={{ marginLeft: "2px" }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 🎤 TAB ARTISTS */}
      {activeTab === "artists" && (
        <section className="artists-section">
          <div className="section-header"><h2>Tất cả nghệ sĩ</h2></div>
          {loadingArtists ? <p style={{textAlign: 'center'}}>Đang tải...</p> : (
            <div className="playlist-grid">
              {artists.map((artist) => (
                <div key={artist.id} className="playlist-item" onClick={() => navigate(`/artist/${artist.id}`)}>
                  <div className="playlist-cover artist-cover">
                    <img src={fixLocalUrl(artist.avatar)} alt={artist.name} style={{ borderRadius: "50%" }} onError={(e) => { e.target.style.display = "none"; e.target.parentElement.innerHTML = '<div style="width:100%;height:100%;background:#667eea;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:40px">🎤</div>'; }} />
                  </div>
                  <div className="playlist-info"><h3>{artist.name}</h3><p>Nghệ sĩ</p></div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 🏠 TAB ALL (Đầy đủ nội dung) */}
      {activeTab === "all" && (
        <>
          {albums.length > 0 && (
            <section className="discover-section" style={{ marginBottom: "30px" }}>
              <div className="section-header"><h2>💿 Để bạn bắt đầu</h2></div>
              <div className="horizontal-scroll">
                {albums.map((album) => (
                  <div key={album.album_id} className="album-card" onClick={() => navigate(`/album/${album.album_id}`)}>
                    <div className="album-cover-wrapper">
                      <img src={fixAlbumUrl(album.cover_url)} alt={album.name} />
                      <div className="album-badge">Album</div>
                    </div>
                    <div className="album-info"><h4>{album.name}</h4></div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {allSongs.length > 0 && (
            <section className="recommended-section">
              <div className="section-header"><h2>🎵 Gợi ý cho bạn</h2></div>
              <div className="songs-horizontal-scroll">
                {Array.from({ length: Math.ceil(allSongs.length / 3) }).map((_, colIndex) => {
                   const startIdx = colIndex * 3;
                   const columnSongs = allSongs.slice(startIdx, startIdx + 3);
                   return (
                     <div key={colIndex} className="song-column">
                       {columnSongs.map((song, idx) => (
                         <div key={song.id || idx} className="song-row-item" onClick={() => { setPlaylist(allSongs); setCurrentSong(song); }}>
                           <img src={song.cover} className="song-thumbnail" alt="" onError={(e) => e.target.src = "https://placehold.co/60x60"} />
                           <div className="song-details"><h4>{song.title}</h4><p>{song.artist}</p></div>
                         </div>
                       ))}
                     </div>
                   );
                })}
              </div>
            </section>
          )}

          <section className="featured-section" style={{ marginTop: "30px" }}>
            <div className="section-header"><h2>🎵 Bài Hát Được Yêu Thích</h2><button className="show-all">Xem tất cả</button></div>
            <div className="playlist-grid">
              {allSongs.slice(0, 12).map((song) => (
                <div key={song.id} className="playlist-item" onClick={() => { setPlaylist(allSongs); setCurrentSong(song); }}>
                  <div className="playlist-cover">
                    <img src={song.cover} alt={song.title} onError={(e) => e.target.src = "https://placehold.co/300x300"} />
                    <div className="play-hover"><button className="play-btn">▶</button></div>
                  </div>
                  <div className="playlist-info"><h3>{song.title}</h3><p>{song.artist}</p></div>
                </div>
              ))}
            </div>
          </section>

          <section className="made-for-section">
            <div className="section-header"><h2>Dành cho bạn</h2><button className="show-all">Xem tất cả</button></div>
            <div className="playlist-grid">
              {dailyMixes.map((mix) => (
                <div key={mix.id} className="playlist-item" onClick={() => handlePlayMix(mix)}>
                  <div className="playlist-cover">
                    <img src={mix.cover} alt={mix.name} onError={(e) => e.target.src = "https://placehold.co/300x300"} />
                    <div className="play-hover"><button className="play-btn">▶</button></div>
                  </div>
                  <div className="playlist-info"><h3>{mix.name}</h3><p>{mix.description}</p></div>
                </div>
              ))}
            </div>
          </section>

          <section className="recommended-section">
            <div className="section-header"><h2>Gợi ý hôm nay</h2><button className="show-all">Xem tất cả</button></div>
            <div className="playlist-grid">
              {recommendations.map((rec) => (
                <div key={rec.id} className="playlist-item" onClick={() => handlePlayMix(rec)}>
                  <div className="playlist-cover">
                    <img src={rec.cover} alt={rec.name} onError={(e) => e.target.src = "https://placehold.co/300x300"} />
                    <div className="play-hover"><button className="play-btn">▶</button></div>
                  </div>
                  <div className="playlist-info"><h3>{rec.name}</h3><p>{rec.description}</p></div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {activeTab === "artist" && selectedArtist && (
         <section className="artist-section">
            <div className="section-header"><h2>🎵 Bài hát của {selectedArtist.name}</h2></div>
            <div className="playlist-grid">
               {artistSongs.map(song => (
                 <div key={song.id} className="playlist-item" onClick={() => { setPlaylist(artistSongs); setCurrentSong(song); }}>
                    <div className="playlist-cover"><img src={fixLocalUrl(song.cover)} alt={song.title} /></div>
                    <div className="playlist-info"><h3>{song.title}</h3><p>{song.artist}</p></div>
                 </div>
               ))}
            </div>
         </section>
      )}
      
      {activeTab === "genre" && (
        <section className="genre-section">
          <div className="section-header"><h2>🎶 Thể loại: {selectedGenre}</h2></div>
          <div className="playlist-grid">
            {genreSongs.map((song) => (
              <div key={song.id} className="playlist-item" onClick={() => { setPlaylist(genreSongs); setCurrentSong(song); }}>
                <div className="playlist-cover"><img src={fixLocalUrl(song.cover)} alt={song.title} /><div className="play-hover"><button className="play-btn">▶</button></div></div>
                <div className="playlist-info"><h3>{song.title}</h3><p>{song.artist}</p></div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;