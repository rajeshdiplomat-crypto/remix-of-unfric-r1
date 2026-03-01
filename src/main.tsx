import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/responsive.css";
import { registerSW } from "virtual:pwa-register";


// Register Service Worker using vite-plugin-pwa
if ("serviceWorker" in navigator) {
  registerSW({
    immediate: true,
    onRegistered(r) {
      console.log("[SW] Registered via vite-plugin-pwa:", r?.scope);
    },
    onRegisterError(error) {
      console.error("[SW] Registration failed:", error);
    },
    onNeedRefresh() {
      console.log("New version available.");
    },
    onOfflineReady() {
      console.log("App ready to work offline.");
    },
  });
}


// 1. Better DOM query with a safety fallback check
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "Failed to find the root element. Ensure there is a <div id='root'></div> in your index.html."
  );
}

// 2. Wrap App in StrictMode for better development safety
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
