// ============================================================
// 🎮 Auth Controller - 인증 요청/응답 처리
// ============================================================
const authService = require("../services/authService");

/**
 * 회원가입 컨트롤러
 * @route   POST /api/auth/signup
 * @access  Public
 */
const signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const result = await authService.signup({ email, password, name });

    res.status(201).json({
      success: true,
      message: "회원가입이 완료되었습니다",
      data: result,
    });
  } catch (error) {
    console.error("회원가입 에러:", error);
    
    // 에러 메시지에 따라 적절한 상태 코드 반환
    const statusCode = error.message.includes("모든 필드") || 
                       error.message.includes("이미 사용중") ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message || "서버 오류가 발생했습니다",
    });
  }
};

/**
 * 로그인 컨트롤러
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔐 로그인 요청:", { email });

    const result = await authService.login({ email, password });

    console.log("✅ 로그인 성공:", email);
    res.json({
      success: true,
      message: "로그인 성공",
      data: result,
    });
  } catch (error) {
    console.error("❌ 로그인 에러 상세:", error);
    
    // 에러 메시지에 따라 적절한 상태 코드 반환
    let statusCode = 500;
    if (error.message.includes("입력해주세요")) {
      statusCode = 400;
    } else if (error.message.includes("잘못되었습니다")) {
      statusCode = 401;
    } else if (error.message.includes("서버 설정")) {
      statusCode = 500;
    }

    res.status(statusCode).json({
      success: false,
      message: error.message || "서버 오류가 발생했습니다",
    });
  }
};

/**
 * Google OAuth 로그인 컨트롤러
 * @route   POST /api/auth/google
 * @access  Public
 */
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    console.log("🔐 Google 로그인 요청");

    const result = await authService.googleLogin(credential);

    res.json({
      success: true,
      message: "Google 로그인 성공",
      data: result,
    });
  } catch (error) {
    console.error("❌ Google 로그인 에러:", error);
    
    const statusCode = error.message.includes("필요합니다") ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message || "Google 로그인 실패",
    });
  }
};

/**
 * 현재 로그인한 사용자 정보 조회 컨트롤러
 * @route   GET /api/auth/me
 * @access  Private (토큰 필요)
 */
const getCurrentUser = async (req, res) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const token = req.headers.authorization?.split(" ")[1];

    const user = await authService.getCurrentUser(token);

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("인증 에러:", error);
    
    const statusCode = error.message.includes("필요합니다") || 
                       error.message.includes("유효하지") ? 401 : 404;
    
    res.status(statusCode).json({
      success: false,
      message: error.message || "유효하지 않은 토큰입니다",
    });
  }
};

module.exports = {
  signup,
  login,
  googleLogin,
  getCurrentUser,
};
