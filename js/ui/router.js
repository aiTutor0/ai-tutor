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

// Basit local room state (frontend demo) - load from localStorage
let rooms = JSON.parse(localStorage.getItem('aitutor_rooms') || '["Room 1", "Room 2"]');

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

  // Get current user
  const currentUserStr = localStorage.getItem('aitutor_current_user');
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : { email: 'demo@example.com' };
  const userEmail = currentUser.email.toLowerCase();

  // Filter rooms to only show those the user has access to
  const accessibleRooms = rooms.filter(roomName => {
    const roomKey = `room_${roomName.replace(/\\s+/g, '_')}`;
    const creator = (localStorage.getItem(roomKey + '_creator') || '').toLowerCase();
    const members = JSON.parse(localStorage.getItem(roomKey + '_members') || '[]');

    return creator === userEmail || members.some(m => m.toLowerCase() === userEmail);
  });

  if (accessibleRooms.length === 0) {
    list.innerHTML = `<div style="padding:10px; text-align:center; color:var(--color-text-muted); font-size:0.85rem;">No rooms yet. Add one!</div>`;
    return;
  }

  list.innerHTML = accessibleRooms
    .map(
      (r) => `
      <button class="room-item" onclick="selectRoom('${encodeURIComponent(r)}')">
        <i class="fa-solid fa-hashtag"></i>
        <span>${r}</span>
        <i class="fa-solid fa-trash room-delete" onclick="event.stopPropagation(); deleteRoom('${encodeURIComponent(r)}')" title="Delete room"></i>
      </button>
    `
    )
    .join("");
}

// Delete room
window.deleteRoom = (encoded) => {
  const room = decodeURIComponent(encoded || "");
  if (!confirm(`Delete "${room}"?`)) return;

  // Get current rooms from localStorage
  let currentRooms = JSON.parse(localStorage.getItem('aitutor_rooms') || '[]');
  currentRooms = currentRooms.filter(r => r !== room);

  // Save updated rooms to localStorage
  localStorage.setItem('aitutor_rooms', JSON.stringify(currentRooms));

  // Update local variable too
  rooms = currentRooms;

  renderRooms();

  // Clear localStorage for this room's data
  const roomKey = `room_${room.replace(/\s+/g, '_')}`;
  localStorage.removeItem(roomKey);
  localStorage.removeItem(roomKey + '_creator');
  localStorage.removeItem(roomKey + '_members');
};

// Global: room seçimi - delegate to groupChat's selectGroupRoom
let currentRoom = null;

window.selectRoom = (encoded) => {
  const room = decodeURIComponent(encoded || "");
  currentRoom = room;

  // Use groupChat's selectGroupRoom if available (preferred - handles Supabase)
  if (typeof window.selectGroupRoom === 'function') {
    // Local rooms use room name as ID
    window.selectGroupRoom(room, encodeURIComponent(room), true);
    return;
  }

  // Fallback: handle locally
  const currentUserStr = localStorage.getItem('aitutor_current_user');
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : { email: 'user@example.com' };
  const userEmail = currentUser.email.toLowerCase();

  const roomKey = `room_${room.replace(/\s+/g, '_')}`;
  const roomCreator = (localStorage.getItem(roomKey + '_creator') || '').toLowerCase();
  const roomMembers = JSON.parse(localStorage.getItem(roomKey + '_members') || '[]');

  const isCreator = roomCreator === userEmail;
  const isMember = roomMembers.some(m => m.toLowerCase() === userEmail);

  if (!isCreator && !isMember) {
    alert('❌ Access denied. You are not a member of this room.');
    return;
  }

  window.openTool('group');
  const toolTitle = document.getElementById('tool-title');
  if (toolTitle) toolTitle.textContent = `🏠 ${room}`;

  const roomMessages = JSON.parse(localStorage.getItem(roomKey) || '[]');
  const chatWindow = document.getElementById('chat-window');

  if (chatWindow) {
    chatWindow.innerHTML = '';
    if (roomMessages.length === 0) {
      const welcomeDiv = document.createElement('div');
      welcomeDiv.className = 'message ai-msg';
      welcomeDiv.innerHTML = `
        <div class="msg-avatar"><i class="fa-solid fa-users"></i></div>
        <div class="msg-bubble">Welcome to ${room}! Start chatting with your group members.</div>
      `;
      chatWindow.appendChild(welcomeDiv);
    } else {
      roomMessages.forEach(msg => {
        const isCurrentUser = msg.senderEmail?.toLowerCase() === currentUser.email?.toLowerCase();
        const senderName = msg.senderName || msg.senderEmail?.split('@')[0] || 'User';
        const timestamp = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '';
        let attachmentHTML = '';
        if (msg.attachments && msg.attachments.length > 0) {
          attachmentHTML = msg.attachments.map(att => {
            if (typeof att === 'string' && att.startsWith('data:image')) {
              return `<img src="${att}" style="max-width:200px; max-height:150px; border-radius:8px; margin-bottom:8px; display:block;">`;
            }
            return '';
          }).join('');
        }
        const div = document.createElement('div');
        div.className = `message ${isCurrentUser ? 'user-msg' : 'ai-msg'}`;
        div.innerHTML = `
          <div class="msg-avatar" style="${!isCurrentUser ? 'background:var(--color-secondary);' : ''}">
            <i class="fa-solid fa-user"></i>
          </div>
          <div class="msg-bubble">
            <div style="font-size:0.75rem; color:${isCurrentUser ? 'rgba(255,255,255,0.85)' : 'var(--color-text-muted)'}; margin-bottom:4px;">
              <strong>${senderName}${isCurrentUser ? ' (You)' : ''}</strong>${timestamp ? ' • ' + timestamp : ''}
            </div>
            ${attachmentHTML}
            ${msg.content}
          </div>
        `;
        chatWindow.appendChild(div);
      });
    }
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
};

// === Workspace Tabs ===
function initWorkspaceTabs() {
  const tabs = document.querySelectorAll('.ws-tab[data-tab]');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      showTabPanel(tabName);
    });
  });
}

function showTabPanel(tabName) {
  // Hide all tab panels
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));

  // Show selected panel
  const panel = document.getElementById(`panel-${tabName}`);
  if (panel) panel.classList.remove('hidden');

  // Update active tab state
  document.querySelectorAll('.ws-tab[data-tab]').forEach(t => t.classList.remove('active'));
  const activeTab = document.querySelector(`.ws-tab[data-tab="${tabName}"]`);
  if (activeTab) activeTab.classList.add('active');

  // Refresh sent items when switching to sent tab (for room-specific filtering)
  if (tabName === 'sent' && typeof window.renderSentItems === 'function') {
    window.renderSentItems();
  }
}

// === Mobile Sidebar ===
function initMobileSidebar() {
  const menuBtn = $('mobile-menu-btn');
  const overlay = $('sidebar-overlay');

  if (menuBtn) {
    menuBtn.addEventListener('click', toggleMobileSidebar);
  }

  if (overlay) {
    overlay.addEventListener('click', closeMobileSidebar);
  }

  // Close on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileSidebar();
  });
}

function toggleMobileSidebar() {
  const sidebar = $('sidebar');
  const overlay = $('sidebar-overlay');

  sidebar?.classList.toggle('open');
  overlay?.classList.toggle('open');
  overlay?.setAttribute('aria-hidden', !sidebar?.classList.contains('open'));
}

function closeMobileSidebar() {
  $('sidebar')?.classList.remove('open');
  $('sidebar-overlay')?.classList.remove('open');
  $('sidebar-overlay')?.setAttribute('aria-hidden', 'true');
}

export async function initRouter() {
  // Hide all views initially to avoid flicker
  hideAllViews();

  initChatUI();

  // İlk render
  renderRooms();

  // === Workspace Tabs ===
  initWorkspaceTabs();

  // === Mobile Sidebar Toggle ===
  initMobileSidebar();

  window.showLanding = (addHistory = true) => {
    document.body.classList.add("public");
    document.body.classList.remove("no-sidebar");
    closeMobileSidebar(); // Close mobile sidebar when navigating
    showView("landing-view");

    // dropdown/rooms kapat
    $("user-dropdown")?.classList.add("hidden");
    $("rooms-panel")?.classList.add("hidden");

    if (addHistory) {
      history.pushState({ view: "landing" }, "", "#landing");
    }
  };

  window.showAuth = (tab = "login", addHistory = true) => {
    document.body.classList.add("public");
    document.body.classList.remove("no-sidebar");
    closeMobileSidebar();
    showView("auth-view");
    setAuthTab(tab);

    if (addHistory) {
      history.pushState({ view: "auth", tab }, "", "#auth-" + tab);
    }
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
  window.addRoom = async (e) => {
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

    // Create room using groupChat's createRoom (handles both Supabase and localStorage)
    if (typeof window.createRoom === 'function') {
      await window.createRoom(clean);
      // Update local rooms array for immediate display
      if (!rooms.includes(clean)) {
        rooms.unshift(clean);
      }
    } else {
      // Fallback to localStorage only if createRoom not available
      rooms.unshift(clean);
      localStorage.setItem('aitutor_rooms', JSON.stringify(rooms));

      const currentUserStr = localStorage.getItem('aitutor_current_user');
      const currentUser = currentUserStr ? JSON.parse(currentUserStr) : { email: 'demo@example.com' };

      const roomKey = `room_${clean.replace(/\s+/g, '_')}`;
      localStorage.setItem(roomKey + '_creator', currentUser.email);
      localStorage.setItem(roomKey + '_members', JSON.stringify([currentUser.email]));
    }

    // Render updated room list using groupChat's renderRooms if available
    if (typeof window.renderRooms === 'function') {
      window.renderRooms();
    } else {
      renderRooms();
    }
  };

  // Update menu visibility based on role
  function updateMenuForRole(role) {
    const studentOnlyTools = ['interview', 'translate', 'grammar', 'tutor'];

    studentOnlyTools.forEach(tool => {
      const link = document.querySelector(`.menu-link[data-link="${tool}"]`);
      if (link) {
        if (role === 'teacher') {
          link.style.display = 'none';
        } else {
          link.style.display = '';
        }
      }
    });

    // Update level test for teachers
    if (role === 'teacher') {
      updateLevelTestForTeacher();
    }
  }

  // Make level test view-only for teachers
  function updateLevelTestForTeacher() {
    window.isTeacher = true;
    // Render teacher view when they navigate to level test
    if (typeof window.renderTeacherLevelView === 'function') {
      window.renderTeacherLevelView();
    }
  }

  // Preview: backend olmadan UI görmek için
  window.previewUI = (role, addHistory = true) => {
    document.body.classList.remove("public");

    if (role === "admin") document.body.classList.add("no-sidebar");
    else document.body.classList.remove("no-sidebar");

    const name =
      role === "teacher" ? "Teacher Demo" : role === "admin" ? "Admin Demo" : "Student Demo";
    const avatar = (name?.[0] || "U").toUpperCase();

    $("profile-name") && ($("profile-name").textContent = name);
    $("profile-role") && ($("profile-role").textContent = role);
    $("profile-avatar") && ($("profile-avatar").textContent = avatar);

    // Update current user for group chat
    localStorage.setItem('aitutor_current_user', JSON.stringify({ email: `${role}@example.com`, name, role }));

    // Update menu based on role
    updateMenuForRole(role);

    if (role === "admin") {
      showView("admin-view");
    } else {
      showView("workspace-view");
      setTool("chat");
      setActiveMenu("chat");
    }

    if (addHistory) {
      history.pushState({ view: "preview", role }, "", "#preview-" + role);
    }
  };

  // Role aware dashboard (session varsa)
  window.showDashboard = async (addHistory = true) => {
    document.body.classList.remove("public");

    const session = await getSession();
    const role = session?.user?.user_metadata?.role || "student";
    const name = session?.user?.user_metadata?.full_name || "User";
    const email = session?.user?.email || "user@example.com";

    const avatar = (name?.[0] || "U").toUpperCase();
    $("profile-name") && ($("profile-name").textContent = name);
    $("profile-role") && ($("profile-role").textContent = role);
    $("profile-avatar") && ($("profile-avatar").textContent = avatar);

    // Save current user for group chat functionality
    localStorage.setItem('aitutor_current_user', JSON.stringify({ email, name, role }));

    // Update menu based on role
    updateMenuForRole(role);

    if (role === "admin") {
      document.body.classList.add("no-sidebar");
      showView("admin-view");
      if (addHistory) history.pushState({ view: "admin" }, "", "#admin");
      return;
    }

    document.body.classList.remove("no-sidebar");
    showView("dashboard-view");
    if (addHistory) history.pushState({ view: "dashboard" }, "", "#dashboard");
  };

  // tool open
  window.openTool = (tool, e, addHistory = true) => {
    e?.preventDefault?.();

    document.body.classList.remove("public");
    document.body.classList.remove("no-sidebar");

    showView("workspace-view");
    setTool(tool);
    setActiveMenu(tool);

    // Special handling for level test
    if (tool === 'level') {
      showTabPanel('level');
    } else {
      showTabPanel('chat');
    }

    if (addHistory) {
      history.pushState({ tool }, "", "#" + tool);
    }
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

    if (pass.length < 6) {
      errorEl.textContent = "Password must be at least 6 characters.";
      errorEl?.classList.remove("hidden");
      return;
    }

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

  // Password reset handlers
  $("btn-forgot-password")?.addEventListener("click", () => {
    $("login-form")?.classList.add("hidden");
    $("register-form")?.classList.add("hidden");
    $("reset-password-form")?.classList.remove("hidden");
  });

  $("btn-back-to-login")?.addEventListener("click", () => {
    $("reset-password-form")?.classList.add("hidden");
    $("login-form")?.classList.remove("hidden");
  });

  $("reset-password-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("reset-email")?.value?.trim();
    const newPass = $("reset-new-password")?.value;
    const confirmPass = $("reset-confirm-password")?.value;
    const errorEl = $("auth-error");

    errorEl?.classList.add("hidden");

    if (newPass.length < 6) {
      errorEl.textContent = "Password must be at least 6 characters.";
      errorEl?.classList.remove("hidden");
      return;
    }

    if (newPass !== confirmPass) {
      errorEl.textContent = "Passwords do not match.";
      errorEl?.classList.remove("hidden");
      return;
    }

    try {
      // For local/demo mode - just update localStorage
      // In real production, you'd use Supabase's password reset flow
      const storedUsers = JSON.parse(localStorage.getItem('aitutor_local_users') || '{}');
      if (storedUsers[email.toLowerCase()]) {
        storedUsers[email.toLowerCase()].password = newPass;
        localStorage.setItem('aitutor_local_users', JSON.stringify(storedUsers));
        alert("✅ Password reset successfully! You can now login with your new password.");
        $("reset-password-form")?.classList.add("hidden");
        $("login-form")?.classList.remove("hidden");
        $("login-email").value = email;
        $("login-password").value = "";
      } else {
        errorEl.textContent = "Email not found. Please register first.";
        errorEl?.classList.remove("hidden");
      }
    } catch (err) {
      errorEl.textContent = "Password reset failed: " + err.message;
      errorEl?.classList.remove("hidden");
    }
  });

  $("tab-login")?.addEventListener("click", () => setAuthTab("login"));
  $("tab-register")?.addEventListener("click", () => setAuthTab("register"));

  window.addEventListener("popstate", (e) => {
    const state = e.state || {};

    // Kök landing state'ine geri dönüldüyse, tekrar landing'e al ve
    // kullanıcıyı tarayıcı geçmişindeki önceki siteye çıkarmadan içeride tut.
    if (state.view === "landing-root") {
      window.showLanding(false);
      history.pushState({ view: "landing" }, "", "#landing");
      return;
    }

    if (state.tool && state.tool !== "landing") {
      // Araç görünümü arasında geri/ileri
      window.openTool(state.tool, null, false);
      return;
    }

    if (state.view === "auth") {
      window.showAuth(state.tab || "login", false);
      return;
    }

    if (state.view === "dashboard") {
      window.showDashboard(false);
      return;
    }

    if (state.view === "preview") {
      // Preview Teacher/Student/Admin geri dönüşü
      window.previewUI(state.role || "student", false);
      return;
    }

    if (state.view === "admin") {
      // Admin görünümüne basit dönüş (yeni session almadan)
      document.body.classList.remove("public");
      document.body.classList.add("no-sidebar");
      showView("admin-view");
      return;
    }

    // "landing" veya bilinmeyen durumda landing göster
    window.showLanding(false);
  });

  // Başlangıç state: landing-root + landing
  // Amaç: back tuşuyla tarayıcı geçmişindeki önceki siteye çıkmayı engellemek
  if (!history.state) {
    // Kök state (asla uygulama dışına çıkmayalım)
    history.replaceState({ view: "landing-root" }, "", "#landing");
    // Gerçek landing görünümü
    history.pushState({ view: "landing" }, "", "#landing");
  }

  // Check if user is already logged in
  try {
    const session = await getSession();
    if (session?.user) {
      // User is logged in, show dashboard
      await window.showDashboard(false);
    } else {
      // No session, show landing
      window.showLanding(false);
    }
  } catch (err) {
    console.error('Session check error:', err);
    window.showLanding(false);
  }
}
