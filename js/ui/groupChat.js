// Group Chat Invitation System
const INVITATIONS_KEY = 'aitutor_invitations';
const CURRENT_USER_KEY = 'aitutor_current_user';

// Get current user (simulated - uses localStorage)
function getCurrentUser() {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  if (stored) return JSON.parse(stored);
  // Default demo user
  return { email: 'demo@example.com', name: 'Demo User', role: 'student' };
}

// Set current user
window.setCurrentUser = function (email, name, role) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ email, name, role }));
};

// Get all invitations
function getInvitations() {
  const json = localStorage.getItem(INVITATIONS_KEY);
  return json ? JSON.parse(json) : [];
}

// Save invitations
function saveInvitations(invitations) {
  localStorage.setItem(INVITATIONS_KEY, JSON.stringify(invitations));
}

// Get invitations for current user
function getMyInvitations() {
  const user = getCurrentUser();
  const all = getInvitations();
  return all.filter(inv => inv.toEmail.toLowerCase() === user.email.toLowerCase() && inv.status === 'pending');
}

// Update invitation badge
function updateInvitationBadge() {
  const badge = document.getElementById('invitation-badge');
  const count = getMyInvitations().length;

  if (badge) {
    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
}

// Toggle Group Chat panel
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

// Get room members
function getRoomMembers(roomName) {
  const roomKey = `room_${roomName.replace(/\s+/g, '_')}`;
  return JSON.parse(localStorage.getItem(roomKey + '_members') || '[]');
}

// Get room creator
function getRoomCreator(roomName) {
  const roomKey = `room_${roomName.replace(/\s+/g, '_')}`;
  return localStorage.getItem(roomKey + '_creator') || '';
}

// Check if current user has access to a room
function userHasAccessToRoom(roomName) {
  const user = getCurrentUser();
  const userEmail = user.email.toLowerCase();

  // Check if user is the creator
  const creator = getRoomCreator(roomName).toLowerCase();
  if (creator === userEmail) return true;

  // Check if user is a member
  const members = getRoomMembers(roomName);
  return members.some(m => m.toLowerCase() === userEmail);
}

// Get rooms that current user has access to
function getAccessibleRooms() {
  const allRooms = JSON.parse(localStorage.getItem('aitutor_rooms') || '[]');
  return allRooms.filter(roomName => userHasAccessToRoom(roomName));
}

// Show room members modal
window.showRoomMembers = function (roomName) {
  const members = getRoomMembers(roomName);
  const currentUser = getCurrentUser();

  // Get room creator (first member or current user if no members)
  const roomKey = `room_${roomName.replace(/\s+/g, '_')}`;
  let roomCreator = localStorage.getItem(roomKey + '_creator') || currentUser.email;

  const isCreator = currentUser.email.toLowerCase() === roomCreator.toLowerCase();

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
    <div style="background:var(--color-card-bg); border:1px solid var(--color-border); border-radius:16px; padding:24px; max-width:500px; width:90%; max-height:80vh; overflow-y:auto;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <h3 style="margin:0;"><i class="fa-solid fa-users"></i> ${roomName} - Members</h3>
        <button onclick="closeMembersModal()" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:var(--color-text-muted);">&times;</button>
      </div>
      
      <div style="margin-bottom:16px;">
        <button class="primary-btn" style="width:100%; padding:10px;" onclick="inviteToRoom('${roomName}'); closeMembersModal();">
          <i class="fa-solid fa-user-plus"></i> Invite New Member
        </button>
      </div>
      
      <div style="font-size:0.85rem; color:var(--color-text-muted); margin-bottom:12px;">
        ${members.length} member${members.length !== 1 ? 's' : ''} in this room
      </div>
      
      ${members.length === 0 ? `
        <div style="text-align:center; padding:30px; color:var(--color-text-muted);">
          <i class="fa-solid fa-user-group" style="font-size:2rem; margin-bottom:10px;"></i>
          <p>No members yet. Invite someone!</p>
        </div>
      ` : `
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${members.map(email => {
    const isSelf = email.toLowerCase() === currentUser.email.toLowerCase();
    const isRoomCreator = email.toLowerCase() === roomCreator.toLowerCase();
    return `
              <div style="display:flex; align-items:center; justify-content:space-between; background:var(--color-bg-tertiary); border:1px solid var(--color-border); border-radius:10px; padding:12px;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <div style="width:36px; height:36px; border-radius:50%; background:var(--color-accent); display:flex; align-items:center; justify-content:center; color:white; font-weight:bold;">
                    ${email[0].toUpperCase()}
                  </div>
                  <div>
                    <div style="font-weight:500;">${email}${isSelf ? ' (You)' : ''}</div>
                    ${isRoomCreator ? '<div style="font-size:0.75rem; color:var(--color-accent);"><i class="fa-solid fa-crown"></i> Room Creator</div>' : ''}
                  </div>
                </div>
                ${isCreator && !isSelf ? `
                  <button onclick="removeMemberFromRoom('${roomName}', '${email}')" style="background:rgba(255,0,0,0.1); border:1px solid rgba(255,0,0,0.3); color:var(--color-error-text); padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.8rem;">
                    <i class="fa-solid fa-user-minus"></i> Remove
                  </button>
                ` : ''}
              </div>
            `;
  }).join('')}
        </div>
      `}
    </div>
  `;

  modal.onclick = (e) => {
    if (e.target === modal) closeMembersModal();
  };
};

window.closeMembersModal = function () {
  const modal = document.getElementById('members-modal');
  if (modal) modal.remove();
};

// Remove member from room
window.removeMemberFromRoom = function (roomName, email) {
  if (!confirm(`Remove ${email} from "${roomName}"?`)) return;

  const roomKey = `room_${roomName.replace(/\s+/g, '_')}`;
  let members = JSON.parse(localStorage.getItem(roomKey + '_members') || '[]');

  members = members.filter(m => m.toLowerCase() !== email.toLowerCase());
  localStorage.setItem(roomKey + '_members', JSON.stringify(members));

  // Refresh modal
  showRoomMembers(roomName);
};

// Send invitation to a room
window.inviteToRoom = function (roomName) {
  const email = prompt('Enter email address to invite:');
  if (!email || !email.includes('@')) {
    alert('Please enter a valid email address.');
    return;
  }

  const user = getCurrentUser();
  const invitations = getInvitations();

  // Check if already invited
  const exists = invitations.some(inv =>
    inv.toEmail.toLowerCase() === email.toLowerCase() &&
    inv.roomName === roomName &&
    inv.status === 'pending'
  );

  if (exists) {
    alert('This user has already been invited to this room.');
    return;
  }

  const invitation = {
    id: Date.now(),
    roomName: roomName,
    fromEmail: user.email,
    fromName: user.name,
    toEmail: email,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  invitations.push(invitation);
  saveInvitations(invitations);

  alert(`✅ Invitation sent to ${email} for room "${roomName}"`);
  console.log('📧 Invitation sent:', invitation);
};

// Show invitations modal/section
window.showInvitations = function (e) {
  e?.preventDefault?.();
  e?.stopPropagation?.();

  const myInvitations = getMyInvitations();

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
    <div style="background:var(--color-card-bg); border:1px solid var(--color-border); border-radius:16px; padding:24px; max-width:500px; width:90%; max-height:80vh; overflow-y:auto;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <h3 style="margin:0;"><i class="fa-solid fa-envelope"></i> My Invitations</h3>
        <button onclick="closeInvitationsModal()" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:var(--color-text-muted);">&times;</button>
      </div>
      
      ${myInvitations.length === 0 ? `
        <div style="text-align:center; padding:30px; color:var(--color-text-muted);">
          <i class="fa-solid fa-inbox" style="font-size:3rem; margin-bottom:10px;"></i>
          <p>No pending invitations</p>
        </div>
      ` : `
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${myInvitations.map(inv => `
            <div style="background:var(--color-bg-tertiary); border:1px solid var(--color-border); border-radius:12px; padding:16px;">
              <div style="font-weight:bold; margin-bottom:8px;">
                <i class="fa-solid fa-door-open"></i> ${inv.roomName}
              </div>
              <div style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:12px;">
                Invited by: ${inv.fromName} (${inv.fromEmail})
              </div>
              <div style="display:flex; gap:8px;">
                <button class="primary-btn" style="padding:8px 16px; font-size:0.9rem;" onclick="acceptInvitation(${inv.id})">
                  <i class="fa-solid fa-check"></i> Accept
                </button>
                <button class="ghost-btn" style="padding:8px 16px; font-size:0.9rem;" onclick="declineInvitation(${inv.id})">
                  <i class="fa-solid fa-times"></i> Decline
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;

  modal.onclick = (e) => {
    if (e.target === modal) closeInvitationsModal();
  };
};

window.closeInvitationsModal = function () {
  const modal = document.getElementById('invitations-modal');
  if (modal) modal.remove();
};

window.acceptInvitation = function (invId) {
  const invitations = getInvitations();
  const inv = invitations.find(i => i.id === invId);

  if (inv) {
    inv.status = 'accepted';
    saveInvitations(invitations);

    // Add room to user's rooms if not exists
    const roomKey = `room_${inv.roomName.replace(/\s+/g, '_')}`;
    const members = JSON.parse(localStorage.getItem(roomKey + '_members') || '[]');
    const user = getCurrentUser();

    if (!members.includes(user.email)) {
      members.push(user.email);
      localStorage.setItem(roomKey + '_members', JSON.stringify(members));
    }

    alert(`✅ You joined "${inv.roomName}"!`);
    closeInvitationsModal();
    updateInvitationBadge();
    renderRooms();
  }
};

window.declineInvitation = function (invId) {
  const invitations = getInvitations();
  const inv = invitations.find(i => i.id === invId);

  if (inv) {
    inv.status = 'declined';
    saveInvitations(invitations);

    alert('Invitation declined.');
    closeInvitationsModal();
    updateInvitationBadge();
  }
};

// Render rooms with invite button - ONLY shows rooms user has access to
window.renderRoomsWithInvite = function () {
  const list = document.getElementById('rooms-list');
  if (!list) return;

  // Get only rooms that the current user has access to
  const accessibleRooms = getAccessibleRooms();

  if (accessibleRooms.length === 0) {
    list.innerHTML = `<div style="padding:10px; text-align:center; color:var(--color-text-muted); font-size:0.85rem;">No rooms yet. Add one!</div>`;
    return;
  }

  const currentUser = getCurrentUser();

  list.innerHTML = accessibleRooms.map(r => {
    const memberCount = getRoomMembers(r).length;
    const isCreator = getRoomCreator(r).toLowerCase() === currentUser.email.toLowerCase();

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
};

// Override global renderRooms
const originalRenderRooms = window.renderRooms;
window.renderRooms = function () {
  renderRoomsWithInvite();
};

// Initialize
function initGroupChat() {
  updateInvitationBadge();

  // Set demo user if not set
  if (!localStorage.getItem(CURRENT_USER_KEY)) {
    setCurrentUser('demo@example.com', 'Demo User', 'student');
  }
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGroupChat);
} else {
  initGroupChat();
}
