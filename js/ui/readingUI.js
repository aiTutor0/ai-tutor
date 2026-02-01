// js/ui/readingUI.js
// UI management for Academic Reading feature

import { generateReadingPassage, checkAnswers, saveReadingSession, getReadingHistory } from '../services/readingService.js';

// ======================================
// STATE
// ======================================

let currentPassage = null;
let currentQuestions = [];
let userAnswers = {};
let timerInterval = null;
let timeRemaining = 1200; // 20 minutes in seconds
let isLoading = false;
let sessionStartTime = null;

// ======================================
// INITIALIZATION
// ======================================

export function initReadingUI() {
  console.log('Reading UI initialized');
}

// ======================================
// ACADEMIC READING MODE
// ======================================

// Called by skillsUI.js when academic or speed reading is started
window.loadReadingContent = async function (mode = 'academic') {
  if (isLoading) return;

  // Reset state
  resetReadingSession(mode);

  // Show loading
  showReadingLoading(mode, true);

  try {
    if (mode === 'academic') {
      // Generate passage
      const data = await generateReadingPassage();
      currentPassage = data;
      currentQuestions = data.questions || [];

      // Display passage
      displayPassage(data, mode);

      // Display questions
      displayQuestions(data.questions, mode);

      // Start timer
      startTimer(mode);

      // Record start time
      sessionStartTime = Date.now();

      // Load history
      loadReadingHistory(mode);
    } else {
      // Speed reading mode - simpler content
      const data = await generateReadingPassage('speed');
      currentPassage = data;
      currentQuestions = data.questions || [];

      displaySpeedPassage(data);
      sessionStartTime = Date.now();
    }
  } catch (error) {
    console.error('Failed to generate passage:', error);
    alert('Failed to load reading passage. Please try again.');
  } finally {
    showReadingLoading(mode, false);
  }
};

function displaySpeedPassage(data) {
  const passageContainer = document.getElementById('speed-passage-container');
  if (passageContainer) {
    passageContainer.innerHTML = `
            <h3>${data.title || 'Speed Reading Passage'}</h3>
            <div class="passage-text">
                ${data.passage.split('\n').map(p => `<p>${p}</p>`).join('')}
            </div>
        `;
  }

  // Store word count for WPM calculation
  window.currentWordCount = data.wordCount || 150;
}

function resetReadingSession(mode = 'academic') {
  currentPassage = null;
  currentQuestions = [];
  userAnswers = {};
  timeRemaining = 1200;
  sessionStartTime = null;

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // Clear UI based on mode
  const prefix = mode === 'academic' ? 'academic-reading' : 'speed-reading';
  const passageContainer = document.getElementById(mode === 'speed' ? 'speed-passage-container' : 'academic-passage-container');
  const questionsContainer = document.getElementById(mode === 'speed' ? 'speed-questions-container' : 'academic-questions-container');
  const resultsPanel = document.getElementById(`${prefix}-results`);

  if (passageContainer) passageContainer.innerHTML = '';
  if (questionsContainer) questionsContainer.innerHTML = '';
  if (resultsPanel) resultsPanel.classList.add('hidden');
}

function showReadingLoading(mode, show) {
  isLoading = show;
  const prefix = mode === 'academic' ? 'academic-reading' : 'speed-reading';
  const loadingEl = document.getElementById(`${prefix}-loading`);
  const contentEl = document.getElementById(`${prefix}-content`);

  if (loadingEl) loadingEl.classList.toggle('hidden', !show);
  if (contentEl) contentEl.classList.toggle('hidden', show);
}

// ======================================
// DISPLAY FUNCTIONS
// ======================================

function displayPassage(data, mode = 'academic') {
  const containerId = mode === 'academic' ? 'academic-passage-container' : 'speed-passage-container';
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="passage-header">
      <h3>${data.title || 'Reading Passage'}</h3>
      <span class="passage-word-count">${data.wordCount || '~500'} words</span>
    </div>
    <div class="passage-text">
      ${data.passage.split('\n').map(p => `<p>${p}</p>`).join('')}
    </div>
  `;
}

function displayQuestions(questions) {
  const container = document.getElementById('academic-questions-container');
  if (!container) return;

  container.innerHTML = questions.map((q, index) => {
    let inputHtml = '';

    if (q.type === 'true_false_ng') {
      inputHtml = `
        <div class="tfng-options">
          <label class="tfng-option">
            <input type="radio" name="q${index}" value="True" onchange="updateAnswer(${index}, 'True')">
            <span>True</span>
          </label>
          <label class="tfng-option">
            <input type="radio" name="q${index}" value="False" onchange="updateAnswer(${index}, 'False')">
            <span>False</span>
          </label>
          <label class="tfng-option">
            <input type="radio" name="q${index}" value="Not Given" onchange="updateAnswer(${index}, 'Not Given')">
            <span>Not Given</span>
          </label>
        </div>
      `;
    } else if (q.type === 'multiple_choice') {
      inputHtml = `
        <div class="mc-options">
          ${q.options.map(opt => `
            <label class="mc-option">
              <input type="radio" name="q${index}" value="${opt.charAt(0)}" onchange="updateAnswer(${index}, '${opt.charAt(0)}')">
              <span>${opt}</span>
            </label>
          `).join('')}
        </div>
      `;
    } else {
      inputHtml = `
        <input type="text" class="fill-blank-input" 
          placeholder="Type your answer..." 
          oninput="updateAnswer(${index}, this.value)">
      `;
    }

    return `
      <div class="question-item" id="question-${index}">
        <div class="question-number">Question ${index + 1}</div>
        <div class="question-type">${formatQuestionType(q.type)}</div>
        <div class="question-text">${q.question}</div>
        ${inputHtml}
      </div>
    `;
  }).join('');
}

function formatQuestionType(type) {
  const types = {
    'true_false_ng': 'True / False / Not Given',
    'multiple_choice': 'Multiple Choice',
    'fill_blank': 'Fill in the Blank'
  };
  return types[type] || type;
}

// ======================================
// SPEED READING TIMER
// ======================================

let speedTimerInterval = null;
let speedStartTime = null;
let speedTimeElapsed = 0;

window.startSpeedTimer = function () {
  speedStartTime = Date.now();
  speedTimeElapsed = 0;

  // Hide start button, show done button
  const startBtn = document.getElementById('start-speed-btn');
  const doneBtn = document.getElementById('done-speed-btn');
  if (startBtn) startBtn.classList.add('hidden');
  if (doneBtn) doneBtn.classList.remove('hidden');

  // Start timer display
  speedTimerInterval = setInterval(() => {
    speedTimeElapsed = Math.floor((Date.now() - speedStartTime) / 1000);
    updateSpeedTimerDisplay();
  }, 1000);

  console.log('Speed reading started');
};

window.stopSpeedTimer = function () {
  if (speedTimerInterval) {
    clearInterval(speedTimerInterval);
    speedTimerInterval = null;
  }

  // Calculate WPM
  const wordCount = window.currentWordCount || 150;
  const minutes = speedTimeElapsed / 60;
  const wpm = Math.round(wordCount / minutes);

  // Display WPM
  const wpmEl = document.getElementById('speed-reading-wpm');
  if (wpmEl) wpmEl.textContent = `${wpm} WPM`;

  // Hide passage, show questions
  const passageSection = document.querySelector('.speed-passage');
  const questionsSection = document.getElementById('speed-questions-section');

  if (passageSection) passageSection.style.opacity = '0.5';
  if (questionsSection) questionsSection.classList.remove('hidden');

  // Display speed reading questions
  displaySpeedQuestions();

  console.log(`Speed reading finished: ${wpm} WPM`);
};

function updateSpeedTimerDisplay() {
  const timerEl = document.getElementById('speed-reading-timer');
  if (!timerEl) return;

  const minutes = Math.floor(speedTimeElapsed / 60);
  const seconds = speedTimeElapsed % 60;
  timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function displaySpeedQuestions() {
  const container = document.getElementById('speed-questions-container');
  if (!container || !currentQuestions || currentQuestions.length === 0) return;

  container.innerHTML = '';
  currentQuestions.forEach((q, index) => {
    const qDiv = document.createElement('div');
    qDiv.className = 'question-item';

    let inputHTML = '';
    if (q.type === 'multiple_choice') {
      inputHTML = `
        <div class="question-options">
          ${q.options.map(opt => `
            <label class="option-label">
              <input type="radio" name="speedq${index}" value="${opt.charAt(0)}" onchange="updateAnswer(${index}, this.value)">
              <span>${opt}</span>
            </label>
          `).join('')}
        </div>
      `;
    } else if (q.type === 'fill_blank') {
      inputHTML = `<input type="text" class="fill-blank-input" placeholder="Your answer..." onchange="updateAnswer(${index}, this.value)">`;
    } else if (q.type === 'true_false') {
      inputHTML = `
        <div class="question-options">
          <label class="option-label"><input type="radio" name="speedq${index}" value="True" onchange="updateAnswer(${index}, this.value)"> <span>True</span></label>
          <label class="option-label"><input type="radio" name="speedq${index}" value="False" onchange="updateAnswer(${index}, this.value)"> <span>False</span></label>
        </div>
      `;
    }

    qDiv.innerHTML = `
      <div class="question-header">
        <span class="question-number">Question ${index + 1}</span>
        <span class="question-type">${formatQuestionType(q.type)}</span>
      </div>
      <p class="question-text">${q.question}</p>
      ${inputHTML}
    `;
    container.appendChild(qDiv);
  });
}

window.submitSpeedReadingAnswers = async function () {
  if (!currentQuestions || currentQuestions.length === 0) {
    alert('No questions to submit');
    return;
  }

  const answersArray = currentQuestions.map((_, i) => userAnswers[i] || '');
  const results = checkAnswers(currentQuestions, answersArray);

  // Calculate WPM
  const wordCount = window.currentWordCount || 150;
  const minutes = speedTimeElapsed / 60;
  const wpm = Math.round(wordCount / minutes);

  // Display results with time info
  displaySpeedResults(results, wpm, speedTimeElapsed);

  // Save session
  try {
    await saveReadingSession({
      mode: 'speed',
      passageTitle: currentPassage?.title || 'Speed Reading',
      passageContent: currentPassage?.passage || '',
      wordCount: wordCount,
      questions: currentQuestions,
      userAnswers: answersArray,
      correctCount: results.correctCount,
      totalQuestions: results.totalQuestions,
      scorePercentage: results.scorePercentage,
      timeTaken: speedTimeElapsed,
      timeLimit: 0,
      wpm: wpm
    });
    loadReadingHistory('speed');
  } catch (error) {
    console.error('Failed to save speed reading session:', error);
  }
};

function displaySpeedResults(results, wpm, timeTaken) {
  const resultsPanel = document.getElementById('speed-reading-results');
  if (!resultsPanel) return;

  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;

  resultsPanel.classList.remove('hidden');
  resultsPanel.innerHTML = `
    <div class="results-header">
      <h3><i class="fa-solid fa-chart-pie"></i> Speed Reading Results</h3>
      <div class="speed-stats-display">
        <div class="stat-item">
          <span class="stat-value">${wpm}</span>
          <span class="stat-label">WPM</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${minutes}:${seconds.toString().padStart(2, '0')}</span>
          <span class="stat-label">Time</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${results.scorePercentage}%</span>
          <span class="stat-label">Score</span>
        </div>
      </div>
    </div>
    
    <div class="results-breakdown">
      ${results.results.map((r, i) => `
        <div class="result-item ${r.isCorrect ? 'correct' : 'incorrect'}">
          <div class="result-icon">
            <i class="fa-solid ${r.isCorrect ? 'fa-check' : 'fa-times'}"></i>
          </div>
          <div class="result-content">
            <span class="result-question">Q${i + 1}: ${currentQuestions[i].question}</span>
            <span class="result-answer">
              Your answer: <strong>${r.userAnswer || '(no answer)'}</strong>
              ${!r.isCorrect ? `<br>Correct: <strong class="correct-answer">${r.correctAnswer}</strong>` : ''}
            </span>
          </div>
        </div>
      `).join('')}
    </div>
    
    <div class="results-actions">
      <button class="outline-btn" onclick="startSpeedReading()">
        <i class="fa-solid fa-redo"></i> Try Again
      </button>
      <button class="ghost-btn" onclick="backToReadingSelection()">
        <i class="fa-solid fa-arrow-left"></i> Back
      </button>
    </div>
  `;
}

// ======================================
// TIMER
// ======================================

function startTimer() {
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay();

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      submitReadingAnswers();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const timerEl = document.getElementById('academic-reading-timer');
  if (!timerEl) return;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Warning colors
  if (timeRemaining <= 60) {
    timerEl.classList.add('danger');
  } else if (timeRemaining <= 300) {
    timerEl.classList.add('warning');
    timerEl.classList.remove('danger');
  }
}

// ======================================
// ANSWER HANDLING
// ======================================

window.updateAnswer = function (index, value) {
  userAnswers[index] = value;
};

window.submitReadingAnswers = async function () {
  await doSubmitReadingAnswers();
};

// Alias for HTML compatibility
window.submitAcademicReadingAnswers = async function () {
  await doSubmitReadingAnswers();
};

async function doSubmitReadingAnswers() {
  if (!currentPassage || currentQuestions.length === 0) return;

  // Stop timer
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // Calculate time taken
  const timeTaken = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 0;

  // Check answers
  const answersArray = currentQuestions.map((_, i) => userAnswers[i] || '');
  const results = checkAnswers(currentQuestions, answersArray);

  // Display results with time information
  displayResults(results, timeTaken);

  // Save to database
  try {
    await saveReadingSession({
      mode: 'academic',
      passageTitle: currentPassage.title,
      passageContent: currentPassage.passage,
      wordCount: currentPassage.wordCount,
      questions: currentQuestions,
      userAnswers: answersArray,
      correctCount: results.correctCount,
      totalQuestions: results.totalQuestions,
      scorePercentage: results.scorePercentage,
      timeTaken: timeTaken,
      timeLimit: 1200
    });

    loadReadingHistory();
  } catch (error) {
    console.error('Failed to save reading session:', error);
  }
};

function displayResults(results, timeTaken = 0) {
  const resultsPanel = document.getElementById('academic-reading-results');
  if (!resultsPanel) return;

  // Format time taken
  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  resultsPanel.classList.remove('hidden');
  resultsPanel.innerHTML = `
    <div class="results-header">
      <h3><i class="fa-solid fa-chart-pie"></i> Results</h3>
      <div class="score-circle">
        <span class="score-value">${results.scorePercentage}%</span>
        <span class="score-label">${results.correctCount}/${results.totalQuestions}</span>
      </div>
    </div>

    <div class="results-time-info">
      <i class="fa-solid fa-clock"></i> Time taken: <strong>${timeString}</strong>
    </div>

    <div class="results-breakdown">
      ${results.results.map((r, i) => `
        <div class="result-item ${r.isCorrect ? 'correct' : 'incorrect'}">
          <div class="result-icon">
            <i class="fa-solid ${r.isCorrect ? 'fa-check' : 'fa-times'}"></i>
          </div>
          <div class="result-content">
            <span class="result-question">Q${i + 1}: ${currentQuestions[i].question.substring(0, 50)}...</span>
            <span class="result-answer">
              Your answer: <strong>${r.userAnswer || '(no answer)'}</strong>
              ${!r.isCorrect ? `<br>Correct: <strong class="correct-answer">${r.correctAnswer}</strong>` : ''}
            </span>
            ${r.explanation ? `<span class="result-explanation">${r.explanation}</span>` : ''}
          </div>
        </div>
      `).join('')}
    </div>

    <div class="results-actions">
      <button class="outline-btn" onclick="startAcademicReading()">
        <i class="fa-solid fa-redo"></i> New Passage
      </button>
      <button class="ghost-btn" onclick="backToReadingSelection()">
        <i class="fa-solid fa-arrow-left"></i> Back
      </button>
    </div>
  `;

  // Highlight questions with answers
  results.results.forEach((r, i) => {
    const questionEl = document.getElementById(`question-${i}`);
    if (questionEl) {
      questionEl.classList.add(r.isCorrect ? 'answered-correct' : 'answered-incorrect');
    }
  });
}

// ======================================
// NAVIGATION
// ======================================

// backToReadingSelection is handled by skillsUI.js

// ======================================
// HISTORY
// ======================================

async function loadReadingHistory() {
  const historyList = document.getElementById('academic-reading-history');
  if (!historyList) return;

  const { data: sessions } = await getReadingHistory(5);

  if (!sessions || sessions.length === 0) {
    historyList.innerHTML = '<p class="no-history">No previous sessions</p>';
    return;
  }

  historyList.innerHTML = sessions.map(s => `
    <div class="history-item">
      <span class="history-score">${s.score_percentage || 0}%</span>
      <span class="history-info">${s.correct_answers}/${s.total_questions}</span>
      <span class="history-date">${formatDate(s.created_at)}</span>
    </div>
  `).join('');
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReadingUI);
} else {
  initReadingUI();
}
