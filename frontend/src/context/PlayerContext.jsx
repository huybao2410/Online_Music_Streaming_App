import { createContext, useState, useRef, useEffect } from "react";

export const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const [playlist, setPlaylist] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const audioRef = useRef(new Audio());

  useEffect(() => {
    if (currentSong) {
      audioRef.current.src = currentSong.url; // URL bài hát
      audioRef.current.play().catch(err => {
        console.error("Không phát được nhạc:", err);
      });
    }
  }, [currentSong]);

  return (
    <PlayerContext.Provider value={{ playlist, setPlaylist, currentSong, setCurrentSong }}>
      {children}
    </PlayerContext.Provider>
  );
};
