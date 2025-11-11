import { useContext, useEffect, useRef, useState } from "react";
import { PlayerContext } from "../context/PLayerContext";
import { FaPlay, FaPause, FaStepBackward, FaStepForward } from "react-icons/fa";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { IoVolumeHigh, IoVolumeMute } from "react-icons/io5";
import AdOverlay from "./AdOverlay"; // ✅ thêm dòng này

export default function MusicPlayer() {
  const { currentSong, playlist, setCurrentSong } = useContext(PlayerContext);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [playCount, setPlayCount] = useState(0); // ✅ đếm số bài phát
  const [showAd, setShowAd] = useState(false); // ✅ hiển thị quảng cáo
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem("favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ✅ Kiểm tra bài hát yêu thích
  useEffect(() => {
    if (currentSong && currentSong.url) {
      const isFavorited = favorites.some((fav) => fav.url === currentSong.url);
      setIsLiked(isFavorited);
    } else {
      setIsLiked(false);
    }
  }, [currentSong, favorites]);

  // ✅ Lưu favorites
  useEffect(() => {
    try {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    } catch (error) {
      console.error("Error saving favorites:", error);
    }
  }, [favorites]);

  // ✅ Theo dõi trạng thái audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress(
        audio.duration ? (audio.currentTime / audio.duration) * 100 : 0
      );
    };

    const onLoaded = () => {
      setDuration(audio.duration || 0);
    };

    const onEnded = () => {
      if (!playlist || playlist.length === 0) return;
      const idx = playlist.findIndex(
        (s) => s.url === (currentSong && currentSong.url)
      );
      const next = playlist[(idx + 1) % playlist.length];
      if (next) {
        setCurrentSong(next);
        setPlayCount((prev) => prev + 1); // ✅ đếm khi bài mới phát
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, [currentSong, playlist, setCurrentSong]);

  // ✅ Hiển thị quảng cáo sau mỗi 2 bài
  useEffect(() => {
    if (playCount > 0 && playCount % 2 === 0) {
      const audio = audioRef.current;
      if (audio) audio.pause();
      setShowAd(true);
    }
  }, [playCount]);

  // ✅ Cập nhật audio khi có bài mới
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;

    if (currentSong) {
      if (audio.src !== currentSong.url) {
        audio.src = currentSong.url;
        const p = audio.play();
        if (p && p.catch)
          p.catch((e) => {
            console.warn("Autoplay blocked:", e.message);
            setIsPlaying(false);
          });
        setIsPlaying(true);
      }
    } else {
      audio.pause();
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [currentSong, volume, isMuted]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const playPrev = () => {
    if (!playlist || playlist.length === 0) return;
    const idx = playlist.findIndex((s) => s.url === currentSong.url);
    const prev = playlist[(idx - 1 + playlist.length) % playlist.length];
    if (prev) {
      setCurrentSong(prev);
      setPlayCount((prevCount) => prevCount + 1); // ✅
    }
  };

  const playNext = () => {
    if (!playlist || playlist.length === 0) return;
    const idx = playlist.findIndex((s) => s.url === currentSong.url);
    const next = playlist[(idx + 1) % playlist.length];
    if (next) {
      setCurrentSong(next);
      setPlayCount((prevCount) => prevCount + 1); // ✅
    }
  };

  const seek = (e) => {
    const slider = e.currentTarget;
    const rect = slider.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
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
    if (!currentSong || !currentSong.url) return;
    setFavorites((prev) => {
      const isFavorited = prev.some((fav) => fav.url === currentSong.url);
      if (isFavorited) {
        return prev.filter((fav) => fav.url !== currentSong.url);
      } else {
        return [...prev, { ...currentSong, addedAt: new Date().toISOString() }];
      }
    });
    setIsLiked(!isLiked);
  };

  return (
    <>
      {/* ✅ Toàn bộ Player */}
      <footer className="footer">
        <div className="footer-wrapper">
          {/* ...toàn bộ giao diện player hiện tại của bạn... */}
          {/* Giữ nguyên nội dung gốc */}
        </div>
        <audio ref={audioRef} />
      </footer>

      {/* ✅ Quảng cáo full màn hình */}
      {showAd && (
        <AdOverlay
          onClose={() => {
            setShowAd(false);
            setTimeout(() => {
              if (audioRef.current) audioRef.current.play();
            }, 300);
          }}
        />
      )}
    </>
  );
}
