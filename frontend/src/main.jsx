import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import "leaflet/dist/leaflet.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
const clientId =
  "772326937536-6sro0jeq4dsksu1pn0jejcfn90llr6nc.apps.googleusercontent.com";
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
);
