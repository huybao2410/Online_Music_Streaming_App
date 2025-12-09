const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// ===============================
// 🔍 SEARCH ALL (songs + artists + albums)
// ===============================
// Search (songs + artists + albums) — returns artists linked to matched songs too
router.get("/", async (req, res) => {
  const q = (req.query.query || "").trim();
  const page = parseInt(req.query.page || "1", 10);
  const pageSize = parseInt(req.query.pageSize || "50", 10);

  if (!q) {
    return res.json({
      success: true,
      songs: [],
      artists: [],
      albums: [],
      total: 0,
      page,
      pageSize,
    });
  }

  const like = `%${q}%`;
  const offset = (page - 1) * pageSize;

  try {
    // 1) Songs: match title OR genre name OR artist name (via JOIN)
    const [songs] = await pool.query(
      `
      SELECT 
        s.song_id AS id,
        s.title,
        s.audio_url,
        s.cover_url,
        s.duration,
        s.play_count,
        g.name AS genre_name,
        GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') AS artist_name
      FROM songs s
      LEFT JOIN genres g ON g.genre_id = s.genre_id
      LEFT JOIN song_artists sa ON sa.song_id = s.song_id
      LEFT JOIN artists a ON a.artist_id = sa.artist_id
      WHERE s.title LIKE ? OR g.name LIKE ? OR a.name LIKE ?
      GROUP BY s.song_id
      ORDER BY s.play_count DESC, s.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [like, like, like, pageSize, offset]
    );

    // 2) Artists:
    // - artist name matches
    // - OR artist appears on a song whose title/genre matched
    // - OR artist is the album's artist and album name matched (cover cases)
    const [artists] = await pool.query(
      `
      SELECT DISTINCT
        a.artist_id AS id,
        a.name,
        a.avatar_url,
        a.bio
      FROM artists a
      LEFT JOIN song_artists sa ON sa.artist_id = a.artist_id
      LEFT JOIN songs s ON s.song_id = sa.song_id
      LEFT JOIN genres g ON g.genre_id = s.genre_id
      LEFT JOIN album_songs als ON als.song_id = s.song_id
      LEFT JOIN albums al ON al.album_id = als.album_id
      WHERE
        a.name LIKE ?
        OR s.title LIKE ?
        OR g.name LIKE ?
        OR al.name LIKE ?
      LIMIT 50
      `,
      [like, like, like, like]
    );

    // 3) Albums:
    // - album name matches
    // - OR contains a matched song
    // - OR album artist name matches
    const [albums] = await pool.query(
      `
      SELECT DISTINCT
        al.album_id AS id,
        al.name,
        al.cover_url,
        ar.name AS artist_name
      FROM albums al
      LEFT JOIN artists ar ON ar.artist_id = al.artist_id
      LEFT JOIN album_songs als ON als.album_id = al.album_id
      LEFT JOIN songs s ON s.song_id = als.song_id
      LEFT JOIN song_artists sa ON sa.song_id = s.song_id
      LEFT JOIN artists a2 ON a2.artist_id = sa.artist_id
      LEFT JOIN genres g ON g.genre_id = s.genre_id
      WHERE
        al.name LIKE ?
        OR s.title LIKE ?
        OR ar.name LIKE ?
        OR a2.name LIKE ?
        OR g.name LIKE ?
      GROUP BY al.album_id
      LIMIT 50
      `,
      [like, like, like, like, like]
    );

    const total = (songs?.length || 0) + (artists?.length || 0) + (albums?.length || 0);

    return res.json({
      success: true,
      songs,
      artists,
      albums,
      total,
      page,
      pageSize,
    });
  } catch (err) {
    console.error("SEARCH ERROR:", err);
    return res.status(500).json({ success: false, message: "Server search error" });
  }
});

// ===============================
// 🔍 SEARCH SUGGESTIONS
// ===============================
router.get("/suggestions", async (req, res) => {
  try {
    const query = req.query.query?.trim() || "";
    const limit = parseInt(req.query.limit) || 5;

    if (!query)
      return res.json({ success: true, songs: [], artists: [], albums: [] });

    const like = `%${query}%`;

    const [songs] = await pool.query(
      `SELECT song_id AS id, title, cover_url FROM songs WHERE title LIKE ? LIMIT ?`,
      [like, limit]
    );

    const [artists] = await pool.query(
      `SELECT artist_id AS id, name, avatar_url FROM artists WHERE name LIKE ? LIMIT ?`,
      [like, limit]
    );

    const [albums] = await pool.query(
      `SELECT album_id AS id, name, cover_url FROM albums WHERE name LIKE ? LIMIT ?`,
      [like, limit]
    );

    res.json({ success: true, songs, artists, albums });

  } catch (err) {
    console.error("SUGGESTIONS ERROR:", err);
    return res.status(500).json({ success: false });
  }
});

module.exports = router;