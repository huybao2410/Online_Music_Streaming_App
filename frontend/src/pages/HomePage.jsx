import React from "react";
import "../layout/Layout.css";

const HomePage = () => {
  return (
    <>
      {/* Category Filters */}
      <div className="category-filters">
        <button className="filter-btn active">All</button>
        <button className="filter-btn">Music</button>
        <button className="filter-btn">Podcasts</button>
      </div>

      {/* Featured Section */}
      <div className="featured-section">
        <div className="featured-grid">
          <div className="featured-item">
            <img src="https://placehold.co/400x200" alt="MONSTAR" />
            <div className="item-info">
              <h3>MONSTAR</h3>
            </div>
          </div>
          <div className="featured-item">
            <img src="https://placehold.co/400x200" alt="New Music" />
            <div className="item-info">
              <h3>Từng Ngày Như Mới Mãi</h3>
            </div>
          </div>
          <div className="featured-item">
            <img src="https://placehold.co/400x200" alt="Friday Vietnam" />
            <div className="item-info">
              <h3>Thiên Hạ Nghe Gì</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Made For You Section */}
      <section className="made-for-section">
        <div className="section-header">
          <h2>Dành cho bạn</h2>
          <button className="show-all">Xem tất cả</button>
        </div>
        <div className="playlist-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="playlist-item">
              <div className="playlist-cover">
                <img src="https://placehold.co/300x300" alt={`Daily Mix ${i}`} />
                <div className="play-hover">
                  <button className="play-btn">▶</button>
                </div>
              </div>
              <div className="playlist-info">
                <h3>Daily Mix {i}</h3>
                <p>Những bài hát phổ biến nhất</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended Section */}
      <section className="recommended-section">
        <div className="section-header">
          <h2>Gợi ý hôm nay</h2>
          <button className="show-all">Xem tất cả</button>
        </div>
        <div className="playlist-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="playlist-item">
              <div className="playlist-cover">
                <img src="https://placehold.co/300x300" alt={`Top Hits ${i}`} />
                <div className="play-hover">
                  <button className="play-btn">▶</button>
                </div>
              </div>
              <div className="playlist-info">
                <h3>Top Hits {i}</h3>
                <p>Những bài hát hot nhất hiện nay</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default HomePage;
