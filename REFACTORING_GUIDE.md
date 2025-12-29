# 🏗️ Backend 아키텍처 - Controller & Service 리팩토링

## 📁 프로젝트 구조

```
backend/
├── controllers/          # 🎮 컨트롤러 계층 (요청/응답 처리)
│   └── authController.js
├── services/            # 💼 서비스 계층 (비즈니스 로직)
│   └── authService.js
├── routes/              # 🛣️  라우트 계층 (엔드포인트 정의)
│   ├── auth.js
│   ├── posts.js
│   └── comments.js
├── models/              # 📊 모델 계층 (데이터 스키마)
│   ├── User.js
│   ├── Post.js
│   └── Comment.js
└── index.js             # 🚀 서버 진입점
```

---

## 🏛️ 3-Layer 아키텍처

### 1️⃣ Routes (라우트 계층)
**역할**: API 엔드포인트 정의 및 컨트롤러 연결

```javascript
// routes/auth.js
const authController = require("../controllers/authController");

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/google", authController.googleLogin);
router.get("/me", authController.getCurrentUser);
```

**특징**:
- HTTP 메서드와 경로만 정의
- 컨트롤러 함수에 위임
- 비즈니스 로직 없음

---

### 2️⃣ Controllers (컨트롤러 계층)
**역할**: HTTP 요청/응답 처리 및 데이터 검증

```javascript
// controllers/authController.js
const signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // 서비스 계층 호출
    const result = await authService.signup({ email, password, name });
    
    // 성공 응답
    res.status(201).json({
      success: true,
      message: "회원가입이 완료되었습니다",
      data: result,
    });
  } catch (error) {
    // 에러 처리 및 응답
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
```

**특징**:
- 요청 바디 추출
- 서비스 계층 호출
- HTTP 상태 코드 설정
- JSON 응답 형식화
- 에러 핸들링

---

### 3️⃣ Services (서비스 계층)
**역할**: 핵심 비즈니스 로직 처리

```javascript
// services/authService.js
const signup = async ({ email, password, name }) => {
  // 1. 데이터 검증
  if (!email || !password || !name) {
    throw new Error("모든 필드를 입력해주세요");
  }

  // 2. 중복 체크
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("이미 사용중인 이메일입니다");
  }

  // 3. 사용자 생성
  const user = await User.create({ email, password, name });

  // 4. 토큰 생성
  const token = generateToken(user._id);

  // 5. 결과 반환
  return { user, token };
};
```

**특징**:
- HTTP와 독립적
- 재사용 가능한 비즈니스 로직
- 데이터베이스 직접 접근
- 에러는 throw로 처리

---

## 🔄 데이터 흐름

```
Client (프론트엔드)
    ↓ HTTP Request
📍 Routes
    ↓ 라우트 매칭
🎮 Controller
    ↓ 요청 파싱
💼 Service
    ↓ 비즈니스 로직
📊 Model (MongoDB)
    ↑ 데이터 반환
💼 Service
    ↑ 결과 가공
🎮 Controller
    ↑ HTTP Response
Client (프론트엔드)
```

---

## 📋 Google OAuth 로그인 예시

### 1. 라우트 정의
```javascript
// routes/auth.js
router.post("/google", authController.googleLogin);
```

### 2. 컨트롤러 (요청/응답 처리)
```javascript
// controllers/authController.js
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    console.log("🔐 Google 로그인 요청");

    // 서비스 계층 호출
    const result = await authService.googleLogin(credential);

    // 성공 응답
    res.json({
      success: true,
      message: "Google 로그인 성공",
      data: result,
    });
  } catch (error) {
    console.error("❌ Google 로그인 에러:", error);
    
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
```

### 3. 서비스 (비즈니스 로직)
```javascript
// services/authService.js
const googleLogin = async (credential) => {
  // 1. 토큰 검증
  if (!credential) {
    throw new Error("Google 인증 토큰이 필요합니다");
  }

  // 2. Google API로 토큰 검증
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { email, name, sub: googleId, picture } = payload;

  // 3. 사용자 확인 또는 생성
  let user = await User.findOne({ email });
  
  if (!user) {
    user = await User.create({
      email,
      name,
      password: Math.random().toString(36).slice(-8) + "Aa1!",
      googleId,
      profilePicture: picture,
    });
  }

  // 4. JWT 토큰 생성
  const token = generateToken(user._id);

  // 5. 결과 반환
  return { user, token };
};
```

---

## ✅ 리팩토링의 장점

### 1. **관심사의 분리 (Separation of Concerns)**
- Routes: 엔드포인트 관리
- Controllers: HTTP 처리
- Services: 비즈니스 로직
- Models: 데이터 구조

### 2. **재사용성**
```javascript
// Service는 다른 곳에서도 사용 가능
const user = await authService.signup({ email, password, name });
```

### 3. **테스트 용이성**
```javascript
// Service만 단위 테스트 가능
test('signup should create new user', async () => {
  const result = await authService.signup({
    email: 'test@example.com',
    password: '123456',
    name: 'Test User'
  });
  expect(result.user.email).toBe('test@example.com');
});
```

### 4. **유지보수성**
- 비즈니스 로직 변경 시 Service만 수정
- HTTP 응답 형식 변경 시 Controller만 수정
- 엔드포인트 변경 시 Routes만 수정

### 5. **가독성**
- 각 계층의 역할이 명확
- 코드 위치를 쉽게 파악
- 협업 시 충돌 최소화

---

## 🚀 배포

리팩토링된 코드는 기존과 동일하게 작동하며, API 엔드포인트에 변경 없음:

```bash
# 로컬 테스트
cd backend
npm start

# Vercel 배포
vercel --prod
```

---

## 📝 다음 단계

1. ✅ Auth 리팩토링 완료
2. ⏳ Posts 리팩토링 (다음)
3. ⏳ Comments 리팩토링 (다음)
4. ⏳ Middleware 분리 (인증, 에러 처리)
5. ⏳ 유닛 테스트 작성

---

**작성일**: 2025-12-28  
**작성자**: GitHub Copilot & Claude
