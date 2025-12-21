const express = require("express"); // 익스프레스 라우터 불러오기
const router = express.Router(); // 라우터 생성
const jwt = require("jsonwebtoken"); // JWT 토큰 생성을 위한 라이브러리
const User = require("../models/User"); // 사용자 모델 불러오기

// JWT 토큰 생성 함수
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d", // 30일 동안 유효
  });
};

// @route   POST /api/auth/signup
// @desc    회원가입
// @access  Public
router.post("/signup", async (req, res) => {
  // 로직 설명해줄래?
  // 요청 바디에서 이메일, 비밀번호, 이름 추출
  // 필수 필드 체크
  // 이미 존재하는 이메일 체크
  // 새 사용자 생성
  // JWT 토큰 생성
  // 응답 반환
  try {
    const { email, password, name } = req.body; // 요청 바디에서 이메일, 비밀번호, 이름 추출

    // 필수 필드 체크
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "모든 필드를 입력해주세요",
      });
    }

    // 이미 존재하는 이메일 체크
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "이미 사용중인 이메일입니다",
      });
    }

    // 새 사용자 생성
    const user = await User.create({
      email,
      password,
      name,
    });

    // JWT 토큰 생성
    const token = generateToken(user._id);

    // 응답 반환
    res.status(201).json({
      success: true,
      message: "회원가입이 완료되었습니다",
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    console.error("회원가입 에러:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다",
      error: error.message,
    });
  }
});

// @route   POST /api/auth/login
// @desc    로그인
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body; // 클라이언트 에서 보낸 데이터

    // 필수 필드 체크
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "이메일과 비밀번호를 입력해주세요",
      });
    }

    // 사용자 찾기 (비밀번호 포함)
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "이메일 또는 비밀번호가 잘못되었습니다",
      });
    }

    // 비밀번호 확인
    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "이메일 또는 비밀번호가 잘못되었습니다",
      });
    }

    // ========== 허용된 사용자 이름 확인 ==========
    // const allowedNames = ["김지원", "정윤서", "김승주"]; // 허용할 이름 목록

    // if (!allowedNames.includes(user.name)) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "로그인 권한이 없는 사용자입니다",
    //   });
    // }

    // JWT 토큰 생성
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "로그인 성공",
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    console.error("로그인 에러:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다",
      error: error.message,
    });
  }
});

// @route   GET /api/auth/me
// @desc    현재 로그인한 사용자 정보
// @access  Private (토큰 필요)
router.get("/me", async (req, res) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "인증 토큰이 필요합니다",
      });
    }

    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "사용자를 찾을 수 없습니다",
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("인증 에러:", error);
    res.status(401).json({
      success: false,
      message: "유효하지 않은 토큰입니다",
      error: error.message,
    });
  }
});

module.exports = router;
