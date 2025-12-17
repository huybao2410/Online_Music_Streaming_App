const express = require("express");
const router = express.Router();

const artistFollowController = require("../controllers/artistFollow.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.get(
  "/:artistId/follow",
  authMiddleware,
  artistFollowController.checkFollow
);

router.post(
  "/:artistId/follow",
  authMiddleware,
  artistFollowController.toggleFollow
);

module.exports = router;
