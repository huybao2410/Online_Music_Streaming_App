import { createContext, useState } from "react";

export const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const [currentSong, setCurrentSong] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [playCount, setPlayCount] = useState(0);

  const playSong = (song) => {
    setCurrentSong(song);
    setPlayCount((prev) => prev + 1);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        playlist,
        setPlaylist,
        setCurrentSong: playSong,
        playCount,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};
