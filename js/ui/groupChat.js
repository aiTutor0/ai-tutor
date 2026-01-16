// Group Chat System - Email-based Supabase Integration
// Works with localStorage auth, stores data in Supabase for cross-user sharing
import { supabase } from "../config/supabaseClient.js";

const CURRENT_USER_KEY = 'aitutor_current_user';
const ROOMS_KEY = 'aitutor_rooms';

// ============================================
// USER MANAGEMENT
// ============================================

function getCurrentUser() {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  if (stored) return JSON.parse(stored);
  return { email: 'demo@example.com', name: 'Demo User', role: 'student' };
}

window.setCurrentUser = function (email, name, role) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ email, name, role }));
};

// ============================================
// SUPABASE HELPERS (Email-based, no Auth required)
// ============================================

// Get all rooms for current user (by email) - merges Supabase and localStorage
async function getMyRooms() {
  const user = getCurrentUser();

  // Always get localStorage rooms first
  const localRooms = getLocalRooms();

  if (!supabase) {
    console.log('Supabase not connected, using localStorage only');
    return localRooms;
  }

  try {
    // Get rooms where user is creator OR member from Supabase
    const { data: createdRooms, error: e1 } = await supabase
      .from('group_rooms')
      .select('*')
      .eq('creator_email', user.email);

    const { data: memberRooms, error: e2 } = await supabase
      .from('room_members')
      .select('room_id, group_rooms(*)')
      .eq('member_email', user.email);

    if (e1 && e2) {
      console.error('Supabase errors:', e1, e2);
      return localRooms; // Fall back to localStorage only
    }

    // Combine Supabase rooms
    const supabaseRooms = [...(createdRooms || [])];
    (memberRooms || []).forEach(m => {
      if (m.group_rooms && !supabaseRooms.find(r => r.id === m.group_rooms.id)) {
        supabaseRooms.push(m.group_rooms);
      }
    });

    // Merge with localStorage rooms (dedupe by name)
    const allRooms = [...supabaseRooms];
    localRooms.forEach(lr => {
      if (!allRooms.find(r => r.name === lr.name)) {
        allRooms.push(lr);
      }
    });

    console.log('Rooms loaded:', allRooms.length, '(Supabase:', supabaseRooms.length, ', Local:', localRooms.length, ')');
    return allRooms;
  } catch (err) {
    console.error('Supabase error:', err);
    return localRooms;
  }
}

// Get local rooms (fallback)
function getLocalRooms() {
  const user = getCurrentUser();
  const allRooms = JSON.parse(localStorage.getItem(ROOMS_KEY) || '[]');

  return allRooms.filter(roomName => {
    const roomKey = `room_${roomName.replace(/\s+/g, '_')}`;
    const creator = localStorage.getItem(roomKey + '_creator') || '';
    const members = JSON.parse(localStorage.getItem(roomKey + '_members') || '[]');
    return creator.toLowerCase() === user.email.toLowerCase() ||
      members.some(m => m.toLowerCase() === user.email.toLowerCase());
  }).map(name => ({ id: name, name: name, local: true }));
}

// Create a room
async function createRoomInSupabase(name) {
  const user = getCurrentUser();

  if (!supabase) {
    return createLocalRoom(name);
  }

  try {
    const { data, error } = await supabase
      .from('group_rooms')
      .insert([{
        name: name,
        creator_email: user.email,
        creator_name: user.name
      }])
      .select()
      .single();

    if (error) {
      console.error('Create room error:', error);
      return createLocalRoom(name);
    }

    // Add creator as member
    await supabase.from('room_members').insert([{
      room_id: data.id,
      member_email: user.email,
      member_name: user.name
    }]);

    return data;
  } catch (err) {
    console.error('Supabase error:', err);
    return createLocalRoom(name);
  }
}

function createLocalRoom(name) {
  const user = getCurrentUser();
  let rooms = JSON.parse(localStorage.getItem(ROOMS_KEY) || '[]');
  if (!rooms.includes(name)) {
    rooms.push(name);
    localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
  }
  const roomKey = `room_${name.replace(/\s+/g, '_')}`;
  localStorage.setItem(roomKey + '_creator', user.email);
  let members = JSON.parse(localStorage.getItem(roomKey + '_members') || '[]');
  if (!members.includes(user.email)) {
    members.push(user.email);
    localStorage.setItem(roomKey + '_members', JSON.stringify(members));
  }
  return { id: name, name: name, local: true };
}

// Delete a room
async function deleteRoomFromSupabase(roomId, isLocal) {
  if (isLocal || !supabase) {
    const rooms = JSON.parse(localStorage.getItem(ROOMS_KEY) || '[]');
    const updated = rooms.filter(r => r !== roomId);
    localStorage.setItem(ROOMS_KEY, JSON.stringify(updated));
    return true;
  }

  try {
    // Delete members first
    await supabase.from('room_members').delete().eq('room_id', roomId);
    // Delete messages
    await supabase.from('room_messages').delete().eq('room_id', roomId);
    // Delete invitations
    await supabase.from('room_invitations').delete().eq('room_id', roomId);
    // Delete room
    await supabase.from('group_rooms').delete().eq('id', roomId);
    return true;
  } catch (err) {
    console.error('Delete room error:', err);
    return false;
  }
}

// Get room members
async function getRoomMembersFromSupabase(roomId, isLocal) {
  if (isLocal || !supabase) {
    const roomKey = `room_${roomId.replace(/\s+/g, '_')}`;
    return JSON.parse(localStorage.getItem(roomKey + '_members') || '[]').map(email => ({ email }));
  }

  try {
    const { data, error } = await supabase
      .from('room_members')
      .select('member_email, member_name, joined_at')
      .eq('room_id', roomId);

    if (error) throw error;
    return data.map(m => ({ email: m.member_email, name: m.member_name, joined_at: m.joined_at }));
  } catch (err) {
    console.error('Get members error:', err);
    return [];
  }
}

// Get room messages
async function getRoomMessagesFromSupabase(roomId, isLocal) {
  if (isLocal || !supabase) {
    const roomKey = `room_${roomId.replace(/\s+/g, '_')}`;
    return JSON.parse(localStorage.getItem(roomKey) || '[]');
  }

  try {
    const { data, error } = await supabase
      .from('room_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Get messages error:', err);
    return [];
  }
}

// Send message
async function sendMessageToSupabase(roomId, content, isLocal) {
  const user = getCurrentUser();

  if (isLocal || !supabase) {
    const roomKey = `room_${roomId.replace(/\s+/g, '_')}`;
    const messages = JSON.parse(localStorage.getItem(roomKey) || '[]');
    const msg = {
      id: Date.now(),
      sender_email: user.email,
      sender_name: user.name,
      content: content,
      created_at: new Date().toISOString()
    };
    messages.push(msg);
    localStorage.setItem(roomKey, JSON.stringify(messages));
    return msg;
  }

  try {
    const { data, error } = await supabase
      .from('room_messages')
      .insert([{
        room_id: roomId,
        sender_email: user.email,
        sender_name: user.name,
        content: content
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Send message error:', err);
    return null;
  }
}

// ============================================
// INVITATION SYSTEM (Supabase or localStorage)
// ============================================

async function sendInvitation(roomId, roomName, toEmail, isLocal) {
  const user = getCurrentUser();

  if (isLocal || !supabase) {
    // localStorage invitations
    const invKey = 'aitutor_invitations';
    const invitations = JSON.parse(localStorage.getItem(invKey) || '[]');

    // Check duplicate
    if (invitations.some(i => i.toEmail.toLowerCase() === toEmail.toLowerCase() && i.roomName === roomName && i.status === 'pending')) {
      return { error: 'Already invited' };
    }

    const inv = {
      id: Date.now(),
      roomId: roomId,
      roomName: roomName,
      fromEmail: user.email,
      fromName: user.name,
      toEmail: toEmail,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    invitations.push(inv);
    localStorage.setItem(invKey, JSON.stringify(invitations));
    return { data: inv };
  }

  try {
    // Check if already invited
    const { data: existing } = await supabase
      .from('room_invitations')
      .select('id')
      .eq('room_id', roomId)
      .eq('to_email', toEmail.toLowerCase())
      .eq('status', 'pending')
      .single();

    if (existing) {
      return { error: 'Already invited' };
    }

    const { data, error } = await supabase
      .from('room_invitations')
      .insert([{
        room_id: roomId,
        room_name: roomName,
        from_email: user.email,
        from_name: user.name,
        to_email: toEmail.toLowerCase(),
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (err) {
    console.error('Send invitation error:', err);
    return { error: err.message };
  }
}

async function getMyInvitations() {
  const user = getCurrentUser();

  if (!supabase) {
    const invKey = 'aitutor_invitations';
    const all = JSON.parse(localStorage.getItem(invKey) || '[]');
    return all.filter(i => i.toEmail.toLowerCase() === user.email.toLowerCase() && i.status === 'pending');
  }

  try {
    const { data, error } = await supabase
      .from('room_invitations')
      .select('*')
      .eq('to_email', user.email.toLowerCase())
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Get invitations error:', err);
    return [];
  }
}

async function acceptInvitationById(invId, isLocal) {
  const user = getCurrentUser();

  if (isLocal || !supabase) {
    const invKey = 'aitutor_invitations';
    const invitations = JSON.parse(localStorage.getItem(invKey) || '[]');
    const inv = invitations.find(i => i.id === invId);
    if (inv) {
      inv.status = 'accepted';
      localStorage.setItem(invKey, JSON.stringify(invitations));
      // Add to room members
      const roomKey = `room_${inv.roomName.replace(/\s+/g, '_')}`;
      let members = JSON.parse(localStorage.getItem(roomKey + '_members') || '[]');
      if (!members.includes(user.email)) {
        members.push(user.email);
        localStorage.setItem(roomKey + '_members', JSON.stringify(members));
      }
    }
    return inv;
  }

  try {
    // Get invitation
    const { data: inv, error: e1 } = await supabase
      .from('room_invitations')
      .select('*')
      .eq('id', invId)
      .single();

    if (e1) throw e1;

    // Update status
    await supabase
      .from('room_invitations')
      .update({ status: 'accepted' })
      .eq('id', invId);

    // Add as member
    await supabase.from('room_members').insert([{
      room_id: inv.room_id,
      member_email: user.email,
      member_name: user.name
    }]);

    return inv;
  } catch (err) {
    console.error('Accept invitation error:', err);
    return null;
  }
}

async function declineInvitationById(invId, isLocal) {
  if (isLocal || !supabase) {
    const invKey = 'aitutor_invitations';
    const invitations = JSON.parse(localStorage.getItem(invKey) || '[]');
    const inv = invitations.find(i => i.id === invId);
    if (inv) {
      inv.status = 'declined';
      localStorage.setItem(invKey, JSON.stringify(invitations));
    }
    return true;
  }

  try {
    await supabase
      .from('room_invitations')
      .update({ status: 'declined' })
      .eq('id', invId);
    return true;
  } catch (err) {
    console.error('Decline invitation error:', err);
    return false;
  }
}

// ============================================
// UI FUNCTIONS
// ============================================

async function updateInvitationBadge() {
  const badge = document.getElementById('invitation-badge');
  if (!badge) return;

  try {
    const invitations = await getMyInvitations();
    const count = invitations?.length || 0;

    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  } catch (err) {
    badge.classList.add('hidden');
  }
}

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

// Render rooms list
window.renderRooms = async function () {
  const list = document.getElementById('rooms-list');
  if (!list) return;

  list.innerHTML = `<div style="padding:10px; text-align:center; color:var(--color-text-muted); font-size:0.85rem;">Loading...</div>`;

  try {
    const rooms = await getMyRooms();
    const user = getCurrentUser();

    if (!rooms || rooms.length === 0) {
      list.innerHTML = `<div style="padding:10px; text-align:center; color:var(--color-text-muted); font-size:0.85rem;">No rooms yet. Add one!</div>`;
      return;
    }

    // Get member count for display
    const roomsWithCounts = await Promise.all(rooms.map(async (room) => {
      const isLocal = room.local === true;
      let memberCount = 0;

      if (isLocal) {
        const roomKey = `room_${room.name.replace(/\s+/g, '_')}`;
        memberCount = JSON.parse(localStorage.getItem(roomKey + '_members') || '[]').length;
      } else {
        try {
          const members = await getRoomMembersFromSupabase(room.id, false);
          memberCount = members?.length || 0;
        } catch (e) {
          memberCount = 0;
        }
      }

      return { ...room, memberCount };
    }));

    list.innerHTML = roomsWithCounts.map(room => {
      const isLocal = room.local === true;
      const isCreator = room.creator_email?.toLowerCase() === user.email.toLowerCase() ||
        (isLocal && localStorage.getItem(`room_${room.name.replace(/\s+/g, '_')}_creator`)?.toLowerCase() === user.email.toLowerCase());

      return `
        <button class="room-item" onclick="selectGroupRoom('${room.id}', '${encodeURIComponent(room.name)}', ${isLocal})" style="position:relative;">
          <i class="fa-solid fa-hashtag"></i>
          <span>${room.name}</span>
          <span style="font-size:0.7rem; color:var(--color-text-muted); margin-left:4px;">(${room.memberCount})</span>
          <div style="display:flex; gap:4px; margin-left:auto;">
            <i class="fa-solid fa-users room-members" onclick="event.stopPropagation(); showGroupRoomMembers('${room.id}', '${encodeURIComponent(room.name)}', ${isLocal})" title="Members" style="padding:4px; border-radius:4px;"></i>
            <i class="fa-solid fa-user-plus room-invite" onclick="event.stopPropagation(); inviteToGroupRoom('${room.id}', '${encodeURIComponent(room.name)}', ${isLocal})" title="Invite" style="padding:4px; border-radius:4px;"></i>
            ${isCreator ? `<i class="fa-solid fa-trash room-delete" onclick="event.stopPropagation(); deleteGroupRoom('${room.id}', ${isLocal})" title="Delete"></i>` : ''}
          </div>
        </button>
      `;
    }).join('');
  } catch (err) {
    console.error('Render rooms error:', err);
    list.innerHTML = `<div style="padding:10px; text-align:center; color:var(--color-text-muted);">Error loading rooms</div>`;
  }
};

// Global room tracking
window.currentGroupRoomId = null;
window.currentGroupRoomName = null;
window.currentGroupRoomIsLocal = false;

// Select a room
window.selectGroupRoom = async function (roomId, encodedName, isLocal) {
  const roomName = decodeURIComponent(encodedName);

  // Set global room info
  window.currentGroupRoomId = roomId;
  window.currentGroupRoomName = roomName;
  window.currentGroupRoomIsLocal = isLocal;

  // IMPORTANT: Switch to group tool mode first (this sets currentToolMode = 'group')
  if (typeof window.openTool === 'function') {
    window.openTool('group', null, false); // Don't add to history
  }

  // Update UI with room name
  const tt = document.getElementById('tool-title');
  if (tt) tt.textContent = `🏠 ${roomName}`;

  // Load messages
  const mw = document.getElementById('chat-window');
  if (mw) {
    mw.innerHTML = '<div style="text-align:center; padding:20px; color:var(--color-text-muted);">Loading messages...</div>';

    try {
      const messages = await getRoomMessagesFromSupabase(roomId, isLocal);
      mw.innerHTML = '';

      if (messages.length === 0) {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'message ai-msg';
        welcomeDiv.innerHTML = `
          <div class="msg-avatar"><i class="fa-solid fa-users"></i></div>
          <div class="msg-bubble">Welcome to ${escapeHtml(roomName)}! Start chatting with your group members.</div>
        `;
        mw.appendChild(welcomeDiv);
      } else {
        messages.forEach(msg => {
          const sender = msg.sender_name || msg.sender_email || msg.senderName || msg.senderEmail || 'Unknown';
          const time = new Date(msg.created_at || msg.timestamp).toLocaleTimeString();

          const div = document.createElement('div');
          div.className = 'message user-msg';
          div.innerHTML = `
            <div class="msg-avatar" style="background:var(--color-accent);"><i class="fa-solid fa-user"></i></div>
            <div class="msg-bubble">
              <div style="font-size:0.75rem; color:rgba(255,255,255,0.85); margin-bottom:4px;">
                <strong>${escapeHtml(sender)}</strong> • ${time}
              </div>
              ${escapeHtml(msg.content)}
            </div>
          `;
          mw.appendChild(div);
        });
      }

      mw.scrollTop = mw.scrollHeight;

      // Subscribe to real-time messages if Supabase
      if (!isLocal && supabase) {
        subscribeToRoomMessages(roomId);
      }
    } catch (err) {
      console.error('Load messages error:', err);
      mw.innerHTML = '<div style="text-align:center; padding:20px; color:var(--color-text-muted);">Error loading messages</div>';
    }
  }

  window.showTabPanel?.('chat');
};

// Real-time subscription
let roomSubscription = null;

function subscribeToRoomMessages(roomId) {
  if (roomSubscription) {
    supabase.removeChannel(roomSubscription);
  }

  roomSubscription = supabase
    .channel(`room_${roomId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'room_messages',
      filter: `room_id=eq.${roomId}`
    }, (payload) => {
      const msg = payload.new;
      const mw = document.getElementById('chat-window');

      // Skip if this message is from current user (already displayed by chatUI)
      const currentUser = getCurrentUser();
      if (msg.sender_email?.toLowerCase() === currentUser.email?.toLowerCase()) {
        return; // Don't duplicate own messages
      }

      if (mw) {
        const sender = msg.sender_name || msg.sender_email || 'Unknown';
        const time = new Date(msg.created_at).toLocaleTimeString();

        const div = document.createElement('div');
        div.className = 'message user-msg';
        div.innerHTML = `
          <div class="msg-avatar" style="background:var(--color-accent);"><i class="fa-solid fa-user"></i></div>
          <div class="msg-bubble">
            <div style="font-size:0.75rem; color:rgba(255,255,255,0.85); margin-bottom:4px;">
              <strong>${escapeHtml(sender)}</strong> • ${time}
            </div>
            ${escapeHtml(msg.content)}
          </div>
        `;
        mw.appendChild(div);
        mw.scrollTop = mw.scrollHeight;
      }
    })
    .subscribe();
}

// Show room members
window.showGroupRoomMembers = async function (roomId, encodedName, isLocal) {
  const roomName = decodeURIComponent(encodedName);
  const members = await getRoomMembersFromSupabase(roomId, isLocal);
  const user = getCurrentUser();

  let modal = document.getElementById('members-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'members-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div style="background:var(--color-card-bg);border:1px solid var(--color-border);border-radius:16px;padding:24px;max-width:500px;width:90%;max-height:80vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="margin:0;"><i class="fa-solid fa-users"></i> ${roomName} - Members</h3>
        <button onclick="closeMembersModal()" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--color-text-muted);">&times;</button>
      </div>
      <div style="margin-bottom:16px;">
        <button class="primary-btn" style="width:100%;padding:10px;" onclick="inviteToGroupRoom('${roomId}','${encodedName}',${isLocal});closeMembersModal();">
          <i class="fa-solid fa-user-plus"></i> Invite New Member
        </button>
      </div>
      <div style="font-size:0.85rem;color:var(--color-text-muted);margin-bottom:12px;">${members.length} member(s)</div>
      ${members.length === 0 ? '<p style="text-align:center;color:var(--color-text-muted);">No members yet</p>' :
      members.map(m => `
          <div style="display:flex;align-items:center;background:var(--color-bg-tertiary);border:1px solid var(--color-border);border-radius:10px;padding:12px;margin-bottom:8px;">
            <div style="width:36px;height:36px;border-radius:50%;background:var(--color-accent);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;margin-right:10px;">
              ${(m.email || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div style="font-weight:500;">${m.name || m.email}${m.email.toLowerCase() === user.email.toLowerCase() ? ' (You)' : ''}</div>
              <div style="font-size:0.75rem;color:var(--color-text-muted);">${m.email}</div>
            </div>
          </div>
        `).join('')}
    </div>
  `;
  modal.onclick = e => { if (e.target === modal) closeMembersModal(); };
};

window.closeMembersModal = function () {
  document.getElementById('members-modal')?.remove();
};

// Invite to room
window.inviteToGroupRoom = async function (roomId, encodedName, isLocal) {
  const roomName = decodeURIComponent(encodedName);
  const email = prompt('Enter email address to invite:');

  if (!email || !email.includes('@')) {
    alert('Please enter a valid email address.');
    return;
  }

  const result = await sendInvitation(roomId, roomName, email, isLocal);

  if (result.error) {
    alert('Error: ' + result.error);
  } else {
    alert(`✅ Invitation sent to ${email} for room "${roomName}"`);
  }
};

// Delete room
window.deleteGroupRoom = async function (roomId, isLocal) {
  if (!confirm('Delete this room?')) return;

  await deleteRoomFromSupabase(roomId, isLocal);
  renderRooms();
};

// Show invitations
window.showInvitations = async function (e) {
  e?.preventDefault?.();
  e?.stopPropagation?.();

  const invitations = await getMyInvitations();

  let modal = document.getElementById('invitations-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'invitations-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div style="background:var(--color-card-bg);border:1px solid var(--color-border);border-radius:16px;padding:24px;max-width:500px;width:90%;max-height:80vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="margin:0;"><i class="fa-solid fa-envelope"></i> My Invitations</h3>
        <button onclick="closeInvitationsModal()" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--color-text-muted);">&times;</button>
      </div>
      ${invitations.length === 0 ?
      '<div style="text-align:center;padding:30px;color:var(--color-text-muted);"><i class="fa-solid fa-inbox" style="font-size:3rem;margin-bottom:10px;"></i><p>No pending invitations</p></div>' :
      invitations.map(inv => `
          <div style="background:var(--color-bg-tertiary);border:1px solid var(--color-border);border-radius:12px;padding:16px;margin-bottom:12px;">
            <div style="font-weight:bold;margin-bottom:8px;"><i class="fa-solid fa-door-open"></i> ${inv.room_name || inv.roomName}</div>
            <div style="font-size:0.9rem;color:var(--color-text-muted);margin-bottom:12px;">
              Invited by: ${inv.from_name || inv.fromName} (${inv.from_email || inv.fromEmail})
            </div>
            <div style="display:flex;gap:8px;">
              <button class="primary-btn" style="padding:8px 16px;" onclick="handleAcceptInvite(${inv.id},${!supabase})">
                <i class="fa-solid fa-check"></i> Accept
              </button>
              <button class="ghost-btn" style="padding:8px 16px;" onclick="handleDeclineInvite(${inv.id},${!supabase})">
                <i class="fa-solid fa-times"></i> Decline
              </button>
            </div>
          </div>
        `).join('')}
    </div>
  `;
  modal.onclick = e => { if (e.target === modal) closeInvitationsModal(); };
};

window.closeInvitationsModal = function () {
  document.getElementById('invitations-modal')?.remove();
};

window.handleAcceptInvite = async function (invId, isLocal) {
  const inv = await acceptInvitationById(invId, isLocal);
  if (inv) {
    alert(`✅ Joined "${inv.room_name || inv.roomName}"!`);
    closeInvitationsModal();
    updateInvitationBadge();
    renderRooms();
  }
};

window.handleDeclineInvite = async function (invId, isLocal) {
  await declineInvitationById(invId, isLocal);
  alert('Invitation declined.');
  closeInvitationsModal();
  updateInvitationBadge();
};

// Legacy compatibility
window.inviteToRoom = window.inviteToGroupRoom;
window.showRoomMembers = window.showGroupRoomMembers;
window.acceptInvitation = window.handleAcceptInvite;
window.declineInvitation = window.handleDeclineInvite;

// Export createRoom for router.js
window.createRoom = async function (name) {
  return await createRoomInSupabase(name);
};

// Export sendGroupMessage for chatUI.js
window.sendGroupMessage = async function (roomId, content) {
  return await sendMessageToSupabase(roomId, content, false);
};

// Helper
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Init
function initGroupChat() {
  updateInvitationBadge();
  if (!localStorage.getItem(CURRENT_USER_KEY)) {
    setCurrentUser('demo@example.com', 'Demo User', 'student');
  }
  console.log('Group Chat initialized', supabase ? '✅ Supabase connected' : '⚠️ localStorage mode');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGroupChat);
} else {
  initGroupChat();
}
