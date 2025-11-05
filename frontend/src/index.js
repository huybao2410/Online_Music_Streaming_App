import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";  // 👈 import
import { PlayerProvider } from "./context/PlayerContext";


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  
  <PlayerProvider>
    <AuthProvider>
    
    <App />
  </AuthProvider>
  </PlayerProvider>
);
