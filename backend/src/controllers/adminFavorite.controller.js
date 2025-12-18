const pool = require("../config/db");

// ================= LIST FAVORITES =================
exports.getAdminFavorites = async (req, res) => {
  try {
    const { type } = req.query;

    if (!["song", "album", "artist"].includes(type)) {
      return res.status(400).json({ message: "Invalid type" });
    }

    let listQuery = "";

    if (type === "song") {
      listQuery = `
        SELECT fs.song_id AS id, u.username, s.title AS item_name, fs.added_at AS created_at
        FROM favorites_songs fs
        JOIN users u ON fs.user_id = u.id
        JOIN songs s ON fs.song_id = s.song_id
        ORDER BY fs.added_at DESC
      `;
    }

    if (type === "album") {
      listQuery = `
        SELECT fa.album_id AS id, u.username, a.name AS item_name, fa.created_at
        FROM favorite_albums fa
        JOIN users u ON fa.user_id = u.id
        JOIN albums a ON fa.album_id = a.album_id
        ORDER BY fa.created_at DESC
      `;
    }

    if (type === "artist") {
      listQuery = `
        SELECT ufa.artist_id AS id, u.username, ar.name AS item_name, ufa.created_at
        FROM user_favorite_artists ufa
        JOIN users u ON ufa.user_id = u.id
        JOIN artists ar ON ufa.artist_id = ar.artist_id
        ORDER BY ufa.created_at DESC
      `;
    }

    const [list] = await pool.query(listQuery);
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= SUMMARY DASHBOARD =================
exports.getAdminFavoriteSummary = async (req, res) => {
  try {
    const [[songLikes]] = await pool.query(
      "SELECT COUNT(*) AS total FROM favorites_songs"
    );
    const [[albumLikes]] = await pool.query(
      "SELECT COUNT(*) AS total FROM favorite_albums"
    );
    const [[artistLikes]] = await pool.query(
      "SELECT COUNT(*) AS total FROM user_favorite_artists"
    );
    const [[songPlays]] = await pool.query(
      "SELECT SUM(play_count) AS total FROM songs"
    );

    const [topSongs] = await pool.query(`
      SELECT song_id AS id, title AS name, play_count
      FROM songs
      ORDER BY play_count DESC
      LIMIT 5
    `);

    const [topAlbums] = await pool.query(`
      SELECT a.album_id AS id, a.name, COUNT(*) AS likes
      FROM favorite_albums fa
      JOIN albums a ON fa.album_id = a.album_id
      GROUP BY fa.album_id
      ORDER BY likes DESC
      LIMIT 5
    `);

    const [topArtists] = await pool.query(`
      SELECT ar.artist_id AS id, ar.name, COUNT(*) AS likes
      FROM user_favorite_artists ufa
      JOIN artists ar ON ufa.artist_id = ar.artist_id
      GROUP BY ufa.artist_id
      ORDER BY likes DESC
      LIMIT 5
    `);

    res.json({
      total: {
        songPlays: songPlays.total || 0,
        songLikes: songLikes.total || 0,
        albumLikes: albumLikes.total || 0,
        artistLikes: artistLikes.total || 0,
      },
      topSongs,
      topAlbums,
      topArtists,
    });
  } catch (err) {
    console.error("Summary error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

