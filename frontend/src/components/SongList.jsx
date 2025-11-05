import { useContext, useEffect, useState } from "react";
import { getSongs } from "../services/songService";
import { PlayerContext } from "../context/PlayerContext";

function SongList() {
  const [songs, setSongs] = useState([]);
  const { setPlaylist, setCurrentSong } = useContext(PlayerContext);

  useEffect(() => {
    getSongs().then((data) => {
      setSongs(data);
      setPlaylist(data); // ✅ gán danh sách vào playlist luôn
    });
  }, [setPlaylist]);

  return (
    <div>
      <h2>Danh sách bài hát</h2>
      <ul>
        {songs.map((song) => (
          <li
            key={song.url}
            onClick={() => setCurrentSong(song)}
            style={{ display: "flex", alignItems: "center", cursor: "pointer", marginBottom: "10px" }}
          >
            {song.cover ? (
              <img
                src={song.cover}
                alt={song.title}
                style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 5, marginRight: 10 }}
              />
            ) : (
              <div style={{ width: 50, height: 50, marginRight: 10, background: "#ccc", borderRadius: 5 }} />
            )}
            <div>
              <strong>{song.title}</strong> - {song.artist}
            </div>
          </li>
        ))}
      </ul>

    </div>
  );
}

export default SongList;
