// ============================================================
// 📷 이미지 업로드 미들웨어 (Multer)
// ============================================================
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// uploads 디렉토리 생성 (없으면)
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ============================================================
// 저장 설정
// ============================================================
const storage = multer.diskStorage({
  // 파일 저장 위치
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  
  // 파일명 설정 (중복 방지)
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

// ============================================================
// 파일 필터 (이미지만 허용)
// ============================================================
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true); // 허용
  } else {
    cb(
      new Error("이미지 파일만 업로드 가능합니다 (jpg, png, gif, webp)"),
      false
    );
  }
};

// ============================================================
// Multer 설정
// ============================================================
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 제한
  },
});

module.exports = upload;
