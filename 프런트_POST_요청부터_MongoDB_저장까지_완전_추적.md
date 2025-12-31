# 🔄 프런트 POST 요청 → 응답 → FormData 변환 → MongoDB 저장 (완전 추적)

> **목표:** 프런트에서 URL을 보내는 순간부터 백엔드가 응답하고 MongoDB에 저장되기까지의 모든 과정을 실제 코드로 추적하기

---

## 📍 전체 흐름 (한눈에)

```
┌─────────────────────────────────────────────────────────────┐
│ 1️⃣ 프런트: PostCreate.jsx                                   │
│    "작성하기" 버튼 클릭                                       │
│    → handleSubmit() 호출                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 2️⃣ 프런트: FormData 생성                                    │
│    const formData = new FormData()                          │
│    formData.append("title", "제목")                         │
│    formData.append("images", File객체)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 3️⃣ 프런트: api.js - createPost()                           │
│    const response = await api.post("/posts", formData)     │
│    Authorization: Bearer [token]                           │
│    Content-Type: multipart/form-data                       │
└──────────────────────┬──────────────────────────────────────┘
                       │ (HTTPS POST 요청)
                       ↓
                   🌍 인터넷
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 4️⃣ 백: index.js - 미들웨어 체인                           │
│    app.use(parseFormData)                                  │
│    app.use("/api/posts", postsRouter)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 5️⃣ 백: middleware/parseFormData.js - Busboy 파싱          │
│    req.files = [{buffer: <바이너리>}]                     │
│    req.body = {title: "제목", content: "내용"}             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 6️⃣ 백: routes/posts.js - POST /api/posts                  │
│    JWT 검증                                                 │
│    Promise.all()로 이미지 업로드                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 7️⃣ 백: lib/cloudinary.js - uploadImageBuffer()            │
│    cloudinary.uploader.upload_stream(buffer)               │
│    ← Cloudinary URL 반환                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 8️⃣ 백: routes/posts.js - MongoDB 저장                     │
│    const post = await Post.create({                        │
│      title, content,                                       │
│      images: ["https://...", "https://..."],              │
│      author: userId                                       │
│    })                                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 9️⃣ 백: 응답 반환                                            │
│    res.status(201).json({                                  │
│      success: true,                                        │
│      data: { post }                                        │
│    })                                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │ (HTTPS 응답)
                       ↓
                   🌍 인터넷
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 🔟 프런트: api.js - 응답 인터셉터                          │
│    response.data = {success: true, data: {post}}           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 1️⃣1️⃣ 프런트: PostCreate.jsx - handleSubmit 재개           │
│    const response = await createPost(postData)             │
│    // 이제 응답을 받음!                                     │
│    setPosts([...posts, response.data.post])                │
│    alert("게시물이 작성되었습니다!")                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ 프런트: PostCreate.jsx - 요청 시작

### **사용자가 "작성하기" 버튼을 클릭**

```jsx
// frontend/src/components/PostCreate.jsx

import { useState } from "react";
import { createPost } from "../api";  // ← api.js에서 import

function PostCreate() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);  // File 객체 배열

  // 📤 "작성하기" 버튼 클릭 → handleSubmit() 호출
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("📝 게시물 작성 시작:", {
      title,
      content,
      imageCount: images.length,
      imageDetails: images.map(img => ({
        name: img.name,
        size: img.size,
        type: img.type
      }))
    });

    try {
      // 📤 Step 1: 데이터 준비
      const postData = {
        title: title || "제목 없음",
        content: content || "내용 없음",
        images: images,  // ← File[] 배열
      };

      console.log("📦 POST 요청 데이터 준비:", {
        title: postData.title,
        content: postData.content,
        filesCount: postData.images.length,
      });

      // 📤 Step 2: createPost() 호출 (api.js로 이동)
      console.log("🚀 api.js의 createPost() 함수 호출...");
      
      const response = await createPost(postData);
      // ↑
      // ├─ 이 시점에서:
      // │  1. FormData가 생성됨 (api.js에서)
      // │  2. axios.post()가 요청 전송
      // │  3. 백엔드에서 처리
      // │  4. 응답 반환
      // ├─ Promise가 resolve될 때까지 대기 (await)
      // └─ 응답 데이터를 response에 저장

      console.log("✅ 응답 수신:", response);
      // response = {
      //   success: true,
      //   message: "게시물이 작성되었습니다",
      //   data: {
      //     post: {
      //       _id: "...",
      //       title: "제목",
      //       content: "내용",
      //       images: ["https://res.cloudinary.com/..."],
      //       author: "...",
      //       createdAt: "2025-12-30T..."
      //     }
      //   }
      // }

      // 📤 Step 3: 응답 처리 (UI 업데이트)
      alert("게시물이 작성되었습니다!");
      
      // 게시물 목록 새로고침 (선택사항)
      // window.location.reload();
      
    } catch (error) {
      console.error("❌ 게시물 작성 실패:", {
        message: error.message,
        response: error.response?.data,
      });

      alert(`게시물 작성 실패: ${error.response?.data?.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>게시물 작성</h2>

      <label>제목</label>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목을 입력하세요"
        required
      />

      <label>내용</label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="내용을 입력하세요"
        required
      />

      <label>이미지</label>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => {
          const files = Array.from(e.target.files);
          setImages(files);
          
          console.log(`📸 ${files.length}개 이미지 선택됨:`, 
            files.map(f => ({name: f.name, size: f.size}))
          );
        }}
      />

      {/* 미리보기 */}
      <div className="image-preview">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={URL.createObjectURL(img)}
            alt={`preview ${idx}`}
            style={{width: "100px", height: "100px"}}
          />
        ))}
      </div>

      {/* 작성하기 버튼 */}
      <button type="submit">작성하기 ← 클릭!</button>
    </form>
  );
}

export default PostCreate;
```

---

## 2️⃣ 프런트: api.js - FormData 생성 및 POST 요청

### **createPost() 함수: FormData로 변환 후 전송**

```javascript
// frontend/src/api.js

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// 📡 axios 인스턴스 생성
const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,  // 30초 타임아웃
});

// 📤 요청 인터셉터: 모든 요청에 Authorization 헤더 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    
    console.log("🔐 Authorization 헤더 추가:", {
      url: config.url,
      tokenLength: token.length,
      hasToken: true
    });
  }
  
  return config;
});

// 📥 응답 인터셉터: 성공/실패 처리
api.interceptors.response.use(
  (response) => {
    console.log("✅ 응답 성공:", {
      status: response.status,
      url: response.config.url,
      dataSize: JSON.stringify(response.data).length
    });
    return response.data;  // ← 여기서 response.data를 반환!
  },
  (error) => {
    console.error("❌ 응답 실패:", {
      status: error.response?.status,
      message: error.response?.data?.message,
      url: error.config?.url
    });
    return Promise.reject(error);
  }
);

// 📤 게시물 생성 함수
export const createPost = async (postData) => {
  // postData = {
  //   title: "제목",
  //   content: "내용",
  //   images: [File{name: "photo1.jpg"}, File{name: "photo2.jpg"}]
  // }

  console.log("📋 createPost() 호출됨:");
  console.log("  - postData.title:", postData.title);
  console.log("  - postData.content:", postData.content);
  console.log("  - postData.images.length:", postData.images.length);

  // 📦 Step 1: FormData 객체 생성
  const formData = new FormData();
  
  console.log("📦 Step 1: FormData 생성");

  // 📦 Step 2: 텍스트 필드 추가
  formData.append("title", postData.title);
  formData.append("content", postData.content);
  
  console.log("📦 Step 2: 텍스트 필드 추가");
  console.log("  - title:", formData.get("title"));
  console.log("  - content:", formData.get("content"));

  // 📦 Step 3: 이미지 파일 추가
  postData.images.forEach((imageFile, index) => {
    formData.append("images", imageFile);
    
    console.log(`📦 Step 3-${index + 1}: 이미지 ${index + 1} 추가`);
    console.log(`  - name: ${imageFile.name}`);
    console.log(`  - size: ${imageFile.size} bytes`);
    console.log(`  - type: ${imageFile.type}`);
  });

  // formData의 실제 형태:
  // ------WebKitFormBoundary7MA4YWxkTrZu0gW
  // Content-Disposition: form-data; name="title"
  //
  // 제목
  // ------WebKitFormBoundary7MA4YWxkTrZu0gW
  // Content-Disposition: form-data; name="content"
  //
  // 내용
  // ------WebKitFormBoundary7MA4YWxkTrZu0gW
  // Content-Disposition: form-data; name="images"; filename="photo1.jpg"
  // Content-Type: image/jpeg
  //
  // [바이너리 데이터...]
  // ------WebKitFormBoundary7MA4YWxkTrZu0gW--

  // 📤 Step 4: axios.post() 요청 전송
  console.log("📤 Step 4: axios.post() 요청 전송");
  console.log("  - URL: POST /api/posts");
  console.log("  - Content-Type: multipart/form-data");
  console.log("  - Authorization: Bearer [token]");

  try {
    // axios.post(url, data, config)
    const response = await api.post("/posts", formData);
    // ↑
    // ├─ /posts → /api/posts (baseURL 포함)
    // ├─ formData → multipart/form-data로 자동 변환
    // ├─ Authorization 헤더 자동 추가 (인터셉터)
    // └─ 응답 data 반환 (응답 인터셉터)

    console.log("✅ POST /api/posts 응답 수신:");
    console.log("  - success:", response.success);
    console.log("  - post._id:", response.data?.post._id);
    console.log("  - post.title:", response.data?.post.title);
    console.log("  - post.images:", response.data?.post.images);

    return response;  // ← 이 값이 PostCreate.jsx의 handleSubmit()로 반환됨
    // response = {
    //   success: true,
    //   message: "게시물이 작성되었습니다",
    //   data: {
    //     post: {
    //       _id: "...",
    //       title: "제목",
    //       content: "내용",
    //       images: ["https://res.cloudinary.com/..."],
    //       ...
    //     }
    //   }
    // }

  } catch (error) {
    console.error("❌ POST /api/posts 요청 실패:");
    console.error("  - status:", error.response?.status);
    console.error("  - message:", error.response?.data?.message);
    
    throw error;  // ← 에러를 다시 throw (PostCreate.jsx의 catch로)
  }
};

// ========================
// 이 api.js의 역할 정리:
// ========================
// 1. FormData 생성 (브라우저에서만 가능)
// 2. axios.post() 호출
// 3. Authorization 헤더 자동 추가 (인터셉터)
// 4. 응답 데이터 반환 (또는 에러 throw)
// ========================
```

---

## 3️⃣ 백: index.js - 미들웨어 체인

### **요청이 어떤 미들웨어를 거치는가?**

```javascript
// backend/index.js

const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// 📥 Step 1: CORS 미들웨어 (요청 허용)
const cors = require("cors");
app.use(cors({
  origin: ["http://localhost:3000", "https://jiwooresume.vercel.app"],
  credentials: true
}));

console.log("✅ CORS 미들웨어 등록");

// 📥 Step 2: JSON 미들웨어 (JSON 처리)
app.use(express.json());
console.log("✅ JSON 미들웨어 등록");

// 📥 Step 3: FormData 파싱 미들웨어 (우리가 만든 것!)
const parseFormData = require("./middleware/parseFormData");
app.use(parseFormData);

console.log("✅ parseFormData 미들웨어 등록");
// 이 미들웨어가:
// - multipart/form-data를 감지
// - Busboy로 파싱
// - req.files와 req.body 설정

// 📥 Step 4: 라우트 등록
const postsRouter = require("./routes/posts");
app.use("/api/posts", postsRouter);

console.log("✅ POST /api/posts 라우트 등록");

// 요청 흐름:
// POST /api/posts (HTTPS로부터)
//   ↓
// CORS 미들웨어 (요청 허용 확인)
//   ↓
// JSON 미들웨어 (필요한 경우 처리)
//   ↓
// parseFormData 미들웨어 ⭐ (FormData → req.files, req.body로 변환)
//   ↓
// /api/posts 라우트 (routes/posts.js의 POST 핸들러)
//   ↓
// next()로 라우트 핸들러 실행
```

---

## 4️⃣ 백: middleware/parseFormData.js - FormData 파싱

### **POST 데이터를 req.files와 req.body로 변환**

```javascript
// backend/middleware/parseFormData.js

const busboy = require("busboy");

/**
 * FormData를 파싱해서 req.files와 req.body에 저장
 * 
 * 입력: HTTP POST 요청
 *   Content-Type: multipart/form-data; boundary=...
 *   [FormData의 바이너리 데이터]
 * 
 * 출력: 
 *   req.body = {title: "제목", content: "내용"}
 *   req.files = [{buffer: <Buffer...>, name: "photo.jpg", ...}]
 */
function parseFormData(req, res, next) {
  // 📥 Step 1: POST/PUT 요청만 처리
  if (req.method !== "POST" && req.method !== "PUT") {
    return next();  // 다른 메서드는 통과
  }

  // 📥 Step 2: multipart/form-data만 처리
  const contentType = req.headers["content-type"];
  if (!contentType || !contentType.includes("multipart/form-data")) {
    return next();  // JSON 등 다른 형식은 다른 미들웨어가 처리
  }

  console.log("📥 [parseFormData] 시작:");
  console.log("  - Content-Type:", contentType);

  // 📥 Step 3: req.body와 req.files 초기화
  req.body = {};
  req.files = [];

  // 📥 Step 4: Busboy 인스턴스 생성
  const bb = busboy({
    headers: req.headers,
    limits: {
      fileSize: 8 * 1024 * 1024,  // 8MB
      files: 5,
    },
  });

  let fileCount = 0;
  let filesProcessed = 0;

  // 📥 Step 5: 파일 필드 처리
  bb.on("file", (fieldname, file, info) => {
    // fieldname = "images"
    // info = {filename: "photo1.jpg", mimeType: "image/jpeg"}

    fileCount++;
    console.log(`  📁 파일 필드 감지: ${fieldname} (${info.filename})`);

    const chunks = [];

    // 파일 데이터를 청크로 받음
    file.on("data", (data) => {
      chunks.push(data);
      console.log(`    📥 청크: ${data.length} bytes`);
    });

    // 파일 수신 완료
    file.on("end", () => {
      const buffer = Buffer.concat(chunks);
      
      // req.files에 저장
      req.files.push({
        fieldname,
        originalname: info.filename,
        mimetype: info.mimeType,
        size: buffer.length,
        buffer,  // ← 핵심! 바이너리 데이터
      });

      filesProcessed++;
      
      console.log(`    ✅ 파일 완성: ${buffer.length} bytes`);
    });
  });

  // 📥 Step 6: 텍스트 필드 처리
  bb.on("field", (fieldname, val) => {
    // fieldname = "title" 또는 "content"
    // val = "제목" 또는 "내용"

    req.body[fieldname] = val;
    
    console.log(`  📝 텍스트 필드: ${fieldname} = "${val}"`);
  });

  // 📥 Step 7: 파싱 완료
  bb.on("close", () => {
    console.log(`  ✅ 파싱 완료:`);
    console.log(`    - req.body:`, req.body);
    console.log(`    - req.files.length:`, req.files.length);

    // 모든 파일이 처리될 때까지 대기
    if (filesProcessed < fileCount) {
      const waitInterval = setInterval(() => {
        if (filesProcessed >= fileCount) {
          clearInterval(waitInterval);
          console.log(`  ✅ 모든 파일 처리됨, next() 호출`);
          next();  // ← 다음 미들웨어로 이동 (routes/posts.js의 핸들러)
        }
      }, 10);

      setTimeout(() => {
        clearInterval(waitInterval);
        next();
      }, 5000);
    } else {
      console.log(`  ✅ 즉시 next() 호출`);
      next();
    }
  });

  bb.on("error", (err) => {
    console.error("❌ Busboy 에러:", err);
    res.status(400).json({success: false, message: "FormData 파싱 실패"});
  });

  // 📥 Step 8: HTTP 요청 스트림을 Busboy에 파이프
  req.pipe(bb);
}

module.exports = parseFormData;

// 이 시점에서:
// req.body = {title: "제목", content: "내용"}
// req.files = [
//   {
//     fieldname: "images",
//     originalname: "photo1.jpg",
//     mimetype: "image/jpeg",
//     size: 558624,
//     buffer: <Buffer 89 50 4e 47 ff d8 ... (바이너리)>
//   }
// ]
```

---

## 5️⃣ 백: routes/posts.js - Cloudinary 업로드 및 MongoDB 저장

### **이미지를 Cloudinary에 업로드하고 MongoDB에 저장**

```javascript
// backend/routes/posts.js

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Post = require("../models/Post");
const User = require("../models/User");
const { uploadImageBuffer } = require("../lib/cloudinary");

// @route   POST /api/posts
// @desc    게시물 작성
// @access  Private
router.post("/", async (req, res) => {
  try {
    console.log("📥 [POST /api/posts] 요청 수신");
    
    // 📥 Step 1: JWT 검증
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ 토큰 없음");
      return res.status(401).json({
        success: false,
        message: "로그인이 필요합니다",
      });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.log("❌ 토큰 검증 실패:", error.message);
      return res.status(401).json({
        success: false,
        message: "유효하지 않은 토큰입니다",
      });
    }

    const userId = decoded.id;
    console.log("✅ JWT 검증 성공:", {userId});

    // 📥 Step 2: req.body와 req.files 확인 (parseFormData에서 설정됨)
    const { title, content } = req.body;
    const filesFromMiddleware = req.files || [];

    console.log("📝 요청 데이터:", {
      title,
      content,
      filesCount: filesFromMiddleware.length,
    });

    // 📥 Step 3: 검증
    if (!title || !content) {
      console.log("❌ 필수 필드 누락");
      return res.status(400).json({
        success: false,
        message: "제목과 내용을 모두 입력해주세요",
      });
    }

    // 📥 Step 4: 이미지 Cloudinary 업로드
    let images = [];

    if (filesFromMiddleware.length > 0) {
      console.log(`📤 Cloudinary 업로드 시작: ${filesFromMiddleware.length}개 파일`);

      // Promise.all()로 모든 파일 병렬 업로드
      images = await Promise.all(
        filesFromMiddleware.map(async (file, index) => {
          console.log(`  🖼️ 파일 ${index + 1}: ${file.originalname}`);
          
          // uploadImageBuffer() 호출 (lib/cloudinary.js)
          // file.buffer = <Buffer ...> (바이너리 데이터)
          const result = await uploadImageBuffer(file.buffer, {
            folder: "blog-posts",
          });

          console.log(`  ✅ 파일 ${index + 1} 업로드 완료:`, result.secure_url);

          return result.secure_url;
        })
      );

      console.log(`✅ 모든 파일 업로드 완료:`, images);
    }

    // 📥 Step 5: MongoDB Post 생성
    console.log("💾 MongoDB에 Post 저장 시작");

    const post = await Post.create({
      title,
      content,
      images,  // ← Cloudinary URL 배열
      author: userId,
    });

    console.log("✅ MongoDB 저장 완료:", {
      _id: post._id,
      title: post.title,
      imagesCount: post.images.length,
    });

    // 📤 Step 6: 응답 반환
    console.log("📤 클라이언트에 응답 반환");

    res.status(201).json({
      success: true,
      message: "게시물이 작성되었습니다",
      data: { post },
    });

    // 이 응답이 프런트의 api.js로 반환됨
    // axios의 응답 인터셉터가 response.data를 추출
    // → PostCreate.jsx의 handleSubmit에서 받음

  } catch (error) {
    console.error("❌ 에러:", {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다",
      error: error.message,
    });
  }
});

module.exports = router;
```

---

## 6️⃣ 백: lib/cloudinary.js - 이미지를 Cloudinary로 업로드

### **버퍼 데이터를 클라우드에 저장**

```javascript
// backend/lib/cloudinary.js

const cloudinary = require("cloudinary").v2;

let configured = false;

function ensureConfigured() {
  if (configured) return;

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary 환경변수가 설정되지 않았습니다");
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });

  configured = true;
  console.log("✅ Cloudinary 설정됨");
}

/**
 * routes/posts.js에서 호출됨
 * 
 * 입력: 
 *   buffer = <Buffer 89 50 4e 47 ff d8 ...> (바이너리)
 *   options = {folder: "blog-posts"}
 * 
 * 출력:
 *   Promise<{
 *     secure_url: "https://res.cloudinary.com/...",
 *     public_id: "blog-posts/xyz123",
 *     ...
 *   }>
 */
function uploadImageBuffer(buffer, options = {}) {
  ensureConfigured();

  console.log(`📤 Cloudinary 업로드: ${buffer.length} bytes`);

  return new Promise((resolve, reject) => {
    // 타임아웃 설정
    const timeoutHandle = setTimeout(() => {
      reject(new Error("Cloudinary upload timeout"));
    }, 35000);

    // upload_stream()에 버퍼를 전송
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || "blog-posts",
        resource_type: "image",
        timeout: 35000,
      },
      (error, result) => {
        clearTimeout(timeoutHandle);

        if (error) {
          console.error("❌ Cloudinary 업로드 실패:", error);
          reject(error);
        } else {
          console.log("✅ Cloudinary 업로드 성공:", {
            url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
          });

          // result = {
          //   public_id: "blog-posts/abc123xyz",
          //   secure_url: "https://res.cloudinary.com/daijhkfrg/image/upload/...",
          //   url: "http://res.cloudinary.com/...",
          //   width: 1920,
          //   height: 1080,
          //   format: "jpg",
          //   bytes: 558624,
          //   created_at: "2025-12-30T...",
          // }

          resolve(result);
        }
      }
    );

    stream.on("error", (err) => {
      clearTimeout(timeoutHandle);
      console.error("❌ 스트림 에러:", err);
      reject(err);
    });

    // 버퍼 전송 시작
    stream.end(buffer);
  });
}

module.exports = { uploadImageBuffer };

// Cloudinary로 전송되는 것:
// POST https://api.cloudinary.com/v1_1/daijhkfrg/image/upload
// Content-Type: multipart/form-data
// form-data:
//   api_key: "..."
//   api_secret: "..."
//   file: <Buffer ...> (이미지 바이너리)
//   folder: "blog-posts"
//
// ← 응답:
// {
//   secure_url: "https://res.cloudinary.com/daijhkfrg/image/upload/v1735507825/blog-posts/abc123.jpg",
//   ...
// }
```

---

## 7️⃣ 백 → 프런트: 응답 반환

### **routes/posts.js에서 JSON 응답 전송**

```javascript
// backend/routes/posts.js (계속)

// Step 6: 응답 반환 (앞의 코드와 동일)

res.status(201).json({
  success: true,
  message: "게시물이 작성되었습니다",
  data: { 
    post: {
      _id: "695352479a374cba4d8d4826",
      title: "제목",
      content: "내용",
      images: [
        "https://res.cloudinary.com/daijhkfrg/image/upload/v1735507825/blog-posts/abc123.jpg",
        "https://res.cloudinary.com/daijhkfrg/image/upload/v1735507826/blog-posts/def456.jpg"
      ],
      author: "507f1f77bcf86cd799439011",
      likes: [],
      comments: [],
      createdAt: "2025-12-30T10:30:25.000Z",
      updatedAt: "2025-12-30T10:30:25.000Z",
      __v: 0
    }
  }
});

// 이 JSON이 HTTP 응답으로 브라우저로 전송됨:
// HTTP/1.1 201 Created
// Content-Type: application/json
// Content-Length: 1240
// 
// {
//   "success": true,
//   "message": "게시물이 작성되었습니다",
//   "data": { "post": {...} }
// }
```

---

## 8️⃣ 프런트: api.js - 응답 인터셉터

### **응답을 처리해서 PostCreate.jsx로 반환**

```javascript
// frontend/src/api.js (계속)

// 📥 응답 인터셉터: 응답을 처리
api.interceptors.response.use(
  (response) => {
    // response = {
    //   status: 201,
    //   statusText: "Created",
    //   headers: {...},
    //   config: {...},
    //   data: {
    //     success: true,
    //     message: "게시물이 작성되었습니다",
    //     data: { post: {...} }
    //   }
    // }

    console.log("✅ 응답 수신 (응답 인터셉터):", {
      status: response.status,
      url: response.config.url,
      success: response.data.success,
    });

    // 📤 response.data만 추출해서 반환
    return response.data;
    // → {
    //      success: true,
    //      message: "게시물이 작성되었습니다",
    //      data: { post: {...} }
    //    }
  },
  (error) => {
    console.error("❌ 응답 에러 (응답 인터셉터):", {
      status: error.response?.status,
      message: error.response?.data?.message,
    });
    return Promise.reject(error);
  }
);

// createPost()의 반환값:
export const createPost = async (postData) => {
  // ... FormData 생성 ...
  
  const response = await api.post("/posts", formData);
  // response = {
  //   success: true,
  //   message: "게시물이 작성되었습니다",
  //   data: { post: {...} }
  // }
  
  return response;  // ← 이 값을 반환!
};
```

---

## 9️⃣ 프런트: PostCreate.jsx - 응답 처리

### **백엔드 응답을 받아서 UI 업데이트**

```jsx
// frontend/src/components/PostCreate.jsx (계속)

function PostCreate() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const postData = { title, content, images };

      // 📥 응답 수신 (await가 완료됨)
      const response = await createPost(postData);
      
      // response = {
      //   success: true,
      //   message: "게시물이 작성되었습니다",
      //   data: {
      //     post: {
      //       _id: "...",
      //       title: "제목",
      //       content: "내용",
      //       images: ["https://res.cloudinary.com/..."],
      //       ...
      //     }
      //   }
      // }

      console.log("✅ 응답 수신 (PostCreate.jsx):", {
        success: response.success,
        postId: response.data.post._id,
        imageUrls: response.data.post.images,
      });

      // 📥 Step 1: 응답 확인
      if (!response.success) {
        throw new Error(response.message);
      }

      // 📥 Step 2: Post 객체 추출
      const newPost = response.data.post;
      
      console.log("📝 새 Post 객체:", {
        id: newPost._id,
        title: newPost.title,
        images: newPost.images,
      });

      // 📥 Step 3: UI 업데이트 (선택사항)
      alert("게시물이 작성되었습니다!");

      // 📥 Step 4: 페이지 새로고침 (또는 상태 업데이트)
      // 옵션 1: 페이지 새로고침
      window.location.reload();

      // 옵션 2: 상태 업데이트 후 리렌더링
      // setPosts(prev => [newPost, ...prev]);
      // setTitle("");
      // setContent("");
      // setImages([]);

    } catch (error) {
      console.error("❌ 게시물 작성 실패:", error);
      alert(`게시물 작성 실패: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 폼 요소들... */}
    </form>
  );
}
```

---

## 📊 전체 데이터 흐름 정리

```
[ 프런트엔드 ]

1️⃣ PostCreate.jsx
   state: images = [File{jpg}, File{png}]
   ↓
2️⃣ handleSubmit()
   const postData = {
     title: "제목",
     content: "내용",
     images: [File{jpg}, File{png}]
   }
   ↓
3️⃣ createPost(postData)로 호출
   ↓
4️⃣ api.js - createPost()
   const formData = new FormData()
   formData.append("title", "제목")
   formData.append("images", File{jpg})
   formData.append("images", File{png})
   ↓
5️⃣ axios.post("/posts", formData)
   Authorization: Bearer [token]
   Content-Type: multipart/form-data
   [바이너리 데이터]
   ↓ (HTTPS POST 요청)

====================================
         🌍 인터넷 전송 🌍
====================================

[ 백엔드 ]

6️⃣ middleware/parseFormData.js
   Busboy 파싱
   req.body = {title: "제목", content: "내용"}
   req.files = [{buffer: <Buffer...>}]
   ↓
7️⃣ routes/posts.js - POST /api/posts
   JWT 검증: userId 추출
   ↓
8️⃣ Promise.all() 병렬 업로드
   req.files.map(file => uploadImageBuffer(file.buffer))
   ↓
9️⃣ lib/cloudinary.js - uploadImageBuffer()
   cloudinary.uploader.upload_stream(buffer)
   ← Cloudinary 응답: {secure_url: "https://..."}
   ↓
🔟 routes/posts.js - MongoDB 저장
   const post = await Post.create({
     title: "제목",
     content: "내용",
     images: ["https://...", "https://..."],
     author: userId
   })
   ↓
1️⃣1️⃣ res.status(201).json({
      success: true,
      data: { post }
   })
   ↓ (HTTPS JSON 응답)

====================================
         🌍 인터넷 전송 🌍
====================================

[ 프런트엔드 ]

1️⃣2️⃣ api.js - 응답 인터셉터
    response.data 추출
    ↓
1️⃣3️⃣ createPost() - Promise resolve
    response 반환
    ↓
1️⃣4️⃣ PostCreate.jsx - handleSubmit
    const response = await createPost()
    // 이제 응답이 response에 저장됨!
    alert("게시물이 작성되었습니다!")
    window.location.reload()
```

---

## 🔑 핵심 개념 정리

| 위치 | 역할 | 데이터 형태 |
|------|------|-----------|
| **PostCreate.jsx** | 사용자 입력 수집 | JavaScript 객체 |
| **api.js** | FormData 생성 및 요청 | FormData (multipart) |
| **HTTPS** | 요청/응답 전송 | 바이너리 패킷 |
| **parseFormData** | FormData 파싱 | req.files, req.body |
| **routes/posts.js** | 로직 처리 | JavaScript 객체 |
| **cloudinary.js** | 이미지 업로드 | Buffer → URL |
| **MongoDB** | 데이터 저장 | Document |
| **응답** | JSON 반환 | JSON 문자열 |
| **api.js (응답)** | 데이터 추출 | JavaScript 객체 |
| **PostCreate.jsx** | UI 업데이트 | HTML 렌더링 |

---

## ⚡ 주요 포인트

### FormData가 필요한 이유:
```javascript
❌ 파일을 JSON으로 전송할 수 없음:
const data = {
  title: "제목",
  image: File{...}  // ← 에러! File 객체는 JSON이 될 수 없음
};
JSON.stringify(data);  // 실패

✅ FormData 사용 (multipart/form-data):
const formData = new FormData();
formData.append("title", "제목");
formData.append("image", File{...});  // ← 가능!
axios.post("/api/posts", formData);
```

### Promise의 중요성:
```javascript
❌ 콜백 기반 (복잡):
uploadCallback(buffer, (err, result) => {
  saveToDB(result, (err, post) => {
    sendResponse(post);
  });
});

✅ async/await (깔끔):
const result = await uploadImageBuffer(buffer);
const post = await Post.create({...});
sendResponse(post);
```

