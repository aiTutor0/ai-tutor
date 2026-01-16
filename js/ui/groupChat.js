// Group Chat System - Supabase Integration
// Uses roomService.js for cross-user functionality
import { supabase } from "../config/supabaseClient.js";
import * as roomService from "../services/roomService.js";

const CURRENT_USER_KEY = 'aitutor_current_user';

// ============================================
// USER MANAGEMENT
// ============================================

// Get current user from localStorage (set during login)
function getCurrentUser() {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  if (stored) return JSON.parse(stored);
  return { email: 'demo@example.com', name: 'Demo User', role: 'student' };
}

// Set current user
window.setCurrentUser = function (email, name, role) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ email, name, role }));
};

// ============================================
// INVITATION BADGE
// ============================================

async function updateInvitationBadge() {
  const badge = document.getElementById('invitation-badge');
  if (!badge) return;

  if (!supabase) {
    badge.classList.add('hidden');
    return;
  }

  try {
    const { data: invitations } = await roomService.getMyInvitations();
    const count = invitations?.length || 0;

    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  } catch (err) {
    console.error('Error fetching invitations:', err);
    badge.classList.add('hidden');
  }
}

// ============================================
// GROUP CHAT PANEL TOGGLE
// ============================================

window.toggleGroupChat = function (e) {
  e?.preventDefault?.();
  const panel = document.getElementById('group-panel');
  const caret = document.getElementById('group-caret');

  const willOpen = panel?.classList.contains('hidden');
  panel?.classList.toggle('hidden');

  if (caret) caret.classList.toggle('open', willOpen);

  if (willOpen) {
    renderRooms();
    updateInvitationBadge();
  }
};

// ============================================
// ROOM MANAGEMENT
// ============================================

// Render rooms list
window.renderRooms = async function () {
  const list = document.getElementById('rooms-list');
  if (!list) return;

  // Show loading
  list.innerHTML = `<div style="padding:10px; text-align:center; color:var(--color-text-muted); font-size:0.85rem;">Loading...</div>`;

  if (!supabase) {
    // Fallback to localStorage demo mode
    renderRoomsLocalStorage();
    return;
  }

  try {
    const { data: rooms, error } = await roomService.getUserRooms();

    if (error) {
      console.error('Error fetching rooms:', error);
      renderRoomsLocalStorage();
      return;
    }

    if (!rooms || rooms.length === 0) {
      list.innerHTML = `<div style="padding:10px; text-align:center; color:var(--color-text-muted); font-size:0.85rem;">No rooms yet. Add one!</div>`;
      return;
    }

    const currentUser = getCurrentUser();
    const { data: { user: supaUser } } = await supabase.auth.getUser();

    list.innerHTML = rooms.map(room => {
      const isCreator = supaUser && room.creator_id === supaUser.id;

      return `
        <button class="room-item" onclick="selectRoomById('${room.id}', '${encodeURIComponent(room.name)}')" style="position:relative;">
          <i class="fa-solid fa-hashtag"></i>
          <span>${room.name}</span>
          <div style="display:flex; gap:4px; margin-left:auto;">
            <i class="fa-solid fa-users room-members" onclick="event.stopPropagation(); showRoomMembersById('${room.id}', '${encodeURIComponent(room.name)}')" title="Manage members" style="padding:4px; border-radius:4px;"></i>
            ${isCreator ? `<i class="fa-solid fa-user-plus room-invite" onclick="event.stopPropagation(); inviteToRoomById('${room.id}', '${encodeURIComponent(room.name)}')" title="Invite to room" style="padding:4px; border-radius:4px;"></i>` : ''}
            ${isCreator ? `<i class="fa-solid fa-trash room-delete" onclick="event.stopPropagation(); deleteRoomById('${room.id}')" title="Delete room"></i>` : ''}
          </div>
        </button>
      `;
    }).join('');
  } catch (err) {
    console.error('Error rendering rooms:', err);
    renderRoomsLocalStorage();
  }
};

// Fallback localStorage rooms (demo mode)
function renderRoomsLocalStorage() {
  const list = document.getElementById('rooms-list');
  if (!list) return;

  const allRooms = JSON.parse(localStorage.getItem('aitutor_rooms') || '[]');
  const currentUser = getCurrentUser();

  const accessibleRooms = allRooms.filter(roomName => {
    const roomKey = `room_${roomName.replace(/\s+/g, '_')}`;
    const creator = localStorage.getItem(roomKey + '_creator') || '';
    const members = JSON.parse(localStorage.getItem(roomKey + '_members') || '[]');
    return creator.toLowerCase() === currentUser.email.toLowerCase() ||
      members.some(m => m.toLowerCase() === currentUser.email.toLowerCase());
  });

  if (accessibleRooms.length === 0) {
    list.innerHTML = `<div style="padding:10px; text-align:center; color:var(--color-text-muted); font-size:0.85rem;">No rooms yet. Add one! (Demo mode)</div>`;
    return;
  }

  list.innerHTML = accessibleRooms.map(r => {
    const roomKey = `room_${r.replace(/\s+/g, '_')}`;
    const memberCount = JSON.parse(localStorage.getItem(roomKey + '_members') || '[]').length;
    const isCreator = (localStorage.getItem(roomKey + '_creator') || '').toLowerCase() === currentUser.email.toLowerCase();

    return `
      <button class="room-item" onclick="selectRoom('${encodeURIComponent(r)}')" style="position:relative;">
        <i class="fa-solid fa-hashtag"></i>
        <span>${r}</span>
        <span style="font-size:0.7rem; color:var(--color-text-muted); margin-left:4px;">(${memberCount})</span>
        <div style="display:flex; gap:4px; margin-left:auto;">
          <i class="fa-solid fa-users room-members" onclick="event.stopPropagation(); showRoomMembers('${r}')" title="Manage members" style="padding:4px; border-radius:4px;"></i>
          ${isCreator ? `<i class="fa-solid fa-user-plus room-invite" onclick="event.stopPropagation(); inviteToRoom('${r}')" title="Invite to room" style="padding:4px; border-radius:4px;"></i>` : ''}
          ${isCreator ? `<i class="fa-solid fa-trash room-delete" onclick="event.stopPropagation(); deleteRoom('${encodeURIComponent(r)}')" title="Delete room"></i>` : ''}
        </div>
      </button>
    `;
  }).join('');
}

// ============================================
// ROOM SELECTION (Supabase)
// ============================================

window.selectRoomById = async function (roomId, encodedName) {
  const roomName = decodeURIComponent(encodedName);

  // Store current room info
  window.currentRoomId = roomId;
  window.currentRoomName = roomName;

  // Update UI
  const tt = document.getElementById('tool-title');
  if (tt) tt.textContent = `🏠 ${roomName}`;

  // Load messages from Supabase
  const mw = document.getElementById('chat-window');
  if (mw) {
    mw.innerHTML = '<div style="text-align:center; padding:20px; color:var(--color-text-muted);">Loading messages...</div>';

    try {
      const { data: messages, error } = await roomService.getRoomMessages(roomId);

      if (error) throw error;

      mw.innerHTML = '';

      if (messages && messages.length > 0) {
        messages.forEach(msg => {
          const sender = msg.users?.full_name || msg.users?.email || 'Unknown';
          const time = new Date(msg.created_at).toLocaleTimeString();

          const div = document.createElement('div');
          div.className = 'message user-msg';
          div.innerHTML = `
            <div class="msg-avatar" style="background:var(--color-accent);"><i class="fa-solid fa-user"></i></div>
            <div class="msg-bubble">
              <div style="font-size:0.75rem; color:rgba(255,255,255,0.85); margin-bottom:4px; font-weight:500;">
                <strong style="font-weight:700;">${sender}</strong> • ${time}
              </div>
              ${escapeHtml(msg.content)}
            </div>
          `;
          mw.appendChild(div);
        });
        mw.scrollTop = mw.scrollHeight;
      }

      // Subscribe to new messages
      if (window.roomUnsubscribe) window.roomUnsubscribe();
      window.roomUnsubscribe = roomService.subscribeToRoomMessages(roomId, (newMsg) => {
        const sender = newMsg.users?.full_name || newMsg.users?.email || 'You';
        const time = new Date(newMsg.created_at).toLocaleTimeString();

        const div = document.createElement('div');
        div.className = 'message user-msg';
        div.innerHTML = `
          <div class="msg-avatar" style="background:var(--color-accent);"><i class="fa-solid fa-user"></i></div>
          <div class="msg-bubble">
            <div style="font-size:0.75rem; color:rgba(255,255,255,0.85); margin-bottom:4px; font-weight:500;">
              <strong style="font-weight:700;">${sender}</strong> • ${time}
            </div>
            ${escapeHtml(newMsg.content)}
          </div>
        `;
        mw.appendChild(div);
        mw.scrollTop = mw.scrollHeight;
      });

    } catch (err) {
      console.error('Error loading messages:', err);
      mw.innerHTML = '<div style="text-align:center; padding:20px; color:var(--color-text-muted);">Error loading messages</div>';
    }
  }

  // Switch to chat panel
  window.showTabPanel?.('chat');
};

// ============================================
// ROOM MEMBERS (Supabase)
// ============================================

window.showRoomMembersById = async function (roomId, encodedName) {
  const roomName = decodeURIComponent(encodedName);

  // Create modal
  let modal = document.getElementById('members-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'members-modal';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); z-index: 10000;
      display: flex; align-items: center; justify-content: center;
    `;
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div style="background:var(--color-card-bg); border:1px solid var(--color-border); border-radius:16px; padding:24px; max-width:500px; width:90%;">
      <div style="text-align:center; padding:20px; color:var(--color-text-muted);">
        <i class="fa-solid fa-spinner fa-spin"></i> Loading members...
      </div>
    </div>
  `;

  try {
    const { data: members, error } = await roomService.getRoomMembers(roomId);
    const { data: { user: currentSupaUser } } = await supabase.auth.getUser();

    if (error) throw error;

    modal.innerHTML = `
      <div style="background:var(--color-card-bg); border:1px solid var(--color-border); border-radius:16px; padding:24px; max-width:500px; width:90%; max-height:80vh; overflow-y:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <h3 style="margin:0;"><i class="fa-solid fa-users"></i> ${roomName} - Members</h3>
          <button onclick="closeMembersModal()" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:var(--color-text-muted);">&times;</button>
        </div>
        
        <div style="margin-bottom:16px;">
          <button class="primary-btn" style="width:100%; padding:10px;" onclick="inviteToRoomById('${roomId}', '${encodedName}'); closeMembersModal();">
            <i class="fa-solid fa-user-plus"></i> Invite New Member
          </button>
        </div>
        
        <div style="font-size:0.85rem; color:var(--color-text-muted); margin-bottom:12px;">
          ${members?.length || 0} member${(members?.length || 0) !== 1 ? 's' : ''} in this room
        </div>
        
        ${!members || members.length === 0 ? `
          <div style="text-align:center; padding:30px; color:var(--color-text-muted);">
            <i class="fa-solid fa-user-group" style="font-size:2rem; margin-bottom:10px;"></i>
            <p>No members yet. Invite someone!</p>
          </div>
        ` : `
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${members.map(member => {
      const isSelf = currentSupaUser && member.id === currentSupaUser.id;
      return `
                <div style="display:flex; align-items:center; justify-content:space-between; background:var(--color-bg-tertiary); border:1px solid var(--color-border); border-radius:10px; padding:12px;">
                  <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:36px; height:36px; border-radius:50%; background:var(--color-accent); display:flex; align-items:center; justify-content:center; color:white; font-weight:bold;">
                      ${(member.email || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style="font-weight:500;">${member.full_name || member.email}${isSelf ? ' (You)' : ''}</div>
                      <div style="font-size:0.75rem; color:var(--color-text-muted);">${member.email}</div>
                    </div>
                  </div>
                </div>
              `;
    }).join('')}
          </div>
        `}
      </div>
    `;
  } catch (err) {
    console.error('Error loading members:', err);
    modal.innerHTML = `
      <div style="background:var(--color-card-bg); border:1px solid var(--color-border); border-radius:16px; padding:24px; max-width:500px; width:90%;">
        <div style="text-align:center; padding:20px; color:var(--color-error-text);">
          Error loading members
        </div>
        <button onclick="closeMembersModal()" class="ghost-btn" style="width:100%;">Close</button>
      </div>
    `;
  }

  modal.onclick = (e) => {
    if (e.target === modal) closeMembersModal();
  };
};

window.closeMembersModal = function () {
  const modal = document.getElementById('members-modal');
  if (modal) modal.remove();
};

// ============================================
// INVITATIONS (Supabase)
// ============================================

window.inviteToRoomById = async function (roomId, encodedName) {
  const roomName = decodeURIComponent(encodedName);
  const email = prompt('Enter email address to invite:');

  if (!email || !email.includes('@')) {
    alert('Please enter a valid email address.');
    return;
  }

  try {
    const { data, error } = await roomService.inviteToRoom(roomId, email);

    if (error) {
      console.error('Invite error:', error);
      alert(`Error: ${error.message || 'Failed to send invitation'}`);
      return;
    }

    alert(`✅ Invitation sent to ${email} for room "${roomName}"`);
    console.log('📧 Invitation sent:', data);
  } catch (err) {
    console.error('Invite error:', err);
    alert('Error sending invitation');
  }
};

window.showInvitations = async function (e) {
  e?.preventDefault?.();
  e?.stopPropagation?.();

  // Create modal
  let modal = document.getElementById('invitations-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'invitations-modal';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); z-index: 10000;
      display: flex; align-items: center; justify-content: center;
    `;
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div style="background:var(--color-card-bg); border:1px solid var(--color-border); border-radius:16px; padding:24px; max-width:500px; width:90%;">
      <div style="text-align:center; padding:20px; color:var(--color-text-muted);">
        <i class="fa-solid fa-spinner fa-spin"></i> Loading invitations...
      </div>
    </div>
  `;

  try {
    const { data: invitations, error } = await roomService.getMyInvitations();

    if (error) throw error;

    modal.innerHTML = `
      <div style="background:var(--color-card-bg); border:1px solid var(--color-border); border-radius:16px; padding:24px; max-width:500px; width:90%; max-height:80vh; overflow-y:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <h3 style="margin:0;"><i class="fa-solid fa-envelope"></i> My Invitations</h3>
          <button onclick="closeInvitationsModal()" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:var(--color-text-muted);">&times;</button>
        </div>
        
        ${!invitations || invitations.length === 0 ? `
          <div style="text-align:center; padding:30px; color:var(--color-text-muted);">
            <i class="fa-solid fa-inbox" style="font-size:3rem; margin-bottom:10px;"></i>
            <p>No pending invitations</p>
          </div>
        ` : `
          <div style="display:flex; flex-direction:column; gap:12px;">
            ${invitations.map(inv => `
              <div style="background:var(--color-bg-tertiary); border:1px solid var(--color-border); border-radius:12px; padding:16px;">
                <div style="font-weight:bold; margin-bottom:8px;">
                  <i class="fa-solid fa-door-open"></i> ${inv.group_rooms?.name || 'Room'}
                </div>
                <div style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:12px;">
                  Invited by: ${inv.from_user?.full_name || inv.from_user?.email || 'Unknown'}
                </div>
                <div style="display:flex; gap:8px;">
                  <button class="primary-btn" style="padding:8px 16px; font-size:0.9rem;" onclick="acceptInvitationById('${inv.id}')">
                    <i class="fa-solid fa-check"></i> Accept
                  </button>
                  <button class="ghost-btn" style="padding:8px 16px; font-size:0.9rem;" onclick="declineInvitationById('${inv.id}')">
                    <i class="fa-solid fa-times"></i> Decline
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  } catch (err) {
    console.error('Error loading invitations:', err);
    modal.innerHTML = `
      <div style="background:var(--color-card-bg); border:1px solid var(--color-border); border-radius:16px; padding:24px; max-width:500px; width:90%;">
        <div style="text-align:center; padding:20px; color:var(--color-error-text);">
          Error loading invitations
        </div>
        <button onclick="closeInvitationsModal()" class="ghost-btn" style="width:100%;">Close</button>
      </div>
    `;
  }

  modal.onclick = (e) => {
    if (e.target === modal) closeInvitationsModal();
  };
};

window.closeInvitationsModal = function () {
  const modal = document.getElementById('invitations-modal');
  if (modal) modal.remove();
};

window.acceptInvitationById = async function (invitationId) {
  try {
    const { error } = await roomService.acceptInvitation(invitationId);

    if (error) {
      console.error('Accept error:', error);
      alert(`Error: ${error.message || 'Failed to accept invitation'}`);
      return;
    }

    alert('✅ Invitation accepted! You can now access the room.');
    closeInvitationsModal();
    updateInvitationBadge();
    renderRooms();
  } catch (err) {
    console.error('Accept error:', err);
    alert('Error accepting invitation');
  }
};

window.declineInvitationById = async function (invitationId) {
  try {
    const { error } = await roomService.declineInvitation(invitationId);

    if (error) {
      console.error('Decline error:', error);
      alert(`Error: ${error.message || 'Failed to decline invitation'}`);
      return;
    }

    alert('Invitation declined.');
    closeInvitationsModal();
    updateInvitationBadge();
  } catch (err) {
    console.error('Decline error:', err);
    alert('Error declining invitation');
  }
};

// ============================================
// DELETE ROOM (Supabase)
// ============================================

window.deleteRoomById = async function (roomId) {
  if (!confirm('Are you sure you want to delete this room?')) return;

  try {
    const { error } = await roomService.deleteRoom(roomId);

    if (error) {
      console.error('Delete error:', error);
      alert(`Error: ${error.message || 'Failed to delete room'}`);
      return;
    }

    alert('Room deleted.');
    renderRooms();
  } catch (err) {
    console.error('Delete error:', err);
    alert('Error deleting room');
  }
};

// ============================================
// LEGACY LOCALSTORAGE FUNCTIONS (for compatibility)
// ============================================

// These are kept for backward compatibility with router.js

window.showRoomMembers = function (roomName) {
  // For localStorage mode, use old implementation
  const roomKey = `room_${roomName.replace(/\s+/g, '_')}`;
  const members = JSON.parse(localStorage.getItem(roomKey + '_members') || '[]');
  const currentUser = getCurrentUser();
  const roomCreator = localStorage.getItem(roomKey + '_creator') || currentUser.email;
  const isCreator = currentUser.email.toLowerCase() === roomCreator.toLowerCase();

  let modal = document.getElementById('members-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'members-modal';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); z-index: 10000;
      display: flex; align-items: center; justify-content: center;
    `;
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div style="background:var(--color-card-bg); border:1px solid var(--color-border); border-radius:16px; padding:24px; max-width:500px; width:90%; max-height:80vh; overflow-y:auto;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <h3 style="margin:0;"><i class="fa-solid fa-users"></i> ${roomName} - Members (Demo)</h3>
        <button onclick="closeMembersModal()" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:var(--color-text-muted);">&times;</button>
      </div>
      <p style="color:var(--color-text-muted); font-size:0.9rem;">Demo mode - data stored locally only.</p>
      <div style="font-size:0.85rem; color:var(--color-text-muted); margin-bottom:12px;">
        ${members.length} member${members.length !== 1 ? 's' : ''} in this room
      </div>
      ${members.length === 0 ? `
        <div style="text-align:center; padding:30px; color:var(--color-text-muted);">
          <p>No members yet.</p>
        </div>
      ` : `
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${members.map(email => `
            <div style="display:flex; align-items:center; background:var(--color-bg-tertiary); border:1px solid var(--color-border); border-radius:10px; padding:12px;">
              <div style="width:36px; height:36px; border-radius:50%; background:var(--color-accent); display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; margin-right:10px;">
                ${email[0].toUpperCase()}
              </div>
              <span>${email}</span>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;

  modal.onclick = (e) => { if (e.target === modal) closeMembersModal(); };
};

window.inviteToRoom = function (roomName) {
  alert('Demo mode: Invitations only work when connected to Supabase.\n\nTo enable cross-user invitations, make sure Supabase is properly configured.');
};

window.removeMemberFromRoom = function (roomName, email) {
  if (!confirm(`Remove ${email} from "${roomName}"?`)) return;

  const roomKey = `room_${roomName.replace(/\s+/g, '_')}`;
  let members = JSON.parse(localStorage.getItem(roomKey + '_members') || '[]');
  members = members.filter(m => m.toLowerCase() !== email.toLowerCase());
  localStorage.setItem(roomKey + '_members', JSON.stringify(members));
  showRoomMembers(roomName);
};

window.acceptInvitation = function (invId) {
  alert('Demo mode: Please use Supabase for real invitations.');
};

window.declineInvitation = function (invId) {
  alert('Demo mode: Please use Supabase for real invitations.');
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ============================================
// INITIALIZATION
// ============================================

function initGroupChat() {
  updateInvitationBadge();

  // Set demo user if not set
  if (!localStorage.getItem(CURRENT_USER_KEY)) {
    setCurrentUser('demo@example.com', 'Demo User', 'student');
  }

  console.log('Group Chat initialized', supabase ? '(Supabase connected)' : '(Demo mode)');
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGroupChat);
} else {
  initGroupChat();
}
