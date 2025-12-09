const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.post("/set-top-songs", async (req, res) => {
  const topSongs = req.body.top_songs || [];

  try {
    // reset tất cả
    await pool.query("UPDATE songs SET is_top = 0");

    if (topSongs.length > 0) {
      const ids = topSongs.map(Number);
      await pool.query(
        `UPDATE songs SET is_top = 1 WHERE song_id IN (${ids.join(",")})`
      );
    }

    res.json({ status: true, msg: "Đã cập nhật Top Songs" });
  } catch (err) {
    console.error(err);
    res.json({ status: false, msg: "Lỗi server" });
  }
});

module.exports = router;
        