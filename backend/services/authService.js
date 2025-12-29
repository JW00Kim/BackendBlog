// ============================================================
// 🔐 Auth Service - 인증 관련 비즈니스 로직
// ============================================================
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Google OAuth 클라이언트 초기화
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * JWT 토큰 생성
 * @param {string} userId - 사용자 ID
 * @returns {string} JWT 토큰
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d", // 30일 동안 유효
  });
};

/**
 * 회원가입 비즈니스 로직
 * @param {Object} userData - 사용자 데이터 { email, password, name }
 * @returns {Object} { user, token }
 */
const signup = async ({ email, password, name }) => {
  // 필수 필드 체크
  if (!email || !password || !name) {
    throw new Error("모든 필드를 입력해주세요");
  }

  // 이미 존재하는 이메일 체크
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("이미 사용중인 이메일입니다");
  }

  // 새 사용자 생성
  const user = await User.create({
    email,
    password,
    name,
  });

  // JWT 토큰 생성
  const token = generateToken(user._id);

  return {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
    token,
  };
};

/**
 * 로그인 비즈니스 로직
 * @param {Object} credentials - 로그인 정보 { email, password }
 * @returns {Object} { user, token }
 */
const login = async ({ email, password }) => {
  // 필수 필드 체크
  if (!email || !password) {
    throw new Error("이메일과 비밀번호를 입력해주세요");
  }

  // JWT_SECRET 확인
  if (!process.env.JWT_SECRET) {
    throw new Error("서버 설정 오류 (JWT_SECRET)");
  }

  // 사용자 찾기 (비밀번호 포함)
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new Error("이메일 또는 비밀번호가 잘못되었습니다");
  }

  // 비밀번호 확인
  const isPasswordMatch = await user.matchPassword(password);
  if (!isPasswordMatch) {
    throw new Error("이메일 또는 비밀번호가 잘못되었습니다");
  }

  // JWT 토큰 생성
  const token = generateToken(user._id);

  return {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
    token,
  };
};

/**
 * Google OAuth 로그인 비즈니스 로직
 * @param {string} credential - Google ID 토큰
 * @returns {Object} { user, token }
 */
const googleLogin = async (credential) => {
  if (!credential) {
    throw new Error("Google 인증 토큰이 필요합니다");
  }

  // Google 토큰 검증
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { email, name, sub: googleId, picture } = payload;

  // 기존 사용자 확인
  let user = await User.findOne({ email });

  if (!user) {
    // 새 사용자 생성
    user = await User.create({
      email,
      name,
      password: Math.random().toString(36).slice(-8) + "Aa1!", // 랜덤 비밀번호 (사용 안 함)
      googleId,
      profilePicture: picture,
    });
    console.log("✅ 새 Google 사용자 생성:", email);
  } else {
    // 기존 사용자 Google ID 업데이트
    if (!user.googleId) {
      user.googleId = googleId;
      user.profilePicture = picture;
      await user.save();
    }
    console.log("✅ 기존 사용자 Google 로그인:", email);
  }

  // JWT 토큰 생성
  const token = generateToken(user._id);

  return {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
    },
    token,
  };
};

/**
 * 현재 사용자 정보 조회
 * @param {string} token - JWT 토큰
 * @returns {Object} user 정보
 */
const getCurrentUser = async (token) => {
  if (!token) {
    throw new Error("인증 토큰이 필요합니다");
  }

  // 토큰 검증
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);

  if (!user) {
    throw new Error("사용자를 찾을 수 없습니다");
  }

  return {
    id: user._id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
};

module.exports = {
  signup,
  login,
  googleLogin,
  getCurrentUser,
};
