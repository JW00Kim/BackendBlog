import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Google Sign-In 초기화
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: "470258271536-me011cja3u0uiukn9fkrtp1cqk7is0jm.apps.googleusercontent.com",
        callback: handleGoogleLogin,
      });

      // Google 버튼 렌더링
      window.google.accounts.id.renderButton(
        document.getElementById("googleSignInButton"),
        {
          theme: "outline",
          size: "large",
          text: "signin_with",
          width: 400,
        }
      );
    }
  }, []);

  const handleGoogleLogin = async (response) => {
    try {
      setLoading(true);
      setMessage("");

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const result = await fetch(`${apiUrl}/api/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await result.json();

      if (data.success) {
        // 토큰 저장
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        setMessage("Google 로그인 성공!");
        setTimeout(() => navigate("/dashboard"), 500);
      } else {
        setMessage(data.message || "Google 로그인 실패");
      }
    } catch (error) {
      console.error("Google 로그인 에러:", error);
      setMessage("Google 로그인 중 오류가 발생했습니다");
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
