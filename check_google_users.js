// MongoDB에서 Google 로그인 사용자 확인하기
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./backend/models/User");

async function checkGoogleUsers() {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB 연결 성공\n");

    // Google 로그인 사용자 찾기
    const googleUsers = await User.find({ googleId: { $exists: true } });

    console.log(`📊 Google 로그인 사용자: ${googleUsers.length}명\n`);

    googleUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Google ID: ${user.googleId}`);
      console.log(`   프로필 사진: ${user.profilePicture || "없음"}`);
      console.log(`   가입일: ${user.createdAt}\n`);
    });

    // 전체 사용자 수
    const totalUsers = await User.countDocuments();
    console.log(`📈 전체 사용자: ${totalUsers}명`);

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ 에러:", error.message);
  }
}

checkGoogleUsers();
