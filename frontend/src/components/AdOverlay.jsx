import React, { useEffect, useState } from "react";
import "./AdOverlay.css";

export default function AdOverlay({ onClose }) {
  const [timer, setTimer] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const [isPremium, setIsPremium] = useState(null); 
  // null = đang kiểm tra, true = premium, false = free

  // 🔍 Kiểm tra Premium bằng API PHP
  useEffect(() => {
    const checkPremium = async () => {
      try {
        const userId = localStorage.getItem("user_id");

        if (!userId) {
          setIsPremium(false);
          return;
        }

        const res = await fetch(
          `http://localhost:8081/music_API/check_subscription.php?user_id=${userId}`
        );

        const data = await res.json();

        if (data?.is_premium === true) {
          setIsPremium(true);
          onClose(); // tự tắt quảng cáo
        } else {
          setIsPremium(false);
        }
      } catch (err) {
        console.error("Lỗi kiểm tra Premium:", err);
        setIsPremium(false);
      }
    };

    checkPremium();
  }, [onClose]);

  // ⏳ Chạy countdown chỉ khi KHÔNG phải Premium
  useEffect(() => {
    if (isPremium !== false) return; // chỉ chạy timer khi free user

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
  }, [isPremium]);

  // Nếu đang kiểm tra Premium → không render gì
  if (isPremium === null) return null;

  // Nếu Premium → không render quảng cáo
  if (isPremium === true) return null;

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
          <p>
            Vui lòng chờ <strong>{timer}</strong> giây để bỏ qua...
          </p>
        ) : (
          <button className="skip-btn" onClick={onClose}>
            Bỏ qua quảng cáo
          </button>
        )}
      </div>
    </div>
  );
}