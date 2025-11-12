import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import HomePage from "./pages/HomePage";
import PremiumRegis from "./pages/PremiumRegis";
import AdminDashboard from "./pages/AdminDashboard";
import LoginDialog from "./pages/LoginDialog";
import SignupDialog from "./pages/SignupDialog";
import UploadSong from "./pages/UploadSong";
import UserProfile from "./pages/UserProfile";
import PlaylistDetail from "./pages/PlaylistDetail";
import EditPlaylist from "./pages/EditPlaylist";
import FavoriteSongs from "./pages/FavoriteSongs";
import SearchPage from "./pages/SearchPage";

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
          <Route path="/premium" element={<PremiumRegis />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/playlist/:id" element={<PlaylistDetail />} />
          <Route path="/playlist/:id/edit" element={<EditPlaylist />} />
          <Route path="/search" element={<SearchPage />} />
        </Route>

        {/* Routes công khai */}
        <Route path="/upload" element={<UploadSong />} />
        <Route path="/login" element={<LoginDialog />} />
        <Route path="/signup" element={<SignupDialog />} />
        
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