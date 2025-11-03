import React from "react";
import "./Footer.css";
import { BsFillPlayFill, BsPauseFill, BsShuffle, BsRepeat } from "react-icons/bs";
import { BiSkipPrevious, BiSkipNext } from "react-icons/bi";
import { HiOutlineQueueList } from "react-icons/hi2";
import { MdDevices } from "react-icons/md";
import { IoVolumeMediumOutline, IoVolumeMuteOutline } from "react-icons/io5";

export default function Footer() {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  
  return (
    <footer className="footer">
      {/* Now Playing */}
      <div className="now-playing">
        <img src="https://via.placeholder.com/56" alt="Album cover" />
        <div className="track-info">
          <span className="title">Tên bài hát</span>
          <span className="artist">Nghệ sĩ</span>
        </div>
      </div>

      {/* Player Controls */}
      <div className="player-controls">
        <div className="control-buttons">
          <button className="control-button">
            <BsShuffle size={20} />
          </button>
          <button className="control-button">
            <BiSkipPrevious size={24} />
          </button>
          <button 
            className="control-button play"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <BsPauseFill size={24} /> : <BsFillPlayFill size={24} />}
          </button>
          <button className="control-button">
            <BiSkipNext size={24} />
          </button>
          <button className="control-button">
            <BsRepeat size={20} />
          </button>
        </div>

        <div className="progress-bar">
          <span className="time">0:00</span>
          <div className="progress-slider">
            <div className="progress-value" style={{ width: "0%" }} />
          </div>
          <span className="time">3:45</span>
        </div>
      </div>

      {/* Extra Controls */}
      <div className="extra-controls">
        <button className="control-button">
          <HiOutlineQueueList size={20} />
        </button>
        <button className="control-button">
          <MdDevices size={20} />
        </button>
        <div className="volume-control">
          <button 
            className="control-button"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? 
              <IoVolumeMuteOutline size={20} /> : 
              <IoVolumeMediumOutline size={20} />
            }
          </button>
          <div className="volume-slider">
            <div className="volume-value" />
          </div>
        </div>
      </div>
    </footer>
  );
}
