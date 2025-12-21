//몽고 DB와 bcryptjs를 사용하여 사용자 모델 정의

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "이메일을 입력해주세요"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "유효한 이메일을 입력해주세요",
    ],
  },
  password: {
    type: String,
    required: [true, "비밀번호를 입력해주세요"],
    minlength: [6, "비밀번호는 최소 6자 이상이어야 합니다"],
    select: false, // 기본적으로 비밀번호는 조회하지 않음
  },
  name: {
    type: String,
    required: [true, "이름을 입력해주세요"],
    trim: true,
    maxlength: [50, "이름은 50자 이하여야 합니다"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 비밀번호 저장 전 해싱 (회원가입 시)
userSchema.pre("save", async function () {
  // 비밀번호가 수정되지 않았으면 건너뛰기
  if (!this.isModified("password")) {
    return;
  }

  // 비밀번호 해싱
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 비밀번호 비교 메서드
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
