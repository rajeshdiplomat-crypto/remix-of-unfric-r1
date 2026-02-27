import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/responsive.css";

// Global safety net for unhandled auth/lock rejections
window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
  const reason = event.reason;
  const msg = reason?.message ?? String(reason ?? "");

  // Suppress auth-specific lock timeouts and fetch failures from Supabase refresh flows
  const isAuthLock = msg.includes("lock:sb-") || msg.includes("navigator.locks.request");
  const isAuthFetch = (reason instanceof TypeError && msg === "Failed to fetch") ||
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("Load failed");
  const isRefreshToken = msg.includes("refresh_token") || msg.includes("token");

  if (isAuthLock || (isAuthFetch && isRefreshToken) || (reason instanceof TypeError && msg === "Failed to fetch")) {
    console.warn("[Auth] Suppressed unhandled rejection:", msg.slice(0, 120));
    event.preventDefault();
  }
});

// Register Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("[SW] Registered:", reg.scope);
      })
      .catch((err) => {
        console.warn("[SW] Registration failed:", err);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
