const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// GET all providers
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT provider_id, name, contact_email, contact_phone, address, status FROM music_providers ORDER BY name"
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

// CREATE provider
router.post("/", async (req, res) => {
  try {
    const { name, contact_email, contact_phone, address } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Tên nhà cung cấp là bắt buộc" });
    const [result] = await pool.query(
      "INSERT INTO music_providers (name, contact_email, contact_phone, address, status) VALUES (?, ?, ?, ?, 1)",
      [name, contact_email, contact_phone, address]
    );
    res.json({ success: true, provider_id: result.insertId });
  } catch (err) {
    console.error("Create provider error:", err);
    res.status(500).json({ success: false, message: "Không thể thêm nhà cung cấp" });
  }
});

// UPDATE provider
router.put("/:id", async (req, res) => {
  try {
    const { name, contact_email, contact_phone, address, status } = req.body;
    const { id } = req.params;
    if (!name) return res.status(400).json({ success: false, message: "Tên nhà cung cấp là bắt buộc" });
    const [result] = await pool.query(
      "UPDATE music_providers SET name=?, contact_email=?, contact_phone=?, address=?, status=? WHERE provider_id=?",
      [name, contact_email, contact_phone, address, status ? 1 : 0, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Update provider error:", err);
    res.status(500).json({ success: false, message: "Không thể cập nhật nhà cung cấp" });
  }
});

// DELETE provider
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM music_providers WHERE provider_id=?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete provider error:", err);
    res.status(500).json({ success: false, message: "Không thể xóa nhà cung cấp" });
  }
});

module.exports = router;