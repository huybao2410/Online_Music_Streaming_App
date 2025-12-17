const express = require("express");
const router = express.Router();
const artistController = require("../controllers/artist.controller");

router.get("/:id", artistController.getArtistById);
router.get("/:id/songs", artistController.getSongsByArtist); 

module.exports = router;
