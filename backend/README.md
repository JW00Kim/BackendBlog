# Backend API - Express + MongoDB

Node.js, Express, MongoDB를 사용한 RESTful API 백엔드입니다.

## 🚀 시작하기

### 1. 패키지 설치

```bash
cd backend
npm install
```

### 2. 환경 변수 설정

`.env.example` 파일을 `.env`로 복사하고 MongoDB URI를 설정하세요.

```bash
cp .env.example .env
```

### 3. MongoDB Atlas 설정 (무료)

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 회원가입
2. 무료 클러스터 생성 (M0 Free)
3. Database Access에서 사용자 생성
4. Network Access에서 0.0.0.0/0 추가 (모든 IP 허용)
5. Connect > Connect your application > 연결 문자열 복사
6. `.env` 파일에 붙여넣기

### 4. 로컬 서버 실행

```bash
npm run dev  # nodemon으로 개발 모드 실행 (파일 변경시 자동 재시작)
# 또는
npm start    # 일반 실행
```

서버가 http://localhost:5000 에서 실행됩니다.

## 📡 API 엔드포인트

### 서버 상태 확인

```bash
GET /api
```

### Todo CRUD

```bash
# 모든 Todo 조회
GET /api/todos

# Todo 생성
POST /api/todos
Content-Type: application/json
{
  "title": "할 일"
}

# Todo 업데이트
PUT /api/todos/:id
Content-Type: application/json
{
  "title": "수정된 할 일",
  "completed": true
}

# Todo 삭제
DELETE /api/todos/:id
```

## 🧪 API 테스트

### curl 사용

```bash
# 서버 상태 체크
curl http://localhost:5000/api

# Todo 생성
curl -X POST http://localhost:5000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"테스트 할 일"}'

# Todo 조회
curl http://localhost:5000/api/todos
```

### 또는 Thunder Client / Postman 사용

VS Code에서 Thunder Client 익스텐션을 설치하면 GUI로 API를 테스트할 수 있습니다.

## 📦 Vercel 배포

### 1. Vercel CLI 설치

```bash
npm install -g vercel
```

### 2. 배포

```bash
cd backend
vercel
```

### 3. 환경 변수 설정

Vercel 대시보드 또는 CLI로 환경 변수 추가:

```bash
vercel env add MONGODB_URI
```

### 4. 프로덕션 배포

```bash
vercel --prod
```

배포된 URL: `https://your-project.vercel.app`

## 📝 주요 명령어

- `npm run dev` - 개발 모드로 서버 실행 (nodemon)
- `npm start` - 프로덕션 모드로 서버 실행
- `vercel` - Vercel에 배포
- `vercel --prod` - 프로덕션 배포

## 🛠️ 사용된 패키지

- **express** - 웹 프레임워크
- **mongoose** - MongoDB ODM
- **cors** - Cross-Origin Resource Sharing 설정
- **dotenv** - 환경 변수 관리
- **nodemon** (dev) - 개발시 자동 재시작
