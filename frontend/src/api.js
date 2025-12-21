import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://backend-blog-snowy.vercel.app/api';

// API 인스턴스 생성
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 회원가입
export const signup = async (userData) => {
  const response = await api.post('/auth/signup', userData);
  if (response.data.success) {
    localStorage.setItem('token', response.data.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.data.user));
  }
  return response.data;
};

// 로그인
export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  if (response.data.success) {
    localStorage.setItem('token', response.data.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.data.user));
  }
  return response.data;
};

// 로그아웃
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// 현재 사용자 정보 가져오기
export const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  const response = await api.get('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export default api;
