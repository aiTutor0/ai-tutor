// js/ui/skillsUI.js
// UI management for Writing, Listening, Reading features

// ======================================
// SIDEBAR TOGGLE FUNCTIONS
// ======================================

window.toggleWritingMenu = function (event) {
    if (event) event.preventDefault();

    const panel = document.getElementById('writing-panel');
    const caret = document.getElementById('writing-caret');

    if (panel) {
        panel.classList.toggle('hidden');
    }

    if (caret) {
        caret.classList.toggle('rotated');
    }
};

window.toggleListeningMenu = function (event) {
    if (event) event.preventDefault();

    const panel = document.getElementById('listening-panel');
    const caret = document.getElementById('listening-caret');

    if (panel) {
        panel.classList.toggle('hidden');
    }

    if (caret) {
        caret.classList.toggle('rotated');
    }
};

window.toggleReadingMenu = function (event) {
    if (event) event.preventDefault();

    const panel = document.getElementById('reading-panel');
    const caret = document.getElementById('reading-caret');

    if (panel) {
        panel.classList.toggle('hidden');
    }

    if (caret) {
        caret.classList.toggle('rotated');
    }
};

// ======================================
// SKILL MODE OPENING
// ======================================

window.openSkillMode = async function (skill, mode, event) {
    if (event) event.preventDefault();

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

    // Hide all tab panels
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));

    // Show the correct skill panel
    const panelId = `panel-${skill}`;
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.classList.remove('hidden');
    }

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

    console.log(`Opened ${skill} - ${mode} mode`);
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
