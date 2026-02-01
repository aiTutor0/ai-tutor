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

    // Close mobile sidebar
    if (window.closeMobileSidebar) {
        window.closeMobileSidebar();
    }

    // Update sidebar active state
    document.querySelectorAll('.menu-link').forEach(link => link.classList.remove('active'));

    // Directly start the specific mode instead of showing mode selection
    if (skill === 'writing') {
        if (mode === 'essay') {
            window.startEssayWriting(null);
        } else if (mode === 'task') {
            window.startTaskWriting(null);
        } else {
            resetSkillPanelToModeSelection(skill);
        }
    } else if (skill === 'listening') {
        if (mode === 'academic') {
            window.startAcademicListening(null);
        } else if (mode === 'conversation') {
            window.startConversationListening(null);
        } else {
            resetSkillPanelToModeSelection(skill);
        }
    } else if (skill === 'reading') {
        if (mode === 'academic') {
            window.startAcademicReading(null);
        } else if (mode === 'speed') {
            window.startSpeedReading(null);
        } else {
            resetSkillPanelToModeSelection(skill);
        }
    } else {
        // Default: show mode selection
        resetSkillPanelToModeSelection(skill);
    }
};

// Reset skill panel to show mode selection
function resetSkillPanelToModeSelection(skill) {
    // Hide all session screens for this skill
    const sessionScreens = {
        'writing': ['essay-session-screen', 'task-session-screen'],
        'listening': ['academic-listening-screen', 'conversation-listening-screen'],
        'reading': ['academic-reading-screen', 'speed-reading-screen']
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

    // Hide task screen (if open)
    const taskScreen = document.getElementById('task-session-screen');
    if (taskScreen) taskScreen.classList.add('hidden');

    // Show essay session screen
    const sessionScreen = document.getElementById('essay-session-screen');
    if (sessionScreen) sessionScreen.classList.remove('hidden');

    // Update title
    const toolTitle = document.getElementById('tool-title');
    if (toolTitle) toolTitle.textContent = 'Essay Writing';

    // Get initial topic if writingUI has the function
    if (window.loadEssayContent) {
        window.loadEssayContent();
    }
};

window.backToWritingSelection = function () {
    // Hide both session screens
    const essayScreen = document.getElementById('essay-session-screen');
    if (essayScreen) essayScreen.classList.add('hidden');

    const taskScreen = document.getElementById('task-session-screen');
    if (taskScreen) taskScreen.classList.add('hidden');

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

    // Hide essay screen (if open)
    const essayScreen = document.getElementById('essay-session-screen');
    if (essayScreen) essayScreen.classList.add('hidden');

    // Show task session screen
    const sessionScreen = document.getElementById('task-session-screen');
    if (sessionScreen) sessionScreen.classList.remove('hidden');

    // Update title
    const toolTitle = document.getElementById('tool-title');
    if (toolTitle) toolTitle.textContent = 'Task Response';

    // Get task topic if function available
    if (window.loadTaskContent) {
        window.loadTaskContent();
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

    // Hide conversation screen (if open)
    const convScreen = document.getElementById('conversation-listening-screen');
    if (convScreen) convScreen.classList.add('hidden');

    // Show academic listening screen
    const sessionScreen = document.getElementById('academic-listening-screen');
    if (sessionScreen) sessionScreen.classList.remove('hidden');

    // Update title
    const toolTitle = document.getElementById('tool-title');
    if (toolTitle) toolTitle.textContent = 'Academic Listening';

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

    // Hide academic screen (if open)
    const acadScreen = document.getElementById('academic-listening-screen');
    if (acadScreen) acadScreen.classList.add('hidden');

    // Show conversation listening screen
    const sessionScreen = document.getElementById('conversation-listening-screen');
    if (sessionScreen) sessionScreen.classList.remove('hidden');

    // Update title
    const toolTitle = document.getElementById('tool-title');
    if (toolTitle) toolTitle.textContent = 'Conversation Practice';

    // Start loading content if function available
    if (window.loadListeningContent) {
        window.loadListeningContent('conversation');
    }
};

window.backToListeningSelection = function () {
    // Hide both session screens
    const acadScreen = document.getElementById('academic-listening-screen');
    if (acadScreen) acadScreen.classList.add('hidden');

    const convScreen = document.getElementById('conversation-listening-screen');
    if (convScreen) convScreen.classList.add('hidden');

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

    // Hide speed reading screen (if open)
    const speedScreen = document.getElementById('speed-reading-screen');
    if (speedScreen) speedScreen.classList.add('hidden');

    // Show academic reading screen
    const sessionScreen = document.getElementById('academic-reading-screen');
    if (sessionScreen) sessionScreen.classList.remove('hidden');

    // Update title
    const toolTitle = document.getElementById('tool-title');
    if (toolTitle) toolTitle.textContent = 'Academic Reading';

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

    // Hide academic reading screen (if open)
    const acadScreen = document.getElementById('academic-reading-screen');
    if (acadScreen) acadScreen.classList.add('hidden');

    // Show speed reading screen
    const sessionScreen = document.getElementById('speed-reading-screen');
    if (sessionScreen) sessionScreen.classList.remove('hidden');

    // Update title
    const toolTitle = document.getElementById('tool-title');
    if (toolTitle) toolTitle.textContent = 'Speed Reading';

    // Start loading content if function available
    if (window.loadReadingContent) {
        window.loadReadingContent('speed');
    }
};

window.backToReadingSelection = function () {
    // Hide both session screens
    const acadScreen = document.getElementById('academic-reading-screen');
    if (acadScreen) acadScreen.classList.add('hidden');

    const speedScreen = document.getElementById('speed-reading-screen');
    if (speedScreen) speedScreen.classList.add('hidden');

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
