import { useContext, useEffect, useRef } from "react";
import { PlayerContext } from "../context/PlayerContext";

export default function MusicPlayer() {
  const { currentSong } = useContext(PlayerContext);
  const audioRef = useRef();

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    // Dừng bài cũ trước
    audio.pause();

    if (currentSong) {
      audio.load(); // reset nguồn
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("⚠️ Trình duyệt chặn tự động phát nhạc:", err.message);
        });
      }
    }
  }, [currentSong]);

  if (!currentSong) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#222",
        color: "#fff",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 999,
      }}
    >
      <div>
        <strong>{currentSong.title}</strong> - {currentSong.artist}
      </div>
      <audio ref={audioRef} controls src={currentSong.url} />
    </div>
  );
}
