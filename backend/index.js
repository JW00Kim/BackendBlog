const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB 연결 캐싱 (Vercel Serverless에서 재사용)
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
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

// 각 요청마다 DB 연결 확인
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Routes
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/posts");

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);

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

// Vercel을 위한 export
module.exports = app;
