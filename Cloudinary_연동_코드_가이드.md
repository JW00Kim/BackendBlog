# 🖼️ Cloudinary 이미지 업로드 연동 가이드

> **최종 완성일:** 2025-12-30  
> **아키텍처:** Vercel Serverless + Cloudinary + MongoDB

---

## 📋 핵심 흐름도

```
사용자가 이미지 선택
    ↓
FormData에 이미지 + 텍스트 데이터 담기
    ↓
POST /api/posts 요청
    ↓
parseFormData 미들웨어 (Busboy로 파싱)
    ↓
uploadImageBuffer (Cloudinary SDK 호출)
    ↓
Cloudinary 클라우드에 저장 → secure_url 반환
    ↓
MongoDB에 게시물 + 이미지 URL 저장
    ↓
프론트엔드에서 이미지 표시
```

---

## 1️⃣ 백엔드: Busboy 파서 (`middleware/parseFormData.js`)

### 📌 왜 Busboy를 사용하나?

**Vercel Serverless 환경의 문제:**
- Multer는 `/tmp` 디렉토리에 파일을 일시 저장
- 메모리 제한: 512MB (대량의 파일 업로드 시 메모리 초과)
- **해결:** Busboy는 메모리에서 직접 파싱 → 버퍼로 변환

### 🔧 핵심 코드

```javascript
// 1. FormData 요청 감지
const contentType = req.headers["content-type"];
if (!contentType || !contentType.includes("multipart/form-data")) {
  return next(); // FormData가 아니면 통과
}

// 2. Busboy 인스턴스 생성
const bb = busboy({
  headers: req.headers,
  limits: {
    fileSize: 8 * 1024 * 1024, // 최대 8MB
    files: 5, // 최대 5개 파일
  },
});

// 3. 파일 이벤트 핸들링
bb.on("file", (fieldname, file, info) => {
  const chunks = [];
  
  // 파일 데이터를 청크로 받음
  file.on("data", (data) => {
    chunks.push(data);
  });
  
  // 파일 파싱 완료
  file.on("end", () => {
    const buffer = Buffer.concat(chunks); // 청크들을 하나의 버퍼로
    req.files.push({
      fieldname,
      originalname: info.filename,
      mimetype: info.encoding,
      size: buffer.length,
      buffer, // ← 이 버퍼가 Cloudinary에 전송됨
    });
    filesProcessed++;
  });
});

// 4. 폼 필드 (텍스트 데이터) 처리
bb.on("field", (fieldname, val) => {
  req.body[fieldname] = val; // { title, content, ... }
});

// 5. 모든 파일 파싱 완료 대기
bb.on("close", () => {
  // ⚠️ 중요: 파일 파싱이 완료될 때까지 대기
  if (filesProcessed < fileCount) {
    const waitInterval = setInterval(() => {
      if (filesProcessed >= fileCount) {
        clearInterval(waitInterval);
        next(); // 다음 미들웨어로
      }
    }, 10);
    setTimeout(() => clearInterval(waitInterval), 5000); // 최대 5초 대기
  }
});
```

### ✨ 핵심 포인트
- **비동기 처리:** 파일 파싱 완료를 기다려야 함 (안 그러면 req.files가 비어있음)
- **메모리 효율:** 스트림 처리로 메모리 사용 최소화
- **에러 처리:** file/stream/busboy 에러를 모두 캡처

---

## 2️⃣ 백엔드: Cloudinary 래퍼 (`lib/cloudinary.js`)

### 📌 왜 래퍼가 필요한가?

**Cloudinary SDK 특성:**
- 설정이 전역으로 이루어짐
- 타임아웃 처리 필요 (기본 30초)
- 에러 재시도 로직 구현 필요

### 🔧 핵심 코드

```javascript
const cloudinary = require("cloudinary").v2;
let configured = false;

// 1. 설정 초기화 (한 번만)
function ensureConfigured() {
  if (configured) return; // 이미 설정됨
  
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;
  
  // 환경변수 검증
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary 환경변수가 설정되지 않았습니다");
  }
  
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
  
  configured = true;
}

// 2. 버퍼를 Cloudinary에 업로드
function uploadImageBuffer(buffer, options = {}) {
  ensureConfigured();
  
  return new Promise((resolve, reject) => {
    // ⚠️ 타임아웃: 35초 (Vercel 기본 제한은 30초이므로 안전마진)
    const timeoutHandle = setTimeout(() => {
      reject(new Error("Cloudinary upload timeout (35s)"));
    }, 35000);
    
    // upload_stream: 스트림 기반 업로드 (메모리 효율)
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "blog-posts", // Cloudinary에서 폴더 구조
        resource_type: "image",
        ...options,
      },
      (error, result) => {
        clearTimeout(timeoutHandle);
        if (error) return reject(error);
        
        // 결과: { secure_url: "https://...", public_id: "...", ... }
        resolve(result);
      }
    );
    
    // 버퍼 데이터를 스트림에 전송
    stream.end(buffer);
  });
}
```

### ✨ 핵심 포인트
- **Promise 래핑:** 콜백 기반 Cloudinary API를 Promise로 변환
- **스트림 업로드:** `upload_stream`으로 메모리 효율적
- **타임아웃:** 35초로 설정 (Vercel 10초 제한은 아니고, 내부적으로 버퍼링)

---

## 3️⃣ 백엔드: 게시물 라우트 (`routes/posts.js`)

### 🔧 핵심 코드

```javascript
router.post("/", parseFormData, async (req, res) => {
  // 1. JWT 토큰 검증
  const authHeader = req.headers.authorization;
  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.id;
  
  try {
    const { title, content } = req.body; // parseFormData에서 파싱됨
    
    // 2. 이미지 업로드 (병렬 처리)
    let images = [];
    if (req.files?.length) {
      // ✨ Promise.all: 모든 이미지를 동시에 업로드
      images = await Promise.all(
        req.files.map(async (file) => {
          const result = await uploadImageBuffer(file.buffer, {
            folder: "blog-posts",
          });
          return result.secure_url; // "https://res.cloudinary.com/..."
        })
      );
    }
    
    // 3. MongoDB에 게시물 저장
    const post = await Post.create({
      title,
      content,
      images, // Cloudinary URL 배열
      author: userId,
    });
    
    // 4. 성공 응답
    res.status(201).json({
      success: true,
      data: { post },
    });
    
  } catch (error) {
    // 5. 에러 응답 (환경변수 상태 포함)
    res.status(500).json({
      success: false,
      message: error.message,
      details: {
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? "있음" : "없음",
        CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? "있음" : "없음",
        CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? "있음" : "없음",
      },
    });
  }
});
```

### ✨ 핵심 포인트
- **미들웨어 체이닝:** `parseFormData` → 라우트 핸들러
- **병렬 업로드:** `Promise.all`로 모든 이미지 동시 업로드 (빠름)
- **URL 저장:** Cloudinary `secure_url`만 DB에 저장 (실제 이미지는 Cloudinary 서버에)

---

## 4️⃣ 프론트엔드: API 설정 (`src/api.js`)

### 🔧 핵심 코드

```javascript
// 1. Axios 인스턴스
const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
});

// 2. FormData 업로드 함수
export const createPost = async (postData) => {
  // FormData 생성
  const formData = new FormData();
  formData.append("title", postData.title);
  formData.append("content", postData.content);
  
  // 이미지 파일들 추가
  postData.images.forEach((imageFile) => {
    formData.append("images", imageFile); // 같은 필드명으로 여러 파일
  });
  
  // ⚠️ 중요: Content-Type을 자동 설정하지 않기
  // 브라우저가 multipart/form-data 경계를 자동으로 생성
  const response = await api.post("/posts", formData, {
    headers: {
      // "Content-Type": "application/json" ← 절대 금지!
    },
  });
  
  return response.data;
};

// 3. 에러 인터셉터 (디버깅)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ API 에러:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data, // ← 백엔드 에러 메시지 & details
    });
    return Promise.reject(error);
  }
);
```

### ✨ 핵심 포인트
- **FormData 필수:** 이미지는 JSON이 아닌 FormData로 전송
- **Content-Type 금지:** 명시적 설정하면 multipart 경계 깨짐
- **같은 필드명:** `formData.append("images", file1)` 여러 번 → 배열처럼 처리

---

## 5️⃣ 프론트엔드: 게시물 생성 컴포넌트 (`PostCreate.jsx`)

### 🔧 핵심 코드

```javascript
const PostCreate = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]); // File 객체 배열
  const [previews, setPreviews] = useState([]); // 로컬 미리보기 URL
  
  // 1. 파일 선택 핸들러
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files); // FileList → Array
    setImages(files);
    
    // 2. 로컬 미리보기 생성 (URL.createObjectURL)
    const previewUrls = files.map((file) => URL.createObjectURL(file));
    setPreviews(previewUrls);
  };
  
  // 3. 게시물 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // API 호출 (자동으로 FormData로 변환)
      const response = await createPost({
        title,
        content,
        images, // File 객체 배열
      });
      
      if (response.success) {
        alert("게시물이 작성되었습니다!");
        // 상태 초기화
        setTitle("");
        setContent("");
        setImages([]);
        setPreviews([]);
      }
    } catch (error) {
      // error.response.data.details에 Cloudinary 환경변수 상태 포함
      alert(`에러: ${error.response?.data?.message}`);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="내용"
      />
      
      {/* 파일 입력 */}
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleImageSelect}
      />
      
      {/* 미리보기 */}
      <div className="previews">
        {previews.map((url, idx) => (
          <img key={idx} src={url} alt="preview" />
        ))}
      </div>
      
      <button type="submit">게시물 작성</button>
    </form>
  );
};
```

### ✨ 핵심 포인트
- **File 객체:** `<input type="file">`에서 얻은 File 객체 그대로 전송
- **로컬 미리보기:** `URL.createObjectURL(file)` (Blob URL)
- **메모리 정리:** 페이지 떠날 때 `URL.revokeObjectURL(url)` 호출 권장

---

## 🔑 환경변수 설정

### 로컬 개발 (`backend/.env`)
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Vercel 프로덕션
1. https://vercel.com → `backend-blog` 프로젝트
2. **Settings > Environment Variables**
3. 위 3개 변수 추가

> ⚠️ **주의:** API_SECRET은 절대 프론트엔드에 노출되면 안 됨!

---

## 🐛 트러블슈팅

### 문제 1: `Invalid cloud_name`
**원인:** Vercel 환경변수가 잘못됨
```bash
# 확인 방법: 에러 응답의 details 필드 확인
# "CLOUDINARY_CLOUD_NAME": "있음" ← 설정됨
# "CLOUDINARY_API_KEY": "없음" ← 미설정!
```

**해결:** Vercel 대시보드에서 환경변수 재확인 후 재배포

### 문제 2: `Busboy timeout (5s)`
**원인:** 파일이 너무 큼 (8MB 초과)
**해결:** `middleware/parseFormData.js`의 `fileSize` 제한 증가
```javascript
limits: {
  fileSize: 16 * 1024 * 1024, // 16MB로 증가
}
```

### 문제 3: FormData의 `Content-Type: application/json` 에러
**원인:** 명시적으로 JSON 헤더 설정함
**해결:** FormData 전송 시 헤더 명시 금지
```javascript
// ❌ 잘못된 예
await api.post("/posts", formData, {
  headers: { "Content-Type": "application/json" }
});

// ✅ 올바른 예
await api.post("/posts", formData);
// 또는
await api.post("/posts", formData, {
  headers: {} // 비워두기
});
```

---

## 📊 데이터 흐름 요약

```
┌─────────────────────────────────────────────────────────┐
│ 프론트엔드 (React)                                        │
│ ┌────────────────────────────────────────────────────┐  │
│ │ PostCreate.jsx                                     │  │
│ │ - File 객체 수집                                    │  │
│ │ - FormData 생성                                    │  │
│ │ - createPost() 호출                                │  │
│ └────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────┘
                           │
                        HTTP POST
                           │
┌──────────────────────────▼──────────────────────────────┐
│ 백엔드 (Express)                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ parseFormData 미들웨어                              │  │
│ │ - Busboy로 FormData 파싱                           │  │
│ │ - req.files[] 에 File 객체 저장                     │  │
│ │ - req.body 에 텍스트 필드 저장                      │  │
│ └────────────────────────────────────────────────────┘  │
│                         │                                │
│ ┌────────────────────────▼────────────────────────────┐ │
│ │ routes/posts.js                                     │ │
│ │ - uploadImageBuffer() 호출 (Promise.all)            │ │
│ │ - Cloudinary URL 배열 얻음                           │ │
│ │ - Post.create() 로 DB 저장                          │ │
│ └────────────────────────────────────────────────────┘ │
│                         │                                │
│ ┌────────────────────────▼────────────────────────────┐ │
│ │ lib/cloudinary.js                                   │ │
│ │ - upload_stream() 으로 버퍼 업로드                   │ │
│ │ - Cloudinary 서버가 이미지 저장                      │ │
│ │ - secure_url 반환                                   │ │
│ └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│ 외부 서비스                                               │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Cloudinary CDN                                     │  │
│ │ - 이미지 저장 및 최적화                              │  │
│ │ - global CDN으로 빠른 로딩                           │  │
│ └────────────────────────────────────────────────────┘  │
│ ┌────────────────────────────────────────────────────┐  │
│ │ MongoDB Atlas                                      │  │
│ │ - Post 문서 저장 (Cloudinary URL 포함)              │  │
│ └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 🚀 성능 최적화 팁

1. **병렬 업로드:** `Promise.all`로 여러 이미지 동시 업로드
2. **메모리 관리:** Busboy의 스트림 처리로 메모리 초과 방지
3. **CDN 활용:** Cloudinary는 자동으로 이미지 최적화 및 CDN 제공
4. **로컬 미리보기:** Blob URL로 실시간 프리뷰 (용량 효율)

---

## ✅ 체크리스트

- [ ] Cloudinary 계정 생성
- [ ] Cloud Name, API Key, API Secret 확인
- [ ] `.env` 파일에 환경변수 설정
- [ ] Vercel 대시보드에서 환경변수 설정
- [ ] 로컬에서 이미지 업로드 테스트
- [ ] 프로덕션 배포 후 테스트
- [ ] `middleware/upload.js` 삭제 (더 이상 사용 안 함)
