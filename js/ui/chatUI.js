// js/ui/chatUI.js
import { callOpenAI } from "../services/openaiService.js";

// === Constants ===
const STORAGE_KEY = "aitutor_chat_history";
const SENT_ITEMS_KEY = "aitutor_sent_items";
const MAX_CONTEXT_TOKENS = 3000;
const TYPING_SPEED_MS = 15; // Milliseconds per character for typing animation
const MAX_MESSAGE_LENGTH = 10000;
const MAX_TITLE_LENGTH = 30;
const IMAGE_TOKEN_ESTIMATE = 500;
const CHARS_PER_TOKEN = 4;

let els = {};
let currentToolMode = "chat";
let currentChatId = null;
let currentAttachments = []; // Stores Base64 strings or text content
let searchQuery = ""; // For message search

// --- Helpers ---

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// Parse basic markdown (bold text)
function parseMarkdown(str) {
  if (!str) return "";
  // First escape HTML to prevent XSS
  let escaped = escapeHtml(str);
  // Then convert **text** to <strong>text</strong>
  return escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getHistory() {
  const json = localStorage.getItem(STORAGE_KEY);
  return json ? JSON.parse(json) : [];
}

function saveHistory(history) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

// === Sent Items Management ===
function getSentItems() {
  const json = localStorage.getItem(SENT_ITEMS_KEY);
  return json ? JSON.parse(json) : [];
}

function saveSentItem(item) {
  const items = getSentItems();
  items.unshift(item); // Add to beginning (newest first)
  // Keep only last 100 items
  if (items.length > 100) items.pop();
  localStorage.setItem(SENT_ITEMS_KEY, JSON.stringify(items));
  renderSentItems();
}

async function renderSentItems() {
  const container = document.getElementById('sent-list');
  if (!container) return;

  const allItems = getSentItems();

  // Get current context (room name or chat mode)
  const toolTitle = document.getElementById('tool-title');
  const currentTitle = toolTitle?.textContent || '';

  // Check if we're in a group chat room
  const isGroupRoom = currentTitle.startsWith('🏠 ');
  const currentRoomName = isGroupRoom ? currentTitle.replace('🏠 ', '') : null;

  // Filter items based on current context
  let items;
  // Get current user email for filtering
  const currentUserStr = localStorage.getItem('aitutor_current_user');
  const currentUserEmail = currentUserStr ? JSON.parse(currentUserStr)?.email?.toLowerCase() : null;

  if (isGroupRoom && currentRoomName) {
    // For group chat: Fetch messages from Supabase or localStorage
    let roomMessages = [];

    // Try Supabase first using global roomId
    const roomId = window.currentGroupRoomId;
    const isLocal = window.currentGroupRoomIsLocal;

    if (!isLocal && roomId && typeof window.sendGroupMessage === 'function') {
      // Supabase mode - fetch messages via global function if available
      try {
        const { supabase } = await import('../config/supabaseClient.js');
        if (supabase) {
          const { data, error } = await supabase
            .from('room_messages')
            .select('*')
            .eq('room_id', roomId)
            .order('created_at', { ascending: true });

          if (!error && data) {
            roomMessages = data;
          }
        }
      } catch (e) {
        console.log('Supabase fetch failed, falling back to localStorage');
      }
    }

    // Fallback to localStorage
    if (roomMessages.length === 0) {
      const roomKey = `room_${currentRoomName.replace(/\s+/g, '_')}`;
      roomMessages = JSON.parse(localStorage.getItem(roomKey) || '[]');
    }

    // Filter to only show messages that have attachments (photos or text files)
    const messagesWithFiles = roomMessages.filter(msg => {
      const attachments = msg.attachments || [];
      return attachments.length > 0;
    });

    // Convert room messages to sent item format
    items = messagesWithFiles.map(msg => ({
      content: msg.content || '',
      attachments: msg.attachments || [],
      mode: 'group',
      roomName: currentRoomName,
      userEmail: msg.sender_email || msg.senderEmail,
      senderName: msg.sender_name || msg.senderName || (msg.sender_email || msg.senderEmail || '').split('@')[0] || 'User',
      timestamp: msg.created_at || msg.timestamp
    })).reverse(); // newest first
  } else if (currentToolMode === 'group') {
    // In group mode but no room selected - show user's own group items only
    items = allItems.filter(item => item.mode === 'group' && item.userEmail?.toLowerCase() === currentUserEmail);
  } else {
    // For regular AI chat modes, show ONLY messages from the CURRENT CHAT
    items = allItems.filter(item => {
      // Don't show group items in non-group modes
      if (item.mode === 'group') return false;
      // For AI chats, only show items from current user
      const itemUserEmail = item.userEmail?.toLowerCase();
      if (itemUserEmail && currentUserEmail && itemUserEmail !== currentUserEmail) return false;
      // STRICT: Only show items from current chatId
      return item.chatId === currentChatId;
    });
  }

  // Build file upload section for group chat rooms
  const groupFileUploadSection = isGroupRoom ? `
    <div class="group-file-upload" style="background:var(--color-bg-tertiary); border:1px solid var(--color-border); border-radius:12px; padding:16px; margin-bottom:16px;">
      <h4 style="margin:0 0 12px 0; font-size:0.9rem; color:var(--color-text-primary);">
        <i class="fa-solid fa-cloud-upload-alt"></i> Send Files to Room
      </h4>
      <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:flex-end;">
        <div style="flex:1; min-width:200px;">
          <input type="file" id="sent-file-input" multiple accept="image/*,.txt,.js,.json,.md,.py,.html,.css" 
            style="display:none;">
          <div id="sent-file-preview" style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;"></div>
          <button type="button" onclick="document.getElementById('sent-file-input').click()" 
            style="background:var(--color-bg-secondary); border:1px solid var(--color-border); padding:10px 16px; border-radius:8px; cursor:pointer; color:var(--color-text-primary); width:100%;">
            <i class="fa-solid fa-paperclip"></i> Choose Files
          </button>
        </div>
        <div style="flex:2; min-width:200px;">
          <input type="text" id="sent-file-comment" placeholder="Add a comment (optional)..." 
            style="width:100%; padding:10px 14px; border:1px solid var(--color-border); border-radius:8px; background:var(--color-bg-secondary); color:var(--color-text-primary);">
        </div>
        <button type="button" onclick="sendFilesFromSentPanel()" 
          style="background:var(--color-accent); color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:500;">
          <i class="fa-solid fa-paper-plane"></i> Send
        </button>
      </div>
    </div>
  ` : '';

  if (items.length === 0) {
    container.innerHTML = `
      ${groupFileUploadSection}
      <div class="empty-state">
        <i class="fa-solid fa-inbox" style="font-size:3rem; color:var(--color-text-muted); margin-bottom:1rem;"></i>
        <p>No ${isGroupRoom ? 'files sent in this room' : 'sent items'} yet</p>
      </div>
    `;

    // Setup file input listener for group chat
    if (isGroupRoom) {
      setupSentFileInput();
    }
    return;
  }

  // Get chat history for looking up chat titles
  const chatHistory = getHistory();

  container.innerHTML = groupFileUploadSection + items.map(item => {
    const date = new Date(item.timestamp).toLocaleString();
    const hasAttachments = item.attachments && item.attachments.length > 0;
    const attachmentPreview = hasAttachments ? item.attachments.map(att => {
      if (typeof att === 'string' && att.startsWith('data:image')) {
        return `<img src="${att}" style="max-width:60px; max-height:60px; border-radius:6px; margin-right:4px;">`;
      }
      if (typeof att === 'object' && att.type === 'file') {
        return `<span style="background:var(--color-bg-tertiary); padding:2px 8px; border-radius:4px; font-size:0.75rem;"><i class="fa-solid fa-file-lines"></i> ${escapeHtml(att.name || 'File')}</span>`;
      }
      return `<span style="background:var(--color-bg-tertiary); padding:2px 8px; border-radius:4px; font-size:0.75rem;"><i class="fa-solid fa-file"></i> File</span>`;
    }).join('') : '';

    // Show room name for group items, or chat title for AI chats
    let contextLabel;
    if (item.mode === 'group' && item.roomName) {
      contextLabel = item.roomName;
    } else if (item.chatId) {
      // Look up the actual chat title from history
      const chat = chatHistory.find(c => c.id === item.chatId);
      contextLabel = chat?.title || item.mode || 'chat';
    } else {
      contextLabel = item.mode || 'chat';
    }

    // For group chat rooms, show sender name
    const senderInfo = isGroupRoom && item.senderName
      ? `<span style="font-weight:600; color:var(--color-text-primary);">${escapeHtml(item.senderName)}</span> • `
      : '';

    return `
      <div class="sent-item" style="background:var(--color-bg-tertiary); border:1px solid var(--color-border); border-radius:12px; padding:14px; margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
          <span style="font-size:0.75rem; color:var(--color-text-muted);">
            ${senderInfo}<i class="fa-solid fa-clock"></i> ${date}
          </span>
          <span style="font-size:0.7rem; background:var(--color-accent); color:white; padding:2px 8px; border-radius:10px;">
            ${contextLabel}
          </span>
        </div>
        ${hasAttachments ? `<div style="margin-bottom:8px;">${attachmentPreview}</div>` : ''}
        <div style="font-size:0.9rem; word-break:break-word;">
          ${escapeHtml(item.content.substring(0, 200))}${item.content.length > 200 ? '...' : ''}
        </div>
      </div>
    `;
  }).join('');

  // Setup file input listener for group chat
  if (isGroupRoom) {
    setupSentFileInput();
  }
}

// File upload handling for sent panel
let sentPanelAttachments = [];

function setupSentFileInput() {
  const fileInput = document.getElementById('sent-file-input');
  if (fileInput) {
    fileInput.onchange = handleSentFileSelect;
  }
}

function handleSentFileSelect(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  const previewContainer = document.getElementById('sent-file-preview');

  Array.from(files).forEach(file => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target.result;

      if (file.type.startsWith("image/")) {
        sentPanelAttachments.push(content);
        renderSentPreview(content, "image", file.name, previewContainer);
      } else if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".js") || file.name.endsWith(".json")) {
        const textReader = new FileReader();
        textReader.onload = (te) => {
          const textContent = te.target.result;
          sentPanelAttachments.push({ type: 'file', name: file.name, content: textContent });
          renderSentPreview(null, "file", file.name, previewContainer);
        };
        textReader.readAsText(file);
      } else {
        alert("Only images and text files supported.");
      }
    };

    if (file.type.startsWith("image/")) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsDataURL(file);
    }
  });

  event.target.value = "";
}

function renderSentPreview(src, type, name, container) {
  if (!container) return;

  const div = document.createElement("div");
  div.style.cssText = "position:relative; width:50px; height:50px; border-radius:6px; overflow:hidden; border:1px solid var(--color-border);";

  if (type === "image") {
    div.innerHTML = `<img src="${src}" style="width:100%; height:100%; object-fit:cover;">`;
  } else {
    div.innerHTML = `<div style="width:100%; height:100%; background:var(--color-bg-secondary); display:flex; align-items:center; justify-content:center; font-size:1rem;"><i class="fa-solid fa-file-lines"></i></div>`;
  }

  const removeBtn = document.createElement("button");
  removeBtn.innerHTML = "&times;";
  removeBtn.style.cssText = "position:absolute; top:0; right:0; background:rgba(0,0,0,0.6); color:white; border:none; width:16px; height:16px; cursor:pointer; font-size:10px; line-height:1;";
  removeBtn.onclick = () => {
    if (type === "image") {
      const idx = sentPanelAttachments.indexOf(src);
      if (idx > -1) sentPanelAttachments.splice(idx, 1);
    } else {
      const idx = sentPanelAttachments.findIndex(a => a.name === name);
      if (idx > -1) sentPanelAttachments.splice(idx, 1);
    }
    div.remove();
  };

  div.appendChild(removeBtn);
  container.appendChild(div);
}

window.sendFilesFromSentPanel = async function () {
  if (sentPanelAttachments.length === 0) {
    alert('Please select at least one file to send.');
    return;
  }

  const comment = document.getElementById('sent-file-comment')?.value?.trim() || '';
  const roomId = window.currentGroupRoomId;
  const roomName = window.currentGroupRoomName;
  const isLocal = window.currentGroupRoomIsLocal;

  if (!roomId && !roomName) {
    alert('No room selected.');
    return;
  }

  // Get current user
  const currentUserStr = localStorage.getItem('aitutor_current_user');
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : { email: 'user@example.com', name: 'User' };

  const newMessage = {
    id: Date.now(),
    sender_email: currentUser.email,
    sender_name: currentUser.name || currentUser.email.split('@')[0],
    content: comment,
    attachments: [...sentPanelAttachments],
    created_at: new Date().toISOString()
  };

  // Save to Supabase if available
  if (!isLocal && roomId && typeof window.sendGroupMessage === 'function') {
    await window.sendGroupMessage(roomId, comment, sentPanelAttachments);
  } else {
    // Fallback to localStorage
    const roomKey = `room_${roomName.replace(/\s+/g, '_')}`;
    const roomMessages = JSON.parse(localStorage.getItem(roomKey) || '[]');
    roomMessages.push(newMessage);
    localStorage.setItem(roomKey, JSON.stringify(roomMessages));
  }

  // Display in chat window too
  const mw = document.getElementById("chat-window");
  if (mw) {
    let attachmentHTML = sentPanelAttachments.map(att => {
      if (typeof att === 'object' && att.type === 'file') {
        const fileId = 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        return `<div id="${fileId}" class="file-attachment" style="background:var(--color-bg-tertiary); padding:10px 14px; border-radius:10px; font-size:0.9rem; display:inline-flex; align-items:center; gap:8px; border:1px solid var(--color-border); margin-bottom:8px; cursor:pointer;" onclick="downloadTextFile('${escapeHtml(att.name || 'file.txt')}', '${fileId}')" data-file-content="${btoa(unescape(encodeURIComponent(att.content || '')))}">
          <i class="fa-solid fa-file-lines" style="color:var(--color-accent); font-size:1.1rem;"></i>
          <span style="font-weight:500;">${escapeHtml(att.name || 'File')}</span>
          <i class="fa-solid fa-download" style="color:var(--color-text-muted); margin-left:4px; font-size:0.8rem;"></i>
        </div>`;
      } else if (typeof att === 'string' && att.startsWith('data:image')) {
        return `<img src="${att}" style="max-width:200px; max-height:150px; border-radius:8px; margin-bottom:8px; display:block;">`;
      }
      return '';
    }).join('');

    const div = document.createElement("div");
    div.className = "message user-msg";
    div.innerHTML = `
      <div class="msg-avatar" style="background:var(--color-accent);"><i class="fa-solid fa-user"></i></div>
      <div class="msg-bubble">
        <div style="font-size:0.75rem; color:rgba(255,255,255,0.85); margin-bottom:4px; font-weight:500;">
          <strong style="font-weight:700;">${currentUser.name || currentUser.email.split('@')[0]}</strong> • ${new Date().toLocaleTimeString()}
        </div>
        ${attachmentHTML}
        ${escapeHtml(comment)}
      </div>
    `;
    mw.appendChild(div);
    mw.scrollTop = mw.scrollHeight;
  }

  // Clear form
  sentPanelAttachments = [];
  const previewContainer = document.getElementById('sent-file-preview');
  if (previewContainer) previewContainer.innerHTML = '';
  const commentInput = document.getElementById('sent-file-comment');
  if (commentInput) commentInput.value = '';

  // Refresh sent items
  renderSentItems();
};



// Make renderSentItems globally available
window.renderSentItems = renderSentItems;

// === Token Management ===
// Rough estimation: ~4 characters per token for English text
function estimateTokens(content) {
  if (!content) return 0;

  if (typeof content === 'string') {
    return Math.ceil(content.length / 4);
  }

  if (Array.isArray(content)) {
    return content.reduce((sum, item) => {
      if (item.type === 'text') return sum + estimateTokens(item.text);
      if (item.type === 'image_url') return sum + 500; // Images ~500 tokens
      return sum;
    }, 0);
  }

  return 0;
}

// Get messages within token limit (sliding window)

function getMessagesWithinLimit(messages, maxTokens = MAX_CONTEXT_TOKENS) {
  let totalTokens = 0;
  const result = [];

  // Start from most recent and work backwards
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const tokens = estimateTokens(msg.content);

    if (totalTokens + tokens > maxTokens) {
      // If we haven't added any messages yet, add at least the last one (truncated context warning)
      if (result.length === 0) {
        console.warn('Single message exceeds token limit, context may be incomplete');
      }
      break;
    }

    totalTokens += tokens;
    result.unshift(msg);
  }

  return result;
}

// --- Message Logic ---

let messageCounter = 0;

function addMessage(text, sender, skipSave = false, attachments = [], useTyping = false) {
  const mw = document.getElementById("chat-window");
  if (!mw) return;

  const msgId = `msg-${Date.now()}-${messageCounter++}`;
  const div = document.createElement("div");
  div.className = `message ${sender === "user" ? "user-msg" : "ai-msg"}`;
  div.setAttribute('data-msg-id', msgId);

  // Render Attachments
  let attachmentHTML = "";
  if (attachments && attachments.length > 0) {
    attachmentHTML = `<div class="msg-attachments" style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:5px;">`;
    attachments.forEach(att => {
      // If it's a file object (text file)
      if (typeof att === 'object' && att.type === 'file') {
        const fileContent = att.content || '';
        const fileId = 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        attachmentHTML += `<div id="${fileId}" class="file-attachment" style="background:var(--color-bg-tertiary); padding:10px 14px; border-radius:10px; font-size:0.9rem; display:inline-flex; align-items:center; gap:8px; border:1px solid var(--color-border); cursor:pointer;" onclick="downloadTextFile('${escapeHtml(att.name || 'file.txt')}', '${fileId}')" data-file-content="${btoa(unescape(encodeURIComponent(fileContent)))}">
          <i class="fa-solid fa-file-lines" style="color:var(--color-accent); font-size:1.1rem;"></i>
          <span style="font-weight:500;">${escapeHtml(att.name || 'File')}</span>
          <i class="fa-solid fa-download" style="color:var(--color-text-muted); margin-left:4px; font-size:0.8rem;"></i>
        </div>`;
      }
      // If base64 image
      else if (typeof att === 'string' && att.startsWith("data:image")) {
        attachmentHTML += `<img src="${att}" style="max-width:200px; max-height:200px; border-radius:8px; border:1px solid rgba(255,255,255,0.1);">`;
      } else if (typeof att === 'string') {
        // Other string attachments
        attachmentHTML += `<div style="background:var(--color-bg-tertiary); padding:8px 12px; border-radius:8px; font-size:0.85rem; display:flex; align-items:center; gap:6px; border:1px solid var(--color-border);">
          <i class="fa-solid fa-file"></i>
          <span>File attached</span>
        </div>`;
      }
    });
    attachmentHTML += `</div>`;
  }

  // Message action buttons (edit/delete for user, copy for AI)
  const actionButtons = sender === "user" ? `
    <div class="msg-actions" style="display:none; position:absolute; top:4px; right:4px; gap:4px;">
      <button onclick="editMessage('${msgId}')" title="Edit" style="background:var(--color-bg-tertiary); border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.75rem; color:var(--color-text-primary);">
        <i class="fa-solid fa-pen"></i>
      </button>
      <button onclick="deleteMessage('${msgId}')" title="Delete" style="background:var(--color-bg-tertiary); border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.75rem; color:var(--color-error-text);">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  ` : `
    <div class="msg-actions" style="display:none; position:absolute; top:4px; right:4px; gap:4px;">
      <button onclick="copyMessage('${msgId}')" title="Copy" style="background:var(--color-bg-tertiary); border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.75rem; color:var(--color-text-primary);">
        <i class="fa-solid fa-copy"></i>
      </button>
    </div>
  `;

  div.style.position = 'relative';
  div.innerHTML = `
    <div class="msg-avatar">${sender === "user" ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>'}</div>
    <div class="msg-bubble" data-full-text="${escapeHtml(text)}">
        ${attachmentHTML}
        <span class="msg-text">${useTyping ? '' : (sender === 'ai' ? parseMarkdown(text) : escapeHtml(text))}</span>
    </div>
    ${actionButtons}
  `;

  // Show actions on hover
  div.addEventListener('mouseenter', () => {
    const actions = div.querySelector('.msg-actions');
    if (actions) actions.style.display = 'flex';
  });
  div.addEventListener('mouseleave', () => {
    const actions = div.querySelector('.msg-actions');
    if (actions) actions.style.display = 'none';
  });

  mw.appendChild(div);
  mw.scrollTop = mw.scrollHeight;

  // Typing animation for AI messages
  if (useTyping && sender === "ai") {
    const textSpan = div.querySelector('.msg-text');
    typeText(textSpan, text, mw, true); // Pass true to indicate markdown parsing needed
  }

  if (!skipSave && currentChatId) {
    saveMessageToStorage(currentChatId, sender, text, attachments);
  }

  return msgId;
}

// Typing animation function
function typeText(element, text, scrollContainer, useMarkdown = false) {
  let index = 0;
  const processedText = useMarkdown ? parseMarkdown(text) : escapeHtml(text);

  function type() {
    if (index < text.length) {
      // Calculate how many characters of the original text we've shown
      const currentText = text.substring(0, index + 1);
      // Apply the appropriate processing
      element.innerHTML = useMarkdown ? parseMarkdown(currentText) : escapeHtml(currentText);
      index++;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
      setTimeout(type, TYPING_SPEED_MS);
    }
  }
  type();
}

// Download text file attachment
window.downloadTextFile = function (filename, fileId) {
  const element = document.getElementById(fileId);
  if (!element) {
    console.error('File element not found:', fileId);
    return;
  }

  const base64Content = element.getAttribute('data-file-content');
  if (!base64Content) {
    console.error('No file content found');
    return;
  }

  try {
    // Decode base64 to text
    const textContent = decodeURIComponent(escape(atob(base64Content)));

    // Create and download file
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Error downloading file:', e);
    alert('Error downloading file');
  }
};

// Copy message to clipboard
window.copyMessage = function (msgId) {
  const msgDiv = document.querySelector(`[data-msg-id="${msgId}"]`);
  if (!msgDiv) return;

  const bubble = msgDiv.querySelector('.msg-bubble');
  const text = bubble?.getAttribute('data-full-text') || bubble?.innerText || '';

  navigator.clipboard.writeText(text).then(() => {
    // Show brief feedback
    const btn = msgDiv.querySelector('.msg-actions button');
    if (btn) {
      const originalHTML = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check"></i>';
      setTimeout(() => btn.innerHTML = originalHTML, 1000);
    }
  });
};

// Delete message
window.deleteMessage = function (msgId) {
  if (!confirm('Delete this message?')) return;

  const msgDiv = document.querySelector(`[data-msg-id="${msgId}"]`);
  if (msgDiv) msgDiv.remove();

  // Also remove from storage
  const history = getHistory();
  const chat = history.find(c => c.id === currentChatId);
  if (chat && chat.messages) {
    // Find and remove the message (by matching content/position)
    const bubble = msgDiv?.querySelector('.msg-bubble');
    const text = bubble?.getAttribute('data-full-text') || '';
    const idx = chat.messages.findIndex(m => m.content === text);
    if (idx > -1) {
      chat.messages.splice(idx, 1);
      saveHistory(history);
    }
  }
};

// Edit message
window.editMessage = function (msgId) {
  const msgDiv = document.querySelector(`[data-msg-id="${msgId}"]`);
  if (!msgDiv) return;

  const bubble = msgDiv.querySelector('.msg-bubble');
  const textSpan = bubble?.querySelector('.msg-text');
  const originalText = bubble?.getAttribute('data-full-text') || textSpan?.innerText || '';

  const newText = prompt('Edit message:', originalText);
  if (newText === null || newText === originalText) return;

  // Update display
  if (textSpan) textSpan.innerHTML = escapeHtml(newText);
  if (bubble) bubble.setAttribute('data-full-text', newText);

  // Update storage
  const history = getHistory();
  const chat = history.find(c => c.id === currentChatId);
  if (chat && chat.messages) {
    const msg = chat.messages.find(m => m.content === originalText);
    if (msg) {
      msg.content = newText;
      msg.edited = true;
      saveHistory(history);
    }
  }
};

// Search messages
window.searchMessages = function (query) {
  searchQuery = query.toLowerCase().trim();
  const messages = document.querySelectorAll('.message');

  messages.forEach(msg => {
    const text = msg.querySelector('.msg-bubble')?.innerText?.toLowerCase() || '';
    if (searchQuery === '' || text.includes(searchQuery)) {
      msg.style.display = '';
      // Highlight matching text
      if (searchQuery && text.includes(searchQuery)) {
        msg.style.background = 'rgba(var(--color-accent-rgb), 0.1)';
      } else {
        msg.style.background = '';
      }
    } else {
      msg.style.display = 'none';
    }
  });
};

// Clear search
window.clearMessageSearch = function () {
  searchQuery = '';
  const messages = document.querySelectorAll('.message');
  messages.forEach(msg => {
    msg.style.display = '';
    msg.style.background = '';
  });
  const searchInput = document.getElementById('message-search');
  if (searchInput) searchInput.value = '';
};

function saveMessageToStorage(chatId, role, text, attachments = []) {
  const history = getHistory();
  let chatIndex = history.findIndex(c => c.id === chatId);

  // Auto-create chat logic
  if (chatIndex === -1) {
    const meta = getToolMeta(currentToolMode);
    let title = meta.title;
    if (role === 'user') {
      title = text.substring(0, 30) + (text.length > 30 ? "..." : "");
    }

    // Get current user email
    const currentUserStr = localStorage.getItem('aitutor_current_user');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    const userEmail = currentUser?.email || 'unknown@example.com';

    const newChat = {
      id: chatId,
      mode: currentToolMode,
      title: title,
      userEmail: userEmail,
      created_at: Date.now(),
      updated_at: Date.now(),
      messages: [],
      manualTitle: false
    };

    history.unshift(newChat);
    chatIndex = 0;
  }

  if (chatIndex >= 0) {
    history[chatIndex].messages.push({
      role,
      content: text,
      attachments: attachments,
      timestamp: Date.now()
    });
    history[chatIndex].updated_at = Date.now();

    if (role === 'user' && !history[chatIndex].manualTitle) {
      const userMsgs = history[chatIndex].messages.filter(m => m.role === 'user');
      if (userMsgs.length === 1 && text) {
        history[chatIndex].title = text.substring(0, 30) + (text.length > 30 ? "..." : "");
      } else if (userMsgs.length === 1 && attachments.length > 0) {
        history[chatIndex].title = "Image Analysis";
      }
    }

    saveHistory(history);
    renderSidebarHistory();
  }
}

function getToolMeta(mode) {
  const map = {
    chat: { title: "New Chat", welcome: "Let's chat about anything!" },
    group: { title: "Group Chat", welcome: "Welcome to group chat!" },
    level: { title: "Level Test", welcome: "Let's determine your English level." },
    interview: { title: "Interview", welcome: "Tell me about yourself." },
    translate: { title: "Translate", welcome: "Paste text to translate." },
    grammar: { title: "Grammar Fixer", welcome: "Paste text to correct." },
    tutor: { title: "Topic Explainer", welcome: "Ask me a topic." }
  };
  return map[mode] || { title: "Tool", welcome: "Hello!" };
}

// Global New Chat Function
export function createNewChat() {
  clearAttachments();
  setTool('chat');
}

export function setTool(mode) {
  currentToolMode = mode;
  startNewChat(mode);
}

function startNewChat(mode) {
  const meta = getToolMeta(mode);
  const mw = document.getElementById("chat-window");
  const tt = document.getElementById("tool-title");

  if (tt) tt.textContent = meta.title;
  if (mw) mw.innerHTML = "";

  currentChatId = generateId();
  renderSidebarHistory();
  addMessage(meta.welcome, "ai", true);
}

// --- Attachment Logic ---

function handleFileSelect(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  const previewContainer = document.getElementById("file-preview-container");
  if (previewContainer) {
    previewContainer.classList.remove("hidden");
    // Ensure flex layout via JS just in case CSS missed it, though we added style inline in html
    previewContainer.style.display = "flex";
  }

  Array.from(files).forEach(file => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target.result; // Base64 for images

      // Check limits (simple check)
      if (content.length > 2 * 1024 * 1024) { // 2MB limit for localStorage safety
        alert(`File ${file.name} is too large (>2MB).`);
        return;
      }

      // Logic for text files?
      // For now, let's treat everything as base64 data for images. 
      // If it is text, we might want to readAsText, but to simplify "Attach" logic:
      // We will focus on IMAGES for Vision API. 
      // If text file, we append content to prompt message effectively.

      if (file.type.startsWith("image/")) {
        currentAttachments.push(content);
        renderPreview(content, "image");
      } else if (file.type.startsWith("text/") || file.name.endsWith(".js") || file.name.endsWith(".json")) {
        // Read as text
        const textReader = new FileReader();
        textReader.onload = (te) => {
          const textContent = te.target.result;
          // We store it as a special object or just append to user text later?
          // To fit "attachments" array logic, let's store it as content but mark type?
          // Actually, for Vision API we only need images. 
          // For text files, we'll append to the message instantly or store in a separate buffer.
          // Let's store in attachments but handle it in sendMessage.
          currentAttachments.push({ type: 'file', name: file.name, content: textContent });
          renderPreview(null, "file", file.name);
        };
        textReader.readAsText(file);
      } else {
        // Unsupported for now
        alert("Only images and text files supported.");
      }
    };

    if (file.type.startsWith("image/")) {
      reader.readAsDataURL(file);
    } else {
      // For text, just trigger logic above
      reader.readAsDataURL(file); // Dummy read to trigger onload, but inner logic handles text
    }
  });

  // Reset input
  event.target.value = "";
}

function renderPreview(src, type, name = "") {
  const container = document.getElementById("file-preview-container");
  const div = document.createElement("div");
  div.className = "preview-item";
  div.style.cssText = "position:relative; width:60px; height:60px; border-radius:8px; overflow:hidden; border:1px solid var(--color-border); flex-shrink:0;";

  if (type === "image") {
    div.innerHTML = `<img src="${src}" style="width:100%; height:100%; object-fit:cover;">`;
  } else {
    div.innerHTML = `<div style="width:100%; height:100%; background:var(--color-bg-tertiary); display:flex; align-items:center; justify-content:center; font-size:1.5rem;"><i class="fa-solid fa-file-lines"></i></div>`;
  }

  // Remove button
  const removeBtn = document.createElement("button");
  removeBtn.innerHTML = "&times;";
  removeBtn.style.cssText = "position:absolute; top:0; right:0; background:rgba(0,0,0,0.6); color:white; border:none; width:20px; height:20px; cursor:pointer;";
  removeBtn.onclick = () => {
    // Remove from array (rough matching)
    if (type === "image") {
      const idx = currentAttachments.indexOf(src);
      if (idx > -1) currentAttachments.splice(idx, 1);
    } else {
      const idx = currentAttachments.findIndex(a => a.name === name);
      if (idx > -1) currentAttachments.splice(idx, 1);
    }
    div.remove();
    if (currentAttachments.length === 0) container.classList.add("hidden");
  };

  div.appendChild(removeBtn);
  container.appendChild(div);
}

function clearAttachments() {
  currentAttachments = [];
  const container = document.getElementById("file-preview-container");
  if (container) {
    container.innerHTML = "";
    container.classList.add("hidden");
  }
}

export async function sendMessage() {
  const input = document.getElementById("user-input");
  let text = (input?.value ?? "").trim();

  if (!text && currentAttachments.length === 0) return;

  // Process text files in attachments: Append them to text
  // Filter out images for API
  const textFiles = currentAttachments.filter(a => a.type === 'file');
  const images = currentAttachments.filter(a => typeof a === 'string'); // Base64 strings

  // Combine all attachments for display (both text files and images)
  const allAttachments = [...images, ...textFiles];

  input.value = "";

  // === GROUP CHAT MODE - No AI, just save to room ===
  if (currentToolMode === "group") {
    // Get current user info
    const currentUserStr = localStorage.getItem('aitutor_current_user');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : { email: 'user@example.com', name: 'User' };

    // Get current room info from global variables (set by selectGroupRoom)
    const roomId = window.currentGroupRoomId;
    const roomName = window.currentGroupRoomName || document.getElementById('tool-title')?.textContent?.replace('🏠 ', '') || 'Room';
    const isLocal = window.currentGroupRoomIsLocal;
    const roomKey = `room_${roomName.replace(/\s+/g, '_')}`;

    // Build message object with all attachments
    const newMessage = {
      role: 'user',
      senderEmail: currentUser.email,
      senderName: currentUser.name || currentUser.email.split('@')[0],
      content: text,
      attachments: allAttachments, // Include both images and text files
      sender_email: currentUser.email,
      sender_name: currentUser.name || currentUser.email.split('@')[0],
      created_at: new Date().toISOString(),
      id: Date.now(),
      timestamp: Date.now()
    };

    // Save to Supabase if available, otherwise localStorage
    if (typeof window.sendGroupMessage === 'function' && roomId && !isLocal) {
      // Use Supabase - pass all attachments (images + text files)
      window.sendGroupMessage(roomId, text, allAttachments);
    } else {
      // Fallback to localStorage
      const roomMessages = JSON.parse(localStorage.getItem(roomKey) || '[]');
      roomMessages.push(newMessage);
      localStorage.setItem(roomKey, JSON.stringify(roomMessages));
    }

    // Build attachment HTML for display
    let attachmentHTML = '';
    if (allAttachments && allAttachments.length > 0) {
      attachmentHTML = allAttachments.map(att => {
        if (typeof att === 'object' && att.type === 'file') {
          const fileContent = att.content || '';
          const fileId = 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
          return `<div id="${fileId}" class="file-attachment" style="background:var(--color-bg-tertiary); padding:10px 14px; border-radius:10px; font-size:0.9rem; display:inline-flex; align-items:center; gap:8px; border:1px solid var(--color-border); margin-bottom:8px; cursor:pointer;" onclick="downloadTextFile('${escapeHtml(att.name || 'file.txt')}', '${fileId}')" data-file-content="${btoa(unescape(encodeURIComponent(fileContent)))}">
            <i class="fa-solid fa-file-lines" style="color:var(--color-accent); font-size:1.1rem;"></i>
            <span style="font-weight:500;">${escapeHtml(att.name || 'File')}</span>
            <i class="fa-solid fa-download" style="color:var(--color-text-muted); margin-left:4px; font-size:0.8rem;"></i>
          </div>`;
        } else if (typeof att === 'string' && att.startsWith('data:image')) {
          return `<img src="${att}" style="max-width:200px; max-height:150px; border-radius:8px; margin-bottom:8px; display:block;">`;
        }
        return '';
      }).join('');
    }

    // Display the message in chat
    const mw = document.getElementById("chat-window");
    if (mw) {
      const div = document.createElement("div");
      div.className = "message user-msg";
      div.innerHTML = `
        <div class="msg-avatar" style="background:var(--color-accent);"><i class="fa-solid fa-user"></i></div>
        <div class="msg-bubble">
          <div style="font-size:0.75rem; color:rgba(255,255,255,0.85); margin-bottom:4px; font-weight:500;">
            <strong style="font-weight:700;">${newMessage.senderName}</strong> • ${new Date().toLocaleTimeString()}
          </div>
          ${attachmentHTML}
          ${escapeHtml(text)}
        </div>
      `;
      mw.appendChild(div);
      mw.scrollTop = mw.scrollHeight;
    }

    // Save to sent items for history tracking
    saveSentItem({
      content: text,
      attachments: allAttachments,
      mode: 'group',
      roomName: roomName,
      timestamp: Date.now()
    });

    // Clear preview
    clearAttachments();
    return; // Exit early - no AI response needed
  }

  // === NORMAL AI CHAT MODE ===
  // Display all attachments (images and text files) in chat immediately
  addMessage(text, "user", false, allAttachments);

  // Save to sent items for history tracking - include userEmail for filtering
  const currentUserStr = localStorage.getItem('aitutor_current_user');
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  saveSentItem({
    content: text,
    attachments: allAttachments,
    mode: currentToolMode,
    chatId: currentChatId,
    userEmail: currentUser?.email || 'unknown',
    timestamp: Date.now()
  });

  // Clear preview
  clearAttachments();

  // Build conversation history from storage
  const history = getHistory();
  const currentChat = history.find(c => c.id === currentChatId);
  const previousMessages = currentChat?.messages || [];

  // Convert previous messages to OpenAI format
  // Exclude the message we just added (it will be sent separately as current message)
  const allMessages = previousMessages.slice(0, -1).map(msg => {
    // Map role: 'user' stays 'user', 'ai' becomes 'assistant'
    const role = msg.role === 'ai' ? 'assistant' : 'user';

    // Handle multimodal content (images)
    if (msg.attachments && msg.attachments.length > 0) {
      // Build multimodal content array
      const content = [
        { type: "text", text: msg.content || "Analyze this image." }
      ];

      msg.attachments.forEach(imgBase64 => {
        content.push({
          type: "image_url",
          image_url: { url: imgBase64 }
        });
      });

      return { role, content };
    } else {
      // Simple text message
      return { role, content: msg.content };
    }
  });

  // Apply token limit to prevent API errors
  const messages = getMessagesWithinLimit(allMessages, MAX_CONTEXT_TOKENS);

  if (messages.length < allMessages.length) {
    console.info(`Context trimmed: ${allMessages.length} -> ${messages.length} messages to fit token limit`);
  }

  // Loading indicator
  const mw = document.getElementById("chat-window");
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "message ai-msg";
  loadingDiv.innerHTML = `
    <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
    <div class="msg-bubble"><i class="fa-solid fa-spinner fa-spin"></i> Thinking...</div>
  `;
  if (mw) {
    mw.appendChild(loadingDiv);
    mw.scrollTop = mw.scrollHeight;
  }

  try {
    // Get user's integrated language level
    let userLevel = null;
    try {
      const { getUserLevel } = await import('../services/chatService.js');
      const { data } = await getUserLevel();
      if (data && data.language_level) {
        userLevel = {
          level: data.language_level,
          description: data.level_description
        };
        console.log('📚 User level loaded:', userLevel);
      }
    } catch (err) {
      console.log('No user level set or error fetching:', err);
    }

    // Send to OpenAI with conversation history and user level
    const aiText = await callOpenAI({
      toolMode: currentToolMode,
      userText: text,
      images: images, // Send images array (only images)
      messages: messages, // Send conversation history (token-limited)
      userLevel: userLevel // Send user's language level
    });
    loadingDiv.remove();
    addMessage(aiText, "ai", false, [], true); // Use typing animation
  } catch (err) {
    loadingDiv.remove();

    // Improved error messages based on error type
    let errorMsg = "Sorry, something went wrong. Please try again.";
    const errStr = err.message?.toLowerCase() || err.toString().toLowerCase();

    if (errStr.includes('429') || errStr.includes('too many')) {
      errorMsg = "⏳ Too many requests. Please wait a moment and try again.";
    } else if (errStr.includes('401') || errStr.includes('unauthorized')) {
      errorMsg = "🔑 Authentication error. Please contact support.";
    } else if (errStr.includes('400') || errStr.includes('invalid')) {
      errorMsg = "⚠️ Invalid request. Please try rephrasing your message.";
    } else if (errStr.includes('network') || errStr.includes('fetch') || errStr.includes('failed to fetch')) {
      errorMsg = "📡 Network error. Please check your internet connection.";
    } else if (errStr.includes('timeout')) {
      errorMsg = "⏱️ Request timed out. Please try again.";
    }

    addMessage(errorMsg, "ai");
    console.error('Chat error:', err);
  }
}

// --- Sidebar Visuals & Interactions ---

function renderSidebarHistory() {
  const list = document.getElementById("sidebar-history-list");
  if (!list) return;

  // Get current user email
  const currentUserStr = localStorage.getItem('aitutor_current_user');
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const currentEmail = currentUser?.email?.toLowerCase() || '';

  // Get history and filter by current user
  const allHistory = getHistory();
  const history = allHistory.filter(chat => {
    // If chat has userEmail, filter by it
    if (chat.userEmail) {
      return chat.userEmail.toLowerCase() === currentEmail;
    }
    // Legacy chats without userEmail - show to everyone (backward compatibility)
    return true;
  });

  list.innerHTML = "";

  const newChatBtn = document.createElement("div");
  newChatBtn.className = "room-item";
  newChatBtn.style.cssText = `
    justify-content: center; color: var(--color-primary); 
    font-weight: bold; border: 1px dashed var(--color-border); 
    opacity: 0.9; margin-bottom: 8px; cursor: pointer;
  `;
  newChatBtn.innerHTML = `<i class="fa-solid fa-plus"></i> New Chat`;
  newChatBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    createNewChat();
  };
  list.appendChild(newChatBtn);

  if (history.length === 0) {
    list.innerHTML += `<div style="padding:15px; text-align:center; color:var(--color-text-muted); font-size:0.8rem;">No history.</div>`;
    return;
  }

  history.forEach(chat => {
    const item = document.createElement("div");
    item.className = "room-item history-item";

    item.style.cssText = `
      position: relative;
      display: flex; 
      align-items: center; 
      justify-content: space-between; 
      padding: 8px 10px; 
      margin-bottom: 4px;
      border-radius: 8px;
      cursor: pointer; 
      font-size: 0.85rem;
      border: 1px solid transparent;
      color: var(--color-text-secondary);
      transition: all 0.2s;
      min-height: 36px;
    `;

    if (chat.id === currentChatId) {
      item.style.borderColor = "rgba(var(--color-accent-rgb), 0.3)";
      item.style.background = "var(--color-bg-tertiary)";
      item.style.color = "var(--color-text-primary)";
      item.style.fontWeight = "600";
    }

    const title = (chat.title || 'New Chat');
    let iconClass = "fa-regular fa-message";

    item.innerHTML = `
      <div class="chat-info" style="display:flex; align-items:center; gap:8px; overflow:hidden; flex:1; pointer-events:none;">
        <i class="${iconClass}" style="opacity:0.7;"></i>
        <span class="chat-title" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(title)}</span>
      </div>
      
      <div class="chat-menu-trigger" style="padding:4px; border-radius:4px; cursor:pointer;" title="Options">
        <i class="fa-solid fa-ellipsis-vertical" style="font-size:0.8rem;"></i>
      </div>

      <div class="chat-context-menu hidden" id="menu-${chat.id}" style="
          position: absolute; right: 0; top: 100%; 
          background: var(--color-card-bg); 
          border: 1px solid var(--color-border); 
          box-shadow: var(--shadow-md); 
          border-radius: 6px; 
          z-index: 100; 
          min-width: 100px;
          overflow: hidden;
      ">
        <div class="ctx-item" data-action="rename">Rename</div>
        <div class="ctx-item" data-action="delete" style="color:var(--color-error-text);">Delete</div>
      </div>
    `;

    const trigger = item.querySelector(".chat-menu-trigger");
    const menu = item.querySelector(`#menu-${chat.id}`);

    trigger.onclick = (e) => {
      e.stopPropagation();
      document.querySelectorAll(".chat-context-menu").forEach(el => {
        if (el.id !== `menu-${chat.id}`) el.classList.add("hidden");
      });
      menu.classList.toggle("hidden");
    };

    item.onclick = (e) => {
      if (e.target.closest(".chat-menu-trigger") || e.target.closest(".chat-context-menu")) return;
      if (currentChatId !== chat.id) {
        loadChat(chat);
      }
    };

    menu.querySelector('[data-action="rename"]').onclick = (e) => {
      e.stopPropagation();
      menu.classList.add("hidden");
      const newTitle = prompt("Rename:", chat.title);
      if (newTitle && newTitle.trim()) renameChat(chat.id, newTitle.trim());
    };

    menu.querySelector('[data-action="delete"]').onclick = (e) => {
      e.stopPropagation();
      menu.classList.add("hidden");
      if (confirm("Delete?")) deleteChat(chat.id);
    };

    menu.querySelectorAll(".ctx-item").forEach(btn => {
      btn.style.cssText = "padding:8px 12px; cursor:pointer; font-size:0.8rem;";
      btn.onmouseover = () => btn.style.background = "var(--color-bg-tertiary)";
      btn.onmouseout = () => btn.style.background = "transparent";
    });

    list.appendChild(item);
  });
}

function loadChat(chat) {
  currentChatId = chat.id;
  currentToolMode = chat.mode;
  currentAttachments = []; // Reset attachments on load

  renderSidebarHistory();

  const meta = getToolMeta(chat.mode);
  const tt = document.getElementById("tool-title");
  if (tt) tt.textContent = chat.title || meta.title;

  const mw = document.getElementById("chat-window");
  if (mw) {
    mw.innerHTML = "";

    if (chat.messages && chat.messages.length > 0) {
      chat.messages.forEach(msg => {
        // Restore attachments if any
        addMessage(msg.content, msg.role, true, msg.attachments || []);
      });
    } else {
      addMessage(meta.welcome, "ai", true);
    }
    setTimeout(() => mw.scrollTop = mw.scrollHeight, 10);
  }

  // Update sent items when switching chats
  renderSentItems();
}


function renameChat(id, newTitle) {
  const history = getHistory();
  const chat = history.find(c => c.id === id);
  if (chat) {
    chat.title = newTitle;
    chat.manualTitle = true;
    saveHistory(history);
    renderSidebarHistory();
    if (currentChatId === id) {
      const tt = document.getElementById("tool-title");
      if (tt) tt.textContent = newTitle;
    }
  }
}

function deleteChat(id) {
  let history = getHistory();
  history = history.filter(c => c.id !== id);
  saveHistory(history);

  if (currentChatId === id) {
    createNewChat();
  } else {
    renderSidebarHistory();
  }
}

function toggleHistory(e) {
  e?.preventDefault?.();
  const panel = document.getElementById("history-panel");
  const caret = document.getElementById("history-caret");

  const willOpen = panel?.classList.contains("hidden");
  panel?.classList.toggle("hidden");
  if (caret) caret.classList.toggle("open", willOpen);

  if (willOpen) renderSidebarHistory();
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".chat-context-menu") && !e.target.closest(".chat-menu-trigger")) {
    document.querySelectorAll(".chat-context-menu").forEach(el => el.classList.add("hidden"));
  }
});

export function exportChat() {
  let messages = [];
  let title = 'Chat Export';
  let mode = currentToolMode;

  // Check if we're in group chat mode
  if (currentToolMode === 'group') {
    // Use global room variables set by selectGroupRoom
    const roomId = window.currentGroupRoomId;
    const roomName = window.currentGroupRoomName ||
      document.getElementById('tool-title')?.textContent?.replace(/^🏠\s*/, '').trim() || 'Room';
    const isLocal = window.currentGroupRoomIsLocal;

    title = `Group Chat - ${roomName}`;

    // Try to get messages from the chat window directly (works for both Supabase and localStorage)
    const chatWindow = document.getElementById('chat-window');
    if (chatWindow) {
      const messageDivs = chatWindow.querySelectorAll('.message');
      messageDivs.forEach(div => {
        const bubble = div.querySelector('.msg-bubble');
        if (bubble) {
          // Extract sender info and content
          const senderDiv = bubble.querySelector('div[style*="font-size:0.75rem"]');
          const strongTag = senderDiv?.querySelector('strong');
          const senderName = strongTag?.textContent || 'Unknown';

          // Get text content (excluding the sender info div)
          let content = bubble.textContent || '';
          if (senderDiv) {
            content = content.replace(senderDiv.textContent, '').trim();
          }

          if (content) {
            messages.push({
              senderName: senderName,
              content: content,
              timestamp: Date.now()
            });
          }
        }
      });
    }

    // Fallback: try localStorage if no messages found
    if (messages.length === 0) {
      const roomKey = `room_${roomName.replace(/\s+/g, '_')}`;
      const localMessages = JSON.parse(localStorage.getItem(roomKey) || '[]');
      messages = localMessages.map(msg => ({
        senderName: msg.senderName || msg.sender_name || msg.sender_email || 'Unknown',
        content: msg.content,
        timestamp: msg.timestamp || msg.created_at
      }));
    }
  } else {
    // Regular chat export
    const history = getHistory();
    const chat = history.find(c => c.id === currentChatId);
    if (chat && chat.messages) {
      messages = chat.messages;
      title = chat.title || 'Chat Export';
      mode = chat.mode || 'chat';
    }
  }

  if (!messages || messages.length === 0) {
    alert('No messages to export.');
    return;
  }

  // Build TXT content
  let txtContent = `=== ${title} ===\n`;
  txtContent += `Mode: ${mode}\n`;
  txtContent += `Date: ${new Date().toLocaleString()}\n`;
  txtContent += `${'='.repeat(40)}\n\n`;

  messages.forEach((msg) => {
    const sender = msg.senderName || (msg.role === 'user' ? 'You' : 'AI');
    const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '';
    txtContent += `[${sender}] ${time}\n`;
    txtContent += `${msg.content}\n`;
    if (msg.attachments && msg.attachments.length > 0) {
      txtContent += `(${msg.attachments.length} attachment(s))\n`;
    }
    txtContent += '\n';
  });

  // Create and download file
  const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chat-${title.replace(/[^a-z0-9]/gi, '_').substring(0, 20)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Make exportChat globally available immediately
window.exportChat = exportChat;

export function initChatUI() {
  els = {
    chatWindow: document.getElementById("chat-window"),
    userInput: document.getElementById("user-input"),
    toolTitle: document.getElementById("tool-title"),
  };

  els.userInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { // shift+enter for new line
      e.preventDefault(); // prevent newline in textarea
      sendMessage();
    }
  });

  // File Input checking
  const fileInput = document.getElementById("file-input");
  if (fileInput) {
    fileInput.addEventListener("change", handleFileSelect);
  }

  window.sendMessage = sendMessage;
  window.exportChat = exportChat;
  window.toggleHistory = toggleHistory;
  window.createNewChat = createNewChat;

  renderSidebarHistory();
  renderSentItems(); // Load sent items history
}
