import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";  // 👈 import
import { PlayerProvider } from "./context/PLayerContext";
import { GoogleOAuthProvider } from "@react-oauth/google";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <GoogleOAuthProvider clientId="611360314458-nvkv0ebj64ddqegpe0lcl9mlduud2tst.apps.googleusercontent.com">
    <AuthProvider>
      <PlayerProvider>
       <App />
     </PlayerProvider>
    </AuthProvider>
  </GoogleOAuthProvider>
);


