import React, { useEffect, useState } from "react";
import { getAllArtists } from "../services/artistService";

export default function Artists() {
  const [artists, setArtists] = useState([]);

  useEffect(() => {
    const fetchArtists = async () => {
      const data = await getAllArtists();
      setArtists(data);
    };
    fetchArtists();
  }, []);

  return (
    <div className="artists-page p-4">
      <h2 className="text-xl font-bold mb-4">Danh sách nghệ sĩ</h2>
      <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {artists.map((artist, index) => (
          <li key={index} className="artist-card bg-neutral-800 p-3 rounded-2xl cursor-pointer hover:bg-neutral-700 transition">
            <div className="artist-avatar w-full aspect-square bg-neutral-600 rounded-full flex items-center justify-center mb-2 text-lg font-bold">
              {artist[0]}
            </div>
            <div className="artist-name text-center font-medium">{artist}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
