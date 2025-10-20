import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import LoginDialog from "../pages/LoginDialog";
import SignupDialog from "../pages/SignupDialog";
import "./Layout.css";

export default function MainLayout() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoginOpen(false);
    window.location.reload();
  };

  return (
    <div className="homepage">
      <Header isLoginOpen={isLoginOpen} setIsLoginOpen={setIsLoginOpen} />

      <div className="main-layout">
        <Sidebar isLoginOpen={isLoginOpen} setIsLoginOpen={setIsLoginOpen} />

        <main className="main-content">
          {/* 👇 Tại đây sẽ hiển thị HomePage hoặc PremiumRegis */}
          <Outlet />
        </main>
      </div>

      <Footer />

      {isLoginOpen && (
        <LoginDialog
          onClose={() => setIsLoginOpen(false)}
          onSuccess={handleLoginSuccess}
        />
      )}
      {isSignupOpen && (
        <SignupDialog onClose={() => setIsSignupOpen(false)} />
      )}
    </div>
  );
}
