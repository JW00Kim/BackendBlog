const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - CORS 설정
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174", 
      "https://jiwooresume.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// MongoDB 연결
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("✅ MongoDB 연결 성공");
    } else {
      console.log(
        "⚠️  MongoDB URI가 설정되지 않았습니다. .env 파일을 확인하세요."
      );
    }
  } catch (error) {
    console.error("❌ MongoDB 연결 실패:", error.message);
    // Vercel에서는 MongoDB 연결 없이도 서버가 동작하도록 설정
  }
};

connectDB();

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

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행중입니다`);
});

// Vercel을 위한 export
module.exports = app;
