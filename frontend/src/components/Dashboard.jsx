import { logout } from '../api';
import { useState } from 'react';

function Dashboard({ user, onLogout }) {
  const [showGuide, setShowGuide] = useState(false);

  const handleLogout = () => {
    logout();
    onLogout();
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition duration-200"
        >
          {showGuide ? '가이드 닫기' : '📚 프로젝트 가이드 보기'}
        </button>
        <button
          onClick={handleLogout}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition duration-200"
        >
          로그아웃
        </button>
      </div>

      {showGuide && (
        <div className="prose prose-sm max-w-none bg-gray-50 rounded-lg p-6 text-left">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📚 Blog 프로젝트 완벽 가이드</h2>
          
          <div className="bg-white rounded-lg p-4 mb-4">
            <h3 className="text-xl font-bold text-gray-800 mb-2">🎯 프로젝트 개요</h3>
            <p className="text-gray-700"><strong>백엔드:</strong> Node.js + Express + MongoDB + JWT 인증</p>
            <p className="text-gray-700"><strong>프론트엔드:</strong> React + Vite + Tailwind CSS</p>
            <p className="text-gray-700"><strong>배포:</strong> Vercel</p>
            <p className="text-gray-700"><strong>구조:</strong> Monorepo (backend + frontend)</p>
          </div>

          <div className="bg-white rounded-lg p-4 mb-4">
            <h3 className="text-xl font-bold text-gray-800 mb-2">📁 1. 프로젝트 구조 생성</h3>
            <pre className="bg-gray-800 text-green-400 p-3 rounded overflow-x-auto text-xs">
{`mkdir Blog && cd Blog
mkdir backend frontend`}
            </pre>
          </div>

          <div className="bg-white rounded-lg p-4 mb-4">
            <h3 className="text-xl font-bold text-gray-800 mb-2">🔧 2. 백엔드 설정</h3>
            
            <h4 className="font-bold text-gray-700 mt-3 mb-2">패키지 설치</h4>
            <pre className="bg-gray-800 text-green-400 p-3 rounded overflow-x-auto text-xs">
{`cd backend
npm init -y
npm install express mongoose cors dotenv bcryptjs jsonwebtoken
npm install -D nodemon`}
            </pre>

            <h4 className="font-bold text-gray-700 mt-3 mb-2">주요 파일</h4>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li><code className="bg-gray-200 px-1 rounded">models/User.js</code> - 사용자 모델 (bcrypt 해싱)</li>
              <li><code className="bg-gray-200 px-1 rounded">routes/auth.js</code> - 인증 라우터 (signup, login, me)</li>
              <li><code className="bg-gray-200 px-1 rounded">index.js</code> - Express 서버</li>
              <li><code className="bg-gray-200 px-1 rounded">vercel.json</code> - Vercel 배포 설정</li>
              <li><code className="bg-gray-200 px-1 rounded">.env</code> - 환경 변수 (MONGODB_URI, JWT_SECRET)</li>
            </ul>

            <h4 className="font-bold text-gray-700 mt-3 mb-2">로컬 테스트</h4>
            <pre className="bg-gray-800 text-green-400 p-3 rounded overflow-x-auto text-xs">
{`npm run dev

# 테스트
curl -X POST http://localhost:3001/api/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"123456","name":"테스트"}'`}
            </pre>
          </div>

          <div className="bg-white rounded-lg p-4 mb-4">
            <h3 className="text-xl font-bold text-gray-800 mb-2">🎨 3. 프론트엔드 설정</h3>
            
            <h4 className="font-bold text-gray-700 mt-3 mb-2">패키지 설치</h4>
            <pre className="bg-gray-800 text-green-400 p-3 rounded overflow-x-auto text-xs">
{`cd frontend
npm install axios
npm install -D tailwindcss @tailwindcss/postcss`}
            </pre>

            <h4 className="font-bold text-gray-700 mt-3 mb-2">주요 파일</h4>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li><code className="bg-gray-200 px-1 rounded">src/api.js</code> - API 연동 (axios)</li>
              <li><code className="bg-gray-200 px-1 rounded">src/components/Login.jsx</code> - 로그인</li>
              <li><code className="bg-gray-200 px-1 rounded">src/components/Signup.jsx</code> - 회원가입</li>
              <li><code className="bg-gray-200 px-1 rounded">src/components/Dashboard.jsx</code> - 대시보드</li>
              <li><code className="bg-gray-200 px-1 rounded">tailwind.config.js</code> - Tailwind 설정</li>
            </ul>

            <h4 className="font-bold text-gray-700 mt-3 mb-2">개발 서버 실행</h4>
            <pre className="bg-gray-800 text-green-400 p-3 rounded overflow-x-auto text-xs">
{`npm run dev
# http://localhost:5173`}
            </pre>
          </div>

          <div className="bg-white rounded-lg p-4 mb-4">
            <h3 className="text-xl font-bold text-gray-800 mb-2">📦 4. Git & GitHub</h3>
            <pre className="bg-gray-800 text-green-400 p-3 rounded overflow-x-auto text-xs">
{`cd /path/to/Blog
git init
rm -rf backend/.git  # 서브모듈 충돌 방지
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/repo.git
git push -u origin master`}
            </pre>
          </div>

          <div className="bg-white rounded-lg p-4 mb-4">
            <h3 className="text-xl font-bold text-gray-800 mb-2">🚀 5. Vercel 배포</h3>
            
            <h4 className="font-bold text-gray-700 mt-3 mb-2">백엔드</h4>
            <pre className="bg-gray-800 text-green-400 p-3 rounded overflow-x-auto text-xs">
{`cd backend
vercel  # 개발 배포
vercel env add MONGODB_URI production
vercel env add JWT_SECRET production
vercel --prod  # 프로덕션 배포`}
            </pre>

            <h4 className="font-bold text-gray-700 mt-3 mb-2">프론트엔드</h4>
            <pre className="bg-gray-800 text-green-400 p-3 rounded overflow-x-auto text-xs">
{`cd frontend
vercel
vercel env add VITE_API_URL production
vercel --prod`}
            </pre>
          </div>

          <div className="bg-white rounded-lg p-4 mb-4">
            <h3 className="text-xl font-bold text-gray-800 mb-2">✅ 배포된 URL</h3>
            <p className="text-sm text-gray-700 mb-2">
              <strong>백엔드:</strong> <a href="https://backend-blog-snowy.vercel.app/api" target="_blank" className="text-blue-600 hover:underline">backend-blog-snowy.vercel.app</a>
            </p>
            <p className="text-sm text-gray-700">
              <strong>프론트엔드:</strong> <a href="https://jiwooresume.vercel.app" target="_blank" className="text-blue-600 hover:underline">jiwooresume.vercel.app</a>
            </p>
          </div>

          <div className="bg-white rounded-lg p-4">
            <h3 className="text-xl font-bold text-gray-800 mb-2">🎯 핵심 명령어</h3>
            <pre className="bg-gray-800 text-green-400 p-3 rounded overflow-x-auto text-xs">
{`# 개발
npm run dev

# 배포
vercel          # 개발 배포
vercel --prod   # 프로덕션 배포

# 환경 변수
vercel env add KEY production`}
            </pre>
          </div>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-500 text-center">
          ✅ 백엔드 API와 성공적으로 연동되었습니다
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
