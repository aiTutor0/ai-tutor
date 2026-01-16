// js/ui/adminPanel.js
// Admin Panel functionality - User tracking and chat viewing

const ONLINE_USERS_KEY = 'aitutor_online_users';
const CHAT_HISTORY_KEY = 'aitutor_chat_history';
const ALL_USERS_KEY = 'aitutor_all_users';

// Initialize admin panel
function initAdminPanel() {
    // Record current user as online
    recordUserOnline();

    // Load initial data
    renderAllUsers();
    renderOnlineUsers();
    populateUserSelect();

    // Refresh online users periodically
    setInterval(renderOnlineUsers, 30000);
}

// Record user login with timestamp
function recordUserOnline() {
    const currentUserStr = localStorage.getItem('aitutor_current_user');
    if (!currentUserStr) return;

    const currentUser = JSON.parse(currentUserStr);
    const onlineUsers = JSON.parse(localStorage.getItem(ONLINE_USERS_KEY) || '{}');

    onlineUsers[currentUser.email] = {
        ...currentUser,
        loginTime: Date.now(),
        lastActive: Date.now()
    };

    localStorage.setItem(ONLINE_USERS_KEY, JSON.stringify(onlineUsers));

    // Also add to all users list
    const allUsers = JSON.parse(localStorage.getItem(ALL_USERS_KEY) || '{}');
    allUsers[currentUser.email] = {
        ...currentUser,
        lastActive: Date.now()
    };
    localStorage.setItem(ALL_USERS_KEY, JSON.stringify(allUsers));
}

// Update last active time
function updateUserActivity() {
    const currentUserStr = localStorage.getItem('aitutor_current_user');
    if (!currentUserStr) return;

    const currentUser = JSON.parse(currentUserStr);
    const onlineUsers = JSON.parse(localStorage.getItem(ONLINE_USERS_KEY) || '{}');

    if (onlineUsers[currentUser.email]) {
        onlineUsers[currentUser.email].lastActive = Date.now();
        localStorage.setItem(ONLINE_USERS_KEY, JSON.stringify(onlineUsers));
    }
}

// Get online users (active within last 5 minutes)
function getOnlineUsers() {
    const onlineUsers = JSON.parse(localStorage.getItem(ONLINE_USERS_KEY) || '{}');
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

    return Object.values(onlineUsers).filter(user => user.lastActive > fiveMinutesAgo);
}

// Get all registered users
function getAllUsers() {
    const allUsers = JSON.parse(localStorage.getItem(ALL_USERS_KEY) || '{}');
    return Object.values(allUsers);
}

// Render all users in Users tab
function renderAllUsers() {
    const list = document.getElementById('admin-users-list');
    if (!list) return;

    const users = getAllUsers();
    const onlineEmails = getOnlineUsers().map(u => u.email);

    if (users.length === 0) {
        list.innerHTML = `<div class="admin-row"><div style="grid-column:1/-1; text-align:center; padding:20px; color:var(--color-text-muted);">No users found</div></div>`;
        return;
    }

    list.innerHTML = users.map(user => {
        const isOnline = onlineEmails.includes(user.email);
        const lastActive = user.lastActive ? new Date(user.lastActive).toLocaleString() : 'Never';

        return `
      <div class="admin-row" data-email="${user.email}">
        <div>${escapeHtml(user.name || 'Unknown')}</div>
        <div>${escapeHtml(user.email)}</div>
        <div>${escapeHtml(user.role || 'student')}</div>
        <div>${lastActive}</div>
        <div><span class="pill ${isOnline ? 'ok' : ''}">${isOnline ? 'Online' : 'Offline'}</span></div>
        <div><button class="link-btn" onclick="viewUserChats('${user.email}')">View Chats</button></div>
      </div>
    `;
    }).join('');
}

// Render online users
function renderOnlineUsers() {
    const list = document.getElementById('admin-online-list');
    if (!list) return;

    const users = getOnlineUsers();

    if (users.length === 0) {
        list.innerHTML = `<div class="admin-row"><div style="grid-column:1/-1; text-align:center; padding:20px; color:var(--color-text-muted);">No users currently online</div></div>`;
        return;
    }

    list.innerHTML = users.map(user => {
        const loginTime = new Date(user.loginTime).toLocaleTimeString();

        return `
      <div class="admin-row">
        <div>${escapeHtml(user.name || 'Unknown')}</div>
        <div>${escapeHtml(user.email)}</div>
        <div>${escapeHtml(user.role || 'student')}</div>
        <div>${loginTime}</div>
        <div><span class="pill ok">Online</span></div>
      </div>
    `;
    }).join('');
}

// Populate user select dropdown
function populateUserSelect() {
    const select = document.getElementById('admin-user-select');
    if (!select) return;

    const users = getAllUsers();

    select.innerHTML = '<option value="">-- Select a user --</option>';
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.email;
        option.textContent = `${user.name || user.email} (${user.role || 'student'})`;
        select.appendChild(option);
    });
}

// Load and display user's chat history
window.loadUserChats = function (email) {
    const viewer = document.getElementById('admin-chat-viewer');
    if (!viewer) return;

    if (!email) {
        viewer.innerHTML = '<p style="color:var(--color-text-muted); text-align:center;">Select a user to view their chat history</p>';
        return;
    }

    // Get all chat histories and filter by user email
    const allChats = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || '[]');

    // Filter chats by user email
    const userChats = allChats.filter(chat => chat.userEmail === email);

    if (userChats.length === 0) {
        viewer.innerHTML = `<p style="color:var(--color-text-muted); text-align:center;">No chat history found for ${escapeHtml(email)}</p>`;
        return;
    }

    viewer.innerHTML = userChats.map((chat, index) => {
        const messageCount = chat.messages?.length || 0;
        const created = new Date(chat.created_at).toLocaleString();

        return `
      <div style="border:1px solid var(--color-border); border-radius:8px; padding:12px; margin-bottom:12px; background:var(--color-card-bg); position:relative;">
        <button onclick="deleteChat('${chat.id}')" style="position:absolute; top:8px; right:8px; background:var(--color-error-bg); border:1px solid var(--color-error-border); color:var(--color-error-text); padding:4px 8px; border-radius:6px; cursor:pointer; font-size:0.75rem;" title="Delete this chat">
          <i class="fa-solid fa-trash"></i> Delete
        </button>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; padding-right:70px;">
          <strong style="color:var(--color-text-primary);">${escapeHtml(chat.title || 'Untitled Chat')}</strong>
          <span style="color:var(--color-text-muted); font-size:0.8rem;">${created}</span>
        </div>
        <div style="color:var(--color-text-muted); font-size:0.85rem; margin-bottom:8px;">
          ${messageCount} messages | Mode: ${chat.mode || 'chat'}
        </div>
        <div style="max-height:150px; overflow-y:auto; font-size:0.85rem;">
          ${(chat.messages || []).slice(0, 5).map(msg => `
            <div style="padding:6px 8px; margin:4px 0; border-radius:6px; background:${msg.role === 'user' ? 'var(--color-accent-light)' : 'var(--color-bg-secondary)'};">
              <span style="font-weight:bold;">${msg.role === 'user' ? '👤 User' : '🤖 AI'}:</span>
              ${escapeHtml((msg.content || '').substring(0, 100))}${(msg.content?.length || 0) > 100 ? '...' : ''}
            </div>
          `).join('')}
          ${messageCount > 5 ? `<p style="color:var(--color-text-muted); text-align:center; margin-top:8px;">... and ${messageCount - 5} more messages</p>` : ''}
        </div>
      </div>
    `;
    }).join('');
};

// Delete chat from admin panel
window.deleteChat = function (chatId) {
    if (!confirm('Are you sure you want to delete this chat?')) return;

    let allChats = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || '[]');
    allChats = allChats.filter(chat => chat.id !== chatId);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(allChats));

    // Refresh the view
    const select = document.getElementById('admin-user-select');
    if (select) loadUserChats(select.value);
};

// View chats for specific user (from Users tab)
window.viewUserChats = function (email) {
    showAdminTab('chats', document.querySelector('.admin-tab:last-child'));
    document.getElementById('admin-user-select').value = email;
    loadUserChats(email);
};

// Show admin tab
window.showAdminTab = function (tab, btn) {
    // Hide all panels
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.add('hidden'));

    // Remove active from all tabs
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));

    // Show selected panel
    const panel = document.getElementById(`admin-${tab}-panel`);
    if (panel) panel.classList.remove('hidden');

    // Set active tab
    if (btn) btn.classList.add('active');

    // Refresh data
    if (tab === 'online') renderOnlineUsers();
    if (tab === 'users') renderAllUsers();
    if (tab === 'chats') populateUserSelect();
};

// Filter users in search
window.filterAdminUsers = function (query) {
    const rows = document.querySelectorAll('#admin-users-list .admin-row');
    const q = query.toLowerCase();

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
    });
};

// Escape HTML helper
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Track activity on user actions
document.addEventListener('click', updateUserActivity);
document.addEventListener('keypress', updateUserActivity);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminPanel);
} else {
    initAdminPanel();
}
