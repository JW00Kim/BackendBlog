# 🔐 Google OAuth 로그인 연동 가이드

## 📋 목차
1. [개요](#개요)
2. [아키텍처](#아키텍처)
3. [백엔드 구현](#백엔드-구현)
4. [프론트엔드 구현](#프론트엔드-구현)
5. [환경 설정](#환경-설정)
6. [배포](#배포)
7. [문제 해결](#문제-해결)

---

## 🎯 개요

이 프로젝트는 **Google OAuth 2.0**을 사용하여 소셜 로그인 기능을 구현했습니다.

### 주요 기능
- ✅ Google 계정으로 원클릭 로그인
- ✅ 신규 사용자 자동 회원가입
- ✅ 기존 사용자 자동 로그인
- ✅ JWT 토큰 기반 인증
- ✅ 프로필 이미지 자동 연동

### 기술 스택
- **Backend**: Node.js, Express, MongoDB, google-auth-library
- **Frontend**: React, Vite, Google Sign-In SDK
- **인증**: JWT (JSON Web Token)
- **배포**: Vercel

---

## 🏗️ 아키텍처

### 로그인 플로우

```
┌─────────────┐                ┌──────────────┐                ┌─────────────┐
│             │                │              │                │             │
│  Frontend   │                │   Backend    │                │   Google    │
│  (React)    │                │  (Express)   │                │   OAuth     │
│             │                │              │                │             │
└──────┬──────┘                └──────┬───────┘                └──────┬──────┘
       │                              │                               │
       │ 1. Google 버튼 클릭          │                               │
       ├─────────────────────────────>│                               │
       │                              │                               │
       │ 2. Google 로그인 팝업        │                               │
       │<──────────────────────────────────────────────────────────────┤
       │                              │                               │
       │ 3. 사용자 계정 선택 및 인증   │                               │
       ├───────────────────────────────────────────────────────────────>
       │                              │                               │
       │ 4. ID Token 반환             │                               │
       │<──────────────────────────────────────────────────────────────┤
       │                              │                               │
       │ 5. POST /api/auth/google     │                               │
       │    (credential: ID Token)    │                               │
       ├─────────────────────────────>│                               │
       │                              │                               │
       │                              │ 6. ID Token 검증 요청          │
       │                              ├──────────────────────────────>│
       │                              │                               │
       │                              │ 7. 사용자 정보 반환            │
       │                              │<──────────────────────────────┤
       │                              │                               │
       │                              │ 8. DB에서 사용자 조회/생성     │
       │                              │    (MongoDB)                  │
       │                              │                               │
       │ 9. JWT 토큰 + 사용자 정보 반환│                               │
       │<─────────────────────────────┤                               │
       │                              │                               │
       │ 10. localStorage에 토큰 저장  │                               │
       │     대시보드로 리다이렉트     │                               │
       │                              │                               │
```

### 데이터 흐름

```javascript
// 1. Frontend: Google에서 ID Token 받음
{
  credential: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE4MmU4..." // Google ID Token (JWT)
}

// 2. Backend: Google에 토큰 검증 요청
verifyIdToken(credential, GOOGLE_CLIENT_ID)
  ↓
// 3. Google: 사용자 정보 반환
{
  email: "user@gmail.com",
  name: "홍길동",
  sub: "1234567890", // Google 고유 ID
  picture: "https://lh3.googleusercontent.com/..."
}

// 4. Backend: MongoDB에 사용자 저장/조회
{
  email: "user@gmail.com",
  name: "홍길동",
  googleId: "1234567890",
  profilePicture: "https://...",
  password: "랜덤생성" // Google 로그인은 사용 안 함
}

// 5. Backend: JWT 토큰 생성 및 반환
{
  success: true,
  data: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // JWT
    user: {
      id: "673abc...",
      email: "user@gmail.com",
      name: "홍길동",
      profilePicture: "https://..."
    }
  }
}

// 6. Frontend: localStorage에 저장
localStorage.setItem("token", token)
localStorage.setItem("user", JSON.stringify(user))
```

---

## 🖥️ 백엔드 구현

### 1. 패키지 설치

```bash
cd backend
npm install google-auth-library
```

### 2. 환경 변수 설정

**backend/.env**
```env
# Google OAuth Client ID
GOOGLE_CLIENT_ID=470258271536-me011cja3u0uiukn9fkrtp1cqk7is0jm.apps.googleusercontent.com

# JWT Secret
JWT_SECRET=my-super-secret-jwt-key-12345-change-in-production

# MongoDB URI
MONGODB_URI=mongodb+srv://...

# 환경
NODE_ENV=development
```

### 3. 사용자 모델 업데이트

**backend/models/User.js** - Google OAuth 필드 추가

```javascript
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  
  // ✨ Google OAuth 전용 필드
  googleId: { 
    type: String, 
    unique: true, 
    sparse: true  // null 허용하면서 중복 방지
  },
  profilePicture: { type: String },
  
  createdAt: { type: Date, default: Date.now }
});
```

### 4. Google OAuth 라우트 추가

**backend/routes/auth.js**

```javascript
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google OAuth 로그인 엔드포인트
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body; // Google ID Token
    
    // 1. Google에 토큰 검증 요청
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    // 2. 사용자 정보 추출
    const { email, name, sub: googleId, picture } = ticket.getPayload();
    
    // 3. 기존 사용자 확인 또는 신규 생성
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email, name, googleId,
        profilePicture: picture,
        password: Math.random().toString(36) // 랜덤 비밀번호
      });
    }
    
    // 4. JWT 토큰 생성
    const token = generateToken(user._id);
    
    // 5. 응답 반환
    res.json({
      success: true,
      data: { user, token }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

---

## 🎨 프론트엔드 구현

### 1. Google Sign-In SDK 추가

**frontend/index.html**

```html
<head>
  <!-- Google Sign-In SDK 로드 -->
  <script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
```

### 2. 환경 변수 설정

**frontend/.env** (개발 환경)
```env
VITE_API_URL=http://localhost:3001
```

**frontend/.env.production** (프로덕션)
```env
VITE_API_URL=https://backend-blog-snowy.vercel.app
```

### 3. Login 컴포넌트 구현

**frontend/src/components/Login.jsx**

```jsx
import { useState, useEffect } from "react";

function Login() {
  // Google Sign-In 초기화
  useEffect(() => {
    if (window.google) {
      // 1. SDK 초기화
      window.google.accounts.id.initialize({
        client_id: "470258271536-me011cja3u0uiukn9fkrtp1cqk7is0jm.apps.googleusercontent.com",
        callback: handleGoogleLogin, // 콜백 함수
      });

      // 2. 버튼 렌더링
      window.google.accounts.id.renderButton(
        document.getElementById("googleSignInButton"),
        { theme: "outline", size: "large" }
      );
    }
  }, []);

  // Google 로그인 처리
  const handleGoogleLogin = async (response) => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
    
    // 백엔드로 credential 전송
    const result = await fetch(`${apiUrl}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: response.credential })
    });
    
    const data = await result.json();
    
    if (data.success) {
      // 토큰 저장
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      navigate("/dashboard");
    }
  };

  return (
    <div>
      {/* 일반 로그인 폼 */}
      <form>...</form>
      
      {/* 구분선 */}
      <div>또는</div>
      
      {/* Google 로그인 버튼 */}
      <div id="googleSignInButton"></div>
    </div>
  );
}
```

### 4. API 설정

**frontend/src/api.js**

```javascript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: `${API_URL}/api`, // 주의: /api 추가!
  timeout: 30000,
  headers: { "Content-Type": "application/json" }
});
```

---

## ⚙️ 환경 설정

### Google Cloud Console 설정

#### 1. OAuth 2.0 클라이언트 ID 생성

1. https://console.cloud.google.com 접속
2. 프로젝트 선택 또는 생성
3. **API 및 서비스** → **사용자 인증 정보**
4. **+ 사용자 인증 정보 만들기** → **OAuth 클라이언트 ID**
5. 애플리케이션 유형: **웹 애플리케이션**
6. 이름: 원하는 이름 입력

#### 2. 승인된 자바스크립트 원본 추가

**중요: 이 설정이 없으면 "origin is not allowed" 에러 발생!**

```
http://localhost:5173
https://jiwooresume.vercel.app
```

#### 3. 승인된 리디렉션 URI

**Google Sign-In 방식에서는 필요 없음!** (비워두기)

#### 4. Client ID 복사

생성된 Client ID를 복사하여 코드에 적용:
```
470258271536-me011cja3u0uiukn9fkrtp1cqk7is0jm.apps.googleusercontent.com
```

---

## 🚀 배포

### Vercel 환경 변수 설정

#### Backend 프로젝트

Vercel Dashboard → backend-blog → Settings → Environment Variables

```
GOOGLE_CLIENT_ID=470258271536-me011cja3u0uiukn9fkrtp1cqk7is0jm.apps.googleusercontent.com
JWT_SECRET=your-secret-key
MONGODB_URI=mongodb+srv://...
```

#### Frontend 프로젝트

Vercel Dashboard → jiwooresume → Settings → Environment Variables

```
VITE_API_URL=https://backend-blog-snowy.vercel.app
```

### 배포 명령어

```bash
# Backend 배포
cd backend
vercel --prod

# Frontend 배포
cd frontend
vercel --prod
```

---

## 🐛 문제 해결

### 1. "The given origin is not allowed" 에러

**원인**: Google Cloud Console에 승인된 원본 미등록

**해결**:
1. Google Cloud Console → 사용자 인증 정보
2. Client ID 클릭
3. 승인된 자바스크립트 원본에 도메인 추가
4. 5분 대기 (Google 서버 전파 시간)

### 2. "404 Not Found" - /api/api/auth/google

**원인**: API URL 중복 (`VITE_API_URL`에 `/api` 포함됨)

**해결**:
```env
# ❌ 잘못된 설정
VITE_API_URL=https://backend-blog.vercel.app/api

# ✅ 올바른 설정
VITE_API_URL=https://backend-blog.vercel.app
```

### 3. "500 Internal Server Error"

**원인**: 백엔드 환경 변수 미설정 또는 패키지 미설치

**해결**:
1. Vercel Dashboard에서 환경 변수 확인
2. `google-auth-library` 패키지 설치 확인
3. Vercel 로그 확인 (Runtime Logs)

### 4. Cross-Origin-Opener-Policy 경고

**원인**: Google의 보안 정책

**해결**: **무시해도 됩니다!** 기능에는 영향 없음.

---

## 📚 참고 자료

- [Google Sign-In 공식 문서](https://developers.google.com/identity/gsi/web/guides/overview)
- [google-auth-library NPM](https://www.npmjs.com/package/google-auth-library)
- [OAuth 2.0 이해하기](https://developers.google.com/identity/protocols/oauth2)

---

## ✅ 체크리스트

배포 전 확인사항:

- [ ] Google Cloud Console에 도메인 등록
- [ ] Backend 환경 변수 설정 (Vercel)
- [ ] Frontend 환경 변수 설정 (Vercel)
- [ ] `google-auth-library` 패키지 설치
- [ ] User 모델에 `googleId`, `profilePicture` 필드 추가
- [ ] `/api/auth/google` 엔드포인트 구현
- [ ] Google Sign-In SDK 추가
- [ ] Login 컴포넌트에 Google 버튼 구현
- [ ] 로컬 테스트 완료
- [ ] 프로덕션 테스트 완료

---

🎉 **축하합니다! Google OAuth 로그인 연동이 완료되었습니다!**
