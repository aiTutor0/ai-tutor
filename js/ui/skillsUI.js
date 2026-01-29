// js/ui/skillsUI.js
// UI management for Writing, Listening, Reading features

// ======================================
// SIDEBAR TOGGLE FUNCTIONS
// ======================================

window.toggleWritingMenu = function (event) {
    if (event) event.preventDefault();
    toggleSubPanel('writing-panel', 'writing-caret');
};

window.toggleListeningMenu = function (event) {
    if (event) event.preventDefault();
    toggleSubPanel('listening-panel', 'listening-caret');
};

window.toggleReadingMenu = function (event) {
    if (event) event.preventDefault();
    toggleSubPanel('reading-panel', 'reading-caret');
};

function toggleSubPanel(panelId, caretId) {
    const panel = document.getElementById(panelId);
    const caret = document.getElementById(caretId);

    if (panel) {
        panel.classList.toggle('hidden');
    }

    if (caret) {
        caret.classList.toggle('rotated');
    }
}

// ======================================
// SKILL MODE OPENING
// ======================================

window.openSkillMode = function (skill, mode, event) {
    if (event) event.preventDefault();
    if (event) event.stopPropagation();

    console.log(`openSkillMode called: skill=${skill}, mode=${mode}`);

    // Show workspace view
    const workspaceView = document.getElementById('workspace-view');
    if (workspaceView) {
        workspaceView.classList.remove('hidden');
    }

    // Hide other view sections
    document.getElementById('landing-view')?.classList.add('hidden');
    document.getElementById('auth-view')?.classList.add('hidden');
    document.getElementById('dashboard-view')?.classList.add('hidden');
    document.getElementById('admin-view')?.classList.add('hidden');

    // Hide ALL tab panels first
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));

    // Show the correct skill panel
    const panelId = `panel-${skill}`;
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.classList.remove('hidden');
    }

    // Reset to mode selection screen (hide session screens)
    resetSkillPanelToModeSelection(skill);

    // Update tool title
    const toolTitle = document.getElementById('tool-title');
    if (toolTitle) {
        const titles = {
            'writing': mode === 'essay' ? 'Essay Writing' : 'Task Response',
            'listening': mode === 'academic' ? 'Academic Listening' : 'Conversation Practice',
            'reading': mode === 'academic' ? 'Academic Reading' : 'Speed Reading'
        };
        toolTitle.textContent = titles[skill] || `${skill} Practice`;
    }

    // Close mobile sidebar
    if (window.closeMobileSidebar) {
        window.closeMobileSidebar();
    }

    // Update sidebar active state
    document.querySelectorAll('.menu-link').forEach(link => link.classList.remove('active'));
};

// Reset skill panel to show mode selection
function resetSkillPanelToModeSelection(skill) {
    // Hide all session screens for this skill
    const sessionScreens = {
        'writing': ['writing-session-screen'],
        'listening': ['listening-session-screen'],
        'reading': ['reading-session-screen']
    };

    const modeSelections = {
        'writing': 'writing-mode-selection',
        'listening': 'listening-mode-selection',
        'reading': 'reading-mode-selection'
    };

    // Hide session screens
    if (sessionScreens[skill]) {
        sessionScreens[skill].forEach(screenId => {
            const screen = document.getElementById(screenId);
            if (screen) screen.classList.add('hidden');
        });
    }

    // Show mode selection
    const modeSelectionId = modeSelections[skill];
    if (modeSelectionId) {
        const modeSelection = document.getElementById(modeSelectionId);
        if (modeSelection) modeSelection.classList.remove('hidden');
    }
}

// ======================================
// WRITING FUNCTIONS
// ======================================

window.startEssayWriting = function (event) {
    if (event) event.preventDefault();
    if (event) event.stopPropagation();

    console.log('Starting Essay Writing...');

    // Hide mode selection
    const modeSelection = document.getElementById('writing-mode-selection');
    if (modeSelection) modeSelection.classList.add('hidden');

    // Show session screen
    const sessionScreen = document.getElementById('writing-session-screen');
    if (sessionScreen) sessionScreen.classList.remove('hidden');

    // Update title
    const toolTitle = document.getElementById('tool-title');
    if (toolTitle) toolTitle.textContent = 'Essay Writing';

    // Get initial topic if writingUI has the function
    if (window.getNewTopic) {
        window.getNewTopic();
    }
};

window.backToWritingSelection = function () {
    // Hide session screen
    const sessionScreen = document.getElementById('writing-session-screen');
    if (sessionScreen) sessionScreen.classList.add('hidden');

    // Show mode selection
    const modeSelection = document.getElementById('writing-mode-selection');
    if (modeSelection) modeSelection.classList.remove('hidden');

    // Update title
    const toolTitle = document.getElementById('tool-title');
    if (toolTitle) toolTitle.textContent = 'Writing Practice';
};

window.startTaskWriting = function (event) {
    if (event) event.preventDefault();
    if (event) event.stopPropagation();

    console.log('Starting Task Writing (IELTS Task 1)...');

    // Hide mode selection
    const modeSelection = document.getElementById('writing-mode-selection');
    if (modeSelection) modeSelection.classList.add('hidden');

    // Show session screen
    const sessionScreen = document.getElementById('writing-session-screen');
    if (sessionScreen) sessionScreen.classList.remove('hidden');

    // Update title
    const toolTitle = document.getElementById('tool-title');
    if (toolTitle) toolTitle.textContent = 'Task Response';

    // Get task topic if function available
    if (window.getNewTaskTopic) {
        window.getNewTaskTopic();
    }
};

// ======================================
// LISTENING FUNCTIONS
// ======================================

window.startAcademicListening = function (event) {
    if (event) event.preventDefault();
    if (event) event.stopPropagation();

    console.log('Starting Academic Listening...');

    // Hide mode selection
    const modeSelection = document.getElementById('listening-mode-selection');
    if (modeSelection) modeSelection.classList.add('hidden');

    // Show session screen
    const sessionScreen = document.getElementById('listening-session-screen');
    if (sessionScreen) sessionScreen.classList.remove('hidden');

    // Update title
    const listeningTitle = document.getElementById('listening-title');
    if (listeningTitle) {
        listeningTitle.innerHTML = '<i class="fa-solid fa-headphones"></i> Academic Listening';
    }

    // Start loading content if function available
    if (window.loadListeningContent) {
        window.loadListeningContent('academic');
    }
};

window.startConversationListening = function (event) {
    if (event) event.preventDefault();
    if (event) event.stopPropagation();

    console.log('Starting Conversation Listening...');

    // Hide mode selection
    const modeSelection = document.getElementById('listening-mode-selection');
    if (modeSelection) modeSelection.classList.add('hidden');

    // Show session screen
    const sessionScreen = document.getElementById('listening-session-screen');
    if (sessionScreen) sessionScreen.classList.remove('hidden');

    // Update title
    const listeningTitle = document.getElementById('listening-title');
    if (listeningTitle) {
        listeningTitle.innerHTML = '<i class="fa-solid fa-comments"></i> Conversation Practice';
    }

    // Start loading content if function available
    if (window.loadListeningContent) {
        window.loadListeningContent('conversation');
    }
};

window.backToListeningSelection = function () {
    // Hide session screen
    const sessionScreen = document.getElementById('listening-session-screen');
    if (sessionScreen) sessionScreen.classList.add('hidden');

    // Show mode selection
    const modeSelection = document.getElementById('listening-mode-selection');
    if (modeSelection) modeSelection.classList.remove('hidden');

    // Update title
    const toolTitle = document.getElementById('tool-title');
    if (toolTitle) toolTitle.textContent = 'Listening Practice';
};

// ======================================
// READING FUNCTIONS
// ======================================

window.startAcademicReading = function (event) {
    if (event) event.preventDefault();
    if (event) event.stopPropagation();

    console.log('Starting Academic Reading...');

    // Hide mode selection
    const modeSelection = document.getElementById('reading-mode-selection');
    if (modeSelection) modeSelection.classList.add('hidden');

    // Show session screen
    const sessionScreen = document.getElementById('reading-session-screen');
    if (sessionScreen) sessionScreen.classList.remove('hidden');

    // Update title if exists
    const readingTitle = document.getElementById('reading-title');
    if (readingTitle) {
        readingTitle.innerHTML = '<i class="fa-solid fa-book"></i> Academic Reading';
    }

    // Start loading content if function available
    if (window.loadReadingContent) {
        window.loadReadingContent('academic');
    }
};

window.startSpeedReading = function (event) {
    if (event) event.preventDefault();
    if (event) event.stopPropagation();

    console.log('Starting Speed Reading...');

    // Hide mode selection
    const modeSelection = document.getElementById('reading-mode-selection');
    if (modeSelection) modeSelection.classList.add('hidden');

    // Show session screen
    const sessionScreen = document.getElementById('reading-session-screen');
    if (sessionScreen) sessionScreen.classList.remove('hidden');

    // Update title if exists
    const readingTitle = document.getElementById('reading-title');
    if (readingTitle) {
        readingTitle.innerHTML = '<i class="fa-solid fa-bolt"></i> Speed Reading';
    }

    // Start loading content if function available
    if (window.loadReadingContent) {
        window.loadReadingContent('speed');
    }
};

window.backToReadingSelection = function () {
    // Hide session screen
    const sessionScreen = document.getElementById('reading-session-screen');
    if (sessionScreen) sessionScreen.classList.add('hidden');

    // Show mode selection
    const modeSelection = document.getElementById('reading-mode-selection');
    if (modeSelection) modeSelection.classList.remove('hidden');

    // Update title
    const toolTitle = document.getElementById('tool-title');
    if (toolTitle) toolTitle.textContent = 'Reading Practice';
};

// ======================================
// INITIALIZATION
// ======================================

function initSkillsUI() {
    console.log('Skills UI initialized');
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSkillsUI);
} else {
    initSkillsUI();
}
