const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/upload.middleware");

const {
  createSong,
  getAllSongs,
  deleteSong,
  updateSong
} = require("../controllers/songs.controller");

// GET /api/songs
router.get("/", getAllSongs);

// POST /api/songs
router.post(
  "/",
  auth,
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "audio", maxCount: 1 }
  ]),
  createSong
);

// PUT /api/songs/:id  ✅
router.put(
  "/:id",
  auth,
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "audio", maxCount: 1 }
  ]),
  updateSong
);

// DELETE /api/songs/:id
router.delete("/:id", auth, deleteSong);

module.exports = router;
