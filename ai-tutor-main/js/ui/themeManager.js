// js/ui/themeManager.js

/**
 * Theme Manager - Handles dark mode toggle functionality
 */

const THEME_KEY = 'aiTutor_theme';

export function initTheme() {
  // Check for saved theme preference or default to 'light'
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(savedTheme);

  // Set up theme toggle button (workspace view)
  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleTheme);
  }

  // Set up theme toggle button (landing page)
  const toggleBtnLanding = document.getElementById('theme-toggle-landing');
  if (toggleBtnLanding) {
    toggleBtnLanding.addEventListener('click', toggleTheme);
  }

  // Set up theme toggle button (auth page)
  const toggleBtnAuth = document.getElementById('theme-toggle-auth');
  if (toggleBtnAuth) {
    toggleBtnAuth.addEventListener('click', toggleTheme);
  }

  // Set up theme toggle button (admin panel)
  const toggleBtnAdmin = document.getElementById('theme-toggle-admin');
  if (toggleBtnAdmin) {
    toggleBtnAdmin.addEventListener('click', toggleTheme);
  }
}

function toggleTheme() {
  const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  localStorage.setItem(THEME_KEY, newTheme);
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}
