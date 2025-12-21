import multer from "multer";
import path from "path";
import fs from "fs";

const BASE_UPLOAD_DIR = "C:/xampp/htdocs/music_API/online_music";

const ensureDir = dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "others";

    if (file.fieldname === "audio") folder = "audio";
    if (file.fieldname === "cover") folder = "cover";

    const uploadPath = path.join(BASE_UPLOAD_DIR, folder);
    ensureDir(uploadPath);

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  }
});

export const upload = multer({ storage });