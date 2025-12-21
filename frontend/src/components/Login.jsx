import { useState } from 'react';
import { login } from '../api';

function Login({ onSuccess, onSwitchToSignup }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await login(formData);
      if (result.success) {
        setMessage(result.message);
        onSuccess(result.data.user);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || '로그인 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
        로그인
      </h1>
      <p className="text-gray-500 text-center mb-8">
        백엔드 API와 연동된 프론트엔드
      </p>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.includes('성공') 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            이메일
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            비밀번호
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            minLength="6"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:bg-gray-400"
        >
          {loading ? '처리중...' : '로그인'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={onSwitchToSignup}
          className="text-blue-500 hover:text-blue-600 font-semibold"
        >
          회원가입하기
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-500 text-center">
          🚀 Backend API: <br />
          <a 
            href="https://backend-blog-snowy.vercel.app/api" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            backend-blog-snowy.vercel.app
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;
