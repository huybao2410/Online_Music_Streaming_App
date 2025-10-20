import React from "react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="player-controls">
        <span>Chọn bài hát để phát 🎶</span>
        <div className="controls">
          <button>⏮</button>
          <button>⏯</button>
          <button>⏭</button>
          <button>🔀</button>
          <button>🔊</button>
        </div>
      </div>
    </footer>
  );
}
