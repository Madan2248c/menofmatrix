import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PostDetail from './pages/PostDetail';
import Stories from './pages/Stories';
import Analytics from './pages/Analytics';
import Newsletters from './pages/Newsletters';
import News from './pages/News';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import BlogAdmin from './pages/BlogAdmin';
import YouTubeVideos from './pages/YouTubeVideos';
import YouTubeShorts from './pages/YouTubeShorts';
import YouTubeAnalytics from './pages/YouTubeAnalytics';
import YouTubeVideoDetail from './pages/YouTubeVideoDetail';
import Automation from './pages/Automation';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public pages */}
        <Route path="/" element={<Home />} />
        <Route path="/news" element={<News />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/login" element={<Login />} />
        {/* Owner-only pages */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/posts/:id"
          element={
            <ProtectedRoute>
              <PostDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stories"
          element={
            <ProtectedRoute>
              <Stories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/newsletters"
          element={
            <ProtectedRoute>
              <Newsletters />
            </ProtectedRoute>
          }
        />
        <Route
          path="/automation"
          element={
            <ProtectedRoute>
              <Automation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/blog-admin"
          element={
            <ProtectedRoute>
              <BlogAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/youtube/videos"
          element={
            <ProtectedRoute>
              <YouTubeVideos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/youtube/shorts"
          element={
            <ProtectedRoute>
              <YouTubeShorts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/youtube/analytics"
          element={
            <ProtectedRoute>
              <YouTubeAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/youtube/videos/:id"
          element={
            <ProtectedRoute>
              <YouTubeVideoDetail />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
