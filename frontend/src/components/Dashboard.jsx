import { logout } from '../api';

function Dashboard({ user, onLogout }) {
  const handleLogout = () => {
    logout();
    onLogout();
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        환영합니다! 🎉
      </h1>
      
      <div className="bg-blue-50 rounded-lg p-6 mb-6">
        <p className="text-gray-700 mb-2">
          <span className="font-semibold">이름:</span> {user.name}
        </p>
        <p className="text-gray-700 mb-2">
          <span className="font-semibold">이메일:</span> {user.email}
        </p>
        <p className="text-gray-500 text-sm">
          가입일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}
        </p>
      </div>

      <button
        onClick={handleLogout}
        className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition duration-200"
      >
        로그아웃
      </button>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-500 text-center">
          ✅ 백엔드 API와 성공적으로 연동되었습니다
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
