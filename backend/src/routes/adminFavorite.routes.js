const express = require("express");
const router = express.Router();

const authAdmin = require("../middlewares/authAdmin");
const {
  getAdminFavorites,
  getAdminFavoriteSummary,
} = require("../controllers/adminFavorite.controller");

router.get("/", authAdmin, getAdminFavorites);
router.get("/summary", authAdmin, getAdminFavoriteSummary);

module.exports = router;
