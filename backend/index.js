const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
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
app.use("/api/auth", authRoutes);

// 간단한 데이터 모델 (Todo 예시)mongodb+srv://yjk9363_db_user:KOywu2fYhiGlVvZ2@blog.f4taven.mongodb.net/my_blog_db?retryWrites=true&w=majority
const todoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

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
      todos: "/api/todos",
      createTodo: "POST /api/todos",
      updateTodo: "PUT /api/todos/:id",
      deleteTodo: "DELETE /api/todos/:id",
    },
  });
});

// 모든 Todo 조회
app.get("/api/todos", async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json({ success: true, data: todos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Todo 생성
app.post("/api/todos", async (req, res) => {
  try {
    const { title } = req.body;
    const todo = new Todo({ title });
    await todo.save();
    res.status(201).json({ success: true, data: todo });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Todo 업데이트
app.put("/api/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;
    const todo = await Todo.findByIdAndUpdate(
      id,
      { title, completed },
      { new: true, runValidators: true }
    );
    if (!todo) {
      return res
        .status(404)
        .json({ success: false, error: "Todo를 찾을 수 없습니다" });
    }
    res.json({ success: true, data: todo });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Todo 삭제
app.delete("/api/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const todo = await Todo.findByIdAndDelete(id);
    if (!todo) {
      return res
        .status(404)
        .json({ success: false, error: "Todo를 찾을 수 없습니다" });
    }
    res.json({ success: true, message: "삭제되었습니다" });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
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
