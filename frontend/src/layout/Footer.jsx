import { useContext, useEffect, useRef, useState } from "react";
import { PlayerContext } from "../context/PLayerContext";
import { FaPlay, FaPause, FaStepBackward, FaStepForward } from "react-icons/fa";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { IoVolumeHigh, IoVolumeMute } from "react-icons/io5";
import AdOverlay from "../components/AdOverlay";
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
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem("favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [playCount, setPlayCount] = useState(0);
  const [showAd, setShowAd] = useState(false);
  const [adTriggered, setAdTriggered] = useState(false);

  // 📈 Cập nhật lượt phát bài hát (PHP API)
  const updatePlayCount = async (songId) => {
    if (!songId) return;
    try {
      await axios.post("http://localhost:8081/music_API/song/update_play_count.php", {
        song_id: songId,
      });
      console.log("✅ Đã tăng lượt phát cho bài:", songId);
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật play_count:", err);
    }
  };

  // ❤️ Đồng bộ yêu thích
  useEffect(() => {
    if (currentSong?.url) {
      setIsLiked(favorites.some((fav) => fav.url === currentSong.url));
    } else {
      setIsLiked(false);
    }
  }, [currentSong, favorites]);

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // 🎵 Cập nhật tiến độ phát nhạc
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };

    const onLoaded = () => setDuration(audio.duration || 0);

    // ✅ Khi bài hát phát xong
    const onEnded = () => {
      if (!playlist?.length) return;

      // 🧠 Tăng playCount khi hết bài
      setPlayCount((prev) => {
        const newCount = prev + 1;

        // 📈 Gọi API tăng lượt phát
        updatePlayCount(currentSong?.id);

        // 🎬 Quảng cáo sau mỗi 2 bài (nếu không premium)
        const isPremium = localStorage.getItem("isPremium") === "true";
        if (!isPremium && newCount % 2 === 0 && !adTriggered) {
          setTimeout(() => {
            if (audio) audio.pause();
            setShowAd(true);
            setAdTriggered(true);
          }, 300);
        }
        return newCount;
      });

      // Tự chuyển sang bài kế tiếp
      const idx = playlist.findIndex((s) => s.url === currentSong?.url);
      const next = playlist[(idx + 1) % playlist.length];
      if (next) setCurrentSong(next);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, [currentSong, playlist, setCurrentSong, adTriggered]);

  const handleCloseAd = () => {
    setShowAd(false);
    setAdTriggered(false);
    const audio = audioRef.current;
    if (audio) audio.play();
  };

  // 🎧 Điều khiển phát nhạc
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;

    if (currentSong) {
      if (audio.src !== currentSong.url) {
        audio.src = currentSong.url;
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
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

  const playPrev = () => {
    if (!playlist?.length) return;
    const idx = playlist.findIndex((s) => s.url === currentSong.url);
    const prev = playlist[(idx - 1 + playlist.length) % playlist.length];
    if (prev) setCurrentSong(prev);
  };

  const playNext = () => {
    if (!playlist?.length) return;
    const idx = playlist.findIndex((s) => s.url === currentSong.url);
    const next = playlist[(idx + 1) % playlist.length];
    if (next) setCurrentSong(next);
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

  const toggleLike = () => {
    if (!currentSong?.url) return;
    const isFavorited = favorites.some((fav) => fav.url === currentSong.url);
    if (isFavorited) {
      setFavorites(favorites.filter((fav) => fav.url !== currentSong.url));
    } else {
      setFavorites([...favorites, { ...currentSong, addedAt: new Date().toISOString() }]);
    }
    setIsLiked(!isLiked);
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
      {showAd && <AdOverlay onClose={handleCloseAd} />}
      <footer className="footer">
        <div className="footer-wrapper">
          {/* Left */}
          <div className="footer-left">
            {currentSong.cover ? (
              <img src={currentSong.cover} alt={currentSong.title} className="track-image" />
            ) : (
              <div className="track-image-placeholder">♫</div>
            )}
            <div className="track-details">
              <div className="track-name">{currentSong.title}</div>
              <div className="track-artist">{currentSong.artist}</div>
            </div>
            <button
              className={`like-btn ${isLiked ? "liked" : ""}`}
              onClick={toggleLike}
            >
              {isLiked ? <AiFillHeart size={18} /> : <AiOutlineHeart size={18} />}
            </button>
          </div>

          {/* Center */}
          <div className="footer-center">
            <div className="control-buttons">
              <button className="control-btn" onClick={playPrev}><FaStepBackward size={16} /></button>
              <button className="play-btn" onClick={togglePlay}>
                {isPlaying ? <FaPause size={16} /> : <FaPlay size={16} />}
              </button>
              <button className="control-btn" onClick={playNext}><FaStepForward size={16} /></button>
            </div>
            <div className="progress-section" style={{ marginTop: "-6px" }}>
              <span className="time">{formatTime(currentTime)}</span>
              <div className="progress-bar" onClick={seek}>
                <div className="progress" style={{ width: `${progress}%` }} />
              </div>
              <span className="time">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right */}
          <div className="footer-right">
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
        <div style={{ position: "absolute", right: 20, bottom: 60, fontSize: 12, opacity: 0.5 }}>
  {`Lượt phát: ${playCount}`}
</div>

      </footer>
    </>
  );
}
