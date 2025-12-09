// frontend/src/components/SearchSuggestions.jsx
import React from "react";
import "./SearchSuggestions.css";

export default function SearchSuggestions({ suggestions, onSelect }) {
  if (!suggestions) return null;
  const { songs = [], artists = [], albums = [] } = suggestions;

  const fixURL = (url) =>
    url && url.trim() !== "" ? url.replace("10.0.2.2", "localhost") : "https://placehold.co/50x50?text=No+Img";

  return (
    <div className="vivora-suggestions-box">
      {songs.map((s) => (
        <div key={"song-" + s.id} className="vivora-suggestion-item" onClick={() => onSelect("song", s)}>
          <img src={fixURL(s.cover_url)} className="vivora-suggestion-img" alt="song" />
          <div className="vivora-suggestion-info">
            <span className="vivora-suggestion-title">{s.title}</span>
            <span className="vivora-suggestion-type">Bài hát</span>
          </div>
        </div>
      ))}

      {artists.map((a) => (
        <div key={"artist-" + a.id} className="vivora-suggestion-item" onClick={() => onSelect("artist", a)}>
          <img src={fixURL(a.avatar_url)} className="vivora-suggestion-img vivora-round" alt="artist" />
          <div className="vivora-suggestion-info">
            <span className="vivora-suggestion-title">{a.name}</span>
            <span className="vivora-suggestion-type">Nghệ sĩ</span>
          </div>
        </div>
      ))}

      {albums.map((al) => (
        <div key={"album-" + al.id} className="vivora-suggestion-item" onClick={() => onSelect("album", al)}>
          <img src={fixURL(al.cover_url)} className="vivora-suggestion-img" alt="album" />
          <div className="vivora-suggestion-info">
            <span className="vivora-suggestion-title">{al.name}</span>
            <span className="vivora-suggestion-type">Album</span>
          </div>
        </div>
      ))}

      {songs.length === 0 && artists.length === 0 && albums.length === 0 && (
        <div className="vivora-suggestion-empty">Không có gợi ý phù hợp</div>
      )}
    </div>
  );
}