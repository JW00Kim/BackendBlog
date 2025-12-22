import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPosts, deletePost } from "../api";

function PostList() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await getPosts();
      if (data.success) {
        setPosts(data.data.posts);
      }
    } catch (err) {
      setError("게시물을 불러오는데 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      const data = await deletePost(postId);
      if (data.success) {
        fetchPosts(); // 목록 새로고침
      }
    } catch (err) {
      setError("삭제에 실패했습니다.");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">📝 게시물</h1>
            <div className="space-x-2">
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
              >
                대시보드
              </button>
              <button
                onClick={() => navigate("/posts/create")}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
              >
                ✏️ 글쓰기
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
              {error}
            </div>
          )}

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">
                아직 게시물이 없습니다.
              </p>
              <button
                onClick={() => navigate("/posts/create")}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition"
              >
                첫 게시물 작성하기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map((post) => (
                <div
                  key={post._id}
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-all duration-200 bg-white"
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => navigate(`/posts/${post._id}`)}
                  >
                    <h2 className="text-lg font-bold text-gray-800 mb-2 hover:text-blue-600 transition">
                      {post.title}
                    </h2>
                    <p className="text-gray-600 mb-4 line-clamp-3 text-sm">
                      {post.content}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex flex-col text-xs text-gray-500 space-y-1">
                      <span>👤 {post.author?.name || "익명"}</span>
                      <span>📅 {new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
                    </div>

                    {currentUser && post.author?._id === currentUser.id && (
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/posts/edit/${post._id}`);
                          }}
                          className="text-blue-500 hover:bg-blue-50 px-3 py-1 rounded text-sm transition"
                        >
                          수정
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(post._id);
                          }}
                          className="text-red-500 hover:bg-red-50 px-3 py-1 rounded text-sm transition"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PostList;
