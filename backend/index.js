const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS 헤더 수동 추가 (모든 응답에)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // OPTIONS 요청은 바로 응답
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.use(express.json());

// MongoDB 연결 캐싱 (Vercel Serverless에서 재사용)
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log("✅ MongoDB 이미 연결됨 (캐시 사용)");
    return;
  }

  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, // 5초 timeout
        socketTimeoutMS: 10000, // 10초 timeout
      });
      isConnected = true;
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

// MongoDB 연결 (await 제거 - Vercel Serverless에서는 각 요청마다 연결)
connectDB();

// Routes
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/posts");

// 라우트 등록 전에 DB 연결 확인 미들웨어 (OPTIONS 요청 제외)
app.use(async (req, res, next) => {
  // OPTIONS 요청은 DB 연결 불필요
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  if (!isConnected && mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  next();
});

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
