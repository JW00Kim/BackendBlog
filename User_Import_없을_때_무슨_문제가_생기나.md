# 🔴 User 모델을 Import하지 않으면 무슨 문제가 생기나?

> **핵심:** User를 사용하려고 하는데 정의하지 않아서 `ReferenceError` 발생

---

## 1️⃣ 코드 비교: User 없을 때 vs 있을 때

### ❌ User import 없을 때

```javascript
// routes/posts.js
const express = require("express");
const jwt = require("jsonwebtoken");
const Post = require("../models/Post");
// ❌ User를 import하지 않음

router.delete("/:id", async (req, res) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    //                ^^^^ ← User가 뭔지 몰라!
    // ...
  }
});
```

### ✅ User import 있을 때

```javascript
// routes/posts.js
const express = require("express");
const jwt = require("jsonwebtoken");
const Post = require("../models/Post");
const User = require("../models/User"); // ✅ User 정의됨

router.delete("/:id", async (req, res) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    //                ^^^^ ← User가 뭐하는 것인지 알아!
    // ...
  }
});
```

---

## 2️⃣ JavaScript 실행 과정에서 무슨 일이 일어나나?

### **Step 1: 소스 코드 로드**

```javascript
// routes/posts.js를 서버가 로드할 때
const User = require("../models/User");
// ❌ 이 줄이 없으면?
```

### **Step 2: JavaScript 엔진이 코드를 읽을 때**

```javascript
// 엔진: "요 코드를 읽어보자"

router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findById(decoded.id);
    //            ↑
    //            이걸 봤을 때
    //            "User"가 뭔가요?
    //            - 지역 변수? 아니오
    //            - 함수 매개변수? 아니오  
    //            - 모듈 import? 아니오 ❌
    //            → 정의된 게 없음!
  }
});
```

### **Step 3: 런타임 - DELETE 요청이 들어올 때**

```
1️⃣ 클라이언트: DELETE /api/posts/123 요청

2️⃣ 백엔드: 라우트 핸들러 실행
   router.delete("/:id", async (req, res) => {
     const user = await User.findById(decoded.id);
     //            ↓
     // 👁️ "User"를 찾아야 하는데...

3️⃣ JavaScript 엔진: 변수 검색
   - 함수 스코프에 User가 있나? ❌
   - 전역 스코프에 User가 있나? ❌
   → 찾을 수 없음!

4️⃣ 💥 에러 발생!
   ReferenceError: User is not defined
   at routes/posts.js:302:15
```

---

## 3️⃣ 구체적인 에러 메시지와 스택 트레이스

### **Vercel 함수 로그에 나타나는 내용:**

```
❌ DELETE 인증 에러: {
  "message": "User is not defined",
  "name": "ReferenceError",
  "stack": "ReferenceError: User is not defined
    at routes/posts.js:302:15
    at processTicksAndRejections (internal/timers.js:299:0)"
}
```

**해석:**
```
ReferenceError: User is not defined
└─ "User"라는 이름을 찾을 수 없음

at routes/posts.js:302:15
└─ posts.js의 302번째 줄, 15번째 문자에서 발생

at processTicksAndRejections
└─ (비동기 작업 진행 중)
```

---

## 4️⃣ 실제 코드 실행 흐름 (시각화)

### **User import 없을 때의 실행 흐름**

```
DELETE /api/posts/69537d82c3ec737012ab7bdc
  ↓
router.delete("/:id") 매칭됨
  ↓
라우트 핸들러 실행:
  const authHeader = req.headers.authorization;
  // ✅ 작동 (req.headers는 존재)
  
  const token = authHeader.split(" ")[1];
  // ✅ 작동 (문자열 분석)
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // ✅ 작동 (JWT 검증)
  
  const user = await User.findById(decoded.id);
  //            ↓
  //            User를 찾으려는 순간...
  //            💥 ReferenceError: User is not defined
  //
  // 이 라인 이후의 코드는 절대 실행되지 않음!
  
  // 아래 코드들은 전부 실행 안 됨 ⛔
  if (!user) { ... }
  req.user = user;
  // ...
  
  ↓
catch (error) 블록으로 점프
  console.error("❌ DELETE 인증 에러:", {
    message: error.message,  // "User is not defined"
    name: error.name,         // "ReferenceError"
  });
  
  return res.status(401).json({
    success: false,
    message: "유효하지 않은 토큰입니다",
    error: "User is not defined"  // ← 이 에러가 클라이언트에 반환됨
  });
  
  ↓
클라이언트 받음:
  {
    "success": false,
    "message": "유효하지 않은 토큰입니다",
    "error": "User is not defined"  // ← 이상함! 토큰이 아니라 User?
  }
```

---

## 5️⃣ User import가 있을 때의 흐름

### **User import 있을 때의 실행 흐름**

```
const User = require("../models/User");
// ✅ User는 이제 "User" → Mongoose 모델 객체

DELETE /api/posts/69537d82c3ec737012ab7bdc
  ↓
router.delete("/:id") 매칭됨
  ↓
라우트 핸들러 실행:
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // ✅ 작동
  
  const user = await User.findById(decoded.id);
  //            ↓
  //            User = Mongoose 모델 ✅
  //            User.findById() = MongoDB 쿼리 메서드 ✅
  //            → 정상 작동!
  
  // ✅ 계속 실행됨
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "사용자를 찾을 수 없습니다",
    });
  }
  
  // ✅ 정상 진행
  req.user = user;
  
  // ... (여기부터 POST 삭제 로직)
  const post = await Post.findById(req.params.id);
  
  // ✅ 성공 응답
  res.json({
    success: true,
    message: "게시물이 삭제되었습니다",
  });
  
  ↓
클라이언트 받음:
  {
    "success": true,
    "message": "게시물이 삭제되었습니다"
  }
  ✅ 요청 성공!
```

---

## 6️⃣ 왜 이전까지는 에러가 안 났나?

### **이전 요청들은 User가 필요 없었음**

```javascript
// ✅ POST /api/posts (이미지 업로드)
router.post("/", parseFormData, async (req, res) => {
  const { title, content } = req.body;
  // ... 이미지 업로드 ...
  
  // User 사용 안 함! ✅
  
  const post = await Post.create({
    title,
    content,
    images,
    author: userId,  // ← userId는 어디서? 위에서 받았나?
  });
});

// ❓ 위 코드를 자세히 보면...
// userId 변수가 정의되지 않았는데?
// (다른 에러로 막혔을 가능성)
```

```javascript
// ✅ GET /api/posts/:id (조회)
router.get("/:id", async (req, res) => {
  const post = await Post.findById(req.params.id);
  // User 사용 안 함! ✅
  
  return res.json({ success: true, data: { post } });
});

// User가 필요 없으니까 import 안 해도 괜찮음
```

---

## 7️⃣ JavaScript 변수 스코프 개념

### **User를 찾는 과정 (Scope Chain)**

```javascript
// 1. 함수 스코프 (가장 안쪽)
async function deletePostHandler(req, res) {
  // 여기서 User를 선언했나?
  // ❌ User; 선언 없음
  
  const user = await User.findById(...);
  //            ↑ User를 찾아야 함
  //
  // 이 스코프에 User가 없으니 다음 레벨로...
}

// 2. 모듈 스코프 (routes/posts.js)
// 이 파일에 User가 정의되어 있나?
//
// ❌ User import 없음
// const User = require("../models/User"); ← 이 줄이 없으면 여기도 없음
//
// 이 스코프에도 User가 없으니 다음 레벨로...

// 3. 글로벌 스코프
// Node.js 전역에 User가 있나?
// ❌ 없음
//
// 더 이상 찾을 수 없음!
// → ReferenceError: User is not defined
```

### **User import가 있을 때**

```javascript
// 1. 함수 스코프
async function deletePostHandler(req, res) {
  const user = await User.findById(...);
  //            ↑ User를 찾아야 함
}

// 2. 모듈 스코프 (routes/posts.js)
const User = require("../models/User");
//   ↑ 찾음! User = Mongoose 모델
//
// User를 여기서 발견했으니 사용!

// const user = await User.findById(...);
// ✅ 성공!
```

---

## 8️⃣ 메모리 관점에서의 설명

### **프로세스 메모리 구조**

```
┌─────────────────────────────────────────┐
│  Node.js 프로세스 메모리                    │
│                                           │
│  ┌────────────────────────────────────┐  │
│  │ routes/posts.js 모듈 로드 시작       │  │
│  └────────────────────────────────────┘  │
│                                           │
│  ❌ User import 없을 때:                  │
│  ┌────────────────────────────────────┐  │
│  │ express        : 함수 ✅            │  │
│  │ jwt            : 함수 ✅            │  │
│  │ Post           : 클래스 ✅           │  │
│  │ User           : ??? (없음!) ❌     │  │
│  │ uploadImageBuffer : 함수 ✅         │  │
│  │ parseFormData  : 함수 ✅            │  │
│  └────────────────────────────────────┘  │
│                                           │
│  DELETE 요청 들어옴 → User 찾으려함       │
│         ↓                                 │
│  메모리에 User가 없음! 💥                  │
│  ReferenceError!                          │
│                                           │
│  ✅ User import 있을 때:                  │
│  ┌────────────────────────────────────┐  │
│  │ express        : 함수 ✅            │  │
│  │ jwt            : 함수 ✅            │  │
│  │ Post           : 클래스 ✅           │  │
│  │ User           : 클래스 ✅ (로드됨!)│  │
│  │ uploadImageBuffer : 함수 ✅         │  │
│  │ parseFormData  : 함수 ✅            │  │
│  └────────────────────────────────────┘  │
│                                           │
│  DELETE 요청 들어옴 → User 찾으려함       │
│         ↓                                 │
│  메모리에 User 있음! ✅                    │
│  User.findById() 실행!                    │
└─────────────────────────────────────────┘
```

---

## 9️⃣ 정리: User import의 중요성

### **User import 역할**

```javascript
const User = require("../models/User");
// 1️⃣ Mongoose User 모델을 메모리에 로드
// 2️⃣ User라는 변수에 그 모델을 저장
// 3️⃣ 이 파일의 모든 라우트에서 User 사용 가능하게 함
// 4️⃣ User.findById(), User.create() 등의 메서드 사용 가능
```

### **없을 때의 결과**

```javascript
// User 없음 = User라는 이름이 메모리에 없음

const user = await User.findById(id);
//            ↑
// "User가 뭐예요?" → ReferenceError!
```

---

## 🔟 실제 에러 메시지 분석

### **사용자가 본 에러**

```
❌ API 에러 상세: {
  "message": "Request failed with status code 401",
  "status": 401,
  "fullResponse": {
    "success": false,
    "message": "유효하지 않은 토큰입니다",
    "error": "User is not defined"  ← 이게 힌트!
  }
}
```

**이상한 점:**
```
message: "유효하지 않은 토큰입니다"
└─ 토큰 에러라고 함

but error: "User is not defined"
└─ 실제로는 User 모델 에러!
```

**원인:**
```javascript
try {
  const user = await User.findById(...);
  // ↑ User가 없어서 ReferenceError 발생
} catch (error) {
  // ↓ 에러 메시지가 "User is not defined"인데
  res.status(401).json({
    message: "유효하지 않은 토큰입니다",  // ← 이렇게 제너릭하게 반환
    error: error.message,  // ← 실제 에러는 여기에
  });
}
```

---

## 최종 정리

| 항목 | 내용 |
|------|------|
| **없을 때** | `ReferenceError: User is not defined` |
| **발생 시점** | `const user = await User.findById(...);` 실행 시 |
| **원인** | User가 메모리에 정의되지 않음 |
| **영향** | 그 이후의 모든 코드가 실행 안 됨 |
| **해결** | `const User = require("../models/User");` 추가 |
| **결과** | User가 메모리에 로드됨 → 사용 가능 ✅ |

