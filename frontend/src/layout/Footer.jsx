import { useContext, useEffect, useRef, useState, useCallback } from "react";
import { PlayerContext } from "../context/PLayerContext";
import {
  FaPlay,
  FaPause,
  FaStepBackward,
  FaStepForward,
  FaRedo,
  FaRandom,
} from "react-icons/fa";
import { AiOutlineHeart, AiFillHeart, AiOutlinePlus } from "react-icons/ai";
import { IoVolumeHigh, IoVolumeMute } from "react-icons/io5";
import AdOverlay from "../components/AdOverlay";
import AddToPlaylistModal from "../components/AddToPlaylistModal";
import axios from "axios";
import "./Footer.css";

export default function Footer() {
  const { currentSong, playlist, setCurrentSong } = useContext(PlayerContext);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoop, setIsLoop] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);

  const [playCount, setPlayCount] = useState(0);
  const [showAd, setShowAd] = useState(false);
  const [adTriggered, setAdTriggered] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  const fixUrl = (url) => {
    if (!url) return url;
    return url.replace("10.0.2.2", "localhost");
  };
  // ⭐ NEW – Premium state
  const [isPremium, setIsPremium] = useState(false);
  const [favorites, setFavorites] = useState([]); // Thêm state favorites

  // ⭐ NEW – Lấy user ID
  const userId = localStorage.getItem("user_id");

  // ⭐ NEW – Check Premium bằng API
  useEffect(() => {
    if (!userId) {
      setIsPremium(false);
      return;
    }
    const fetchPremium = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8081/music_API/online_music/user/check_premium.php?user_id=${userId}`
        );
        setIsPremium(res.data.is_premium === true);
      } catch (err) {
        console.error("❌ Lỗi kiểm tra Premium:", err);
      }
    };

    fetchPremium();

    // Cập nhật mỗi 60s để đảm bảo realtime
    const interval = setInterval(fetchPremium, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  // 📈 Gửi API tăng lượt phát
  const updatePlayCount = async (songId) => {
    if (!songId) return;
    try {
      await axios.post("http://localhost:8081/music_API/online_music/song/update_play_count.php", {
        song_id: songId,
      });
    } catch (err) {
      console.error("❌ Lỗi cập nhật play_count:", err);
    }
  };

  // Hàm đóng quảng cáo
  const handleCloseAd = () => {
    setShowAd(false);
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.error("Play error:", e));
      setIsPlaying(true);
    }
  };

  // ⏮ & ⏭ chuyển bài
  const playPrev = useCallback(() => {
    if (!playlist?.length) return;
    const idx = playlist.findIndex((s) => s.url === currentSong?.url);
    const prev = playlist[(idx - 1 + playlist.length) % playlist.length];
    if (prev) setCurrentSong(prev);
  }, [playlist, currentSong, setCurrentSong]);

  const playNext = useCallback(() => {
    if (!playlist?.length) return;
    let next;
    const idx = playlist.findIndex((s) => s.url === currentSong?.url);

    if (isShuffle) {
      next = playlist[Math.floor(Math.random() * playlist.length)];
    } else {
      next = playlist[(idx + 1) % playlist.length];
    }

    if (next) setCurrentSong(next);
  }, [playlist, currentSong, isShuffle, setCurrentSong]);

  // ❤️ Đồng bộ trạng thái tim
  useEffect(() => {
    const checkFavorite = async () => {
      if (!currentSong?.id) return setIsLiked(false);
      const token = localStorage.getItem("token");
      if (!token) return setIsLiked(false);
      try {
        const res = await axios.get(`http://localhost:5000/api/favorite-songs/check/${currentSong.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsLiked(res.data.is_favorite);
      } catch {
        setIsLiked(false);
      }
    };
    checkFavorite();
  }, [currentSong]);

  // Lắng nghe favorites thay đổi
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "favorites") {
        try {
          setFavorites(JSON.parse(e.newValue) || []);
        } catch {
          setFavorites([]);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Lưu favorites
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // 🎧 Cập nhật tiến độ & xử lý hết bài
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };

    const onLoaded = () => setDuration(audio.duration || 0);

    const onEnded = () => {
      if (!playlist?.length) return;

      if (isLoop) {
        audio.currentTime = 0;
        audio.play();
        return;
      }

      setPlayCount((prev) => {
        const newCount = prev + 1;
        updatePlayCount(currentSong?.id);

        // ⭐ Sửa lại: dùng isPremium từ API
        if (!isPremium && newCount % 2 === 0 && !adTriggered) {
          setTimeout(() => {
            audio.pause();
            setShowAd(true);
            setAdTriggered(true);
          }, 300);
        }

        return newCount;
      });

      playNext();
    }; // <--- Đã thêm dấu đóng ngoặc cho hàm onEnded

    // --- BỔ SUNG PHẦN BỊ THIẾU: Đăng ký sự kiện ---
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, [currentSong, playlist, isLoop, isPremium, adTriggered, playNext]); // <--- Đã thêm mảng dependency và đóng useEffect

  // Điều khiển play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume;

    if (currentSong && audio.src !== currentSong.url) {
      audio.src = currentSong.url;
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [currentSong, volume, isMuted]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true));
    }
  };

  const seek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (audioRef.current && duration)
      audioRef.current.currentTime = pct * duration;
  };

  const formatTime = (t) => {
    if (!t || isNaN(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ❤️ Toggle favorite
  const toggleLike = () => {
    if (!currentSong?.id) return;
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Vui lòng đăng nhập!");
      return;
    }
    // Gọi API Node.js để toggle yêu thích
    axios.get(`http://localhost:5000/api/favorite-songs/check/${currentSong.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      if (res.data.is_favorite) {
        // Đã yêu thích, xóa
        axios.delete(`http://localhost:5000/api/favorite-songs/remove/${currentSong.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(() => setIsLiked(false));
      } else {
        // Chưa yêu thích, thêm
        axios.post(`http://localhost:5000/api/favorite-songs/add`, { song_id: currentSong.id }, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(() => setIsLiked(true));
      }
    });
  };

  if (!currentSong) {
    return (
      <footer className="footer">
        <div className="footer-wrapper">
          <div className="footer-left">
            <div className="track-image-placeholder" />
            <div className="track-details">
              <div className="track-name">Không có bài hát nào</div>
              <div className="track-artist">—</div>
            </div>
          </div>
        </div>
        <audio ref={audioRef} />
      </footer>
    );
  }

  return (
    <>
      {/* QUẢNG CÁO */}
      {showAd && <AdOverlay onClose={handleCloseAd} />}

      {/* MODAL PLAYLIST */}
      <AddToPlaylistModal
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
        songId={currentSong?.id}
      />

      <footer
        className="footer"
        style={{
          backgroundImage: currentSong?.cover ? `url(${currentSong.cover})` : "none",
        }}
      >
        <div className="footer-overlay" />
        <div className="footer-wrapper">
          {/* LEFT */}
          <div className="footer-left">
            <div className="track-info-container">
              {currentSong.cover ? (
                <img src={fixUrl(currentSong.cover)} alt={currentSong.title} className="track-image" />
              ) : (
                <div className="track-image-placeholder">♫</div>
              )}

              <div className="track-details">
                <div className="track-name">{currentSong.title}</div>
                <div className="track-artist">{currentSong.artist}</div>
              </div>
            </div>
          </div>

          {/* CENTER */}
          <div className="footer-center">
            <div className="control-buttons">
              <button
                className={`control-btn shuffle ${isShuffle ? "active" : ""}`}
                onClick={() => setIsShuffle(!isShuffle)}
              >
                <FaRandom size={16} />
              </button>

              <button className="control-btn prev" onClick={playPrev}>
                <FaStepBackward size={18} />
              </button>

              <button
                className={`main-play-btn ${isPlaying ? "pause" : "play"}`}
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <FaPause size={20} />
                ) : (
                  <FaPlay size={20} style={{ marginLeft: "3px" }} />
                )}
              </button>

              <button className="control-btn next" onClick={playNext}>
                <FaStepForward size={18} />
              </button>

              <button
                className={`control-btn replay ${isLoop ? "active" : ""}`}
                onClick={() => setIsLoop(!isLoop)}
              >
                <FaRedo size={16} />
              </button>
            </div>

            <div className="progress-section">
              <span className="time">{formatTime(currentTime)}</span>
              <div className="progress-bar" onClick={seek}>
                <div className="progress" style={{ width: `${progress}%` }} />
              </div>
              <span className="time">{formatTime(duration)}</span>
            </div>
          </div>

          {/* RIGHT */}
          <div className="footer-right">
            <button
              className={`action-btn like-btn ${isLiked ? "liked" : ""}`}
              onClick={toggleLike}
              title="Thêm vào yêu thích"
            >
              {isLiked ? <AiFillHeart size={20} /> : <AiOutlineHeart size={20} />}
            </button>

            <button
              className="action-btn playlist-btn"
              onClick={() => setShowPlaylistModal(true)}
              title="Thêm vào playlist"
            >
              <AiOutlinePlus size={20} />
            </button>

            <button
              className="volume-btn"
              onClick={() => {
                const muted = !isMuted;
                setIsMuted(muted);
                if (!muted && volume === 0) setVolume(0.7);
              }}
            >
              {isMuted || volume === 0 ? <IoVolumeMute size={18} /> : <IoVolumeHigh size={18} />}
            </button>

            <div
              className="volume-control"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                setVolume(pct);
                setIsMuted(pct === 0);
              }}
            >
              <div className="volume-bar" style={{ width: `${volume * 100}%` }} />
            </div>
          </div>
        </div>

        <audio ref={audioRef} />
        <div
          style={{
            position: "absolute",
            right: 20,
            bottom: 60,
            fontSize: 12,
            opacity: 0.5,
          }}
        >
          {`Lượt phát: ${playCount}`}
        </div>
      </footer>
    </>
  );
}