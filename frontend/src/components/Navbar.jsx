import { useNavigate, useLocation } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));

  // 로그인/회원가입 페이지에서는 네비바 표시
  const showNavbar = true;

  if (!showNavbar) return null;

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고/타이틀 */}
          <div
            className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 cursor-pointer"
            onClick={() => navigate(user ? "/dashboard" : "/login")}
          >
            지우의 블로그
          </div>

          {/* 우측 버튼들 */}
          <div className="flex items-center gap-3">
            {!user ? (
              <>
                {location.pathname !== "/login" && (
                  <button
                    onClick={() => navigate("/login")}
                    className="px-4 py-2 text-sm sm:text-base text-gray-700 hover:text-blue-600 font-medium transition duration-200"
                  >
                    로그인
                  </button>
                )}
                {location.pathname !== "/signup" && (
                  <button
                    onClick={() => navigate("/signup")}
                    className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-full transition duration-200 shadow-lg hover:shadow-xl"
                  >
                    회원가입
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm sm:text-base text-gray-700 hidden sm:inline">
                  {user.name}님
                </span>
                {location.pathname !== "/dashboard" && (
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="px-4 py-2 text-sm sm:text-base text-gray-700 hover:text-blue-600 font-medium transition duration-200"
                  >
                    대시보드
                  </button>
                )}
                {location.pathname !== "/resume" && (
                  <button
                    onClick={() => navigate("/resume")}
                    className="px-4 py-2 text-sm sm:text-base text-gray-700 hover:text-purple-600 font-medium transition duration-200"
                  >
                    이력서
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
