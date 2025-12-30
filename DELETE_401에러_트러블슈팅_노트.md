# 🔴 DELETE 요청 401 에러 트러블슈팅 (완전 정리)

> **문제:** DELETE 요청 시 계속 401 Unauthorized 에러 발생  
> **근본 원인:** User 모델을 import하지 않음  
> **해결:** `const User = require("../models/User");` 추가

---

## 📋 문제 발생 시나리오

### **문제 1️⃣: Authorization 헤더 누락 (처음)**

```
❌ 에러: 401 Unauthorized
"message": "유효하지 않은 토큰입니다"
```

**원인:**
```javascript
// api.js에서 deletePost 함수
export const deletePost = async (id) => {
  const token = localStorage.getItem("token");
  const response = await api.delete(`/posts/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,  // ← 이 함수에서만 설정
    },
  });
  return response.data;
};

// 문제: 다른 DELETE, PUT 요청들은 Authorization 헤더가 없음
```

**해결 방법 1️⃣:**

요청 인터셉터에 Authorization 헤더 자동 추가:

```javascript
// api.js - 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // ← 모든 요청에 자동 추가
    }
    return config;
  }
);

// 이제 모든 요청에 Authorization이 붙음
api.delete("/posts/123"); // ← 자동으로 Authorization 헤더 포함
```

---

### **문제 2️⃣: 여전히 401 에러 (진전 없음)**

```
❌ 에러: 401 Unauthorized (Authorization 헤더는 있음)
"message": "유효하지 않은 토큰입니다"
```

**원인 추측:**
- JWT 토큰이 만료됨?
- JWT_SECRET이 일치하지 않음?

**디버깅 1: 토큰 로깅 추가**

```javascript
// api.js - 요청 인터셉터에 상세 로깅
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  
  console.log("🔐 토큰 확인:", {
    tokenExists: !!token,
    tokenPreview: token ? token.substring(0, 20) + "..." : "없음",
  });
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("✅ Authorization 헤더 설정됨");
  }
  return config;
});
```

**이후 발견:**
- 토큰은 있음 ✅
- Authorization 헤더도 설정됨 ✅
- 그런데도 401...? 🤔

---

### **문제 3️⃣: 백엔드에서 더 상세한 에러 로깅 추가**

```javascript
// routes/posts.js - DELETE 라우트
router.delete("/:id", async (req, res) => {
  const authHeader = req.headers.authorization;
  
  console.log("🔐 DELETE 요청 토큰 확인:", {
    authHeader: authHeader ? authHeader.substring(0, 30) + "..." : "없음",
    jwtSecret: process.env.JWT_SECRET ? "설정됨" : "없음",
  });
  
  const token = authHeader.split(" ")[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id); // ← 여기서 에러!
    
    // ...
  } catch (error) {
    console.error("❌ DELETE 인증 에러:", {
      message: error.message, // "User is not defined"
      name: error.name,
      tokenLength: token?.length,
    });
  }
});
```

**배포 후 실행하면 콘솔 로그에:**
```
❌ DELETE 인증 에러: {
  "message": "User is not defined",
  "name": "ReferenceError",
  ...
}
```

---

## 🎯 실제 원인 발견!

### **"User is not defined" 에러**

```javascript
// routes/posts.js 상단
const Post = require("../models/Post");
// ❌ User 모델이 없음!

// 그런데 DELETE 라우트에서는:
const user = await User.findById(decoded.id); // ← User가 정의되지 않음!
```

**JavaScript의 호이스팅/스코프 문제:**

```javascript
// 1️⃣ 구문 분석 단계
router.delete("/:id", async (req, res) => {
  // ...
  const user = await User.findById(decoded.id);
  // ^ 이 시점에 User가 뭔지 알 수 없음
});

// 2️⃣ 실행 단계
// ReferenceError: User is not defined!
```

---

## ✅ 해결 방법

### **단계 1: User 모델 import 추가**

```javascript
// routes/posts.js (맨 위에)

// ❌ 전
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Post = require("../models/Post");
const { uploadImageBuffer } = require("../lib/cloudinary");
const parseFormData = require("../middleware/parseFormData");

// ✅ 후
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Post = require("../models/Post");
const User = require("../models/User"); // ← 추가!
const { uploadImageBuffer } = require("../lib/cloudinary");
const parseFormData = require("../middleware/parseFormData");
```

### **단계 2: 배포**

```bash
git add -A
git commit -m "fix: add missing User model import to posts route"
git push origin master
cd backend
vercel --prod
```

### **단계 3: 확인**

DELETE 요청 재실행 → ✅ 성공!

```javascript
// 응답
{
  "success": true,
  "message": "게시물이 삭제되었습니다"
}
```

---

## 🔍 왜 이 문제를 놓쳤나?

### **원인 분석**

```javascript
// routes/posts.js를 처음 리팩토링할 때
// ❌ 코드 정리 중에 User import를 실수로 제거함

// 원래 코드 (작동함):
const User = require("../models/User");
// const fs = require("fs/promises"); // 제거함
// const path = require("path"); // 제거함
// const crypto = require("crypto"); // 제거함

// 실수로 User도 함께 제거 또는 처음부터 누락됨
```

### **왜 처음엔 발견 못 했나?**

1. **이미지 업로드**: `POST /api/posts` - 성공 (User 검증 안 함)
2. **게시물 조회**: `GET /api/posts` - 성공 (User 필요 없음)
3. **게시물 삭제**: `DELETE /api/posts/:id` - **실패** (User 필요 함)

```javascript
// GET - User 필요 없음 ✅
router.get("/:id", async (req, res) => {
  const post = await Post.findById(req.params.id);
  // User 사용 안 함
});

// DELETE - User 필요함 ❌
router.delete("/:id", async (req, res) => {
  const user = await User.findById(decoded.id); // ← User 필요!
});
```

---

## 📊 에러 진행 경로

```
1️⃣ 초기 증상
   ❌ 401 Unauthorized

2️⃣ 추측 1: Authorization 헤더 없음?
   → 요청 인터셉터에 헤더 추가
   → 여전히 401 ⚠️

3️⃣ 추측 2: 토큰 만료 or JWT_SECRET 불일치?
   → 프론트 로깅 추가 (토큰 있음 ✅)
   → Vercel 환경변수 재설정 ✅
   → 여전히 401 ⚠️

4️⃣ 추측 3: 백엔드 코드 에러?
   → 백엔드 로깅 추가
   → 콘솔: "User is not defined" 🎯

5️⃣ 근본 원인 발견
   ✅ User 모델 import 누락
   ✅ import 추가
   ✅ 배포
   ✅ 해결!
```

---

## 📚 교훈

### **1️⃣ 에러 메시지를 신뢰하지 말 것**

```javascript
// ❌ 틀린 이해
"유효하지 않은 토큰입니다" → 토큰이 유효하지 않다고 생각함

// ✅ 올바른 이해
실제 원인: User 모델이 정의되지 않음
(JWT 검증 코드가 실행되기 전에 ReferenceError 발생)
```

### **2️⃣ 상세한 에러 로깅의 중요성**

```javascript
// ❌ 부족한 로깅
console.error("인증 에러:", error);

// ✅ 상세한 로깅
console.error("❌ DELETE 인증 에러:", {
  message: error.message,      // "User is not defined"
  code: error.code,
  name: error.name,            // "ReferenceError"
  tokenLength: token?.length,
  jwtSecretSet: !!process.env.JWT_SECRET,
});
```

### **3️⃣ 백엔드 함수를 사용하기 전에 import 확인**

```javascript
// 필수 체크리스트:
// ✅ User 모델이 필요한가?
// ✅ User 모델을 import 했는가?
// ✅ Post 모델이 필요한가?
// ✅ Post 모델을 import 했는가?
```

---

## 🛠️ 재발 방지

### **코드 리뷰 체크리스트**

```javascript
// routes/posts.js 작성 시 확인사항
router.delete("/:id", async (req, res) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // ✅ jwt를 사용함 → import 확인
    
    const user = await User.findById(decoded.id);
    // ✅ User를 사용함 → import 확인
    
    const post = await Post.findById(req.params.id);
    // ✅ Post를 사용함 → import 확인
  }
});

// 모든 사용된 모델/모듈이 import되었는지 확인!
```

### **자동화된 검사**

```bash
# ESLint 설정 (미사용 변수 감지)
# .eslintrc.json
{
  "rules": {
    "no-undef": "error",  // ← User is not defined 자동 감지!
    "no-unused-vars": "warn"
  }
}
```

---

## 💡 최종 정리

| 항목 | 내용 |
|------|------|
| **증상** | DELETE 요청 401 Unauthorized |
| **초기 추측** | Authorization 헤더 누락 |
| **실제 원인** | User 모델을 import하지 않음 |
| **에러 발생 위치** | `const user = await User.findById(decoded.id);` |
| **에러 타입** | ReferenceError: User is not defined |
| **해결법** | `const User = require("../models/User");` 추가 |
| **배포 후** | ✅ DELETE 요청 성공 |

---

## 🔑 핵심 교훈

> **"에러 메시지만으로 원인을 판단하지 말 것"**
> 
> 401 "유효하지 않은 토큰" → 실제로는 모델 import 누락
>
> 상세한 로깅으로 진짜 에러를 찾아야 함!
