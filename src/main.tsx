import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/responsive.css";

// Global safety net for unhandled auth/lock rejections
window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
  const msg = event.reason?.message ?? String(event.reason ?? "");
  // Only intercept auth lock timeouts and fetch failures to avoid noise
  if (msg.includes("lock:sb-") || (msg.includes("Failed to fetch") && msg.includes("auth"))) {
    console.warn("[Auth] Suppressed unhandled rejection:", msg);
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
