// ============================================================
// 🛣️ Auth Routes - 인증 관련 라우트 정의
// ============================================================
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// ============================================================
// 📍 라우트 정의
// ============================================================

/**
 * @route   POST /api/auth/signup
 * @desc    회원가입
 * @access  Public
 */
router.post("/signup", authController.signup);

/**
 * @route   POST /api/auth/login
 * @desc    이메일/비밀번호 로그인
 * @access  Public
 */
router.post("/login", authController.login);

/**
 * @route   POST /api/auth/google
 * @desc    Google OAuth 로그인
 * @access  Public
 */
router.post("/google", authController.googleLogin);

/**
 * @route   GET /api/auth/me
 * @desc    현재 로그인한 사용자 정보
 * @access  Private (토큰 필요)
 */
router.get("/me", authController.getCurrentUser);

module.exports = router;
