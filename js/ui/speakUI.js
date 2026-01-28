// js/ui/speakUI.js
// UI management for real-time speaking feature

import { getRealtimeClient, createNewRealtimeClient, getSpeakStatistics, getSpeakSessions } from '../services/speakService.js';

// ======================================
// STATE
// ======================================

let currentClient = null;
let currentMode = null;
let isSessionActive = false;
let isMuted = false;
let aiTranscriptBuffer = '';

// ======================================
// INITIALIZATION
// ======================================

export function initSpeakUI() {
    setupEventListeners();
}

function setupEventListeners() {
    // Mode selection cards
    document.querySelectorAll('.speak-mode-card').forEach(card => {
        card.addEventListener('click', () => {
            const mode = card.dataset.mode;
            if (mode) selectMode(mode);
        });
    });
}

// ======================================
// MODE SELECTION
// ======================================

window.openSpeakMode = async function (mode, event) {
    if (event) event.preventDefault();

    // Show speak panel
    const workspaceView = document.getElementById('workspace-view');
    if (workspaceView) {
        workspaceView.classList.remove('hidden');
    }

    // Hide other panels
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));

    // Show speak panel
    const speakPanel = document.getElementById('panel-speak');
    if (speakPanel) {
        speakPanel.classList.remove('hidden');
    }

    // Update tool title
    const toolTitle = document.getElementById('tool-title');
    if (toolTitle) {
        toolTitle.textContent = mode === 'academic' ? 'Academic Speaking' : 'Native Speaking';
    }

    // Update mode indicator
    updateModeIndicator(mode);

    // Show session screen
    showSessionScreen(mode);

    // Close mobile sidebar
    if (window.closeMobileSidebar) window.closeMobileSidebar();
};

function updateModeIndicator(mode) {
    const indicator = document.getElementById('speak-mode-indicator');
    if (indicator) {
        indicator.textContent = mode === 'academic' ? '🎓 Academic Mode' : '💬 Native Mode';
        indicator.className = `speak-mode-indicator ${mode}`;
    }
}

function showSessionScreen(mode) {
    currentMode = mode;

    // Hide mode selection, show session controls
    const modeSelection = document.getElementById('speak-mode-selection');
    const sessionScreen = document.getElementById('speak-session-screen');

    if (modeSelection) modeSelection.classList.add('hidden');
    if (sessionScreen) sessionScreen.classList.remove('hidden');

    // Reset UI
    resetSessionUI();

    // Load previous sessions
    loadPreviousSessions();
}

function resetSessionUI() {
    // Clear transcripts
    const transcriptArea = document.getElementById('speak-transcript');
    if (transcriptArea) {
        transcriptArea.innerHTML = '<div class="transcript-placeholder"><i class="fa-solid fa-microphone"></i><p>Press Start to begin speaking</p></div>';
    }

    // Clear corrections
    const correctionsArea = document.getElementById('speak-corrections');
    if (correctionsArea) {
        correctionsArea.innerHTML = '';
    }

    // Reset buttons
    updateControlButtons(false);

    // Reset state
    aiTranscriptBuffer = '';
    isMuted = false;
}

// ======================================
// SESSION CONTROLS
// ======================================

window.startSpeakSession = async function () {
    if (isSessionActive) return;

    const startBtn = document.getElementById('speak-start-btn');
    if (startBtn) {
        startBtn.disabled = true;
        startBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Connecting...';
    }

    // Create new client
    currentClient = createNewRealtimeClient();

    // Set up event handlers
    currentClient.onTranscriptUpdate = handleTranscriptUpdate;
    currentClient.onCorrectionReceived = handleCorrection;
    currentClient.onAISpeaking = handleAISpeaking;
    currentClient.onAIStopped = handleAIStopped;
    currentClient.onConnectionChange = handleConnectionChange;
    currentClient.onError = handleError;

    // Connect
    const result = await currentClient.connect(currentMode);

    if (result.success) {
        isSessionActive = true;
        updateControlButtons(true);
        showToast('Connected! Start speaking...', 'success');

        // Clear placeholder
        const transcriptArea = document.getElementById('speak-transcript');
        if (transcriptArea) {
            transcriptArea.innerHTML = '';
        }
    } else {
        showToast('Connection failed: ' + result.error, 'error');
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
        }
    }
};

window.stopSpeakSession = async function () {
    if (!isSessionActive || !currentClient) return;

    const stopBtn = document.getElementById('speak-stop-btn');
    if (stopBtn) {
        stopBtn.disabled = true;
        stopBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }

    // Disconnect and save
    const sessionData = await currentClient.disconnect();

    isSessionActive = false;
    currentClient = null;

    updateControlButtons(false);

    // Show session summary
    showSessionSummary(sessionData);

    showToast('Session saved!', 'success');
};

window.toggleSpeakMute = function () {
    if (!currentClient || !isSessionActive) return;

    isMuted = !isMuted;

    if (isMuted) {
        currentClient.mute();
    } else {
        currentClient.unmute();
    }

    const muteBtn = document.getElementById('speak-mute-btn');
    if (muteBtn) {
        muteBtn.innerHTML = isMuted
            ? '<i class="fa-solid fa-microphone-slash"></i>'
            : '<i class="fa-solid fa-microphone"></i>';
        muteBtn.classList.toggle('muted', isMuted);
    }
};

window.backToModeSelection = function () {
    if (isSessionActive) {
        if (!confirm('End current session?')) return;
        stopSpeakSession();
    }

    const modeSelection = document.getElementById('speak-mode-selection');
    const sessionScreen = document.getElementById('speak-session-screen');

    if (modeSelection) modeSelection.classList.remove('hidden');
    if (sessionScreen) sessionScreen.classList.add('hidden');
};

function updateControlButtons(active) {
    const startBtn = document.getElementById('speak-start-btn');
    const stopBtn = document.getElementById('speak-stop-btn');
    const muteBtn = document.getElementById('speak-mute-btn');

    if (startBtn) {
        startBtn.disabled = active;
        startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
        startBtn.classList.toggle('hidden', active);
    }

    if (stopBtn) {
        stopBtn.disabled = !active;
        stopBtn.innerHTML = '<i class="fa-solid fa-stop"></i> End Session';
        stopBtn.classList.toggle('hidden', !active);
    }

    if (muteBtn) {
        muteBtn.disabled = !active;
        muteBtn.classList.toggle('hidden', !active);
    }
}

// ======================================
// EVENT HANDLERS
// ======================================

function handleTranscriptUpdate(role, text) {
    const transcriptArea = document.getElementById('speak-transcript');
    if (!transcriptArea) return;

    if (role === 'user') {
        // Add user message
        const userMsg = document.createElement('div');
        userMsg.className = 'transcript-message user';
        userMsg.innerHTML = `
            <div class="message-avatar"><i class="fa-solid fa-user"></i></div>
            <div class="message-content">${escapeHtml(text)}</div>
        `;
        transcriptArea.appendChild(userMsg);
        transcriptArea.scrollTop = transcriptArea.scrollHeight;

    } else if (role === 'assistant_delta') {
        // Streaming AI response
        aiTranscriptBuffer += text;

        let aiMsg = transcriptArea.querySelector('.transcript-message.assistant.streaming');
        if (!aiMsg) {
            aiMsg = document.createElement('div');
            aiMsg.className = 'transcript-message assistant streaming';
            aiMsg.innerHTML = `
                <div class="message-avatar"><i class="fa-solid fa-robot"></i></div>
                <div class="message-content"></div>
            `;
            transcriptArea.appendChild(aiMsg);
        }

        aiMsg.querySelector('.message-content').textContent = aiTranscriptBuffer;
        transcriptArea.scrollTop = transcriptArea.scrollHeight;

    } else if (role === 'assistant') {
        // Complete AI message
        const streamingMsg = transcriptArea.querySelector('.transcript-message.assistant.streaming');
        if (streamingMsg) {
            streamingMsg.classList.remove('streaming');
            streamingMsg.querySelector('.message-content').textContent = text;
        } else {
            const aiMsg = document.createElement('div');
            aiMsg.className = 'transcript-message assistant';
            aiMsg.innerHTML = `
                <div class="message-avatar"><i class="fa-solid fa-robot"></i></div>
                <div class="message-content">${escapeHtml(text)}</div>
            `;
            transcriptArea.appendChild(aiMsg);
        }

        aiTranscriptBuffer = '';
        transcriptArea.scrollTop = transcriptArea.scrollHeight;
    }
}

function handleCorrection(text) {
    const correctionsArea = document.getElementById('speak-corrections');
    if (!correctionsArea) return;

    const correctionItem = document.createElement('div');
    correctionItem.className = 'correction-item';
    correctionItem.innerHTML = `
        <i class="fa-solid fa-lightbulb"></i>
        <span>${escapeHtml(text)}</span>
    `;

    // Add to top
    correctionsArea.insertBefore(correctionItem, correctionsArea.firstChild);

    // Highlight briefly
    correctionItem.classList.add('highlight');
    setTimeout(() => correctionItem.classList.remove('highlight'), 2000);
}

function handleAISpeaking() {
    const avatar = document.getElementById('speak-ai-avatar');
    if (avatar) {
        avatar.classList.add('speaking');
    }
}

function handleAIStopped() {
    const avatar = document.getElementById('speak-ai-avatar');
    if (avatar) {
        avatar.classList.remove('speaking');
    }
}

function handleConnectionChange(connected) {
    const statusIndicator = document.getElementById('speak-connection-status');
    if (statusIndicator) {
        statusIndicator.className = connected ? 'status-connected' : 'status-disconnected';
        statusIndicator.textContent = connected ? 'Connected' : 'Disconnected';
    }
}

function handleError(message) {
    showToast('Error: ' + message, 'error');
}

// ======================================
// SESSION HISTORY
// ======================================

async function loadPreviousSessions() {
    const historyList = document.getElementById('speak-history-list');
    if (!historyList) return;

    const { data: sessions } = await getSpeakSessions();

    if (!sessions || sessions.length === 0) {
        historyList.innerHTML = '<p class="no-history">No previous sessions</p>';
        return;
    }

    historyList.innerHTML = sessions.slice(0, 5).map(session => `
        <div class="history-item">
            <span class="history-mode ${session.mode}">${session.mode === 'academic' ? '🎓' : '💬'}</span>
            <span class="history-duration">${formatDuration(session.duration_seconds)}</span>
            <span class="history-date">${formatDate(session.created_at)}</span>
        </div>
    `).join('');
}

function showSessionSummary(sessionData) {
    const summaryModal = document.getElementById('speak-summary-modal');
    if (!summaryModal) return;

    const duration = formatDuration(sessionData.durationSeconds);
    const correctionCount = sessionData.corrections.length;

    summaryModal.innerHTML = `
        <div class="summary-content">
            <h3><i class="fa-solid fa-check-circle"></i> Session Complete!</h3>
            <div class="summary-stats">
                <div class="stat">
                    <span class="stat-value">${duration}</span>
                    <span class="stat-label">Duration</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${correctionCount}</span>
                    <span class="stat-label">Corrections</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${sessionData.transcript.length}</span>
                    <span class="stat-label">Messages</span>
                </div>
            </div>
            <button class="primary-btn" onclick="closeSummaryModal()">
                <i class="fa-solid fa-check"></i> Done
            </button>
        </div>
    `;

    summaryModal.classList.remove('hidden');
}

window.closeSummaryModal = function () {
    const summaryModal = document.getElementById('speak-summary-modal');
    if (summaryModal) summaryModal.classList.add('hidden');

    // Reload history
    loadPreviousSessions();
};

// ======================================
// UTILITIES
// ======================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function showToast(message, type = 'info') {
    // Create toast if not exists
    let toast = document.getElementById('speak-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'speak-toast';
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = `speak-toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ======================================
// SIDEBAR TOGGLE
// ======================================

window.toggleSpeakMenu = function (event) {
    if (event) event.preventDefault();

    const panel = document.getElementById('speak-panel');
    const caret = document.getElementById('speak-caret');

    if (panel) {
        panel.classList.toggle('hidden');
    }

    if (caret) {
        caret.classList.toggle('rotated');
    }
};

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSpeakUI);
} else {
    initSpeakUI();
}
