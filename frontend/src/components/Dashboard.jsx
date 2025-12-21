import { logout } from "../api";
import { useState } from "react";

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
          가입일: {new Date(user.createdAt).toLocaleDateString("ko-KR")}
        </p>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition duration-200"
        >
          {showGuide ? "가이드 닫기" : "📚 프로젝트 가이드 보기"}
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
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            📚 Blog 프로젝트 완벽 가이드
          </h2>

          <div className="bg-white rounded-lg p-4 mb-4">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              🎯 프로젝트 개요
            </h3>
            <p className="text-gray-700">
              <strong>백엔드:</strong> Node.js + Express + MongoDB + JWT 인증
            </p>
            <p className="text-gray-700">
              <strong>프론트엔드:</strong> React + Vite + Tailwind CSS
            </p>
            <p className="text-gray-700">
              <strong>배포:</strong> Vercel
            </p>
            <p className="text-gray-700">
              <strong>구조:</strong> Monorepo (backend + frontend)
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 mb-4">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              📁 1. 프로젝트 구조 생성
            </h3>
            <pre className="bg-gray-800 text-green-400 p-3 rounded overflow-x-auto text-xs">
              {`mkdir Blog && cd Blog
mkdir backend frontend`}
            </pre>
          </div>

          <div className="bg-white rounded-lg p-4 mb-4">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              🔧 2. 백엔드 설정
            </h3>

            <h4 className="font-bold text-gray-700 mt-3 mb-2">패키지 설치</h4>
            <pre className="bg-gray-800 text-green-400 p-3 rounded overflow-x-auto text-xs">
              {`cd backend
npm init -y
npm install express mongoose cors dotenv bcryptjs jsonwebtoken
npm install -D nodemon`}
            </pre>

            <h4 className="font-bold text-gray-700 mt-3 mb-2">주요 파일</h4>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li>
                <code className="bg-gray-200 px-1 rounded">models/User.js</code>{" "}
                - 사용자 모델 (bcrypt 해싱)
              </li>
              <li>
                <code className="bg-gray-200 px-1 rounded">routes/auth.js</code>{" "}
                - 인증 라우터 (signup, login, me)
              </li>
              <li>
                <code className="bg-gray-200 px-1 rounded">index.js</code> -
                Express 서버
              </li>
              <li>
                <code className="bg-gray-200 px-1 rounded">vercel.json</code> -
                Vercel 배포 설정
              </li>
              <li>
                <code className="bg-gray-200 px-1 rounded">.env</code> - 환경
                변수 (MONGODB_URI, JWT_SECRET)
              </li>
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
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              🎨 3. 프론트엔드 설정
            </h3>

            <h4 className="font-bold text-gray-700 mt-3 mb-2">패키지 설치</h4>
            <pre className="bg-gray-800 text-green-400 p-3 rounded overflow-x-auto text-xs">
              {`cd frontend
npm install axios
npm install -D tailwindcss @tailwindcss/postcss`}
            </pre>

            <h4 className="font-bold text-gray-700 mt-3 mb-2">주요 파일</h4>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li>
                <code className="bg-gray-200 px-1 rounded">src/api.js</code> -
                API 연동 (axios)
              </li>
              <li>
                <code className="bg-gray-200 px-1 rounded">
                  src/components/Login.jsx
                </code>{" "}
                - 로그인
              </li>
              <li>
                <code className="bg-gray-200 px-1 rounded">
                  src/components/Signup.jsx
                </code>{" "}
                - 회원가입
              </li>
              <li>
                <code className="bg-gray-200 px-1 rounded">
                  src/components/Dashboard.jsx
                </code>{" "}
                - 대시보드
              </li>
              <li>
                <code className="bg-gray-200 px-1 rounded">
                  tailwind.config.js
                </code>{" "}
                - Tailwind 설정
              </li>
            </ul>

            <h4 className="font-bold text-gray-700 mt-3 mb-2">
              개발 서버 실행
            </h4>
            <pre className="bg-gray-800 text-green-400 p-3 rounded overflow-x-auto text-xs">
              {`npm run dev
# http://localhost:5173`}
            </pre>
          </div>

          <div className="bg-white rounded-lg p-4 mb-4">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              📦 4. Git & GitHub
            </h3>
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
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              🎯 4.5. 백엔드 폴더만 배포되는 원리
            </h3>

            <h4 className="font-bold text-gray-700 mt-3 mb-2">
              📌 핵심: Root Directory 설정
            </h4>
            <div className="bg-blue-50 p-3 rounded mb-3">
              <p className="text-sm text-gray-700 mb-2">
                <strong>같은 Git 저장소</strong>에서 <strong>두 개의 Vercel 프로젝트</strong>를 만들 수 있는 이유는 <code className="bg-gray-200 px-1 rounded">Root Directory</code> 설정 때문입니다.
              </p>
              <pre className="text-xs text-gray-700 bg-white p-2 rounded">
                {`Git 저장소: BackendBlog/
├── backend/  ← backend-blog 프로젝트 (Root: backend/)
└── frontend/ ← jiwooresume 프로젝트 (Root: frontend/)`}
              </pre>
            </div>

            <h4 className="font-bold text-gray-700 mt-3 mb-2">
              🔧 1) 초기 배포 시 Root Directory 자동 설정
            </h4>
            <pre className="bg-gray-800 text-green-400 p-3 rounded overflow-x-auto text-xs mb-2">
              {`cd /Users/ymd20.12.13/Documents/Blog/backend
vercel

# Vercel CLI가 물어봄:
? Set up and deploy "~/Documents/Blog/backend"? Y
? In which directory is your code located? ./

# Vercel이 자동으로:
# 1. Git 루트 찾기 (/Documents/Blog)
# 2. 현재 위치 계산 (backend/)
# 3. Root Directory를 "backend/"로 설정`}
            </pre>

            <h4 className="font-bold text-gray-700 mt-3 mb-2">
              📂 2) Vercel 프로젝트별 설정 저장
            </h4>
            <div className="text-sm text-gray-700 space-y-2 mb-3">
              <p>
                <strong>backend-blog 프로젝트:</strong>
              </p>
              <pre className="bg-gray-100 p-2 rounded text-xs">
                {`설정: rootDirectory = "backend/"
빌드할 때: Git 저장소에서 backend/ 폴더만 추출`}
              </pre>
              <p className="mt-2">
                <strong>jiwooresume 프로젝트:</strong>
              </p>
              <pre className="bg-gray-100 p-2 rounded text-xs">
                {`설정: rootDirectory = "frontend/"
빌드할 때: Git 저장소에서 frontend/ 폴더만 추출`}
              </pre>
            </div>

            <h4 className="font-bold text-gray-700 mt-3 mb-2">
              🚀 3) Git Push 시 배포 프로세스
            </h4>
            <div className="bg-yellow-50 p-3 rounded text-sm">
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>
                  <code className="bg-gray-200 px-1 rounded">git push</code> →
                  GitHub 저장소 업데이트
                </li>
                <li>
                  Vercel Webhook 감지 → 변경된 파일 확인
                </li>
                <li>
                  <strong>backend-blog 프로젝트:</strong>
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>
                      <code className="bg-gray-200 px-1 rounded">
                        rootDirectory: "backend/"
                      </code>{" "}
                      확인
                    </li>
                    <li>backend/ 폴더만 추출</li>
                    <li>backend/package.json, vercel.json 읽어서 빌드</li>
                    <li>backend-blog-snowy.vercel.app 배포</li>
                  </ul>
                </li>
                <li>
                  <strong>jiwooresume 프로젝트:</strong>
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>
                      <code className="bg-gray-200 px-1 rounded">
                        rootDirectory: "frontend/"
                      </code>{" "}
                      확인
                    </li>
                    <li>frontend/ 폴더만 추출</li>
                    <li>frontend/package.json 읽어서 빌드</li>
                    <li>jiwooresume.vercel.app 배포</li>
                  </ul>
                </li>
              </ol>
            </div>

            <h4 className="font-bold text-gray-700 mt-3 mb-2">
              ⚙️ 4) Vercel 대시보드에서 확인/수정
            </h4>
            <pre className="bg-gray-800 text-green-400 p-3 rounded overflow-x-auto text-xs mb-2">
              {`1. https://vercel.com → backend-blog 프로젝트 선택
2. Settings → General
3. Root Directory 섹션:
   
   Root Directory: backend/  [Edit]
   
   여기서 변경 가능:
   - "./" (전체 저장소)
   - "backend/" (backend 폴더만)
   - "frontend/" (frontend 폴더만)`}
            </pre>

            <div className="mt-3 p-3 bg-green-50 rounded">
              <p className="text-sm font-semibold text-green-800">💡 핵심 정리:</p>
              <ul className="text-xs text-green-700 space-y-1 mt-2 list-disc list-inside">
                <li>
                  <strong>Root Directory</strong>가 "어디를" 배포할지 결정
                </li>
                <li>
                  <strong>vercel.json</strong>은 "어떻게" 빌드할지 설정
                </li>
                <li>
                  하나의 Git 저장소에 여러 Vercel 프로젝트 연결 가능 (Monorepo)
                </li>
                <li>
                  Git Push하면 Vercel이 Root Directory 기준으로 각각 배포
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 mb-4">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              🚀 5. Vercel 배포
            </h3>

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
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              ✅ 배포된 URL
            </h3>
            <p className="text-sm text-gray-700 mb-2">
              <strong>백엔드:</strong>{" "}
              <a
                href="https://backend-blog-snowy.vercel.app/api"
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                backend-blog-snowy.vercel.app
              </a>
            </p>
            <p className="text-sm text-gray-700">
              <strong>프론트엔드:</strong>{" "}
              <a
                href="https://jiwooresume.vercel.app"
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                jiwooresume.vercel.app
              </a>
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 mb-4">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              🔄 지속적 배포 (CI/CD)
            </h3>

            <h4 className="font-bold text-gray-700 mt-3 mb-2">
              📂 저장소 구조
            </h4>
            <div className="bg-blue-50 p-3 rounded mb-3">
              <p className="text-sm text-gray-700 font-mono">
                <strong>하나의 Git 저장소</strong> (Monorepo)
              </p>
              <pre className="text-xs mt-2 text-gray-700">
                {`BackendBlog/
├── backend/      → Vercel 프로젝트: backend-blog
└── frontend/     → Vercel 프로젝트: jiwooresume`}
              </pre>
              <p className="text-xs text-gray-600 mt-2">
                💡 하나의 Git 저장소에 두 개의 Vercel 프로젝트가 연결되어
                있습니다
              </p>
            </div>

            <h4 className="font-bold text-gray-700 mt-3 mb-2">
              🔗 Vercel과 GitHub 연결
            </h4>
            <div className="text-sm text-gray-700 space-y-2 mb-3">
              <p>
                <strong>1. 백엔드:</strong> GitHub 저장소의{" "}
                <code className="bg-gray-200 px-1 rounded">backend/</code> 폴더
                감지
              </p>
              <p>
                <strong>2. 프론트엔드:</strong> GitHub 저장소의{" "}
                <code className="bg-gray-200 px-1 rounded">frontend/</code> 폴더
                감지
              </p>
              <p className="text-blue-600">
                ✨ Git Push하면 Vercel이 자동으로 두 프로젝트를 각각 배포합니다!
              </p>
            </div>

            <h4 className="font-bold text-gray-700 mt-3 mb-2">
              🚀 지속적 배포 방법
            </h4>

            <p className="text-sm font-semibold text-gray-700 mb-2">
              방법 1: Git Push로 자동 배포 (추천 ⭐)
            </p>
            <pre className="bg-gray-800 text-green-400 p-3 rounded overflow-x-auto text-xs mb-3">
              {`# 1. 코드 수정 후
git add .
git commit -m "Add new feature"
git push

# 2. Vercel이 자동으로 감지하여 배포
# - backend/ 변경 → backend-blog 자동 배포
# - frontend/ 변경 → jiwooresume 자동 배포
# - 둘 다 변경 → 둘 다 자동 배포`}
            </pre>

            <p className="text-sm font-semibold text-gray-700 mb-2">
              방법 2: Vercel CLI로 수동 배포
            </p>
            <pre className="bg-gray-800 text-green-400 p-3 rounded overflow-x-auto text-xs mb-3">
              {`# 백엔드만 배포
cd backend
vercel --prod

# 프론트엔드만 배포
cd frontend
vercel --prod

# 또는 개발 배포
vercel  # preview 배포 (테스트용)`}
            </pre>

            <h4 className="font-bold text-gray-700 mt-3 mb-2">
              📋 배포 워크플로우
            </h4>
            <div className="bg-yellow-50 p-3 rounded text-sm">
              <p className="font-semibold text-gray-800 mb-2">
                실제 작업 순서:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-gray-700">
                <li>로컬에서 코드 수정</li>
                <li>
                  <code className="bg-gray-200 px-1 rounded">npm run dev</code>
                  로 로컬 테스트
                </li>
                <li>
                  <code className="bg-gray-200 px-1 rounded">
                    git add . && git commit -m "message"
                  </code>
                </li>
                <li>
                  <code className="bg-gray-200 px-1 rounded">git push</code>
                </li>
                <li>⏳ Vercel이 자동으로 빌드 & 배포 (1-2분)</li>
                <li>✅ 배포 완료 알림 (이메일 또는 Vercel 대시보드)</li>
              </ol>
            </div>

            <h4 className="font-bold text-gray-700 mt-3 mb-2">🔍 배포 확인</h4>
            <pre className="bg-gray-800 text-green-400 p-3 rounded overflow-x-auto text-xs">
              {`# Vercel 대시보드에서 확인
https://vercel.com/dashboard

# 또는 CLI로 확인
vercel ls  # 프로젝트 목록
vercel inspect [URL]  # 배포 상세 정보`}
            </pre>
          </div>

          <div className="bg-white rounded-lg p-4">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              🎯 핵심 명령어 요약
            </h3>
            <pre className="bg-gray-800 text-green-400 p-3 rounded overflow-x-auto text-xs">
              {`# 개발
npm run dev               # 로컬 서버 실행

# Git 배포 (자동 CI/CD)
git add .
git commit -m "message"
git push                  # ← 이것만으로 자동 배포!

# 수동 배포
vercel                    # Preview 배포
vercel --prod             # Production 배포

# 환경 변수
vercel env add KEY production
vercel env ls             # 환경 변수 목록

# 배포 관리
vercel ls                 # 프로젝트 목록
vercel logs [URL]         # 배포 로그 확인`}
            </pre>

            <div className="mt-3 p-3 bg-green-50 rounded">
              <p className="text-sm font-semibold text-green-800">💡 팁:</p>
              <p className="text-xs text-green-700">
                Git Push만 하면 Vercel이 알아서 배포합니다. 별도의 설정이나
                스크립트 없이도 자동 CI/CD가 작동합니다!
              </p>
            </div>
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
