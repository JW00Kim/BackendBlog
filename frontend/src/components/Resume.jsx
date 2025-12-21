import { useNavigate } from "react-router-dom";

function Resume() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-2xl p-8 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8 mb-6 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">{user.name}</h1>
            <p className="text-blue-100 text-lg mb-4">
              Full Stack Developer/IT 관리자
            </p>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📧</span>
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">📱</span>
                <span>010-2985-9363</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition duration-200 backdrop-blur-sm"
          >
            ← 뒤로가기
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽 사이드바 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 프로필 */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition duration-300">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">
              👤 프로필
            </h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>생년월일:</strong> 1997.04.27
              </p>
              <p>
                <strong>주소:</strong> 부산광역시
              </p>
              <p>
                <strong>GitHub:</strong>{" "}
                <a
                  href="https://github.com"
                  className="text-blue-600 hover:underline"
                >
                  github.com/username
                </a>
              </p>
              <p>
                <strong>가입일:</strong>{" "}
                {new Date(user.createdAt).toLocaleDateString("ko-KR")}
              </p>
            </div>
          </div>

          {/* 기술 스택 */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition duration-300">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-purple-500 pb-2">
              💻 기술 스택
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Frontend</h3>
                <div className="flex flex-wrap gap-2">
                  {["React", "Vite", "Tailwind"].map((skill) => (
                    <span
                      key={skill}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Backend</h3>
                <div className="flex flex-wrap gap-2">
                  {["Node.js", "Express", "MongoDB"].map((skill) => (
                    <span
                      key={skill}
                      className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Tools</h3>
                <div className="flex flex-wrap gap-2">
                  {["Git", "Vercel", "VS Code"].map((skill) => (
                    <span
                      key={skill}
                      className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 언어 */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition duration-300">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-green-500 pb-2">
              🌏 언어
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    한국어
                  </span>
                  <span className="text-sm text-gray-600">원어민</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full w-full"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    영어
                  </span>
                  <span className="text-sm text-gray-600">고급</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽 메인 컨텐츠 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 소개 */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition duration-300">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">
              ✨ 소개
            </h2>
            <p className="text-gray-700 leading-relaxed">
              안녕하세요! Full Stack 개발자 <strong>{user.name}</strong>
              입니다. React, Node.js, MongoDB를 활용한 웹 애플리케이션 개발에
              열정을 가지고 있으며, 사용자 경험을 최우선으로 하는 서비스를
              만들고자 노력합니다. 최신 기술 트렌드를 빠르게 습득하고 실무에
              적용하는 것을 좋아합니다.
            </p>
          </div>

          {/* 경력 */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition duration-300">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-purple-500 pb-2">
              💼 경력
            </h2>
            <div className="space-y-4">
              {/* IT 인프라 관리자 */}
              <div className="relative pl-8 border-l-4 border-blue-500">
                <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-500 rounded-full"></div>
                <div className="mb-1 flex justify-between items-start">
                  <h3 className="text-lg font-bold text-gray-800">
                    현대 트랜시스
                  </h3>
                  <span className="text-sm text-gray-600 bg-blue-100 px-3 py-1 rounded-full">
                    2023.01 - 현재
                  </span>
                </div>
                <p className="text-sm font-semibold text-blue-700 mb-2">
                  IT 인프라 관리자
                </p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>
                    사내 IT 인프라 전반 관리 및 운영 (서버, 네트워크, 보안)
                  </li>
                  <li>클라우드 서비스 도입 및 하이브리드 인프라 구축</li>
                  <li>정보 보안 정책 수립 및 컴플라이언스 관리</li>
                  <li>사내 시스템 모니터링 및 장애 대응 (99.9% 가용성 유지)</li>
                  <li>IT 예산 계획 및 비용 최적화 (연간 20% 절감)</li>
                  <li>임직원 IT 지원 및 기술 교육</li>
                </ul>
              </div>

              {/* 풀스택 개발자 */}
              <div className="relative pl-8 border-l-4 border-purple-500">
                <div className="absolute -left-2 top-0 w-4 h-4 bg-purple-500 rounded-full"></div>
                <div className="mb-1 flex justify-between items-start">
                  <h3 className="text-lg font-bold text-gray-800">
                    테크 스타트업
                  </h3>
                  <span className="text-sm text-gray-600 bg-purple-100 px-3 py-1 rounded-full">
                    2021.06 - 2022.12
                  </span>
                </div>
                <p className="text-sm font-semibold text-purple-700 mb-2">
                  Full Stack Developer
                </p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>React 기반 SPA 웹 애플리케이션 설계 및 개발</li>
                  <li>Node.js/Express 백엔드 API 서버 구축</li>
                  <li>
                    MongoDB 데이터베이스 설계 및 최적화 (쿼리 성능 30% 개선)
                  </li>
                  <li>CI/CD 파이프라인 구축 (Vercel 자동 배포)</li>
                  <li>RESTful API 설계 및 프론트엔드 연동</li>
                  <li>Tailwind CSS를 활용한 반응형 UI/UX 구현</li>
                </ul>
              </div>

              {/* 프론트엔드 개발자 */}
              <div className="relative pl-8 border-l-4 border-green-500">
                <div className="absolute -left-2 top-0 w-4 h-4 bg-green-500 rounded-full"></div>
                <div className="mb-1 flex justify-between items-start">
                  <h3 className="text-lg font-bold text-gray-800">
                    웹 에이전시
                  </h3>
                  <span className="text-sm text-gray-600 bg-green-100 px-3 py-1 rounded-full">
                    2020.03 - 2021.05
                  </span>
                </div>
                <p className="text-sm font-semibold text-green-700 mb-2">
                  Frontend Developer
                </p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>React를 활용한 기업 웹사이트 개발 (10+ 프로젝트)</li>
                  <li>반응형 웹 디자인 구현 및 크로스 브라우징 대응</li>
                  <li>JavaScript ES6+ 활용한 인터랙티브 UI 구현</li>
                  <li>Git을 통한 협업 및 코드 리뷰 참여</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 프로젝트 */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition duration-300">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-green-500 pb-2">
              🚀 프로젝트
            </h2>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border-l-4 border-blue-500">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Blog 플랫폼
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  React + Node.js + MongoDB로 구현한 풀스택 블로그 애플리케이션
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {["React", "Express", "MongoDB", "JWT", "Tailwind"].map(
                    (tech) => (
                      <span
                        key={tech}
                        className="bg-white text-blue-700 px-2 py-1 rounded text-xs font-medium shadow-sm"
                      >
                        {tech}
                      </span>
                    )
                  )}
                </div>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>JWT 기반 인증 시스템 구현</li>
                  <li>Vercel을 통한 자동 배포 (CI/CD)</li>
                  <li>반응형 UI/UX 디자인</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border-l-4 border-green-500">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  E-commerce 쇼핑몰
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  상품 관리 및 결제 시스템을 포함한 온라인 쇼핑몰
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {["React", "Node.js", "PostgreSQL", "Redis"].map((tech) => (
                    <span
                      key={tech}
                      className="bg-white text-green-700 px-2 py-1 rounded text-xs font-medium shadow-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>장바구니 및 주문 시스템 개발</li>
                  <li>Redis 캐싱으로 응답 속도 50% 개선</li>
                  <li>관리자 대시보드 구현</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 학력 */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition duration-300">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-yellow-500 pb-2">
              🎓 학력
            </h2>
            <div className="relative pl-8 border-l-4 border-yellow-500">
              <div className="absolute -left-2 top-0 w-4 h-4 bg-yellow-500 rounded-full"></div>
              <div className="mb-3 flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden shadow-lg bg-white">
                  <img 
                    src="/logo.png" 
                    alt="WSU Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-bold text-gray-800">
                      Washington State University
                    </h3>
                    <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap ml-2">
                      2018.08 - 2022.05
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">컴퓨터공학과 학사</p>
                  <p className="text-sm text-gray-700">
                    학점: 3.9 / 4.0 | 졸업 논문: "웹 성능 최적화 기법 연구"
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 자격증 */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition duration-300">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-red-500 pb-2">
              📜 자격증
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-800">정보처리기사</span>
                <span className="text-sm text-gray-600">2020.08</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-800">
                  AWS Certified Solutions Architect
                </span>
                <span className="text-sm text-gray-600">2022.03</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 푸터 */}
      <div className="mt-6 pt-6 border-t border-gray-300 text-center">
        <p className="text-sm text-gray-500">
          이 이력서는 {new Date().toLocaleDateString("ko-KR")}에 생성되었습니다
        </p>
      </div>
    </div>
  );
}

export default Resume;
