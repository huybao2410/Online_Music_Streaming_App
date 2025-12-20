import { createContext, useEffect, useRef, useState } from "react";

export const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {

  const audioRef = useRef(null);

  // ===== STATE =====
  const [currentSong, _setCurrentSong] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [showAd, setShowAd] = useState(false);
  const [adSongSwitchCount, setAdSongSwitchCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  // Check premium status (Node.js endpoint preferred)
  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return setIsPremium(false);
    const fetchPremium = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/users/${userId}/check-premium`);
        const data = await res.json();
        setIsPremium(data.is_premium === true);
      } catch {
        setIsPremium(false);
      }
    };
    fetchPremium();
  }, []);


  // ===== LOAD FROM LOCALSTORAGE =====
  useEffect(() => {
    try {
      const savedSong = JSON.parse(localStorage.getItem("currentSong"));
      const savedPlaylist = JSON.parse(localStorage.getItem("playlist"));
      const savedIsPlaying = JSON.parse(localStorage.getItem("isPlaying"));

      if (savedSong) _setCurrentSong(savedSong);
      if (Array.isArray(savedPlaylist)) setPlaylist(savedPlaylist);
      setIsPlaying(savedIsPlaying ?? false);
    } catch (e) {
      console.error("PlayerContext restore error:", e);
    }
  }, []);

  // ===== SAVE TO LOCALSTORAGE =====
  useEffect(() => {
    localStorage.setItem("currentSong", JSON.stringify(currentSong));
    localStorage.setItem("playlist", JSON.stringify(playlist));
    localStorage.setItem("isPlaying", JSON.stringify(isPlaying));
  }, [currentSong, playlist, isPlaying]);

  // ===== AUDIO CONTROL =====
  // Luôn phát nhạc khi currentSong thay đổi và isPlaying=true
  useEffect(() => {
    if (!audioRef.current) return;

    if (currentSong && isPlaying) {
      if (audioRef.current.src !== (currentSong.url || "")) {
        audioRef.current.src = currentSong.url || "";
      }
      audioRef.current
        .play()
        .catch(() => {}); // tránh lỗi autoplay browser
    } else if (!isPlaying) {
      audioRef.current.pause();
    }
  }, [currentSong, isPlaying]);

  // ===== ACTIONS =====
  // ... playSong, pauseSong, playNext, playPrev ...

  // Tự động dừng nhạc khi chuyển sang admin (phải đặt sau khi khai báo state và actions)
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role === "admin" && isPlaying) {
      setIsPlaying(false);
    }
  }, [isPlaying]);

  // ===== ACTIONS =====

  // ▶ Play / Resume
  const playSong = (song, fromFooter = false) => {
    if (!song) return;

    // resume cùng bài
    if (currentSong?.id === song.id) {
      setIsPlaying(true);
      return;
    }

    // Nếu gọi từ next/prev thì không tăng adSongSwitchCount ở đây
    if (!fromFooter) {
      setAdSongSwitchCount((prev) => {
        const next = prev + 1;
        if (!isPremium && next >= 2) {
          setShowAd(true);
          return 0;
        }
        return next;
      });
    }

    _setCurrentSong(song);
    setIsPlaying(true);
    setPlayCount((prev) => prev + 1);
  };

  // Đếm số lần chuyển bài ở Footer (next/prev)
  const handleFooterSongSwitch = () => {
    setAdSongSwitchCount((prev) => {
      const next = prev + 1;
      if (!isPremium && next >= 2) {
        setShowAd(true);
        return 0;
      }
      return next;
    });
  };

  // ⏭ Next
  const playNext = () => {
    if (!playlist.length || !currentSong) return;
    const index = playlist.findIndex((s) => s.id === currentSong.id);
    if (index !== -1 && index < playlist.length - 1) {
      handleFooterSongSwitch();
      playSong(playlist[index + 1], true);
    }
  };

  // ⏮ Prev
  const playPrev = () => {
    if (!playlist.length || !currentSong) return;
    const index = playlist.findIndex((s) => s.id === currentSong.id);
    if (index > 0) {
      handleFooterSongSwitch();
      playSong(playlist[index - 1], true);
    }
  };

  // ⏸ Pause
  const pauseSong = () => {
    setIsPlaying(false);
  };

  return (
    <PlayerContext.Provider
      value={{
        // state
        currentSong,
        playlist,
        isPlaying,
        playCount,
        showAd,
        setShowAd,
        isPremium,

        // setters
        setPlaylist,

        // actions (API mới)
        playSong,
        pauseSong,
        playNext,
        playPrev,

        // ⚠️ API CŨ – để không lỗi code
        setCurrentSong: playSong,

        // audio ref
        audioRef,
      }}
    >
      {children}

      {/* AUDIO DUY NHẤT */}
      <audio
        ref={audioRef}
        src={currentSong?.url ? currentSong.url : null}
        preload="metadata"
        onEnded={playNext}
      />
    </PlayerContext.Provider>
  );
};
