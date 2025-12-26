const mongoose = require("mongoose");

// 댓글 스키마 정의
const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, "댓글 내용을 입력해주세요"],
    trim: true,
    maxlength: [500, "댓글은 500자 이하여야 합니다"],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // User 모델 참조 (누가 썼는지)
    required: [true, "작성자가 필요합니다"],
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post", // Post 모델 참조 (어느 게시물에 달린 댓글인지)
    required: [true, "게시물이 필요합니다"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // 좋아요 누른 사용자들
      required: true,
    },
  ],
  dislikes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // 싫어요 누른 사용자들
      required: true,
    },
  ],
});

// 최신 댓글이 위로 오도록 기본 정렬 설정
commentSchema.index({ post: 1, createdAt: -1 });

module.exports = mongoose.model("Comment", commentSchema);
