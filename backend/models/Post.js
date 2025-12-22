const mongoose = require("mongoose");

// 게시물 스키마 정의
const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "제목을 입력해주세요"],
    trim: true,
    maxlength: [100, "제목은 100자 이하여야 합니다"],
  },
  content: {
    type: String,
    required: [true, "내용을 입력해주세요"],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // User 모델 참조
    required: [true, "작성자가 필요합니다"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// 게시물 수정 시 updatedAt 자동 갱신
postSchema.pre("save", function () {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model("Post", postSchema);
