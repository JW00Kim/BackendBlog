const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Comment = require("../models/Comment");
const User = require("../models/User");
const Post = require("../models/Post");

// 인증 미들웨어 (토큰 검증)
const authenticate = async (req, res, next) => {
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
    console.error("인증 에러:", error);
    return res.status(401).json({
      success: false,
      message: "유효하지 않은 토큰입니다",
    });
  }
};

// @route   GET /api/posts/:postId/comments
// @desc    특정 게시물의 모든 댓글 조회
// @access  Public
router.get("/posts/:postId/comments", async (req, res) => {
  try {
    const { postId } = req.params;

    // 게시물 존재 확인
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "게시물을 찾을 수 없습니다",
      });
    }

    // 해당 게시물의 댓글 조회 (최신순)
    const comments = await Comment.find({ post: postId })
      .populate("author", "name email") // 작성자 정보 포함
      .sort({ createdAt: -1 }); // 최신순 정렬

    res.json({
      success: true,
      data: {
        comments,
        count: comments.length,
      },
    });
  } catch (error) {
    console.error("댓글 조회 에러:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다",
      error: error.message,
    });
  }
});

// @route   POST /api/posts/:postId/comments
// @desc    댓글 작성
// @access  Private (로그인 필요)
router.post("/posts/:postId/comments", authenticate, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    // 내용 검증
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "댓글 내용을 입력해주세요",
      });
    }

    // 게시물 존재 확인
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "게시물을 찾을 수 없습니다",
      });
    }

    // 댓글 생성
    const comment = await Comment.create({
      content: content.trim(),
      author: req.user._id,
      post: postId,
    });

    // 작성자 정보 포함해서 반환
    const populatedComment = await Comment.findById(comment._id).populate(
      "author",
      "name email"
    );

    res.status(201).json({
      success: true,
      message: "댓글이 작성되었습니다",
      data: {
        comment: populatedComment,
      },
    });
  } catch (error) {
    console.error("댓글 작성 에러:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다",
      error: error.message,
    });
  }
});

// @route   DELETE /api/comments/:id
// @desc    댓글 삭제
// @access  Private (본인만)
router.delete("/comments/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "댓글을 찾을 수 없습니다",
      });
    }

    // 작성자 본인 확인
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "본인의 댓글만 삭제할 수 있습니다",
      });
    }

    await Comment.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "댓글이 삭제되었습니다",
    });
  } catch (error) {
    console.error("댓글 삭제 에러:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다",
      error: error.message,
    });
  }
});

module.exports = router;
