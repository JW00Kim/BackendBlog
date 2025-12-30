const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB 연결 캐싱 (Vercel Serverless에서 재사용)
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    if (!process.env.MONGODB_URI) {
      console.error(
        "❌ MONGODB_URI가 설정되지 않았습니다. backend/.env 또는 Vercel 환경 변수에 값을 넣어주세요."
      );
      return;
    }

    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 10000,
      });
      isConnected = true;
      console.log("✅ MongoDB 연결 성공");
    }
  } catch (error) {
    console.error("❌ MongoDB 연결 실패:", error.message);
  }
};

// CORS - 모든 도메인 허용
app.use(cors());
app.use(express.json());

// 정적 파일 제공 (업로드된 이미지)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB 연결 (앱 시작 시 한 번)
connectDB();

// Routes
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/posts");
const commentRoutes = require("./routes/comments");

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api", commentRoutes);

// API Routes

// 서버 상태 체크
app.get("/api", (req, res) => {
  res.json({
    message: "백엔드 서버가 정상 작동중입니다! 🚀",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/api",
      signup: "POST /api/auth/signup",
      login: "POST /api/auth/login",
      me: "GET /api/auth/me",
    },
  });
});

// 404 에러 핸들링
app.use((req, res) => {
  res
    .status(404)
    .json({ success: false, error: "요청한 엔드포인트를 찾을 수 없습니다" });
});

// 에러 핸들링 (multer 포함)
app.use((err, req, res, next) => {
  if (!err) return next();

  // Multer 에러 (파일 용량 초과 등)
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "이미지 파일은 10MB 이하만 업로드 가능합니다.",
      });
    }

    return res.status(400).json({
      success: false,
      message: `업로드 오류: ${err.code}`,
    });
  }

  // 파일 필터 에러 (이미지 확장자 제한)
  if (typeof err.message === "string" && err.message.includes("이미지 파일만")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  console.error("❌ 서버 에러:", err);

  return res.status(500).json({
    success: false,
    message: "서버 오류가 발생했습니다",
    ...(process.env.NODE_ENV !== "production" ? { error: err.message } : {}),
  });
});

// 로컬 개발 서버 실행 (Vercel에서는 실행 안됨)
if (process.env.NODE_ENV !== "production" && require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행중입니다`);
  });
}

// Vercel을 위한 export
module.exports = app;
