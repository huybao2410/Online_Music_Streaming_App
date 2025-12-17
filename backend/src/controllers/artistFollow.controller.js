const db = require("../config/db");

/* ================= CHECK FOLLOW ================= */
exports.checkFollow = async (req, res) => {
  try {
    const userId = req.user.id;
    const { artistId } = req.params;

    const [rows] = await db.query(
      `SELECT 1 FROM user_artists_follow 
       WHERE user_id = ? AND artist_id = ?`,
      [userId, artistId]
    );

    res.json({ followed: rows.length > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= TOGGLE FOLLOW ================= */
exports.toggleFollow = async (req, res) => {
  try {
    const userId = req.user.id;
    const { artistId } = req.params;

    const [rows] = await db.query(
      `SELECT 1 FROM user_artists_follow 
       WHERE user_id = ? AND artist_id = ?`,
      [userId, artistId]
    );

    if (rows.length > 0) {
      await db.query(
        `DELETE FROM user_artists_follow 
         WHERE user_id = ? AND artist_id = ?`,
        [userId, artistId]
      );
      return res.json({ followed: false });
    }

    await db.query(
      `INSERT INTO user_artists_follow (user_id, artist_id)
       VALUES (?, ?)`,
      [userId, artistId]
    );

    res.json({ followed: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
