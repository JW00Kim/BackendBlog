import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPost, updatePost } from "../api";

function PostEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const data = await getPost(id);
      if (data.success) {
        setFormData({
          title: data.data.post.title,
          content: data.data.post.content,
        });
      }
    } catch (err) {
      setError("게시물을 불러오는데 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim() || !formData.content.trim()) {
      setError("제목과 내용을 모두 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      const data = await updatePost(id, formData);

      if (data.success) {
        navigate(`/posts/${id}`);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError("본인의 게시물만 수정할 수 있습니다.");
      } else if (err.response?.status === 401) {
        setError("로그인이 필요합니다.");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(err.response?.data?.message || "게시물 수정에 실패했습니다.");
      }
      console.error(err);
    } finally {
      setSubmitting(false);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-8 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          ✏️ 게시물 수정
        </h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              제목
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="게시물 제목을 입력하세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={100}
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.title.length}/100
            </p>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              내용
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="게시물 내용을 입력하세요"
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => navigate(`/posts/${id}`)}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition duration-200"
              disabled={submitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:bg-gray-400"
              disabled={submitting}
            >
              {submitting ? "수정 중..." : "수정하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PostEdit;
