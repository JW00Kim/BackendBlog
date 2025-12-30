# 🔐 Google OAuth 인증 전체 흐름 가이드

## 📊 전체 아키텍처 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│ 1️⃣ 프론트엔드 (Google SDK)                                        │
├─────────────────────────────────────────────────────────────────┤
│ • Google 로그인 버튼 클릭                                            │
│ • Google 인증 페이지로 리디렉션                                       │
│ • 사용자가 Google 계정 선택                                          │
│ • Google이 credential (ID Token) 반환                            │
└─────────────────────────────────────────────────────────────────┘
                        ↓ credential 전송
┌─────────────────────────────────────────────────────────────────┐
│ 2️⃣ 프론트엔드 → 백엔드 (POST /api/auth/google)                     │
├─────────────────────────────────────────────────────────────────┤
│ fetch('http://localhost:3001/api/auth/google', {                │
│   method: 'POST',                                                │
│   body: JSON.stringify({ credential })                          │
│ })                                                               │
└─────────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3️⃣ 백엔드 Routes (라우트 계층)                                      │
├─────────────────────────────────────────────────────────────────┤
│ router.post('/google', authController.googleLogin)               │
└─────────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4️⃣ 백엔드 Controller (요청/응답 처리)                               │
├─────────────────────────────────────────────────────────────────┤
│ const { credential } = req.body                                  │
│ const result = await authService.googleLogin(credential)         │
└─────────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5️⃣ 백엔드 Service (비즈니스 로직)                                   │
├─────────────────────────────────────────────────────────────────┤
│ • Google API로 credential 검증                                    │
│ • 사용자 정보 추출 (email, name, googleId)                         │
│ • MongoDB에서 사용자 조회/생성                                       │
│ • JWT 토큰 생성                                                    │
│ • return { user, token }                                         │
└─────────────────────────────────────────────────────────────────┘
                        ↓ { user, token } 반환
┌─────────────────────────────────────────────────────────────────┐
│ 6️⃣ 프론트엔드 (토큰 저장)                                            │
├─────────────────────────────────────────────────────────────────┤
│ localStorage.setItem('token', data.data.token)                   │
│ localStorage.setItem('user', JSON.stringify(data.data.user))     │
│ navigate('/dashboard')                                           │
└─────────────────────────────────────────────────────────────────┘
                        ↓ 이후 모든 API 요청
┌─────────────────────────────────────────────────────────────────┐
│ 7️⃣ API 호출 시 JWT 토큰 사용                                         │
├─────────────────────────────────────────────────────────────────┤
│ headers: {                                                       │
│   Authorization: `Bearer ${localStorage.getItem('token')}`       │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 단계별 상세 코드

### 1️⃣ 프론트엔드: Google SDK 초기화

```jsx
// frontend/src/components/Login.jsx

useEffect(() => {
  if (window.google) {
    // Google Sign-In 초기화
    window.google.accounts.id.initialize({
      client_id: "470258271536-me011cja3u0uiukn9fkrtp1cqk7is0jm.apps.googleusercontent.com",
      callback: handleGoogleLogin, // ← 로그인 성공 시 실행될 함수
    });

    // Google 로그인 버튼 렌더링
    window.google.accounts.id.renderButton(
      document.getElementById("googleSignInButton"),
      { theme: "outline", size: "large", text: "signin_with", width: 400 }
    );
  }
}, []);
```

**역할**: 
- Google SDK 로드 및 초기화
- 로그인 버튼 DOM에 렌더링
- 사용자가 버튼 클릭 → Google 인증 페이지로 이동
- 인증 성공 → `handleGoogleLogin` 콜백 호출

---

### 2️⃣ 프론트엔드: Google Credential → 백엔드 전송

```jsx
// frontend/src/components/Login.jsx

const handleGoogleLogin = async (response) => {
  try {
    setLoading(true);

    // ✨ Google이 반환한 credential (ID Token)을 백엔드로 전송
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
    const result = await fetch(`${apiUrl}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        credential: response.credential // ← Google ID Token (JWT)
      }),
    });

    const data = await result.json();

    if (data.success) {
      // ✨ 백엔드에서 받은 JWT 토큰 저장
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      
      navigate("/dashboard"); // 대시보드로 이동
    }
  } catch (error) {
    console.error("Google 로그인 에러:", error);
  }
};
```

**역할**:
- Google SDK가 반환한 `credential` (ID Token) 받기
- 백엔드 `/api/auth/google` 엔드포인트로 POST 요청
- 백엔드에서 JWT 토큰 받아서 localStorage에 저장

---

### 3️⃣ 백엔드 Routes: 라우트 정의

```javascript
// backend/routes/auth.js

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/google", authController.googleLogin);

module.exports = router;
```

**역할**:
- `POST /api/auth/google` 엔드포인트 정의
- `authController.googleLogin` 컨트롤러 함수에 위임

---

### 4️⃣ 백엔드 Controller: HTTP 요청/응답 처리

```javascript
// backend/controllers/authController.js

const googleLogin = async (req, res) => {
  try {
    // 1. 요청 바디에서 credential 추출
    const { credential } = req.body;
    console.log("🔐 Google 로그인 요청");

    // 2. Service 계층 호출 (비즈니스 로직 위임)
    const result = await authService.googleLogin(credential);

    // 3. 성공 응답 반환
    res.json({
      success: true,
      message: "Google 로그인 성공",
      data: result, // { user, token }
    });
  } catch (error) {
    // 4. 에러 처리
    console.error("❌ Google 로그인 에러:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
```

**역할**:
- HTTP 요청에서 `credential` 추출
- Service 계층에 비즈니스 로직 위임
- HTTP 응답 형식화 (JSON)

---

### 5️⃣ 백엔드 Service: 비즈니스 로직 (핵심!)

```javascript
// backend/services/authService.js

const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (credential) => {
  // 1. credential 검증
  if (!credential) {
    throw new Error("Google 인증 토큰이 필요합니다");
  }

  // 2. Google API로 ID Token 검증
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  // 3. 검증된 토큰에서 사용자 정보 추출
  const payload = ticket.getPayload();
  const { email, name, sub: googleId, picture } = payload;

  console.log("✅ Google 토큰 검증 완료:", email);

  // 4. MongoDB에서 기존 사용자 확인
  let user = await User.findOne({ email });

  if (!user) {
    // 4-1. 신규 사용자 생성
    user = await User.create({
      email,
      name,
      password: Math.random().toString(36).slice(-8) + "Aa1!", // 더미 비밀번호
      googleId,
      profilePicture: picture,
    });
    console.log("✅ 새 Google 사용자 생성:", email);
  } else {
    // 4-2. 기존 사용자 Google ID 업데이트
    if (!user.googleId) {
      user.googleId = googleId;
      user.profilePicture = picture;
      await user.save();
    }
    console.log("✅ 기존 사용자 Google 로그인:", email);
  }

  // 5. JWT 토큰 생성
  const token = generateToken(user._id);

  // 6. 사용자 정보와 토큰 반환
  return {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
    },
    token,
  };
};
```

**역할**:
- Google ID Token 검증 (Google API 호출)
- 사용자 정보 추출 및 DB 저장/업데이트
- JWT 토큰 생성 및 반환

---

### 6️⃣ 이후 API 호출: JWT 토큰 사용

```javascript
// frontend/src/api.js

// ============================================================
// 🔒 인증이 필요한 API 호출 시 자동으로 토큰 추가
// ============================================================

// Axios 요청 인터셉터
api.interceptors.request.use((config) => {
  // localStorage에서 JWT 토큰 가져오기
  const token = localStorage.getItem("token");
  
  if (token) {
    // Authorization 헤더에 Bearer 토큰 추가
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// ============================================================
// 📝 게시글 생성 예시 (JWT 토큰 자동 포함)
// ============================================================
export const createPost = async (postData) => {
  // 자동으로 Authorization: Bearer {token} 헤더가 추가됨
  const response = await api.post("/posts", postData);
  return response.data;
};

// ============================================================
// 👤 현재 사용자 정보 조회 (JWT 필요)
// ============================================================
export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};
```

**역할**:
- 모든 API 요청에 JWT 토큰 자동 추가
- 백엔드에서 토큰 검증 후 사용자 식별

---

## 🔐 보안 흐름 요약

### Google Credential (ID Token)
```
프론트엔드 ──────► 백엔드
    ↓                ↓
(임시 토큰)    Google API로 검증
    ↓                ↓
사용 1회만      사용자 정보 추출
```

### JWT Token (우리 서버 토큰)
```
백엔드 ──────► 프론트엔드
    ↓                ↓
(30일 유효)    localStorage 저장
    ↓                ↓
검증 가능      모든 API 요청에 사용
```

---

## 📌 핵심 포인트

1. **Google Credential**: Google SDK가 반환, 백엔드로 **1번만** 전송
2. **백엔드 검증**: Google API로 credential 검증 (위조 방지)
3. **JWT 발급**: 우리 서버의 JWT 토큰 생성 및 반환
4. **JWT 저장**: 프론트엔드 localStorage에 저장
5. **JWT 사용**: 이후 모든 API 요청에 Authorization 헤더로 포함

---

## 🚀 실제 사용 예시

### 로그인 후 게시글 작성
```javascript
// 1. Google 로그인 (이미 완료, JWT 저장됨)
localStorage.getItem('token') // "eyJhbGciOiJIUzI1NiIsInR5cCI6..."

// 2. 게시글 작성 API 호출
const createPost = async (title, content) => {
  const response = await api.post('/posts', {
    title,
    content
  });
  // ✨ axios interceptor가 자동으로 JWT 추가:
  // headers: { Authorization: 'Bearer eyJhbGci...' }
  
  return response.data;
};

// 3. 백엔드에서 JWT 검증 → 사용자 식별 → 게시글 생성
```

---

**작성일**: 2025-12-28  
**작성자**: GitHub Copilot & Claude
