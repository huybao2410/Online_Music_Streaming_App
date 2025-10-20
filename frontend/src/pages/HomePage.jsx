import React from "react";
import "../layout/Layout.css"; // nếu cần style

export default function HomePage() {
  const playlists = [
    { name: "Gen Z Hits", img: "https://placehold.co/200x200" },
    { name: "TikTok Virals", img: "https://placehold.co/200x200" },
    { name: "K-Pop", img: "https://placehold.co/200x200" },
  ];

  return (
    <div>
      <h1 className="greeting">Good evening</h1>

      <div className="banner-section">
        <div className="banner-card">
          <img src="https://placehold.co/600x200" alt="Chill vibes" />
          <div className="banner-title">Cười Tươi Nhạc Chill</div>
        </div>
        <div className="banner-card">
          <img src="https://placehold.co/600x200" alt="Buồn ngủ" />
          <div className="banner-title">Ngủ ngon cùng nhạc buồn</div>
        </div>
      </div>

      <h2 className="section-title">Charts</h2>
      <div className="playlist-grid">
        {playlists.map((p, i) => (
          <div key={i} className="playlist-card">
            <img src={p.img} alt={p.name} />
            <p>{p.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
