import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import Resume from "./components/Resume";
import Navbar from "./components/Navbar";
import PostList from "./components/PostList";
import PostCreate from "./components/PostCreate";
import PostDetail from "./components/PostDetail";
import PostEdit from "./components/PostEdit";

// 보호된 라우트 컴포넌트
function PrivateRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));
  return user ? children : <Navigate to="/login" replace />;
}

// 공개 라우트 (로그인된 사용자는 대시보드로)
function PublicRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));
  return !user ? children : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <Signup />
                </PublicRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/resume"
              element={
                <PrivateRoute>
                  <Resume />
                </PrivateRoute>
              }
            />
            <Route
              path="/posts"
              element={
                <PrivateRoute>
                  <PostList />
                </PrivateRoute>
              }
            />
            <Route
              path="/posts/create"
              element={
                <PrivateRoute>
                  <PostCreate />
                </PrivateRoute>
              }
            />
            <Route
              path="/posts/:id"
              element={
                <PrivateRoute>
                  <PostDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/posts/edit/:id"
              element={
                <PrivateRoute>
                  <PostEdit />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
