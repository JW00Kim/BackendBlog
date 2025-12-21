import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "https://backend-blog-snowy.vercel.app/api";

console.log("🔧 API_URL:", API_URL);

// API 인스턴스 생성
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30초 타임아웃
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    console.log("🔵 API 요청:", config.method.toUpperCase(), config.url, config.data);
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

export default api;
