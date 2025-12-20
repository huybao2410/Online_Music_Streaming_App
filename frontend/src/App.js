import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import HomePage from "./pages/HomePage";
import AdminDashboard from "./pages/AdminDashboard";
import LoginDialog from "./pages/LoginDialog";
import SignupDialog from "./pages/SignupDialog";
import UserProfile from "./pages/UserProfile";
import PlaylistDetail from "./pages/PlaylistDetail";
import EditPlaylist from "./pages/EditPlaylist";
import FavoriteSongs from "./pages/FavoriteSongs";
import FavoriteAlbums from "./pages/FavoriteAlbums";
import SearchPage from "./pages/SearchPage";
import ArtistSelectionScreen from "./pages/ArtistSelectionScreen";
import AlbumDetailPage from "./pages/AlbumDetailPage";
import LibraryScreen from "./pages/LibraryScreen";
import ArtistsPage from "./pages/ArtistsPage";
import ArtistDetailPage from "./pages/ArtistDetailPage";
import PremiumPage from "./pages/PremiumPage";
import PaymentCallback from "./pages/PaymentCallback";
import PremiumSuccess from "./pages/PremiumSuccess";
import PremiumStatusPage from "./pages/PremiumStatusPage";
import AlbumDetail from "./pages/AlbumDetailPage";
import "./components/AdminTopSongs.css";

// Component redirect dựa trên role khi vào trang chủ
function RoleBasedRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");

    if (token && role === "admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  return null;
}

// Bảo vệ routes của admin - chỉ admin mới vào được
function AdminRoute({ children }) {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  return children;
}

// Bảo vệ routes của user - admin không được vào
function UserRoute({ children }) {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  // Nếu là admin, redirect về admin dashboard
  if (token && role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

function App() {
  // Quản lý session tab
  useEffect(() => {
    // Gán tabId cho mỗi tab (sessionStorage chỉ tồn tại trên từng tab)
    if (!sessionStorage.getItem('tabId')) {
      sessionStorage.setItem('tabId', Math.random().toString(36).substr(2, 9));
    }
    // Đánh dấu tab đang mở
    const tabId = sessionStorage.getItem('tabId');

    // Hàm cập nhật openTabs an toàn
    const addTab = () => {
      let openTabs = JSON.parse(localStorage.getItem('openTabs') || '[]');
      if (!openTabs.includes(tabId)) {
        openTabs.push(tabId);
        localStorage.setItem('openTabs', JSON.stringify(openTabs));
      }
      if (openTabs.length > 3) {
        alert('Bạn đang mở quá nhiều tab ứng dụng. Vui lòng đóng bớt để tránh lỗi đồng bộ.');
      }
    };
    const removeTab = () => {
      let tabs = JSON.parse(localStorage.getItem('openTabs') || '[]');
      tabs = tabs.filter(id => id !== tabId);
      localStorage.setItem('openTabs', JSON.stringify(tabs));
    };
    addTab();
    window.addEventListener('beforeunload', removeTab);

    // Đồng bộ đăng xuất giữa các tab
    const onStorage = (e) => {
      if (e.key === 'logout') {
        // Xử lý logout ở tab hiện tại (ví dụ: xóa token, reload)
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        localStorage.removeItem('user_id');
        window.location.href = '/login';
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('beforeunload', removeTab);
      window.removeEventListener('storage', onStorage);
      removeTab();
    };
  }, []);

  return (
    <Router>
      <Routes>
        {/* Redirect trang chủ dựa trên role */}
        <Route index element={<RoleBasedRedirect />} />

        {/* Routes cho user thường - admin không được vào */}
        <Route element={
          <UserRoute>
            <MainLayout />
          </UserRoute>
        }>
          <Route path="/home" element={<HomePage />} />
          <Route path="/favorites" element={<FavoriteSongs />} />
          <Route path="/favorite-albums" element={<FavoriteAlbums />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/library" element={<LibraryScreen />} />
          <Route path="/playlist/:id" element={<PlaylistDetail />} />
          <Route path="/playlist/:id/edit" element={<EditPlaylist />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/album/:albumId" element={<AlbumDetailPage />} />
          <Route path="/premium-upgrade" element={<PremiumPage />} />
          <Route path="/artists" element={<ArtistsPage />} />
          <Route path="/artist/:artistId" element={<ArtistDetailPage />} />
          {/* Thêm route PremiumStatus giữ nguyên layout */}
          <Route path="/premium-status" element={<PremiumStatusPage />} />
        </Route>

        {/* Routes công khai */}
        <Route path="/login" element={<LoginDialog />} />
        <Route path="/signup" element={<SignupDialog />} />
        <Route path="/artist-selection" element={<ArtistSelectionScreen />} />
        <Route path="/return-vnpay" element={<PaymentCallback />} />
        <Route path="/premium-success" element={<PremiumSuccess />} />
        {/* Route bảo vệ cho admin */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
      </Routes>
    </Router>
  );
}
export default App;