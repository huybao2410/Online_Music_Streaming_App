import { useContext, useEffect, useRef, useState } from "react";
import { PlayerContext } from "../context/PLayerContext";
import { FaPlay, FaPause, FaStepBackward, FaStepForward } from "react-icons/fa";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { IoVolumeHigh, IoVolumeMute } from "react-icons/io5";

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
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem("favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (currentSong && currentSong.url) {
      const isFavorited = favorites.some((fav) => fav.url === currentSong.url);
      setIsLiked(isFavorited);
    } else {
      setIsLiked(false);
    }
  }, [currentSong, favorites]);

  useEffect(() => {
    try {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    } catch (error) {
      console.error("Error saving favorites:", error);
    }
  }, [favorites]);

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
  }, [currentSong, playlist, setCurrentSong]);

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
    if (prev) setCurrentSong(prev);
  };

  const playNext = () => {
    if (!playlist || playlist.length === 0) return;
    const idx = playlist.findIndex((s) => s.url === currentSong.url);
    const next = playlist[(idx + 1) % playlist.length];
    if (next) setCurrentSong(next);
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
        return [
          ...prev,
          {
            ...currentSong,
            addedAt: new Date().toISOString(),
          },
        ];
      }
    });

    setIsLiked(!isLiked);
  };

  if (!currentSong) {
    return (
      <footer className="footer">
        <div className="footer-wrapper">
          {/* Left Section - Track Info */}
          <div className="footer-left">
            <div className="track-image-placeholder" />
            <div className="track-details">
              <div className="track-name">No song playing</div>
              <div className="track-artist">—</div>
            </div>
          </div>

          {/* Center Section - Player Controls */}
          <div className="footer-center">
            <div className="control-buttons">
              <button className="control-btn" disabled>
                <FaStepBackward size={16} />
              </button>
              <button className="play-btn" disabled>
                <FaPlay size={16} />
              </button>
              <button className="control-btn" disabled>
                <FaStepForward size={16} />
              </button>
            </div>
            <div className="progress-section">
              <span className="time">{formatTime(0)}</span>
              <div className="progress-bar">
                <div className="progress" style={{ width: "0%" }} />
              </div>
              <span className="time">{formatTime(0)}</span>
            </div>
          </div>

          {/* Right Section - Volume */}
          <div className="footer-right">
            <button className="volume-btn" disabled>
              <IoVolumeHigh size={18} />
            </button>
            <div className="volume-control">
              <div className="volume-bar" style={{ width: "70%" }} />
            </div>
          </div>
        </div>
        <audio ref={audioRef} />
      </footer>
    );
  }

  return (
    <footer className="footer">
      <div className="footer-wrapper">
        {/* Left Section - Track Info */}
        <div className="footer-left">
          {currentSong.cover ? (
            <img
              src={currentSong.cover}
              alt={currentSong.title}
              className="track-image"
            />
          ) : (
            <div className="track-image-placeholder" />
          )}
          <div className="track-details">
            <div className="track-name">{currentSong.title}</div>
            <div className="track-artist">{currentSong.artist}</div>
          </div>
          <button
            className={`like-btn ${isLiked ? "liked" : ""}`}
            onClick={toggleLike}
            title={isLiked ? "Remove from favorites" : "Add to favorites"}
          >
            {isLiked ? <AiFillHeart size={18} /> : <AiOutlineHeart size={18} />}
          </button>
        </div>

        {/* Center Section - Player Controls */}
        <div className="footer-center">
          <div className="control-buttons">
            <button className="control-btn" onClick={playPrev}>
              <FaStepBackward size={16} />
            </button>
            <button className="play-btn" onClick={togglePlay}>
              {isPlaying ? <FaPause size={16} /> : <FaPlay size={16} />}
            </button>
            <button className="control-btn" onClick={playNext}>
              <FaStepForward size={16} />
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

        {/* Right Section - Volume */}
        <div className="footer-right">
          <button
            className="volume-btn"
            onClick={() => {
              const newMuted = !isMuted;
              setIsMuted(newMuted);
              if (newMuted === false && volume === 0) setVolume(0.7);
            }}
          >
            {isMuted || volume === 0 ? <IoVolumeMute size={18} /> : <IoVolumeHigh size={18} />}
          </button>
          <div
            className="volume-control"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const pct = Math.max(0, Math.min(1, x / rect.width));
              setVolume(pct);
              setIsMuted(pct === 0);
            }}
          >
            <div className="volume-bar" style={{ width: `${volume * 100}%` }} />
          </div>
        </div>
      </div>

      <audio ref={audioRef} />
    </footer>
  );
}