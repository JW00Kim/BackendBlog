# 배포 및 오류 해결 기록

## 프로젝트 개요
- **프론트엔드**: React + Vite → Vercel (https://jiwooresume.vercel.app)
- **백엔드**: Express 5.2.1 + MongoDB → Vercel (https://backend-blog-snowy.vercel.app/api)
- **주요 기능**: 사용자 인증, 게시물 CRUD

---

## 🔴 주요 문제 및 해결 과정

### 1. CORS Preflight 에러 (최초 문제)
**증상:**
```
Access to XMLHttpRequest blocked by CORS policy: 
Response to preflight request doesn't pass access control check
```

**원인:**
- OPTIONS 요청이 200 OK를 반환하지 못함
- Vercel 배포 시 라우팅이 제대로 설정되지 않음

**시도한 해결책 (실패):**
- ❌ `cors()` 패키지 옵션 설정
- ❌ 수동 CORS 헤더 추가
- ❌ `vercel.json`에 headers 설정
- ❌ DB 연결 미들웨어 제거

---

### 2. Express 5 호환성 문제 ⭐ (핵심 문제 #1)
**증상:**
```javascript
TypeError: Missing parameter name at index 1: *
```

**원인:**
```javascript
// ❌ Express 5에서 지원하지 않는 문법
app.options("*", (req, res) => {...})
```

**해결:**
```javascript
// ✅ Express 5에서는 "*" 경로를 지원하지 않음
// cors() 미들웨어가 자동으로 OPTIONS 처리
app.use(cors());
```

**배운 점:**
- Express 5는 경로 파싱이 더 엄격함
- `*` 와일드카드 대신 정규식이나 다른 방법 사용 필요
- `cors` 패키지가 OPTIONS 요청을 자동 처리하므로 별도 핸들러 불필요

---

### 3. Vercel 설정 문제 ⭐ (핵심 문제 #2)
**증상:**
```
404 NOT_FOUND 또는 FUNCTION_INVOCATION_FAILED
```

**원인:**
잘못된 `vercel.json` 설정
```json
// ❌ 잘못된 설정 (경고 발생)
{
  "version": 2,
  "builds": [{"src": "index.js", "use": "@vercel/node"}],
  "routes": [{"src": "/(.*)", "dest": "index.js"}]
}
```

**해결:**
```json
// ✅ 올바른 설정 (Vercel 권장 방식)
{
  "rewrites": [
    {"source": "/(.*)", "destination": "/api"}
  ]
}
```

**파일 구조:**
```
backend/
├── index.js          # Express 앱
├── api/
│   └── index.js      # module.exports = require('../index')
└── vercel.json       # rewrites 설정
```

**배운 점:**
- `builds`는 구형 방식이며 경고 발생
- Vercel은 `/api` 디렉토리를 자동으로 서버리스 함수로 인식
- `rewrites`로 모든 요청을 `/api`로 리다이렉트

---

### 4. "next is not a function" 에러 ⭐⭐ (최대 난제)
**증상:**
```json
{"error": "next is not a function"}
```

**시도한 해결책 (모두 실패):**
1. ❌ 미들웨어를 `async function`으로 변경
2. ❌ 미들웨어를 화살표 함수로 변경  
3. ❌ Promise 체인 방식으로 변경
4. ❌ 인라인으로 인증 로직 작성
5. ❌ `return next()` 명시적 호출

**실제 원인:**
Mongoose 스키마의 `pre` 훅 문제!

```javascript
// ❌ 문제 코드 (backend/models/Post.js)
postSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();  // ← Mongoose 7+에서는 next가 없음!
});
```

**해결:**
```javascript
// ✅ 올바른 코드
postSchema.pre("save", function () {
  this.updatedAt = Date.now();
  // next() 호출 불필요 - Mongoose가 자동 처리
});
```

**배운 점:**
- Mongoose 7+ 버전에서는 `next` 파라미터를 제공하지 않음
- 미들웨어는 자동으로 다음 단계로 진행됨
- 에러 메시지가 실제 문제 위치와 다를 수 있음 (라우트가 아닌 모델에서 발생)

---

### 5. Serverless 환경 문제
**증상:**
```
FUNCTION_INVOCATION_FAILED
```

**원인:**
```javascript
// ❌ Serverless에서 작동하지 않음
app.listen(PORT, () => {...})
```

**해결:**
```javascript
// ✅ 조건부 실행
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {...});
}

// 또는 완전히 제거
module.exports = app;
```

**배운 점:**
- Vercel Serverless는 `listen()` 불필요
- Express 앱을 export만 하면 Vercel이 자동 처리

---

## 📊 문제 발생 타임라인

1. **CORS 에러** (30분)
   - 여러 CORS 설정 시도
   - vercel.json 수정 반복

2. **Express 5 호환성** (20분)
   - `app.options("*")` 제거
   - 404/500 에러 해결

3. **"next is not a function"** (60분) ⭐
   - 미들웨어 재작성 10회+
   - 다양한 패턴 시도
   - 최종적으로 Mongoose 모델이 원인 발견

4. **Vercel 설정** (10분)
   - `builds` → `rewrites` 변경

---

## ✅ 최종 작동 구성

### Backend (Express 5.2.1)
```javascript
// index.js - 심플하게 유지
const app = express();

app.use(cors());  // OPTIONS 자동 처리
app.use(express.json());

connectDB();  // await 불필요

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);

module.exports = app;  // listen() 제거
```

### Mongoose 모델
```javascript
// models/Post.js
postSchema.pre("save", function () {
  this.updatedAt = Date.now();
  // next() 호출 안함!
});
```

### Vercel 설정
```json
// vercel.json
{
  "rewrites": [
    {"source": "/(.*)", "destination": "/api"}
  ]
}
```

### API 엔트리
```javascript
// api/index.js
module.exports = require('../index');
```

---

## 🎯 향후 에러 예방 가이드

### 1. Express 버전 업그레이드 시
- [ ] 경로 패턴 변경사항 확인 (`*` 지원 여부)
- [ ] 미들웨어 시그니처 변경사항 확인
- [ ] 공식 마이그레이션 가이드 읽기

### 2. Mongoose 버전 업그레이드 시
- [ ] `pre/post` 훅의 `next()` 사용 여부 확인
- [ ] 최신 문서에서 권장 패턴 확인
- [ ] Mongoose 7+ 이상은 `next` 파라미터 제거됨 인지

### 3. Vercel 배포 시
- [ ] `builds` 대신 `rewrites` 사용
- [ ] `/api` 디렉토리 구조 유지
- [ ] `app.listen()` 제거 또는 조건부 실행
- [ ] Runtime Logs에서 실제 에러 확인

### 4. CORS 문제 디버깅
- [ ] `curl -X OPTIONS [URL] -v`로 preflight 테스트
- [ ] `cors()` 패키지로 충분 (수동 헤더 불필요)
- [ ] Vercel inspect 링크에서 로그 확인

### 5. "next is not a function" 에러 시
1. 라우트 핸들러 확인
2. **Mongoose 스키마 훅 확인** ⭐
3. 커스텀 미들웨어 확인
4. 사용 중인 패키지 버전 확인

---

## 🔧 디버깅 체크리스트

```bash
# 1. 로컬에서 앱 로딩 테스트
node -e "const app = require('./index.js'); console.log('OK')"

# 2. 특정 라우트 파일 문법 체크
node -c routes/posts.js

# 3. Vercel 로그 확인
# → vercel.com에서 Inspect 링크 클릭
# → Runtime Logs 섹션에서 실제 에러 확인

# 4. CORS preflight 테스트
curl -X OPTIONS https://[도메인]/api/auth/login \
  -H "Origin: https://프론트엔드-도메인" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

---

## 📚 참고 링크

- [Express 5.x 공식 문서](https://expressjs.com/en/5x/api.html)
- [Mongoose 7.x Migration Guide](https://mongoosejs.com/docs/migrating_to_7.html)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [CORS 문제 해결 가이드](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

## 💡 핵심 교훈

1. **에러 메시지를 맹신하지 말 것**
   - "next is not a function"이 라우트가 아닌 모델에서 발생

2. **최신 버전 문서 확인**
   - Express 5, Mongoose 7+ 등 메이저 버전 업데이트 주의

3. **단계적 디버깅**
   - 가장 간단한 코드부터 시작해서 하나씩 추가

4. **Vercel 로그 활용**
   - 브라우저 콘솔보다 서버 로그가 정확함

5. **패키지 자동 처리 신뢰**
   - `cors()` 패키지가 OPTIONS 자동 처리
   - Mongoose가 훅 자동 진행
   - 불필요한 수동 처리 지양
