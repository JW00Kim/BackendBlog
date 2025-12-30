const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Post = require("../models/Post");
const User = require("../models/User");
const upload = require("../middleware/upload");
const { uploadImageBuffer } = require("../lib/cloudinary");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
};

const mimeToExt = (mime) => {
  switch (mime) {
    case "image/jpeg":
    case "image/jpg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/gif":
      return ".gif";
    case "image/webp":
      return ".webp";
    default:
      return "";
  }
};

const saveToLocalUploads = async (file) => {
  const uploadsDir = path.join(__dirname, "..", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const originalExt = path.extname(file.originalname || "");
  const ext = originalExt || mimeToExt(file.mimetype) || ".bin";
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;

  await fs.writeFile(path.join(uploadsDir, filename), file.buffer);
  return `/uploads/${filename}`;
};

// @route   POST /api/posts
// @desc    게시물 작성 (이미지 업로드 포함)
// @access  Private
router.post("/", upload.array("images", 5), async (req, res) => {
  // 인증 체크
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "로그인이 필요합니다",
    });
  }

  const token = authHeader.split(" ")[1];
  let userId;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.id;
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "유효하지 않은 토큰입니다",
    });
  }

  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "제목과 내용을 모두 입력해주세요",
      });
    }

    // 업로드된 이미지 URL 생성
    let images = [];

    if (req.files?.length) {
      console.log(`📤 ${req.files.length}개 파일 업로드 시작:`, {
        CLOUDINARY_CONFIGURED: isCloudinaryConfigured(),
        NODE_ENV: process.env.NODE_ENV,
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? "있음" : "없음",
      });

      if (!isCloudinaryConfigured()) {
        return res.status(500).json({
          success: false,
          message: "Cloudinary 환경변수가 설정되지 않았습니다",
          details: {
            CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? "있음" : "없음",
            CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? "있음" : "없음",
            CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? "있음" : "없음",
          },
        });
      }

      images = await Promise.all(
        req.files.map(async (file) => {
          console.log(`  업로드 중: ${file.originalname} (${file.size} bytes)`);
          const result = await uploadImageBuffer(file.buffer, {
            folder: "blog-posts",
          });
          console.log(`  ✅ 완료: ${result.secure_url}`);
          return result.secure_url;
        })
      );
      console.log(`✅ 모든 파일 업로드 완료`);
    }

    const post = await Post.create({
      title,
      content,
      images,
      author: userId, // 로그인한 사용자 ID
    });

    res.status(201).json({
      success: true,
      message: "게시물이 작성되었습니다",
      data: { post },
    });
  } catch (error) {
    console.error("❌ 게시물 작성 에러:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다",
      error: error.message,
      details: process.env.NODE_ENV === "production" ? undefined : error.stack,
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
    const post = await Post.findById(req.params.id)
      .populate("author", "name email")
      .populate("likes", "name email"); // 좋아요 누른 사용자 정보 포함

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
router.put("/:id", async (req, res) => {
  // 인증 체크
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
  } catch (error) {
    console.error("인증 에러:", error);
    return res.status(401).json({
      success: false,
      message: "유효하지 않은 토큰입니다",
    });
  }
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
router.delete("/:id", async (req, res) => {
  // 인증 체크
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
  } catch (error) {
    console.error("인증 에러:", error);
    return res.status(401).json({
      success: false,
      message: "유효하지 않은 토큰입니다",
    });
  }
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

// @route   POST /api/posts/:id/like
// @desc    게시물 좋아요 토글 (추가/제거)
// @access  Private (로그인 필요)
router.post("/:id/like", async (req, res) => {
  // 인증 체크
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
  } catch (error) {
    console.error("인증 에러:", error);
    return res.status(401).json({
      success: false,
      message: "유효하지 않은 토큰입니다",
    });
  }

  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "게시물을 찾을 수 없습니다",
      });
    }

    const userId = req.user._id;
    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex > -1) {
      // 이미 좋아요 누른 경우 - 제거
      post.likes.splice(likeIndex, 1);
    } else {
      // 좋아요 추가
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      success: true,
      message: likeIndex > -1 ? "좋아요를 취소했습니다" : "좋아요를 눌렀습니다",
      data: {
        likesCount: post.likes.length,
        isLiked: likeIndex === -1,
      },
    });
  } catch (error) {
    console.error("좋아요 에러:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다",
      error: error.message,
    });
  }
});

module.exports = router;
