import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import HomePage from "./pages/HomePage";
import PremiumRegis from "./pages/PremiumRegis";
import AdminDashboard from "./pages/AdminDashboard";
import LoginDialog from "./pages/LoginDialog";
import SignupDialog from "./pages/SignupDialog";
import UploadSong from "./pages/UploadSong";

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />       
          <Route path="/home" element={<HomePage />} />      
          <Route path="/premium" element={<PremiumRegis />} />
        </Route>

        <Route path="/upload" element={<UploadSong />} />
        <Route path="/login" element={<LoginDialog />} />
        <Route path="/signup" element={<SignupDialog />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
