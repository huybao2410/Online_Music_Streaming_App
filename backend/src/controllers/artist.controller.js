const db = require("../config/db");

exports.getSongsByArtist = async (req, res) => {
  try {
    const artistId = req.params.id;
    console.log("artistId:", artistId);

    const [rows] = await db.query(
      `
      SELECT 
        s.song_id AS id,
        s.title,
        GROUP_CONCAT(a.name SEPARATOR ', ') AS artist, 
        g.name AS genre,
        s.duration,
        s.cover_url AS cover,
        s.audio_url
      FROM songs s
      JOIN song_artists sa ON sa.song_id = s.song_id
      JOIN artists a ON a.artist_id = sa.artist_id 
      JOIN genres g ON g.genre_id = s.genre_id
      WHERE sa.artist_id = ?
      GROUP BY s.song_id
      ORDER BY s.created_at DESC
      `,
      [artistId]
    );

    res.json(rows);
  } catch (err) {
    console.error("🔥 getSongsByArtist SQL ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
