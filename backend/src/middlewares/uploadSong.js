// middlewares/uploadSong.js
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "cover") cb(null, "uploads/covers");
    else cb(null, "uploads/audio");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

module.exports = multer({ storage }).fields([
  { name: "cover", maxCount: 1 },
  { name: "audio", maxCount: 1 }
]);