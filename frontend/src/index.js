import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";  // 👈 import
import { PlayerProvider } from "./context/PLayerContext";
import { GoogleOAuthProvider } from "@react-oauth/google";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <GoogleOAuthProvider clientId="904680302786-n2am857ruhddhol0s7aoj2fvonghh29i.apps.googleusercontent.com">
    <AuthProvider>
      <PlayerProvider>
       <App />
     </PlayerProvider>
    </AuthProvider>
  </GoogleOAuthProvider>
);
