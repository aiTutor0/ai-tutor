// js/app.js
import { initRouter } from "./ui/router.js";
import { initTheme } from "./ui/themeManager.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("Uygulama başlatılıyor...");
  initTheme();
  initRouter();
});
