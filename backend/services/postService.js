const Post = require("../models/Post");
const { uploadImageBuffer } = require("../lib/cloudinary");

/**
 * 게시물 서비스
 * 비즈니스 로직 처리
 */

exports.createPost = async (userId, { title, content }, files) => {
  if (!title || !content) {
    throw {status: 400, message: "제목과 내용을 모두 입력해주세요"};
  }

  let images = [];

  if (files?.length) {
    images = await Promise.all(
      files.map(async (file) => {
        const result = await uploadImageBuffer(file.buffer, {
          folder: "blog-posts",
        });
        return result.secure_url;
      })
    );
  }

  const post = await Post.create({
    title,
    content,
    images,
    author: userId,
  });

  return post;
};

exports.getAllPosts = async () => {
  const posts = await Post.find()
    .populate("author", "name email")
    .sort({ createdAt: -1 });

  return posts;
};

exports.getPostById = async (postId) => {
  const post = await Post.findById(postId)
    .populate("author", "name email")
    .populate("likes", "name email");

  if (!post) {
    throw {status: 404, message: "게시물을 찾을 수 없습니다"};
  }

  return post;
};

exports.updatePost = async (postId, userId, { title, content }) => {
  const post = await Post.findById(postId);

  if (!post) {
    throw {status: 404, message: "게시물을 찾을 수 없습니다"};
  }

  if (post.author.toString() !== userId.toString()) {
    throw {status: 403, message: "본인의 게시물만 수정할 수 있습니다"};
  }

  post.title = title || post.title;
  post.content = content || post.content;
  await post.save();

  const updatedPost = await Post.findById(post._id).populate("author", "name email");

  return updatedPost;
};

exports.deletePost = async (postId, userId) => {
  const post = await Post.findById(postId);

  if (!post) {
    throw {status: 404, message: "게시물을 찾을 수 없습니다"};
  }

  if (post.author.toString() !== userId.toString()) {
    throw {status: 403, message: "본인의 게시물만 삭제할 수 있습니다"};
  }

  await Post.findByIdAndDelete(postId);

  return true;
};

exports.toggleLike = async (postId, userId) => {
  const post = await Post.findById(postId);

  if (!post) {
    throw {status: 404, message: "게시물을 찾을 수 없습니다"};
  }

  const likeIndex = post.likes.indexOf(userId);

  if (likeIndex > -1) {
    post.likes.splice(likeIndex, 1);
  } else {
    post.likes.push(userId);
  }

  await post.save();

  return {
    likesCount: post.likes.length,
    isLiked: likeIndex === -1,
  };
};
