// js/ui/writingUI.js
// UI management for Essay Writing feature

import {
  getRandomEssayTopic, getAllTopics, evaluateEssay, saveEssay, getEssayHistory,
  generateChartData, evaluateTaskResponse, saveTaskResponse, getTaskResponseHistory
} from '../services/writingService.js';

// ======================================
// STATE
// ======================================

let currentTopic = '';
let isEvaluating = false;
let currentEvaluation = null;
let currentChart = null;
let currentMode = 'essay'; // 'essay' or 'task'

// ======================================
// INITIALIZATION
// ======================================

export function initWritingUI() {
  console.log('Writing UI initialized');
}

// ======================================
// ESSAY WRITING MODE
// ======================================

// Called by skillsUI.js when essay writing is started
window.loadEssayContent = async function () {
  currentMode = 'essay';

  // Get random topic
  currentTopic = getRandomEssayTopic();
  const topicDisplay = document.getElementById('essay-topic-display');
  if (topicDisplay) {
    topicDisplay.textContent = currentTopic;
  }

  // Clear textarea
  const essayTextarea = document.getElementById('essay-textarea');
  if (essayTextarea) {
    essayTextarea.value = '';
  }
  updateEssayWordCount();

  // Reset evaluation
  currentEvaluation = null;
  const feedbackPanel = document.getElementById('essay-feedback-panel');
  if (feedbackPanel) feedbackPanel.classList.add('hidden');

  // Load history
  loadEssayHistory();
};

// Called by skillsUI.js when task writing is started
window.loadTaskContent = async function () {
  currentMode = 'task';

  // Auto-generate a chart/task immediately if the function is available
  if (typeof window.getNewTaskTopic === 'function') {
    window.getNewTaskTopic();
  } else {
    // Fallback: just show placeholder
    const topicDisplay = document.getElementById('task-topic-display');
    if (topicDisplay) {
      topicDisplay.textContent = 'Click "New Task" to get a chart/graph description task.';
    }
  }

  // Clear textarea
  const taskTextarea = document.getElementById('task-textarea');
  if (taskTextarea) {
    taskTextarea.value = '';
  }
  updateTaskWordCount();
};

window.getNewTopic = function () {
  currentTopic = getRandomEssayTopic();
  const topicDisplay = document.getElementById('essay-topic-display');
  if (topicDisplay) {
    topicDisplay.textContent = currentTopic;
  }
};

window.updateEssayWordCount = function () {
  const textarea = document.getElementById('essay-textarea');
  const countDisplay = document.getElementById('essay-word-count');

  if (textarea && countDisplay) {
    const words = textarea.value.trim().split(/\s+/).filter(w => w.length > 0);
    const count = words.length;
    countDisplay.textContent = `${count} / 250-400 words`;

    // Color coding
    if (count < 200) {
      countDisplay.style.color = '#ef4444'; // red
    } else if (count < 250) {
      countDisplay.style.color = '#f59e0b'; // yellow
    } else if (count <= 400) {
      countDisplay.style.color = '#10b981'; // green
    } else {
      countDisplay.style.color = '#f59e0b'; // yellow (too long)
    }
  }
};

window.updateTaskWordCount = function () {
  const textarea = document.getElementById('task-textarea');
  const countDisplay = document.getElementById('task-word-count');

  if (textarea && countDisplay) {
    const words = textarea.value.trim().split(/\s+/).filter(w => w.length > 0);
    const count = words.length;
    countDisplay.textContent = `${count} / 150-200 words`;

    // Color coding
    if (count < 100) {
      countDisplay.style.color = '#ef4444'; // red
    } else if (count < 150) {
      countDisplay.style.color = '#f59e0b'; // yellow
    } else if (count <= 200) {
      countDisplay.style.color = '#10b981'; // green
    } else {
      countDisplay.style.color = '#f59e0b'; // yellow (too long)
    }
  }
};

window.submitEssayForReview = async function () {
  if (isEvaluating) return;

  const textarea = document.getElementById('essay-textarea');
  const essayContent = textarea?.value?.trim();

  if (!essayContent || essayContent.length < 100) {
    alert('Please write at least 100 characters before submitting.');
    return;
  }

  isEvaluating = true;
  const submitBtn = document.getElementById('submit-essay-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Evaluating...';
  }

  try {
    const evaluation = await evaluateEssay(currentTopic, essayContent);
    currentEvaluation = evaluation;

    // Save to database
    await saveEssay({
      topic: currentTopic,
      essayContent: essayContent,
      wordCount: evaluation.wordCount,
      bandScore: evaluation.bandScore,
      taskAchievement: evaluation.taskAchievement,
      coherenceCohesion: evaluation.coherenceCohesion,
      lexicalResource: evaluation.lexicalResource,
      grammarAccuracy: evaluation.grammarAccuracy,
      feedback: evaluation.feedback,
      grammarErrors: evaluation.grammarErrors,
      suggestions: evaluation.suggestions
    });

    // Show feedback
    displayEssayFeedback(evaluation);

    // Reload history
    loadEssayHistory();

  } catch (error) {
    console.error('Essay evaluation error:', error);
    alert('Error evaluating essay: ' + error.message);
  } finally {
    isEvaluating = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit for Review';
    }
  }
};

function displayEssayFeedback(evaluation) {
  const feedbackPanel = document.getElementById('essay-feedback-panel');
  if (!feedbackPanel) return;

  feedbackPanel.classList.remove('hidden');
  feedbackPanel.innerHTML = `
    <div class="feedback-header">
      <h3><i class="fa-solid fa-chart-line"></i> Essay Evaluation</h3>
      <div class="band-score-display">
        <span class="band-label">Band Score</span>
        <span class="band-value">${evaluation.bandScore || 'N/A'}</span>
      </div>
    </div>

    <div class="score-breakdown">
      <div class="score-item">
        <span class="score-label">Task Achievement</span>
        <span class="score-value">${evaluation.taskAchievement || '-'}</span>
      </div>
      <div class="score-item">
        <span class="score-label">Coherence & Cohesion</span>
        <span class="score-value">${evaluation.coherenceCohesion || '-'}</span>
      </div>
      <div class="score-item">
        <span class="score-label">Lexical Resource</span>
        <span class="score-value">${evaluation.lexicalResource || '-'}</span>
      </div>
      <div class="score-item">
        <span class="score-label">Grammar Accuracy</span>
        <span class="score-value">${evaluation.grammarAccuracy || '-'}</span>
      </div>
    </div>

    <div class="feedback-section">
      <h4><i class="fa-solid fa-comment"></i> Overall Feedback</h4>
      <p>${evaluation.feedback || 'No feedback available.'}</p>
    </div>

    ${evaluation.strengths?.length ? `
    <div class="feedback-section strengths">
      <h4><i class="fa-solid fa-check-circle"></i> Strengths</h4>
      <ul>${evaluation.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
    </div>
    ` : ''}

    ${evaluation.weaknesses?.length ? `
    <div class="feedback-section weaknesses">
      <h4><i class="fa-solid fa-exclamation-circle"></i> Areas to Improve</h4>
      <ul>${evaluation.weaknesses.map(w => `<li>${w}</li>`).join('')}</ul>
    </div>
    ` : ''}

    ${evaluation.grammarErrors?.length ? `
    <div class="feedback-section grammar-errors">
      <h4><i class="fa-solid fa-spell-check"></i> Grammar Corrections</h4>
      <div class="error-list">
        ${evaluation.grammarErrors.map(e => `
          <div class="error-item">
            <div class="error-original"><i class="fa-solid fa-times"></i> ${e.original}</div>
            <div class="error-corrected"><i class="fa-solid fa-check"></i> ${e.corrected}</div>
            ${e.explanation ? `<div class="error-explanation">${e.explanation}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    ${evaluation.suggestions?.length ? `
    <div class="feedback-section suggestions">
      <h4><i class="fa-solid fa-lightbulb"></i> Suggestions</h4>
      <ul>${evaluation.suggestions.map(s => `<li>${s}</li>`).join('')}</ul>
    </div>
    ` : ''}

    <div class="feedback-actions">
      <button class="outline-btn" onclick="startNewEssay()">
        <i class="fa-solid fa-plus"></i> Write New Essay
      </button>
    </div>
  `;
}

window.startNewEssay = function () {
  currentEvaluation = null;
  currentTopic = getRandomEssayTopic();

  const topicDisplay = document.getElementById('essay-topic-display');
  if (topicDisplay) topicDisplay.textContent = currentTopic;

  const textarea = document.getElementById('essay-textarea');
  if (textarea) {
    textarea.value = '';
    updateWordCount();
  }

  const feedbackPanel = document.getElementById('essay-feedback-panel');
  if (feedbackPanel) feedbackPanel.classList.add('hidden');
};

// backToWritingSelection is handled by skillsUI.js

// ======================================
// ESSAY HISTORY
// ======================================

async function loadEssayHistory() {
  const historyList = document.getElementById('essay-history-list');
  if (!historyList) return;

  const { data: essays } = await getEssayHistory(5);

  if (!essays || essays.length === 0) {
    historyList.innerHTML = '<p class="no-history">No previous essays</p>';
    return;
  }

  historyList.innerHTML = essays.map(essay => `
    <div class="history-item" onclick="viewEssay('${essay.id}')">
      <span class="history-score">${essay.band_score || '-'}</span>
      <span class="history-words">${essay.word_count} words</span>
      <span class="history-date">${formatDate(essay.created_at)}</span>
    </div>
  `).join('');
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWritingUI);
} else {
  initWritingUI();
}
