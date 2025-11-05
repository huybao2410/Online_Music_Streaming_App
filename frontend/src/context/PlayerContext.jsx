import React, { createContext, useState } from "react";

export const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const [playlist, setPlaylist] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);

  return (
    <PlayerContext.Provider
      value={{
        playlist,
        setPlaylist,
        currentSong,
        setCurrentSong,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};
