import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />       
          <Route path="/home" element={<HomePage />} />
          <Route path="/favorites" element={<FavoriteSongs />} />      
          <Route path="/premium" element={<PremiumRegis />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/playlist/:id" element={<PlaylistDetail />} />
          <Route path="/playlist/:id/edit" element={<EditPlaylist />} />
        </Route>

        <Route path="/upload" element={<UploadSong />} />
        <Route path="/login" element={<LoginDialog />} />
        <Route path="/signup" element={<SignupDialog />} />
        <Route path="/admin" element={<AdminDashboard />} />
  <Route path="/search" element={<SearchPage />} />
      </Routes>
    </Router>
  );
}

export default App;
