import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPost, deletePost } from "../api";

function PostDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const data = await getPost(id);
      if (data.success) {
        setPost(data.data.post);
      }
    } catch (err) {
      setError("게시물을 불러오는데 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      const data = await deletePost(id);
      if (data.success) {
        alert("게시물이 삭제되었습니다.");
        navigate("/posts");
      }
    } catch (err) {
      alert("삭제에 실패했습니다.");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-red-600">{error || "게시물을 찾을 수 없습니다."}</div>
      </div>
    );
  }

  const isAuthor = currentUser && post.author?._id === currentUser.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          {/* 헤더 */}
          <div className="mb-6">
            <button
              onClick={() => navigate("/posts")}
              className="text-blue-500 hover:text-blue-600 mb-4 flex items-center"
            >
              ← 목록으로
            </button>

            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              {post.title}
            </h1>

            <div className="flex items-center justify-between text-sm text-gray-500 border-b pb-4">
              <div className="flex items-center space-x-4">
                <span>👤 {post.author?.name || "익명"}</span>
                <span>
                  📅 {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                </span>
                {post.createdAt !== post.updatedAt && (
                  <span className="text-xs">
                    (수정됨: {new Date(post.updatedAt).toLocaleDateString("ko-KR")})
                  </span>
                )}
              </div>

              {isAuthor && (
                <div className="space-x-2">
                  <button
                    onClick={() => navigate(`/posts/edit/${post._id}`)}
                    className="text-blue-500 hover:text-blue-600 px-3 py-1 border border-blue-500 rounded transition"
                  >
                    수정
                  </button>
                  <button
                    onClick={handleDelete}
                    className="text-red-500 hover:text-red-600 px-3 py-1 border border-red-500 rounded transition"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 내용 */}
          <div className="prose max-w-none">
            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {post.content}
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="mt-8 pt-6 border-t">
            <button
              onClick={() => navigate("/posts")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition"
            >
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostDetail;
