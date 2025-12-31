# 🖼️ 파일 수집 → API 요청 → MongoDB 저장 → Cloudinary 업로드 (완전 상세 가이드)

> **목표:** 프론트엔드에서 파일을 선택하는 순간부터 Cloudinary에 업로드되어 MongoDB에 저장되기까지의 **모든 코드와 흐름**을 상세히 이해하기

---

## 📍 전체 흐름도

```
사용자가 파일 선택
    ↓
File 객체 메모리에 저장
    ↓
FormData에 File 객체 담기
    ↓
API 요청 (axios.post)
    ↓
[백엔드] Busboy 파서로 파싱
    ↓
[백엔드] req.files[0].buffer = 바이너리 데이터
    ↓
[백엔드] uploadImageBuffer(buffer) 호출
    ↓
[Cloudinary] 클라우드에 저장 → secure_url 반환
    ↓
[백엔드] MongoDB Post 문서 생성 (images: [url])
    ↓
[클라이언트] 응답 수신 (post 객체)
    ↓
화면에 이미지 표시 (resolveImageUrl)
```

---

## 🎬 실제 게시물 작성 페이지에서의 완전한 코드 흐름

### **시작: "작성하기" 버튼 클릭**

```jsx
// ============================================
// 👉 프론트: PostCreate.jsx
// ============================================

import { useState } from "react";
import { createPost } from "../api";  // ← 여기서 임포트!

function PostCreate() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);

  // 사용자가 "작성하기" 버튼을 클릭하면 호출
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 📤 Step 1: 데이터 준비
    const postData = {
      title,
      content,
      images,  // File[] 배열
    };

    try {
      // 📤 Step 2: createPost() 함수 호출 (api.js로 이동)
      //    ↓
      //    ↓ createPost는 api.js에서 export된 async 함수
      //    ↓
      const response = await createPost(postData);
      //               ↑
      //               └─ Promise가 resolve될 때까지 대기
      //                  (응답이 올 때까지 실행 멈춤)

      console.log("✅ 성공:", response);
      alert("게시물이 작성되었습니다!");

    } catch (error) {
      console.error("❌ 실패:", error);
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
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => setImages(Array.from(e.target.files))}
      />
      <button type="submit">작성하기 ← 이 버튼을 클릭!</button>
    </form>
  );
}

export default PostCreate;
```

### **호출 체인: handleSubmit → createPost → 백엔드**

```
┌─────────────────────────────────────────────────────────┐
│ 1️⃣ PostCreate.jsx - handleSubmit()                      │
│    const response = await createPost(postData)          │
└──────────────────────┬──────────────────────────────────┘
                       │ (import { createPost } from "../api")
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 2️⃣ api.js - createPost(postData)                        │
│    const formData = new FormData()                       │
│    formData.append("title", ...)                        │
│    formData.append("images", ...)                       │
│    const response = await api.post("/posts", formData)  │
└──────────────────────┬──────────────────────────────────┘
                       │ (axios 라이브러리 사용)
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 3️⃣ axios 요청 인터셉터                                   │
│    api.interceptors.request.use(...)                    │
│    Authorization: Bearer [token]                        │
│    Content-Type: multipart/form-data                    │
└──────────────────────┬──────────────────────────────────┘
                       │ (HTTPS POST 요청)
                       ↓
                  🌍 인터넷 전송
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 4️⃣ backend/index.js - 미들웨어 체인                    │
│    app.use(parseFormData)                               │
│    ↓ (FormData를 req.files에 파싱)                     │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 5️⃣ backend/routes/posts.js - POST /api/posts           │
│    const { uploadImageBuffer } = require("../lib/cloudinary")
│    images = await Promise.all(                          │
│      req.files.map(file => uploadImageBuffer(file.buffer))
│    )                                                    │
└──────────────────────┬──────────────────────────────────┘
                       │ (각각 Promise 객체)
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 6️⃣ lib/cloudinary.js - uploadImageBuffer(buffer)       │
│    return new Promise((resolve, reject) => {            │
│      cloudinary.uploader.upload_stream(...)             │
│    })                                                   │
└──────────────────────┬──────────────────────────────────┘
                       │ (모든 Promise가 resolve될 때까지 대기)
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 7️⃣ Cloudinary CDN - 이미지 저장                         │
│    secure_url 반환                                       │
│    "https://res.cloudinary.com/..."                    │
└──────────────────────┬──────────────────────────────────┘
                       │ (모든 업로드 완료)
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 8️⃣ backend/routes/posts.js - MongoDB 저장             │
│    const post = await Post.create({                     │
│      title,                                             │
│      content,                                           │
│      images: ["https://...", "https://..."],            │
│      author: userId                                     │
│    })                                                   │
└──────────────────────┬──────────────────────────────────┘
                       │ (MongoDB 응답)
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 9️⃣ 백엔드 응답 반환                                      │
│    res.status(201).json({                              │
│      success: true,                                     │
│      data: { post }                                     │
│    })                                                   │
└──────────────────────┬──────────────────────────────────┘
                       │ (HTTPS 응답)
                       ↓
                  🌍 인터넷 전송
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 🔟 api.js - response 인터셉터                            │
│    api.interceptors.response.use(...)                   │
│    (응답 처리)                                           │
└──────────────────────┬──────────────────────────────────┘
                       │ (Promise resolve)
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 1️⃣1️⃣ PostCreate.jsx - handleSubmit 재개                 │
│    const response = await createPost(postData)          │
│                     ↑                                   │
│                     └─ 이제 완료!                       │
│    alert("게시물이 작성되었습니다!")                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🔀 Promise로 감싸는 이유 (vs 콜백 vs Async/Await)

### **문제 상황: 콜백 기반의 Cloudinary API**

```javascript
// ❌ Cloudinary의 원래 API (콜백 기반)
cloudinary.uploader.upload_stream(
  { folder: "blog-posts" },
  (error, result) => {
    if (error) {
      console.error("업로드 실패:", error);
      // 여기서는 실패 처리만 가능
      // 밖에서 에러를 어떻게 받지?
    } else {
      console.log("업로드 성공:", result.secure_url);
      // 여기서도 성공 처리만 가능
      // 결과를 어떻게 반환하지?
    }
  }
);
// 함수는 즉시 undefined를 반환
// 결과를 기다릴 수 없음!
```

**문제점:**
- 콜백 기반 API는 "나중에 호출될 함수"만 제공
- 함수의 결과를 직접 반환할 수 없음
- 에러 처리와 성공 처리를 섞어야 함

---

### **해결책 1: Promise로 감싸기 ✅**

```javascript
// ✅ Promise로 감싸기 (가장 안전)
function uploadImageBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      reject(new Error("Cloudinary upload timeout (35s)"));
    }, 35000);

    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        clearTimeout(timeoutHandle);
        
        if (error) {
          reject(error);  // ← reject() 호출: 실패 신호
        } else {
          resolve(result);  // ← resolve() 호출: 성공 신호 + 값 반환
        }
      }
    );

    stream.on("error", (err) => {
      clearTimeout(timeoutHandle);
      reject(err);
    });

    stream.end(buffer);
  });
}

// 이제 사용하는 곳에서:
const result = await uploadImageBuffer(buffer);
// ✅ result를 직접 변수에 저장 가능!
// ✅ 에러도 try/catch로 처리 가능!
```

**장점:**
- ✅ 동기적 코드처럼 쓸 수 있음 (`await` 사용)
- ✅ `try/catch`로 에러 처리 가능
- ✅ 값을 직접 반환받을 수 있음
- ✅ Promise 체이닝 가능
- ✅ 타임아웃 같은 추가 로직 추가 가능

---

### **해결책 2: Promise.all()로 병렬 처리 ✅**

```javascript
// ❌ 순차 처리 (느림)
const url1 = await uploadImageBuffer(files[0]);
const url2 = await uploadImageBuffer(files[1]);
const url3 = await uploadImageBuffer(files[2]);
// 총 시간: 30초 + 30초 + 30초 = 90초

// ✅ Promise.all()로 병렬 처리 (빠름)
const urls = await Promise.all([
  uploadImageBuffer(files[0]),
  uploadImageBuffer(files[1]),
  uploadImageBuffer(files[2]),
]);
// 총 시간: 30초 (모두 동시 실행!)

// 실제 코드:
images = await Promise.all(
  req.files.map(async (file, index) => {
    const result = await uploadImageBuffer(file.buffer, {
      folder: "blog-posts",
    });
    return result.secure_url;
  })
);
// images = ["https://...", "https://...", "https://..."]
```

**왜 Promise.all()이 효과적인가?**

```
❌ 순차 처리 (Sequential):
  파일1: ████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░ (30초)
         └─ Cloudinary에 요청 중...
  파일2: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████████████████████████ (30초)
         └─ 파일1이 완료된 후에 시작
  파일3: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████████ (30초)
         └─ 파일2가 완료된 후에 시작
  ───────────────────────────────────────────────────────────
  총 시간: 90초

✅ 병렬 처리 (Parallel with Promise.all()):
  파일1: ████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░
  파일2: ████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░
  파일3: ████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░
         └─ 동시에 요청!
  ───────────────────────────────────────────────────────────
  총 시간: 30초 (3배 빠름!)
```

---

### **콜백 vs Promise vs Async/Await 비교**

```javascript
// ❌ 방식 1: 콜백 (Callback Hell)
function uploadWithCallback(buffer, callback) {
  cloudinary.uploader.upload_stream({}, (error, result) => {
    if (error) {
      callback(error, null);
    } else {
      callback(null, result.secure_url);
    }
  });
}

// 사용:
uploadWithCallback(buffer1, (err1, url1) => {
  if (err1) {
    console.error("에러:", err1);
    return;
  }
  
  uploadWithCallback(buffer2, (err2, url2) => {
    if (err2) {
      console.error("에러:", err2);
      return;
    }
    
    uploadWithCallback(buffer3, (err3, url3) => {
      if (err3) {
        console.error("에러:", err3);
        return;
      }
      
      // 이제 url1, url2, url3를 사용 가능
      // 문제: 들여쓰기가 깊어짐 (Pyramid of Doom)
      // 문제: 에러 처리가 복잡함
      // 문제: 코드가 읽기 어려움
    });
  });
});

// ➡️ 문제: 
//    1. 콜백 지옥 (Callback Hell)
//    2. 에러 처리 중복
//    3. 병렬 처리 어려움
//    4. 코드 이해 어려움


// ✅ 방식 2: Promise (Promise Chaining)
function uploadWithPromise(buffer) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({}, (error, result) => {
      if (error) reject(error);
      else resolve(result.secure_url);
    });
  });
}

// 사용:
uploadWithPromise(buffer1)
  .then(url1 => {
    console.log("파일1 완료:", url1);
    return uploadWithPromise(buffer2);  // ← 체이닝
  })
  .then(url2 => {
    console.log("파일2 완료:", url2);
    return uploadWithPromise(buffer3);
  })
  .then(url3 => {
    console.log("파일3 완료:", url3);
    // 이제 url1, url2, url3를 사용 가능
  })
  .catch(error => {
    // 어디든 에러가 발생하면 여기서 처리
    console.error("에러:", error);
  });

// ➡️ 장점:
//    1. 콜백 지옥 해결
//    2. .catch()로 모든 에러 처리
//    3. 코드가 읽기 더 쉬움
//
// ➡️ 문제:
//    1. 여전히 .then() 체이닝이 필요
//    2. 병렬 처리 시 코드가 복잡해짐


// 🎯 방식 3: Async/Await (최고의 방식!)
async function uploadMultipleFiles() {
  try {
    // 순차 처리 (필요할 때)
    const url1 = await uploadWithPromise(buffer1);
    const url2 = await uploadWithPromise(buffer2);
    const url3 = await uploadWithPromise(buffer3);
    
    return [url1, url2, url3];
  } catch (error) {
    console.error("에러:", error);
  }
}

// 또는 병렬 처리 (권장!)
async function uploadMultipleFilesParallel() {
  try {
    // Promise.all()로 동시 실행
    const urls = await Promise.all([
      uploadWithPromise(buffer1),
      uploadWithPromise(buffer2),
      uploadWithPromise(buffer3),
    ]);
    
    return urls;
  } catch (error) {
    console.error("에러:", error);
    // 하나라도 실패하면 여기로 옴
  }
}

// ➡️ 장점:
//    1. 동기 코드처럼 읽기 쉬움
//    2. try/catch로 표준 에러 처리
//    3. 병렬 처리도 간단함
//    4. 타임아웃 추가 가능
//    5. 변수 스코프 명확함
```

---

### **실제 코드에서의 적용**

```javascript
// 백엔드: routes/posts.js

// ✅ Promise.all() + async/await 조합
router.post("/", parseFormData, async (req, res) => {
  try {
    const { title, content } = req.body;

    // Promise.all()로 모든 파일을 동시에 업로드
    const images = await Promise.all(
      req.files.map(async (file, index) => {
        // 각 파일마다 Promise가 생성됨
        const result = await uploadImageBuffer(file.buffer, {
          folder: "blog-posts",
        });
        
        return result.secure_url;
        // ["https://...", "https://...", ...]
      })
    );

    // 모든 업로드가 완료된 후
    const post = await Post.create({
      title,
      content,
      images,  // ← URL 배열
      author: userId,
    });

    res.status(201).json({
      success: true,
      data: { post },
    });

  } catch (error) {
    // 모든 에러가 여기로 캐치됨
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// 왜 이 방식이 안전한가?
// 1. Promise.all()은 하나라도 실패하면 reject됨
// 2. try/catch가 모든 에러를 잡음
// 3. async/await로 코드가 깔끔함
// 4. 병렬 처리로 성능 최적화됨
// 5. 타임아웃 설정 가능함
```

---

## 1️⃣ 프론트엔드: 파일 객체 수집

### **파일 입력 받기**

```jsx
// frontend/src/components/PostCreate.jsx

import { useState } from "react";
import { createPost } from "../api";

function PostCreate() {
  // 선택된 파일들을 저장하는 상태
  // File[] = [File{name: "img1.jpg"}, File{name: "img2.jpg"}]
  const [images, setImages] = useState([]);
  
  // 로컬 미리보기를 위한 Blob URL 저장
  // string[] = ["blob:http://...", "blob:http://..."]
  const [previews, setPreviews] = useState([]);

  // 1️⃣ 사용자가 <input type="file">로 파일 선택할 때 호출
  const handleImageSelect = (e) => {
    // e.target.files = FileList {0: File, 1: File, length: 2}
    // FileList는 배열 같은 객체이므로 Array.from()으로 변환
    const files = Array.from(e.target.files);
    // files = [
    //   File {name: "photo1.jpg", size: 558624, type: "image/jpeg", ...},
    //   File {name: "photo2.png", size: 1024768, type: "image/png", ...}
    // ]

    // 상태에 저장 (후에 POST 요청 시 사용)
    setImages(files);

    // 2️⃣ 사용자를 위해 로컬 미리보기 생성
    // URL.createObjectURL()은 File을 Blob URL로 변환
    // 예: "blob:http://localhost:3000/a1b2c3d4"
    // 실제 이미지 데이터는 브라우저 메모리에 캐시됨
    const previewUrls = files.map((file) => URL.createObjectURL(file));
    setPreviews(previewUrls);

    // previews = [
    //   "blob:http://localhost:3000/uuid1",
    //   "blob:http://localhost:3000/uuid2"
    // ]
  };

  return (
    <>
      {/* 파일 선택 input */}
      <input
        type="file"
        multiple           // 여러 파일 선택 가능
        accept="image/*"   // 이미지만
        onChange={handleImageSelect}
      />

      {/* 미리보기 */}
      <div className="previews">
        {previews.map((url, idx) => (
          <img
            key={idx}
            src={url}  // blob: URL을 src에 사용 → 브라우저가 메모리에서 로드
            alt={`preview ${idx}`}
          />
        ))}
      </div>
    </>
  );
}

export default PostCreate;
```

**이 시점의 메모리 상태:**

```javascript
images = [
  File {
    name: "photo1.jpg",           // 파일명
    size: 558624,                 // 바이트
    type: "image/jpeg",           // MIME type
    lastModified: 1735507825000,
    webkitRelativePath: "",
    // 내부 데이터:
    // 이 File 객체는 브라우저가 실제 파일 바이너리를 참조
  }
]

previews = [
  "blob:http://localhost:3000/a1b2c3d4-e5f6-7890-...",
  // 이것은 URL이 아니라 '참조'
  // 브라우저가 이 URL을 img src에 사용하면
  // 메모리의 File 바이너리를 자동으로 렌더링
]
```

---

## 2️⃣ 프론트엔드: FormData 생성 및 API 요청

### **POST 요청 핸들러**

```jsx
// frontend/src/components/PostCreate.jsx (계속)

function PostCreate() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);

  // 3️⃣ 게시물 작성 버튼 클릭 시 호출
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 백엔드로 보낼 데이터
      const postData = {
        title: "사진",           // 텍스트
        content: "사진 테스트",    // 텍스트
        images: images,          // File 객체 배열
      };

      console.log("📤 API 요청 전 데이터:", {
        title: postData.title,
        content: postData.content,
        imageCount: postData.images.length,
        imageDetails: postData.images.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type
        }))
      });

      // API 함수 호출 (api.js의 createPost)
      const response = await createPost(postData);

      console.log("✅ 게시물 생성 성공:", response);
      alert("게시물이 작성되었습니다!");

    } catch (error) {
      console.error("❌ 게시물 작성 실패:", error);
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
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleImageSelect}
      />
      <button type="submit">게시물 작성</button>
    </form>
  );
}
```

---

## 3️⃣ 프론트엔드: api.js - CreatePost 함수

### **FormData로 변환 및 axios 요청**

```javascript
// frontend/src/api.js

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
});

// 4️⃣ 요청 인터셉터: 모든 요청에 Authorization 헤더 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  
  if (token) {
    // Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5...
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  console.log("🔵 API 요청:", {
    method: config.method.toUpperCase(),
    url: config.url,
    hasAuth: !!token,
  });
  
  return config;
});

// 5️⃣ 게시물 생성 API 함수
export const createPost = async (postData) => {
  // postData = {
  //   title: "사진",
  //   content: "사진 테스트",
  //   images: [File, File, ...]
  // }

  // 6️⃣ FormData 생성
  // FormData는 multipart/form-data 형식으로 변환하기 위한 특수 객체
  const formData = new FormData();
  
  // FormData에 텍스트 필드 추가
  formData.append("title", postData.title);
  // formData 내용: { "title": "사진" }
  
  formData.append("content", postData.content);
  // formData 내용: { "title": "사진", "content": "사진 테스트" }

  // 7️⃣ 이미지 파일들을 FormData에 추가
  // append()를 여러 번 같은 이름으로 호출하면
  // 백엔드에서 배열로 처리됨
  postData.images.forEach((imageFile, index) => {
    // 첫 번째: formData.append("images", File {name: "photo1.jpg"})
    // 두 번째: formData.append("images", File {name: "photo2.jpg"})
    
    formData.append("images", imageFile);
    
    console.log(`📸 이미지 ${index + 1}:`, {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type
    });
  });

  // formData 내용 (시각화):
  // ------WebKitFormBoundary7MA4YWxkTrZu0gW
  // Content-Disposition: form-data; name="title"
  //
  // 사진
  // ------WebKitFormBoundary7MA4YWxkTrZu0gW
  // Content-Disposition: form-data; name="content"
  //
  // 사진 테스트
  // ------WebKitFormBoundary7MA4YWxkTrZu0gW
  // Content-Disposition: form-data; name="images"; filename="photo1.jpg"
  // Content-Type: image/jpeg
  //
  // [BINARY DATA: 558624 bytes]
  // ------WebKitFormBoundary7MA4YWxkTrZu0gW
  // Content-Disposition: form-data; name="images"; filename="photo2.jpg"
  // Content-Type: image/png
  //
  // [BINARY DATA: 1024768 bytes]
  // ------WebKitFormBoundary7MA4YWxkTrZu0gW--

  console.log("📋 FormData 준비 완료:", {
    title: formData.get("title"),
    content: formData.get("content"),
    fileCount: postData.images.length,
  });

  // 8️⃣ axios로 POST 요청
  // ⚠️ 중요: Content-Type을 명시하지 않음!
  // axios가 자동으로 감지하고 브라우저가 multipart 경계를 생성
  const response = await api.post("/posts", formData);
  // POST /api/posts HTTP/1.1
  // Authorization: Bearer eyJhbGci...
  // Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
  // [FormData의 바이너리 내용]

  console.log("✅ POST 응답:", response.data);

  return response.data;
  // response.data = {
  //   success: true,
  //   message: "게시물이 작성되었습니다",
  //   data: {
  //     post: {
  //       _id: "695352479a374cba4d8d4826",
  //       title: "사진",
  //       content: "사진 테스트",
  //       images: [
  //         "https://res.cloudinary.com/daijhkfrg/image/upload/v1735507825/blog-posts/abc123.jpg",
  //         "https://res.cloudinary.com/daijhkfrg/image/upload/v1735507826/blog-posts/def456.jpg"
  //       ],
  //       author: "507f1f77bcf86cd799439011",
  //       createdAt: "2025-12-30T10:30:25.000Z"
  //     }
  //   }
  // }
};
```

**이 시점의 HTTP 요청:**

```
🔵 시작: FormData 생성
   ↓
📦 HTTP 패킷 (multipart/form-data)
   Content-Type: multipart/form-data; boundary=----...
   Authorization: Bearer eyJhbGci...
   
   [바이너리 데이터]
   ↓
🌍 인터넷 전송 (HTTPS)
   ↓
✅ 백엔드 서버 수신
```

---

## 4️⃣ 백엔드: middleware/parseFormData.js - Busboy 파싱

### **FormData를 메모리에서 파싱**

```javascript
// backend/middleware/parseFormData.js

const busboy = require("busboy");

/**
 * Busboy를 사용한 FormData 파싱 미들웨어
 * - 파일 바이너리를 메모리의 Buffer로 변환
 * - 텍스트 필드를 req.body에 저장
 * - Vercel 서버리스 환경에 최적화 (디스크 쓰기 없음)
 */
function parseFormData(req, res, next) {
  // 1️⃣ OPTIONS 요청은 CORS 처리만 하고 스킵
  if (req.method === "OPTIONS") {
    return next();
  }

  // 2️⃣ POST/PUT만 처리 (multipart는 이 두 메서드)
  if (req.method !== "POST" && req.method !== "PUT") {
    return next();
  }

  // 3️⃣ multipart/form-data 요청만 처리
  const contentType = req.headers["content-type"];
  if (!contentType || !contentType.includes("multipart/form-data")) {
    // 일반 JSON이면 그냥 통과 (json 미들웨어가 처리)
    return next();
  }

  // 4️⃣ req.body와 req.files 초기화
  req.body = {};      // 텍스트 필드 저장
  req.files = [];     // File 객체들 저장

  // 5️⃣ Busboy 인스턴스 생성
  // headers: HTTP 요청 헤더를 파싱에 사용
  // limits: 파일 크기/개수 제한
  const bb = busboy({
    headers: req.headers,  // Content-Type, boundary 등 포함
    limits: {
      fileSize: 8 * 1024 * 1024,  // 최대 8MB
      files: 5,                    // 최대 5개 파일
    },
  });

  let fileCount = 0;
  let filesProcessed = 0;

  // 6️⃣ 파일 이벤트 처리
  bb.on("file", (fieldname, file, info) => {
    // fieldname: HTML form에서의 필드명 ("images")
    // file: 스트림 객체
    // info: {filename: "photo1.jpg", encoding: "7bit", mimeType: "image/jpeg"}

    fileCount++;
    console.log(`📁 파일 ${fileCount} 수신:`, {
      fieldname,
      filename: info.filename,
      mimeType: info.mimeType,
    });

    // 이 파일의 바이너리 데이터를 저장할 배열
    const chunks = [];

    // 7️⃣ 파일 데이터를 청크 단위로 받음
    file.on("data", (data) => {
      // data: Buffer 객체 (일반적으로 64KB 단위)
      // 예: <Buffer 89 50 4e 47 ff d8 ff e0 ...>
      
      chunks.push(data);
      
      console.log(`  📥 청크 수신: ${data.length} bytes`);
      // 큰 파일이면 여러 번 호출됨:
      // 📥 청크 수신: 65536 bytes (첫 번째)
      // 📥 청크 수신: 65536 bytes (두 번째)
      // 📥 청크 수신: 45824 bytes (마지막)
    });

    // 8️⃣ 파일 수신 완료
    file.on("end", () => {
      // 모든 청크를 하나의 Buffer로 합치기
      // chunks = [Buffer, Buffer, Buffer]
      // → Buffer.concat() → 하나의 큰 Buffer
      const buffer = Buffer.concat(chunks);

      console.log(`  ✅ 파일 완성: ${buffer.length} bytes`);

      // 9️⃣ req.files 배열에 저장
      req.files.push({
        fieldname: fieldname,           // "images"
        originalname: info.filename,    // "photo1.jpg"
        mimetype: info.mimeType,        // "image/jpeg"
        size: buffer.length,            // 558624
        buffer: buffer,                 // ← 이것이 핵심!
        // buffer = <Buffer 89 50 4e 47 ff d8 ff e0 00 10 4a 46 49 46 00 ...>
        // JPEG 매직 넘버: 89 50 4e 47 (PNG), FF D8 FF E0 (JPEG) 등
      });

      filesProcessed++;
      
      console.log(`  ✅ req.files[${req.files.length - 1}] 저장됨`);
    });

    file.on("error", (err) => {
      console.error("  ❌ 파일 스트림 에러:", err);
    });
  });

  // 🔟 텍스트 필드 처리
  bb.on("field", (fieldname, val) => {
    // fieldname: "title" 또는 "content"
    // val: 필드 값 ("사진", "사진 테스트")

    console.log(`📝 필드: ${fieldname} = "${val}"`);
    
    // req.body에 저장
    req.body[fieldname] = val;
  });

  // 1️⃣1️⃣ 전체 파싱 완료
  bb.on("close", () => {
    console.log(`✅ Busboy 파싱 완료: ${filesProcessed}/${fileCount} 파일`);

    // 12️⃣ 모든 파일이 처리될 때까지 대기
    if (filesProcessed < fileCount) {
      console.log("⏳ 파일 처리 중...");
      
      const waitInterval = setInterval(() => {
        if (filesProcessed >= fileCount) {
          clearInterval(waitInterval);
          console.log("✅ 모든 파일 처리됨, next() 호출");
          next();  // 다음 라우트 핸들러로
        }
      }, 10);

      // 안전장치: 5초 후 무조건 진행
      setTimeout(() => {
        clearInterval(waitInterval);
        next();
      }, 5000);
    } else {
      console.log("✅ 즉시 next() 호출");
      next();  // 다음 라우트 핸들러로
    }
  });

  bb.on("error", (err) => {
    console.error("❌ Busboy 에러:", err);
    return res.status(400).json({
      success: false,
      message: "FormData 파싱 실패",
      error: err.message,
    });
  });

  // 13️⃣ HTTP 요청 스트림을 Busboy에 파이프
  // req (입력 스트림) → bb (Busboy 파서) → 파싱됨
  req.pipe(bb);
}

module.exports = parseFormData;

// 이 시점의 req 상태:
// req.body = { title: "사진", content: "사진 테스트" }
// req.files = [
//   {
//     fieldname: "images",
//     originalname: "photo1.jpg",
//     mimetype: "image/jpeg",
//     size: 558624,
//     buffer: <Buffer 89 50 4e 47 ff d8 ... (558624 bytes)>
//   },
//   {
//     fieldname: "images",
//     originalname: "photo2.png",
//     mimetype: "image/png",
//     size: 1024768,
//     buffer: <Buffer 89 50 4e 47 ... (1024768 bytes)>
//   }
// ]
```

---

## 5️⃣ 백엔드: routes/posts.js - Cloudinary 업로드

### **이미지를 Cloudinary로 업로드**

```javascript
// backend/routes/posts.js

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Post = require("../models/Post");
const User = require("../models/User");
const { uploadImageBuffer } = require("../lib/cloudinary");
const parseFormData = require("../middleware/parseFormData");

// @route   POST /api/posts
// @desc    게시물 작성 (이미지 업로드)
// @access  Private
router.post("/", parseFormData, async (req, res) => {
  try {
    // 1️⃣ JWT 토큰 검증
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "로그인이 필요합니다",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    console.log("🔐 JWT 검증 성공:", { userId });

    // 2️⃣ parseFormData 미들웨어에서 설정한 req.body와 req.files 확인
    const { title, content } = req.body;
    // req.body = { title: "사진", content: "사진 테스트" }

    console.log("📝 요청 데이터:", {
      title,
      content,
      filesCount: req.files?.length || 0,
    });

    // 3️⃣ 필수 필드 검증
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "제목과 내용을 모두 입력해주세요",
      });
    }

    // 4️⃣ 이미지 업로드 (있으면)
    let images = [];

    if (req.files?.length) {
      console.log(`📤 ${req.files.length}개 파일 업로드 시작`);

      // 5️⃣ Promise.all()로 모든 이미지를 병렬로 업로드
      // 이렇게 하면 3개 파일이 동시에 처리되어 더 빠름
      images = await Promise.all(
        req.files.map(async (file, index) => {
          // file = {
          //   fieldname: "images",
          //   originalname: "photo1.jpg",
          //   mimetype: "image/jpeg",
          //   size: 558624,
          //   buffer: <Buffer ...>
          // }

          console.log(`  🖼️ 이미지 ${index + 1} 처리 중: ${file.originalname}`);

          // 6️⃣ uploadImageBuffer() 함수 호출
          // 이 함수는 lib/cloudinary.js에 정의됨
          const result = await uploadImageBuffer(file.buffer, {
            folder: "blog-posts",  // Cloudinary에서의 폴더명
            // 다른 옵션 가능:
            // width: 800, height: 600, crop: "fill" 등
          });

          // result = {
          //   public_id: "blog-posts/xyz123",
          //   secure_url: "https://res.cloudinary.com/daijhkfrg/image/upload/v1735507825/blog-posts/xyz123.jpg",
          //   url: "http://res.cloudinary.com/...", (비보안)
          //   format: "jpg",
          //   width: 1920,
          //   height: 1080,
          //   bytes: 558624,
          //   created_at: "2025-12-30T10:30:25Z",
          //   ... (다른 메타데이터)
          // }

          console.log(`  ✅ 이미지 ${index + 1} 업로드 완료:`, {
            url: result.secure_url,
            width: result.width,
            height: result.height,
          });

          // 7️⃣ URL만 반환 (secure_url)
          return result.secure_url;
          // "https://res.cloudinary.com/daijhkfrg/image/upload/v1735507825/blog-posts/xyz123.jpg"
        })
      );

      // images = [
      //   "https://res.cloudinary.com/daijhkfrg/image/upload/v1735507825/blog-posts/abc123.jpg",
      //   "https://res.cloudinary.com/daijhkfrg/image/upload/v1735507826/blog-posts/def456.jpg"
      // ]

      console.log(`✅ 모든 이미지 업로드 완료`);
    }

    // 8️⃣ MongoDB에 Post 생성
    const post = await Post.create({
      title,           // "사진"
      content,         // "사진 테스트"
      images,          // ["https://...", "https://..."] (Cloudinary URL 배열)
      author: userId,  // "507f1f77bcf86cd799439011"
    });

    // post = {
    //   _id: ObjectId("695352479a374cba4d8d4826"),
    //   title: "사진",
    //   content: "사진 테스트",
    //   images: [
    //     "https://res.cloudinary.com/daijhkfrg/image/upload/v1735507825/blog-posts/abc123.jpg",
    //     "https://res.cloudinary.com/daijhkfrg/image/upload/v1735507826/blog-posts/def456.jpg"
    //   ],
    //   author: ObjectId("507f1f77bcf86cd799439011"),
    //   likes: [],
    //   comments: [],
    //   createdAt: Date("2025-12-30T10:30:25.000Z"),
    //   updatedAt: Date("2025-12-30T10:30:25.000Z"),
    //   __v: 0
    // }

    console.log("💾 MongoDB에 저장됨:", {
      postId: post._id,
      imageCount: post.images.length,
    });

    // 9️⃣ 성공 응답
    res.status(201).json({
      success: true,
      message: "게시물이 작성되었습니다",
      data: { post },
    });

  } catch (error) {
    console.error("❌ 게시물 작성 에러:", {
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

## 6️⃣ 백엔드: lib/cloudinary.js - 버퍼 업로드

### **Cloudinary SDK로 업로드**

```javascript
// backend/lib/cloudinary.js

const cloudinary = require("cloudinary").v2;

let configured = false;

/**
 * Cloudinary 환경변수 설정
 * (한 번만 호출되어야 함 - configured 플래그로 제어)
 */
function ensureConfigured() {
  if (configured) return;  // 이미 설정됐으면 스킵

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;

  // 환경변수 검증
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error(
      "Cloudinary 환경변수가 설정되지 않았습니다"
    );
  }

  // Cloudinary 초기화
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,      // "daijhkfrg"
    api_key: CLOUDINARY_API_KEY,            // "523179376368729"
    api_secret: CLOUDINARY_API_SECRET,      // "f3TNK8I1mn-2p-..."
  });

  configured = true;
  console.log("✅ Cloudinary 설정됨");
}

/**
 * 버퍼를 Cloudinary로 업로드
 * @param {Buffer} buffer - 이미지 바이너리 데이터
 * @param {Object} options - Cloudinary 업로드 옵션
 * @returns {Promise} - Cloudinary 응답
 */
function uploadImageBuffer(buffer, options = {}) {
  // 1️⃣ Cloudinary 설정 확인
  ensureConfigured();

  // 2️⃣ Cloudinary 업로드 옵션
  const uploadOptions = {
    folder: options.folder || "blog-posts",  // Cloudinary 폴더
    resource_type: "image",                  // 이미지 파일
    timeout: 35000,                          // 35초 타임아웃
    ...options,                              // 추가 옵션
  };

  // 3️⃣ Promise로 감싸기 (콜백 기반 API를 Promise 기반으로)
  return new Promise((resolve, reject) => {
    // 4️⃣ 타임아웃 설정 (안전장치)
    const timeoutHandle = setTimeout(() => {
      reject(new Error("Cloudinary upload timeout (35s)"));
    }, 35000);

    // 5️⃣ upload_stream() 메서드 사용
    // Cloudinary는 스트림 기반 업로드를 제공
    // stream.end(buffer)로 데이터를 전송
    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        // 6️⃣ 타임아웃 해제
        clearTimeout(timeoutHandle);

        // 7️⃣ 에러 처리
        if (error) {
          console.error("❌ Cloudinary 업로드 에러:", {
            message: error.message,
            http_code: error.http_code,
            status: error.status,
          });
          return reject(error);
        }

        // 8️⃣ 성공
        console.log("✅ Cloudinary 업로드 성공:", {
          public_id: result.public_id,
          secure_url: result.secure_url,
          bytes: result.bytes,
        });

        resolve(result);
        // result = {
        //   public_id: "blog-posts/abc123xyz",
        //   version: 1735507825,
        //   signature: "f3bd6e...",
        //   width: 1920,
        //   height: 1080,
        //   format: "jpg",
        //   resource_type: "image",
        //   created_at: "2025-12-30T10:30:25Z",
        //   tags: [],
        //   bytes: 558624,
        //   type: "upload",
        //   etag: "abc123...",
        //   placeholder: false,
        //   url: "http://res.cloudinary.com/...",
        //   secure_url: "https://res.cloudinary.com/...",
        //   folder: "blog-posts",
        //   original_filename: "photo1",
        //   original_extension: "jpg"
        // }
      }
    );

    // 9️⃣ 스트림 에러 처리
    stream.on("error", (err) => {
      clearTimeout(timeoutHandle);
      console.error("❌ Cloudinary 스트림 에러:", err);
      reject(err);
    });

    // 🔟 버퍼 데이터를 스트림으로 전송
    // buffer = <Buffer 89 50 4e 47 ff d8 ff e0 ...>
    // 이 버퍼가 Cloudinary로 전송됨
    stream.end(buffer);

    console.log(`📤 Cloudinary로 ${buffer.length} bytes 전송 시작`);
  });
}

module.exports = {
  uploadImageBuffer,
};

// Cloudinary 내부 동작:
// 1. HTTP POST 요청 생성
//    POST https://api.cloudinary.com/v1_1/daijhkfrg/image/upload
//
// 2. 요청 헤더:
//    Content-Type: multipart/form-data
//    form-data:
//      - api_key: "523179376368729"
//      - api_secret: "f3TNK8I1mn-2p-..."
//      - file: <Buffer ...> (이미지 바이너리)
//      - folder: "blog-posts"
//
// 3. Cloudinary 서버:
//    - 이미지 유효성 검증
//    - 이미지 최적화 (압축, 리사이징 옵션 생성)
//    - 전 세계 CDN에 배포
//    - URL 생성
//
// 4. 응답:
//    {
//      public_id: "blog-posts/abc123xyz",
//      secure_url: "https://res.cloudinary.com/...",
//      ...
//    }
```

---

## 7️⃣ 전체 코드 흐름 요약 (한눈에 보기)

```
┌──────────────────────────────────────────────────────────────┐
│ 1️⃣ 프론트엔드: File 객체 수집                                   │
│   const images = [File{jpg}, File{png}]                     │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 2️⃣ 프론트엔드: FormData 생성                                   │
│   const formData = new FormData()                            │
│   formData.append("title", "사진")                           │
│   formData.append("content", "내용")                         │
│   formData.append("images", File{jpg})                      │
│   formData.append("images", File{png})                      │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 3️⃣ 프론트엔드: axios.post("/posts", formData)                │
│   HTTP/1.1 POST /api/posts                                  │
│   Authorization: Bearer eyJ...                              │
│   Content-Type: multipart/form-data; boundary=...           │
│   [FormData 바이너리]                                        │
└──────────────────────────────────────────────────────────────┘
                          ↓ HTTPS 전송
┌──────────────────────────────────────────────────────────────┐
│ 4️⃣ 백엔드: parseFormData 미들웨어                            │
│   Busboy로 FormData 파싱                                      │
│   req.files = [{buffer: <...>, originalname: "...", ...}]  │
│   req.body = {title: "사진", content: "내용"}               │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 5️⃣ 백엔드: POST /api/posts 라우트                            │
│   Promise.all()로 모든 파일 처리                               │
│   await uploadImageBuffer(buffer)                           │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 6️⃣ 백엔드: lib/cloudinary.js                               │
│   cloudinary.uploader.upload_stream()                       │
│   stream.end(buffer)                                        │
│   ← Cloudinary secure_url 반환                              │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 7️⃣ 백엔드: MongoDB Post 생성                                  │
│   const post = await Post.create({                          │
│     title: "사진",                                            │
│     content: "내용",                                         │
│     images: ["https://res.cloudinary.com/..."],  ← URL!    │
│     author: userId                                         │
│   })                                                        │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 8️⃣ 백엔드: JSON 응답                                          │
│   {                                                         │
│     success: true,                                          │
│     data: {                                                 │
│       post: {                                               │
│         _id: "...",                                         │
│         title: "사진",                                       │
│         images: ["https://..."],                           │
│         ...                                                 │
│       }                                                     │
│     }                                                       │
│   }                                                         │
└──────────────────────────────────────────────────────────────┘
                          ↓ HTTPS 전송
┌──────────────────────────────────────────────────────────────┐
│ 9️⃣ 프론트엔드: 응답 처리                                       │
│   const response = await createPost(postData)               │
│   // 상태 업데이트 (리렌더링)                                 │
│   setPosts([...posts, response.data.post])                  │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ 🔟 프론트엔드: 화면에 이미지 표시                                │
│   <img src={resolveImageUrl(post.images[0])}/>            │
│   ↓ (Cloudinary CDN에서 로드)                                │
│   이미지 표시! 👍                                            │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 데이터 변환 과정

```
1️⃣ 프론트: File 객체
   {
     name: "photo.jpg",
     size: 558624,
     type: "image/jpeg",
     lastModified: 1735507825000
   }

2️⃣ FormData로 변환
   multipart/form-data {
     title: "사진",
     content: "내용",
     images: <바이너리 데이터 558624 bytes>
   }

3️⃣ HTTP 전송
   POST /api/posts HTTP/1.1
   [multipart 형식의 바이너리 패킷]

4️⃣ Busboy 파싱
   {
     fieldname: "images",
     originalname: "photo.jpg",
     mimetype: "image/jpeg",
     size: 558624,
     buffer: <Buffer 89 50 4e 47 ...>
   }

5️⃣ Cloudinary 업로드
   POST https://api.cloudinary.com/v1_1/daijhkfrg/image/upload
   [업로드 중...]
   ← 응답: {secure_url: "https://..."}

6️⃣ MongoDB 저장
   {
     _id: ObjectId("..."),
     title: "사진",
     content: "내용",
     images: ["https://res.cloudinary.com/..."],  ← URL 문자열만!
     author: ObjectId("...")
   }

7️⃣ 프론트엔드에서 표시
   <img src="https://res.cloudinary.com/..." />
   [Cloudinary CDN에서 이미지 로드]
   ✅ 사용자 화면에 표시됨
```

---

## 🔑 핵심 포인트

| 단계 | 무엇이 | 형태 | 저장 위치 |
|------|--------|------|---------|
| **1️⃣** | File 객체 | 브라우저 메모리의 참조 | 브라우저 RAM |
| **2️⃣** | FormData | multipart/form-data 패킷 | 네트워크 (HTTPS) |
| **3️⃣** | Buffer | 바이너리 데이터 | 백엔드 메모리 |
| **4️⃣** | Cloudinary URL | 문자열 | Cloudinary 서버 + MongoDB |
| **5️⃣** | 이미지 표시 | HTML img 태그 | 사용자 브라우저 (Cloudinary CDN에서 로드) |

---

## ⚠️ 주의사항

```javascript
❌ 실수: 이미지 파일을 MongoDB에 저장
const post = await Post.create({
  images: [<Buffer ...>]  // ← 너무 크다! 비효율
});

✅ 올바름: 이미지 URL만 저장
const post = await Post.create({
  images: ["https://res.cloudinary.com/..."]  // ← 작고 빠름
});
```

---

## 📊 Promise로 감싸는 것이 왜 안전한가? (심화)

### **안전성 측면**

```javascript
// ❌ 콜백 방식: 에러 처리가 불완전할 수 있음
function uploadCallback(buffer, onComplete, onError) {
  cloudinary.uploader.upload_stream({}, (err, result) => {
    if (err) {
      onError(err);  // ← 콜백 호출
    } else {
      onComplete(result);  // ← 콜백 호출
    }
  });
}

// 사용하는 곳에서:
uploadCallback(
  buffer,
  (result) => { /* 성공 */ },
  (error) => { /* 실패 */ }
);

// 문제:
// 1. 콜백을 빠뜨릴 수 있음
// 2. 콜백을 두 번 호출할 수도 있음
// 3. 타임아웃 처리를 별도로 해야 함
// 4. 에러를 try/catch로 처리할 수 없음


// ✅ Promise 방식: 강제된 에러 처리
function uploadPromise(buffer) {
  return new Promise((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      reject(new Error("Timeout"));  // ← 강제된 실패 처리
    }, 35000);

    cloudinary.uploader.upload_stream({}, (err, result) => {
      clearTimeout(timeoutHandle);
      
      if (err) {
        reject(err);  // ← 반드시 reject 또는 resolve 중 하나만 호출
      } else {
        resolve(result);  // ← 둘 다 호출될 수 없음 (자동 방지)
      }
    });
  });
}

// 사용하는 곳에서:
try {
  const result = await uploadPromise(buffer);
  console.log("✅ 성공:", result);
} catch (error) {
  console.error("❌ 실패:", error);  // ← 강제된 에러 처리
}

// 이점:
// 1. resolve/reject 중 하나만 호출됨 (자동 보장)
// 2. 타임아웃이 자동으로 처리됨
// 3. try/catch로 표준화된 에러 처리
// 4. 에러를 빠뜨릴 수 없음 (컴파일러 경고)
```

---

### **성능 측면**

```javascript
// ❌ 콜백: 3개 파일 순차 처리 (가장 느림)
let completed = 0;
let results = [];

function uploadNext(files, index) {
  if (index >= files.length) {
    console.log("모든 파일 업로드 완료");
    return;
  }

  uploadCallback(
    files[index].buffer,
    (result) => {
      results.push(result);
      completed++;
      uploadNext(files, index + 1);  // ← 재귀 호출 (Callback Hell)
    },
    (error) => {
      console.error("에러:", error);
    }
  );
}

uploadNext(files, 0);
// 시간: 30초 + 30초 + 30초 = 90초


// ✅ Promise: Promise.all()로 병렬 처리 (가장 빠름)
const results = await Promise.all(
  files.map(file => uploadPromise(file.buffer))
);
// 시간: 30초 (동시 실행)

// 3배 더 빠름! 🚀
```

---

### **에러 처리 비교**

```javascript
// ❌ 콜백: 에러 처리가 복잡
uploadCallback(buffer1, 
  (result1) => {
    uploadCallback(buffer2,
      (result2) => {
        uploadCallback(buffer3,
          (result3) => {
            // 성공: 3개 다 완료
          },
          (error) => {
            console.error("파일3 에러:", error);
            // 파일1, 2는 이미 처리됨 (롤백 불가)
          }
        );
      },
      (error) => {
        console.error("파일2 에러:", error);
        // 파일1은 이미 처리됨 (롤백 불가)
      }
    );
  },
  (error) => {
    console.error("파일1 에러:", error);
  }
);


// ✅ Promise: try/catch로 통일된 처리
try {
  const results = await Promise.all([
    uploadPromise(buffer1),
    uploadPromise(buffer2),
    uploadPromise(buffer3),
  ]);
  console.log("✅ 모든 파일 성공:", results);
} catch (error) {
  console.error("❌ 어디선가 실패:", error);
  // Promise.all()은 하나라도 실패하면 전체 실패 처리
  // 이미 성공한 파일들을 정리(cleanup)할 수 있음
}
```

---

### **타이밍 문제 (Race Condition) 방지**

```javascript
// ❌ 콜백: 타이밍 문제 발생 가능
let isComplete = false;
let result = null;

uploadCallback(buffer,
  (res) => {
    result = res;
    isComplete = true;
  },
  (err) => { console.error(err); }
);

// 문제: 아직 콜백이 호출되지 않았는데 접근 가능
console.log(result);  // null (예상치 못한 상황)
console.log(isComplete);  // false


// ✅ Promise: 타이밍이 강제됨
const result = await uploadPromise(buffer);
// ← 이 줄 다음에서만 result를 사용 가능
console.log(result);  // 반드시 값이 있음!

// Promise는 상태가 바뀔 때까지 await를 차단함
// 따라서 Race condition이 발생할 수 없음
```

---

## 🎯 종합 비교 표

| 비교 항목 | 콜백 | Promise | Async/Await |
|---------|------|---------|-----------|
| **코드 가독성** | ❌ 낮음 | ⚠️ 중간 | ✅ 높음 |
| **에러 처리** | ❌ 복잡 | ⚠️ 중간 | ✅ 간단 (try/catch) |
| **타임아웃 처리** | ❌ 수동 | ✅ 자동 가능 | ✅ 자동 가능 |
| **병렬 처리** | ❌ 어려움 | ✅ Promise.all() | ✅ Promise.all() |
| **순차 처리** | ✅ 쉬움 | ⚠️ 중간 | ✅ 쉬움 |
| **상태 관리** | ❌ 복잡 | ✅ 자동 | ✅ 자동 |
| **Race Condition** | ❌ 위험 | ✅ 안전 | ✅ 안전 |
| **Stack Trace** | ❌ 추적 어려움 | ⚠️ 중간 | ✅ 명확 |
| **메모리 누수** | ❌ 위험 | ✅ 안전 | ✅ 안전 |
| **성능** | ⚠️ 중간 | ✅ 우수 | ✅ 우수 |

---

## 🚀 최종 결론

```javascript
// 현재 프로젝트에서 사용하는 방식 (최고 수준의 안전성)
function uploadImageBuffer(buffer, options = {}) {
  // 1️⃣ Promise로 감싸기 (안전성)
  return new Promise((resolve, reject) => {
    // 2️⃣ 타임아웃 설정 (안전성)
    const timeoutHandle = setTimeout(() => {
      reject(new Error("Cloudinary upload timeout"));
    }, 35000);

    // 3️⃣ 스트림 에러 처리 (안전성)
    const stream = cloudinary.uploader.upload_stream(
      { ...options, timeout: 35000 },
      (error, result) => {
        clearTimeout(timeoutHandle);  // 4️⃣ 타임아웃 정리 (메모리 누수 방지)
        
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    stream.on("error", (err) => {
      clearTimeout(timeoutHandle);  // 5️⃣ 에러 시에도 정리
      reject(err);
    });

    stream.end(buffer);
  });
}

// 백엔드에서의 사용 (병렬 처리 + 에러 처리)
router.post("/", parseFormData, async (req, res) => {
  try {
    // 6️⃣ Promise.all()로 병렬 처리 (성능)
    const images = await Promise.all(
      req.files.map(file => uploadImageBuffer(file.buffer))
    );
    
    // 7️⃣ 모든 업로드가 성공한 경우에만 DB 저장
    await Post.create({ images, ... });
    
    res.status(201).json({ success: true });
    
  } catch (error) {
    // 8️⃣ 모든 에러가 여기서 처리됨 (한 곳에서 관리)
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// 이 구조의 안전성 보장:
// ✅ 타임아웃 자동 처리
// ✅ 에러 자동 잡힘
// ✅ 메모리 누수 방지
// ✅ Race condition 없음
// ✅ 병렬 처리로 3배 빠름
// ✅ 코드 읽기 쉬움
// ✅ 유지보수 용이함
```

