import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getPost,
  deletePost,
  getComments,
  createComment,
  deleteComment,
  likePost,
  likeComment,
} from "../api";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 댓글 관련 state
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  // 좋아요 관련 state
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const data = await getPost(id);
        if (data.success) {
          setPost(data.data.post);
          // 좋아요 정보 초기화
          setLikesCount(data.data.post.likes?.length || 0);
          setIsLiked(
            currentUser && data.data.post.likes?.includes(currentUser.id)
          );
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch post");
      } finally {
        setLoading(false);
      }
    };

    const fetchComments = async () => {
      try {
        const data = await getComments(id);
        if (data.success) {
          setComments(data.data.comments);
        }
      } catch (err) {
        console.error("댓글 조회 실패:", err);
      }
    };

    fetchPost();
    fetchComments();
  }, [id]);

  // 댓글 작성
  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert("로그인이 필요합니다");
      navigate("/login");
      return;
    }

    if (!commentContent.trim()) {
      alert("댓글 내용을 입력해주세요");
      return;
    }

    try {
      setCommentLoading(true);
      const data = await createComment(id, commentContent);
      if (data.success) {
        setComments([data.data.comment, ...comments]);
        setCommentContent("");
      }
    } catch (err) {
      alert(err.response?.data?.message || "댓글 작성에 실패했습니다");
    } finally {
      setCommentLoading(false);
    }
  };

  // 댓글 삭제
  const handleCommentDelete = async (commentId) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      const data = await deleteComment(commentId);
      if (data.success) {
        setComments(comments.filter((c) => c._id !== commentId));
      }
    } catch (err) {
      alert(err.response?.data?.message || "댓글 삭제에 실패했습니다");
    }
  };

  // 댓글 좋아요 토글
  const handleCommentLike = async (commentId) => {
    if (!currentUser) {
      alert("로그인이 필요합니다");
      navigate("/login");
      return;
    }
    try {
      const data = await likeComment(commentId);
      if (data.success) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId
              ? {
                  ...c,
                  likes: data.data.isLiked
                    ? [...c.likes, currentUser.id]
                    : c.likes.filter((id) => id !== currentUser.id),
                }
              : c
          )
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || "댓글 좋아요 처리 실패");
    }
  };

  // 좋아요 토글
  const handleLike = async () => {
    if (!currentUser) {
      alert("로그인이 필요합니다");
      navigate("/login");
      return;
    }

    try {
      setLikeLoading(true);
      const data = await likePost(id);
      if (data.success) {
        setLikesCount(data.data.likesCount);
        setIsLiked(data.data.isLiked);

        // 게시물 다시 불러와서 좋아요 누른 사람 목록 갱신
        const postData = await getPost(id);
        if (postData.success) {
          setPost(postData.data.post);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || "좋아요 처리에 실패했습니다");
    } finally {
      setLikeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Post not found</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4">
      <button
        onClick={() => navigate("/posts")}
        className="mb-4 text-blue-600 hover:text-blue-800"
      >
        ← Back to Posts
      </button>

      {/* 게시물 본문 */}
      <article className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{post.title}</h1>
        <p className="text-gray-600 text-sm mb-4">
          By {post.author?.name || post.author?.email || "Unknown"} on{" "}
          {new Date(post.createdAt).toLocaleDateString()}
        </p>
        <div className="prose prose-lg max-w-none text-gray-700 whitespace-pre-wrap">
          {post.content}
        </div>

        {/* 좋아요 버튼 */}
        <div className="mt-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              disabled={likeLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                likesCount >= 1
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="text-xl">{likesCount >= 1 ? "❤️" : "🤍"}</span>
              <span className="font-semibold">{likesCount}</span>
            </button>
          </div>

          {/* 좋아요 누른 사람들 */}
          {post.likes && post.likes.length > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              {post.likes.map((user, index) => (
                <span key={user._id || index}>
                  {user.name || user.email}
                  {index < post.likes.length - 1 ? ", " : ""}
                </span>
              ))}
              님이 좋아합니다
            </p>
          )}
        </div>

        <div className="mt-4 flex gap-4">
          <button
            onClick={() => navigate(`/posts/edit/${post._id}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Edit
          </button>
          <button
            onClick={async () => {
              if (confirm("Are you sure you want to delete this post?")) {
                try {
                  await deletePost(post._id);
                  navigate("/posts");
                } catch (err) {
                  alert("Failed to delete post");
                }
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </article>

      {/* 댓글 섹션 */}
      <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          💬 댓글 ({comments.length})
        </h2>

        {/* 댓글 작성 폼 */}
        {currentUser ? (
          <form onSubmit={handleCommentSubmit} className="mb-6">
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="댓글을 입력하세요..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">
                {commentContent.length}/500
              </span>
              <button
                type="submit"
                disabled={commentLoading || !commentContent.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {commentLoading ? "작성중..." : "댓글 작성"}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-gray-600">
              댓글을 작성하려면{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-blue-600 hover:underline font-semibold"
              >
                로그인
              </button>
              이 필요합니다.
            </p>
          </div>
        )}

        {/* 댓글 목록 */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              첫 댓글을 작성해보세요!
            </p>
          ) : (
            comments.map((comment) => {
              // 현재 사용자가 이 댓글에 좋아요를 눴는지 판별
              const isCommentLiked =
                currentUser && comment.likes?.includes(currentUser.id);
              return (
                <div
                  key={comment._id}
                  className="border-b border-gray-200 pb-4 last:border-0"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-800">
                          {comment.author?.name || comment.author?.email}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(comment.createdAt).toLocaleString("ko-KR")}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                      {/* 댓글 좋아요 버튼 */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleCommentLike(comment._id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all duration-150
                            ${
                              isCommentLiked
                                ? "bg-pink-100 text-pink-600"
                                : "bg-gray-100 text-gray-500"
                            }
                          `}
                        >
                          {isCommentLiked ? "❤️" : "🤍"} {comment.likes.length}
                        </button>
                      </div>
                    </div>
                    {currentUser && currentUser.id === comment.author?._id && (
                      <button
                        onClick={() => handleCommentDelete(comment._id)}
                        className="text-red-600 hover:text-red-800 text-sm ml-4"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
