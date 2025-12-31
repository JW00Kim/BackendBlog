const express = require("express");
const router = express.Router();
const parseFormData = require("../middleware/parseFormData");
const postController = require("../controllers/postController");

// CREATE: 게시물 작성
router.post(
  "/",
  parseFormData,
  postController.authenticateUser,
  postController.createPost
);

// READ: 모든 게시물 조회
router.get("/", postController.getAllPosts);

// READ: 특정 게시물 조회
router.get("/:id", postController.getPostById);

// UPDATE: 게시물 수정
router.put(
  "/:id",
  postController.authenticateUser,
  postController.updatePost
);

// DELETE: 게시물 삭제
router.delete(
  "/:id",
  postController.authenticateUser,
  postController.deletePost
);

// LIKE: 좋아요 토글
router.post(
  "/:id/like",
  postController.authenticateUser,
  postController.toggleLike
);

module.exports = router;
