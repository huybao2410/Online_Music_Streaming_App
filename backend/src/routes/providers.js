const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT provider_id, name FROM music_providers ORDER BY name"
    );

    res.json({
      success: true,
      providers: rows
    });
  } catch (err) {
    console.error("Fetch providers error:", err);
    res.status(500).json({
      success: false,
      message: "Không thể tải nhà cung cấp"
    });
  }
});

module.exports = router;
