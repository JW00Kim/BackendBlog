# Controller vs Service 역할 분담 정리

> 작성일: 2025-12-28  
> 주제: 3-Layer 아키텍처 (Routes → Controller → Service → Model)

---

## 📌 핵심 개념

**Controller**: HTTP 요청/응답 처리 (우편 배달부)  
**Service**: 비즈니스 로직 실행 (실제 일하는 사람)

---

## 🎮 Controller (HTTP 계층)

### 담당 업무
1. **요청 받기**: `req.body`, `req.params`에서 데이터 추출
2. **Service 호출**: 비즈니스 로직 실행 위임
3. **응답 만들기**: HTTP 상태코드 + JSON 반환
4. **에러 처리**: HTTP 에러 응답 생성

### 코드 예시
```javascript
const googleLogin = async (req, res) => {
  try {
    // 1️⃣ HTTP 요청에서 데이터 추출
    const { credential } = req.body;
    
    // 2️⃣ Service에게 비즈니스 로직 위임
    const result = await authService.googleLogin(credential);
    
    // 3️⃣ HTTP 응답 만들기
    res.json({
      success: true,
      message: "Google 로그인 성공",
      data: result,
    });
  } catch (error) {
    // 4️⃣ HTTP 에러 응답
    const statusCode = error.message.includes("필요합니다") ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};
```

### Controller는 하지 않는 것 ❌
- DB 접근 (Model 사용 금지)
- 비즈니스 로직 (검증, 계산, 데이터 가공)
- 외부 API 호출 (Google 검증 등)
- 토큰 생성, 암호화 등

### Controller가 알아야 할 것 ✅
- HTTP (req, res, 상태코드)
- 어떤 Service를 호출할지
- 에러를 어떤 상태코드로 변환할지

---

## 💼 Service (비즈니스 로직 계층)

### 담당 업무
1. **입력 검증**: 데이터 유효성 체크
2. **외부 API 호출**: Google, 결제 API 등
3. **DB 작업**: CRUD 수행 (Model 사용)
4. **비즈니스 로직**: 계산, 검증, 토큰 생성, 데이터 가공
5. **순수 데이터 반환**: HTTP 모르는 순수 객체 반환

### 코드 예시
```javascript
const googleLogin = async (credential) => {
  // 1️⃣ 입력 검증
  if (!credential) {
    throw new Error("Google 인증 토큰이 필요합니다");
  }
  
  // 2️⃣ 외부 API 호출 (Google 검증)
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const { email, name, sub: googleId, picture } = payload;
  
  // 3️⃣ DB 작업
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      email,
      name,
      password: Math.random().toString(36).slice(-8) + "Aa1!",
      googleId,
      profilePicture: picture,
    });
  } else {
    if (!user.googleId) {
      user.googleId = googleId;
      user.profilePicture = picture;
      await user.save();
    }
  }
  
  // 4️⃣ 비즈니스 로직 (JWT 생성, 데이터 필터링)
  const token = generateToken(user._id);
  
  // 5️⃣ 순수 객체 반환 (res.json 사용 안 함!)
  return {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
      // password는 제외! (보안)
    },
    token,
  };
};
```

### Service는 하지 않는 것 ❌
- `req`, `res` 사용
- HTTP 상태코드 설정
- `res.json()` 호출
- HTTP 관련 처리 (쿠키, 헤더 등)

### Service가 알아야 할 것 ✅
- 비즈니스 규칙 (회원가입 조건, 결제 로직 등)
- DB 스키마 구조
- 외부 API 사용법
- 보안 (어떤 데이터를 반환할지)

---

## 📊 비교표

| 구분 | Controller | Service |
|------|-----------|---------|
| **의존하는 것** | HTTP, Express | 비즈니스 규칙, DB |
| **입력** | `req.body`, `req.params` | 순수 JavaScript 값 |
| **출력** | `res.json()` 호출 | 순수 객체/값 반환 |
| **에러 처리** | HTTP 상태코드 설정 | `throw new Error()` |
| **DB 접근** | ❌ 안 함 | ✅ 함 (Model 사용) |
| **외부 API** | ❌ 안 함 | ✅ 함 |
| **재사용성** | ❌ HTTP에만 | ✅ 어디서든 가능 |
| **테스트** | HTTP 모킹 필요 | 순수 함수 테스트 |

---

## 🔄 데이터 흐름

```
Frontend
  ↓ HTTP Request
Route (라우터)
  ↓ req, res 전달
Controller (HTTP 계층)
  ↓ 순수 데이터만 전달
Service (비즈니스 로직)
  ↓ DB 쿼리
Model (MongoDB)
  ↓ DB 결과
Service (데이터 가공)
  ↓ 순수 객체 반환
Controller (HTTP 응답)
  ↓ res.json()
Frontend
```

---

## 💡 왜 이렇게 나누나요?

### 1. 재사용성
```javascript
// ✅ Service는 CLI, 테스트, 다른 API에서도 사용 가능
const result = await authService.googleLogin(credential);

// ❌ Controller는 req, res 없으면 사용 불가
await authController.googleLogin(req, res); // CLI에서 불가능
```

### 2. 테스트 용이성
```javascript
// ✅ Service 테스트 (순수 함수)
test('Google login creates user', async () => {
  const result = await authService.googleLogin('test-token');
  expect(result.user.email).toBe('test@gmail.com');
});

// ❌ Controller 테스트 (req, res 모킹 필요)
test('Controller', async () => {
  const req = { body: { credential: 'test' } };
  const res = { json: jest.fn() };
  await authController.googleLogin(req, res);
});
```

### 3. 유지보수성
```javascript
// ✅ Service 로직만 수정 (Controller 영향 없음)
const googleLogin = async (credential) => {
  // 비즈니스 로직 변경
  if (isBlacklisted(email)) {
    throw new Error("차단된 사용자입니다");
  }
  // ...
};

// ❌ Controller에 비즈니스 로직 섞이면 수정 어려움
```

---

## 🎯 실전 팁

### Controller에서는
```javascript
// ✅ 좋은 예
const signup = async (req, res) => {
  const { email, password, name } = req.body;
  const result = await authService.signup({ email, password, name });
  res.status(201).json({ success: true, data: result });
};

// ❌ 나쁜 예 (비즈니스 로직 포함)
const signup = async (req, res) => {
  const user = await User.create(req.body); // DB 직접 접근
  const token = jwt.sign({ id: user._id }, secret); // JWT 생성
  res.json({ user, token });
};
```

### Service에서는
```javascript
// ✅ 좋은 예
const signup = async ({ email, password, name }) => {
  if (!email || !password || !name) {
    throw new Error("모든 필드를 입력해주세요");
  }
  const user = await User.create({ email, password, name });
  return { user, token: generateToken(user._id) };
};

// ❌ 나쁜 예 (HTTP 의존)
const signup = async (req, res) => {
  const user = await User.create(req.body); // req 사용
  res.json({ user }); // res 사용
};
```

---

## 📝 요약

| 계층 | 역할 | 비유 |
|------|------|------|
| **Route** | 주소 매핑 (`/api/auth/google`) | 우체국 분류 |
| **Controller** | HTTP 요청/응답 처리 | 우편 배달부 |
| **Service** | 비즈니스 로직 실행 | 실제 업무 담당자 |
| **Model** | DB 스키마 정의 | 데이터 저장소 |

**핵심**: Controller는 "택배 받고 전달", Service는 "실제 작업 처리"! 🚀
