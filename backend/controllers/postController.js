const jwt = require("jsonwebtoken");
const User = require("../models/User");
const postService = require("../services/postService");

/**
 * 게시물 컨트롤러
 * 요청 처리 및 응답 반환
 */

// 인증 미들웨어
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "로그인이 필요합니다",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "사용자를 찾을 수 없습니다",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "유효하지 않은 토큰입니다",
    });
  }
};

// CREATE: 게시물 작성
exports.createPost = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({success: false, message: "로그인이 필요합니다"});
    }

    const post = await postService.createPost(
      req.user._id,
      req.body,
      req.files
    );

    res.status(201).json({
      success: true,
      message: "게시물이 작성되었습니다",
      data: { post },
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다",
    });
  }
};

// READ: 모든 게시물 조회
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await postService.getAllPosts();

    res.json({
      success: true,
      data: {
        posts,
        count: posts.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다",
    });
  }
};

// READ: 특정 게시물 조회
exports.getPostById = async (req, res) => {
  try {
    const post = await postService.getPostById(req.params.id);

    res.json({
      success: true,
      data: { post },
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다",
    });
  }
};

// UPDATE: 게시물 수정
exports.updatePost = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({success: false, message: "로그인이 필요합니다"});
    }

    const updatedPost = await postService.updatePost(
      req.params.id,
      req.user._id,
      req.body
    );

    res.json({
      success: true,
      message: "게시물이 수정되었습니다",
      data: { post: updatedPost },
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다",
    });
  }
};

// DELETE: 게시물 삭제
exports.deletePost = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({success: false, message: "로그인이 필요합니다"});
    }

    await postService.deletePost(req.params.id, req.user._id);

    res.json({
      success: true,
      message: "게시물이 삭제되었습니다",
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다",
    });
  }
};

// LIKE: 좋아요 토글
exports.toggleLike = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({success: false, message: "로그인이 필요합니다"});
    }

    const result = await postService.toggleLike(req.params.id, req.user._id);

    res.json({
      success: true,
      message: result.isLiked ? "좋아요를 눌렀습니다" : "좋아요를 취소했습니다",
      data: result,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다",
    });
  }
};

exports.authenticateUser = authenticateUser;
