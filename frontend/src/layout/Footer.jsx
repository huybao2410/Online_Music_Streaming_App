import { useContext, useEffect, useState, useCallback } from "react";
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
  /* ================= CONTEXT ================= */
  const {
    currentSong,
    playlist,
    isPlaying,
    playSong,
    pauseSong,
    playNext,
    playPrev,
    audioRef,
  } = useContext(PlayerContext);

  /* ================= LOCAL UI STATE ================= */
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

  const [isPremium, setIsPremium] = useState(false);

  const userId = localStorage.getItem("user_id");

  /* ================= PREMIUM CHECK ================= */
  useEffect(() => {
    if (!userId) return setIsPremium(false);

    const fetchPremium = async () => {
      try {
        // Sử dụng endpoint Node.js RESTful
        const res = await axios.get(
          `http://localhost:5000/api/users/${userId}/check-premium`
        );
        setIsPremium(res.data.is_premium === true);
      } catch {
        setIsPremium(false);
      }
    };

    fetchPremium();
    const i = setInterval(fetchPremium, 60000);
    return () => clearInterval(i);
  }, [userId]);

  /* ================= AUDIO EVENTS ================= */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = isLoop;
    audio.volume = isMuted ? 0 : volume;

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
      setPlayCount((prev) => {
        const next = prev + 1;

        if (!isPremium && next % 2 === 0 && !adTriggered) {
          pauseSong();
          setShowAd(true);
          setAdTriggered(true);
          return next;
        }

        return next;
      });

      if (!isLoop) {
        isShuffle
          ? playSong(
              playlist[Math.floor(Math.random() * playlist.length)]
            )
          : playNext();
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
  }, [
    audioRef,
    volume,
    isMuted,
    isLoop,
    isShuffle,
    playlist,
    isPremium,
    adTriggered,
    playNext,
    playSong,
    pauseSong,
  ]);

  /* ================= LIKE ================= */
  useEffect(() => {
    const checkFavorite = async () => {
      if (!currentSong?.id) return setIsLiked(false);
      const token = localStorage.getItem("token");
      if (!token) return setIsLiked(false);

      try {
        const res = await axios.get(
          `http://localhost:5000/api/favorite-songs/check/${currentSong.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsLiked(res.data.is_favorite);
      } catch {
        setIsLiked(false);
      }
    };

    checkFavorite();
  }, [currentSong]);

  const toggleLike = async () => {
    if (!currentSong?.id) return;
    const token = localStorage.getItem("token");
    if (!token) return alert("Vui lòng đăng nhập!");

    const url = `http://localhost:5000/api/favorite-songs`;

    if (isLiked) {
      await axios.delete(`${url}/remove/${currentSong.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsLiked(false);
    } else {
      await axios.post(
        `${url}/add`,
        { song_id: currentSong.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsLiked(true);
    }
  };

  /* ================= UI HELPERS ================= */
  const togglePlay = () => {
    isPlaying ? pauseSong() : playSong(currentSong);
  };

  const seek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width)
    );
    audio.currentTime = pct * duration;
  };

  const formatTime = (t) => {
    if (!t || isNaN(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };


  // Nếu là admin thì không render player/footer
  const role = localStorage.getItem("role");
  if (role === "admin") {
    return null;
  }

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
      </footer>
    );
  }

  return (
    <>
      {showAd && <AdOverlay onClose={() => setShowAd(false)} />}

      <AddToPlaylistModal
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
        songId={currentSong.id}
      />

      <footer
        className="footer"
        style={{
          backgroundImage: currentSong.cover
            ? `url(${currentSong.cover})`
            : "none",
        }}
      >
        <div className="footer-overlay" />
        <div className="footer-wrapper">
          {/* LEFT */}
          <div className="footer-left">
            <img
              src={currentSong.cover}
              alt={currentSong.title}
              className="track-image"
            />
            <div className="track-details">
              <div className="track-name">{currentSong.title}</div>
              <div className="track-artist">{currentSong.artist}</div>
            </div>
          </div>

          {/* CENTER */}
          <div className="footer-center">
            <div className="control-buttons">
              <button
                className={`control-btn shuffle ${
                  isShuffle ? "active" : ""
                }`}
                onClick={() => setIsShuffle(!isShuffle)}
              >
                <FaRandom />
              </button>

              <button onClick={playPrev}>
                <FaStepBackward />
              </button>

              <button
                className="main-play-btn"
                onClick={togglePlay}
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>

              <button onClick={playNext}>
                <FaStepForward />
              </button>

              <button
                className={`control-btn replay ${
                  isLoop ? "active" : ""
                }`}
                onClick={() => setIsLoop(!isLoop)}
              >
                <FaRedo />
              </button>
            </div>

            <div className="progress-section">
              <span>{formatTime(currentTime)}</span>
              <div className="progress-bar" onClick={seek}>
                <div
                  className="progress"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* RIGHT */}
          <div className="footer-right">
            <button
              className={`action-btn like-btn ${
                isLiked ? "liked" : ""
              }`}
              onClick={toggleLike}
            >
              {isLiked ? <AiFillHeart /> : <AiOutlineHeart />}
            </button>

            <button onClick={() => setShowPlaylistModal(true)}>
              <AiOutlinePlus />
            </button>

            <button
              onClick={() => {
                setIsMuted(!isMuted);
                if (volume === 0) setVolume(0.7);
              }}
            >
              {isMuted ? <IoVolumeMute /> : <IoVolumeHigh />}
            </button>

            <div
              className="volume-control"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct =
                  (e.clientX - rect.left) / rect.width;
                setVolume(Math.max(0, Math.min(1, pct)));
                setIsMuted(pct === 0);
              }}
            >
              <div
                className="volume-bar"
                style={{ width: `${volume * 100}%` }}
              />
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
