import React, { useEffect, useState } from "react";
import "./AdOverlay.css";

export default function AdOverlay({ onClose }) {
  const [timer, setTimer] = useState(5);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    setTimer(5);
    setCanSkip(false);

    const countdown = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(countdown);
          setCanSkip(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, []);

  return (
    <div className="ad-overlay">
      <video
        src="/ads/ad1.mp4"
        autoPlay
        muted={false}
        className="ad-video"
        playsInline
      />
      <div className="ad-content">
        <h2>🎬 Quảng cáo</h2>
        {!canSkip ? (
          <p>Vui lòng chờ <strong>{timer}</strong> giây để bỏ qua...</p>
        ) : (
          <button className="skip-btn" onClick={onClose}>
            Bỏ qua quảng cáo
          </button>
        )}
      </div>
    </div>
  );
}