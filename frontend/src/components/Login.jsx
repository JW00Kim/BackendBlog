import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login, googleLogin } from "../api";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ============================================================
  // 🔐 Google Sign-In 초기화 (컴포넌트 마운트 시 1회 실행)
  // ============================================================
  useEffect(() => {
    // Google SDK가 로드되었는지 확인
    if (window.google) {
      // 1️⃣ Google Sign-In 초기화
      window.google.accounts.id.initialize({
        client_id: "470258271536-me011cja3u0uiukn9fkrtp1cqk7is0jm.apps.googleusercontent.com",
        callback: handleGoogleLogin, // 로그인 성공 시 호출될 콜백 함수
      });

      // 2️⃣ Google 로그인 버튼 렌더링
      // #googleSignInButton 요소에 버튼을 자동으로 생성
      window.google.accounts.id.renderButton(
        document.getElementById("googleSignInButton"), // 버튼이 표시될 DOM 요소
        {
          theme: "outline",        // 버튼 테마 (outline/filled_blue/filled_black)
          size: "large",           // 버튼 크기 (small/medium/large)
          text: "signin_with",     // 버튼 텍스트 ("Google로 로그인")
          width: 400,              // 버튼 너비 (px)
        }
      );
    }
  }, []); // 빈 배열 = 컴포넌트 마운트 시 1회만 실행

  // ============================================================
  // 🔑 Google 로그인 처리 함수
  // ============================================================
  /**
   * Google Sign-In 버튼 클릭 시 자동으로 호출됩니다.
   * @param {Object} response - Google에서 반환한 응답 객체
   * @param {string} response.credential - Google ID Token (JWT 형식)
   */
  const handleGoogleLogin = async (response) => {
    try {
      setLoading(true);
      setMessage("");

      // api.js의 googleLogin 함수 사용 (axios 인스턴스 활용)
      const result = await googleLogin(response.credential);

      if (result.success) {
        setMessage("Google 로그인 성공!");
        setTimeout(() => navigate("/dashboard"), 500);
      } else {
        setMessage(result.message || "Google 로그인 실패");
      }
    } catch (error) {
      console.error("Google 로그인 에러:", error);
      setMessage(
        error.response?.data?.message || "Google 로그인 중 오류가 발생했습니다"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const result = await login(formData);
      if (result.success) {
        setMessage(result.message);
        navigate("/dashboard");
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "로그인 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
        로그인
      </h1>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            message.includes("성공")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
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
          {loading ? "처리중..." : "로그인"}
        </button>
      </form>

      {/* Google 로그인 구분선 */}
      <div className="mt-6 mb-6 flex items-center">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="px-4 text-gray-500 text-sm">또는</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      {/* Google 로그인 버튼 */}
      <div className="flex justify-center">
        <div id="googleSignInButton"></div>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => navigate("/signup")}
          className="text-blue-500 hover:text-blue-600 font-semibold"
        >
          회원가입하기
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-500 text-center">
          🚀
          <br />© 2025 지우의 블로그. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default Login;
