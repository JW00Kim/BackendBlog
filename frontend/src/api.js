// ============================================================
// 📡 API 설정 및 Axios 인스턴스
// ============================================================
import axios from "axios";

// ============================================================
// 🌐 API 기본 URL 설정
// ============================================================
/**
 * 환경별 API URL 자동 선택:
 * - Production: .env.production의 VITE_API_URL 사용
 * - Development: .env의 VITE_API_URL 또는 기본값(localhost:3001)
 * 
 * 주의: /api를 포함하지 않음! (axios baseURL에서 추가)
 */
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001";

console.log("🔧 API_URL:", API_URL);

// ============================================================
// ⚙️ Axios 인스턴스 생성 및 기본 설정
// ============================================================
/**
 * 모든 API 요청에 사용되는 axios 인스턴스
 * - baseURL: 모든 요청의 기본 URL (API_URL + /api)
 * - timeout: 요청 제한 시간 (30초)
 * - headers: 기본 헤더 설정
 */
const api = axios.create({
  baseURL: `${API_URL}/api`, // 예: http://localhost:3001/api
  timeout: 30000, // 30초 타임아웃
  headers: {
    "Content-Type": "application/json", // JSON 요청/응답
  },
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    console.log(
      "🔵 API 요청:",
      config.method.toUpperCase(),
      config.url,
      config.data
    );
    return config;
  },
  (error) => {
    console.error("❌ 요청 에러:", error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    console.log("✅ API 응답:", response.status, response.data);
    return response;
  },
  (error) => {
    console.error("❌ API 에러:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
    });
    return Promise.reject(error);
  }
);

// 회원가입
export const signup = async (userData) => {
  const response = await api.post("/auth/signup", userData);
  if (response.data.success) {
    localStorage.setItem("token", response.data.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.data.user));
  }
  return response.data;
};

// 로그인
export const login = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  if (response.data.success) {
    localStorage.setItem("token", response.data.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.data.user));
  }
  return response.data;
};

// 로그아웃
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// 현재 사용자 정보 가져오기
export const getCurrentUser = async () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const response = await api.get("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// ===== Posts API =====

// 모든 게시물 가져오기
export const getPosts = async () => {
  const response = await api.get("/posts");
  return response.data;
};

// 특정 게시물 가져오기
export const getPost = async (id) => {
  const response = await api.get(`/posts/${id}`);
  return response.data;
};

// 게시물 작성
export const createPost = async (postData) => {
  const token = localStorage.getItem("token");
  const response = await api.post("/posts", postData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// 게시물 수정
export const updatePost = async (id, postData) => {
  const token = localStorage.getItem("token");
  const response = await api.put(`/posts/${id}`, postData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// 게시물 삭제
export const deletePost = async (id) => {
  const token = localStorage.getItem("token");
  const response = await api.delete(`/posts/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// 게시물 좋아요
export const likePost = async (postId) => {
  const token = localStorage.getItem("token");
  const response = await api.post(`/posts/${postId}/like`, {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// ===== Comments API =====

// 댓글 가져오기
export const getComments = async (postId) => {
  const response = await api.get(`/posts/${postId}/comments`);
  return response.data;
};

// 댓글 작성
export const createComment = async (postId, content) => {
  const token = localStorage.getItem("token");
  const response = await api.post(`/posts/${postId}/comments`, { content }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// 댓글 삭제
export const deleteComment = async (postId, commentId) => {
  const token = localStorage.getItem("token");
  const response = await api.delete(`/posts/${postId}/comments/${commentId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// 댓글 좋아요
export const likeComment = async (postId, commentId) => {
  const token = localStorage.getItem("token");
  const response = await api.post(`/posts/${postId}/comments/${commentId}/like`, {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export default api;
