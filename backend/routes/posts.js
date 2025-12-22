const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Post = require("../models/Post");
const User = require("../models/User");

// @route   POST /api/posts
// @desc    게시물 작성
// @access  Private (로그인 필요)
router.post("/", async (req, res) => {
  // 인증 체크
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
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
  } catch (error) {
    console.error("인증 에러:", error);
    return res.status(401).json({
      success: false,
      message: "유효하지 않은 토큰입니다",
    });
  }

  // 게시물 작성 로직
  try {
    const { title, content } = req.body;

    // 필수 필드 체크
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "제목과 내용을 모두 입력해주세요",
      });
    }

    // 게시물 생성
    const post = await Post.create({
      title,
      content,
      author: req.user._id, // 로그인한 사용자 ID
    });

    // 작성자 정보 포함해서 응답
    const populatedPost = await Post.findById(post._id).populate(
      "author",
      "name email"
    );

    res.status(201).json({
      success: true,
      message: "게시물이 작성되었습니다",
      data: {
        post: populatedPost,
      },
    });
  } catch (error) {
    console.error("게시물 작성 에러:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다",
      error: error.message,
    });
  }
});

// @route   GET /api/posts
// @desc    모든 게시물 조회
// @access  Public
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "name email") // 작성자 정보 포함
      .sort({ createdAt: -1 }); // 최신순 정렬

    res.json({
      success: true,
      data: {
        posts,
        count: posts.length,
      },
    });
  } catch (error) {
    console.error("게시물 조회 에러:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다",
      error: error.message,
    });
  }
});

// @route   GET /api/posts/:id
// @desc    특정 게시물 조회
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "author",
      "name email"
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "게시물을 찾을 수 없습니다",
      });
    }

    res.json({
      success: true,
      data: {
        post,
      },
    });
  } catch (error) {
    console.error("게시물 조회 에러:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다",
      error: error.message,
    });
  }
});

// @route   PUT /api/posts/:id
// @desc    게시물 수정
// @access  Private (본인만)
router.put("/:id", authenticateUser, async (req, res) => {
  try {
    const { title, content } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "게시물을 찾을 수 없습니다",
      });
    }

    // 작성자 본인 확인
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "본인의 게시물만 수정할 수 있습니다",
      });
    }

    // 게시물 수정
    post.title = title || post.title;
    post.content = content || post.content;
    await post.save();

    const updatedPost = await Post.findById(post._id).populate(
      "author",
      "name email"
    );

    res.json({
      success: true,
      message: "게시물이 수정되었습니다",
      data: {
        post: updatedPost,
      },
    });
  } catch (error) {
    console.error("게시물 수정 에러:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다",
      error: error.message,
    });
  }
});

// @route   DELETE /api/posts/:id
// @desc    게시물 삭제
// @access  Private (본인만)
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "게시물을 찾을 수 없습니다",
      });
    }

    // 작성자 본인 확인
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "본인의 게시물만 삭제할 수 있습니다",
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "게시물이 삭제되었습니다",
    });
  } catch (error) {
    console.error("게시물 삭제 에러:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다",
      error: error.message,
    });
  }
});

module.exports = router;
