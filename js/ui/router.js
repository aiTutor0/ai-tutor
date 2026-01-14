// js/ui/router.js
import {
  loginUser,
  registerUser,
  logoutUser,
  loginWithGoogle,
  getSession,
} from "../services/authService.js";

import { initChatUI, setTool } from "./chatUI.js";

const $ = (id) => document.getElementById(id);

// Basit local room state (frontend demo)
let rooms = ["Room 1", "Room 2"];

function hideAllViews() {
  ["landing-view", "auth-view", "dashboard-view", "workspace-view", "admin-view"].forEach(
    (id) => $(id)?.classList.add("hidden")
  );
}

function showView(id) {
  hideAllViews();
  $(id)?.classList.remove("hidden");
}

function setAuthTab(tab) {
  const loginForm = $("login-form");
  const regForm = $("register-form");
  const tabLogin = $("tab-login");
  const tabReg = $("tab-register");

  if (tab === "register") {
    loginForm?.classList.add("hidden");
    regForm?.classList.remove("hidden");
    tabLogin?.classList.remove("active");
    tabReg?.classList.add("active");
  } else {
    regForm?.classList.add("hidden");
    loginForm?.classList.remove("hidden");
    tabReg?.classList.remove("active");
    tabLogin?.classList.add("active");
  }
}

function setActiveMenu(tool) {
  document.querySelectorAll(".menu-link").forEach((a) => a.classList.remove("active"));
  const el = document.querySelector(`.menu-link[data-link="${tool}"]`);
  el?.classList.add("active");
}

function renderRooms() {
  const list = $("rooms-list");
  if (!list) return;

  list.innerHTML = rooms
    .map(
      (r) => `
      <button class="room-item" type="button" onclick="selectRoom('${encodeURIComponent(r)}')">
        <i class="fa-solid fa-hashtag"></i>
        <span>${r}</span>
      </button>
    `
    )
    .join("");
}

// Global: room seçimi (demo)
window.selectRoom = (encoded) => {
  const room = decodeURIComponent(encoded || "");
  // İstersen burada group chat ekranını açtırabiliriz:
  // openTool('group');
  alert("Selected: " + room);
};

export function initRouter() {
  initChatUI();

  // İlk render
  renderRooms();

  window.showLanding = () => {
    document.body.classList.add("public");
    document.body.classList.remove("no-sidebar");
    showView("landing-view");

    // dropdown/rooms kapat
    $("user-dropdown")?.classList.add("hidden");
    $("rooms-panel")?.classList.add("hidden");
  };

  window.showAuth = (tab = "login") => {
    showView("auth-view");
    setAuthTab(tab);
  };

  window.switchAuthTab = (tab) => setAuthTab(tab);

  // User menu
  window.toggleUserMenu = () => {
    $("user-dropdown")?.classList.toggle("hidden");
  };

  window.goBackHome = (e) => {
    e?.stopPropagation?.();
    $("user-dropdown")?.classList.add("hidden");
    window.showLanding();
  };

  // Logout user menüden: chatten çık, landing’e dön
  window.logoutFromMenu = async (e) => {
    e?.stopPropagation?.();
    $("user-dropdown")?.classList.add("hidden");

    try {
      await logoutUser();
    } catch (_) { }

    window.showLanding();
  };

  // Rooms toggle
  window.toggleRooms = (e) => {
    e?.preventDefault?.();
    const panel = $("rooms-panel");
    const caret = $("rooms-caret");

    const willOpen = panel?.classList.contains("hidden");
    panel?.classList.toggle("hidden");

    // caret döndürme
    if (caret) caret.classList.toggle("open", willOpen);

    // list render (güncel kalsın)
    renderRooms();
  };

  // Room ekleme
  window.addRoom = (e) => {
    e?.stopPropagation?.();
    const name = prompt("Room name?");
    if (!name) return;

    const clean = name.trim();
    if (!clean) return;

    // aynı isim varsa ekleme
    if (rooms.some((r) => r.toLowerCase() === clean.toLowerCase())) {
      alert("This room already exists.");
      return;
    }

    rooms.unshift(clean);
    renderRooms();
  };

  // Preview: backend olmadan UI görmek için
  window.previewUI = (role) => {
    document.body.classList.remove("public");

    if (role === "admin") document.body.classList.add("no-sidebar");
    else document.body.classList.remove("no-sidebar");

    const name =
      role === "teacher" ? "Teacher Demo" : role === "admin" ? "Admin Demo" : "Student Demo";
    const avatar = (name?.[0] || "U").toUpperCase();

    $("profile-name") && ($("profile-name").textContent = name);
    $("profile-role") && ($("profile-role").textContent = role);
    $("profile-avatar") && ($("profile-avatar").textContent = avatar);

    if (role === "admin") {
      showView("admin-view");
    } else {
      showView("workspace-view");
      setTool("chat");
      setActiveMenu("chat");
    }

    const rightPanel = $("ws-right-panel");
    if (rightPanel) rightPanel.style.display = role === "teacher" ? "block" : "none";
  };

  // Role aware dashboard (session varsa)
  window.showDashboard = async () => {
    document.body.classList.remove("public");

    const session = await getSession();
    const role = session?.user?.user_metadata?.role || "student";
    const name = session?.user?.user_metadata?.full_name || "User";

    const avatar = (name?.[0] || "U").toUpperCase();
    $("profile-name") && ($("profile-name").textContent = name);
    $("profile-role") && ($("profile-role").textContent = role);
    $("profile-avatar") && ($("profile-avatar").textContent = avatar);

    if (role === "admin") {
      document.body.classList.add("no-sidebar");
      showView("admin-view");
      return;
    }

    document.body.classList.remove("no-sidebar");
    showView("dashboard-view");
  };

  // tool open
  window.openTool = (tool, e, addHistory = true) => {
    e?.preventDefault?.();

    document.body.classList.remove("public");
    document.body.classList.remove("no-sidebar");

    showView("workspace-view");
    setTool(tool);
    setActiveMenu(tool);

    if (addHistory) history.pushState({ tool }, "", "#" + tool);
  };

  window.logout = async () => {
    await logoutUser();
    window.showLanding();
  };

  // Dışarı tıklayınca dropdown kapat
  document.addEventListener("click", (e) => {
    const dd = $("user-dropdown");
    const profile = document.querySelector(".user-profile");
    if (dd && profile && !profile.contains(e.target)) dd.classList.add("hidden");
  });

  // Auth handlers
  $("login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("login-email")?.value?.trim();
    const pass = $("login-password")?.value;

    const errorEl = $("auth-error");
    errorEl?.classList.add("hidden");

    try {
      const { error } = await loginUser(email, pass);
      if (error) {
        errorEl.textContent = error.message;
        errorEl?.classList.remove("hidden");
        return;
      }
      window.showDashboard();
    } catch (err) {
      errorEl.textContent = "Login failed: " + err.message;
      errorEl?.classList.remove("hidden");
    }
  });

  $("register-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = $("reg-name")?.value?.trim();
    const email = $("reg-email")?.value?.trim();
    const pass = $("reg-password")?.value;
    const confirm = $("reg-confirm")?.value;
    const role = document.querySelector('input[name="role"]:checked')?.value || "student";

    const errorEl = $("auth-error");
    errorEl?.classList.add("hidden");

    if (pass !== confirm) {
      errorEl.textContent = "Passwords do not match.";
      errorEl?.classList.remove("hidden");
      return;
    }

    try {
      const { error } = await registerUser({ name, email, password: pass, role });
      if (error) {
        errorEl.textContent = error.message;
        errorEl?.classList.remove("hidden");
        return;
      }

      alert("Registration successful! Please check your email to verify your account, then login.");
      window.showAuth("login");
    } catch (err) {
      errorEl.textContent = "Registration failed: " + err.message;
      errorEl?.classList.remove("hidden");
    }
  });

  $("btn-google-login")?.addEventListener("click", async () => {
    try {
      const { error } = await loginWithGoogle();
      if (error) alert("Google login failed: " + error.message);
    } catch (err) {
      alert("Google login error: " + err.message);
    }
  });

  $("btn-go-login")?.addEventListener("click", () => window.showAuth("login"));
  $("btn-go-register")?.addEventListener("click", () => window.showAuth("register"));
  $("btn-hero-start")?.addEventListener("click", () => window.showAuth("register"));
  $("btn-hero-login")?.addEventListener("click", () => window.showAuth("login"));

  $("btn-back-home")?.addEventListener("click", () => window.showLanding());
  $("btn-back-home-2")?.addEventListener("click", () => window.showLanding());

  $("tab-login")?.addEventListener("click", () => setAuthTab("login"));
  $("tab-register")?.addEventListener("click", () => setAuthTab("register"));

  window.addEventListener("popstate", (e) => {
    if (e.state && e.state.tool) {
      window.openTool(e.state.tool, null, false);
    } else {
      window.showLanding();
    }
  });

  window.showLanding();
}
