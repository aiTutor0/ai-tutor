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

window.startAcademicReading = async function (event) {
    if (event) event.preventDefault();
    if (isLoading) return;

    // Show session screen
    const modeSelection = document.getElementById('reading-mode-selection');
    const sessionScreen = document.getElementById('reading-session-screen');

    if (modeSelection) modeSelection.classList.add('hidden');
    if (sessionScreen) sessionScreen.classList.remove('hidden');

    // Reset state
    resetReadingSession();

    // Show loading
    showReadingLoading(true);

    try {
        // Generate passage
        const data = await generateReadingPassage();
        currentPassage = data;
        currentQuestions = data.questions || [];

        // Display passage
        displayPassage(data);

        // Display questions
        displayQuestions(data.questions);

        // Start timer
        startTimer();

        // Record start time
        sessionStartTime = Date.now();

        // Load history
        loadReadingHistory();

    } catch (error) {
        console.error('Failed to generate passage:', error);
        alert('Failed to load reading passage. Please try again.');
        backToReadingSelection();
    } finally {
        showReadingLoading(false);
    }
};

function resetReadingSession() {
    currentPassage = null;
    currentQuestions = [];
    userAnswers = {};
    timeRemaining = 1200;
    sessionStartTime = null;

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    // Clear UI
    const passageContainer = document.getElementById('passage-container');
    const questionsContainer = document.getElementById('questions-container');
    const resultsPanel = document.getElementById('reading-results-panel');

    if (passageContainer) passageContainer.innerHTML = '';
    if (questionsContainer) questionsContainer.innerHTML = '';
    if (resultsPanel) resultsPanel.classList.add('hidden');
}

function showReadingLoading(show) {
    isLoading = show;
    const loadingEl = document.getElementById('reading-loading');
    const contentEl = document.getElementById('reading-content');

    if (loadingEl) loadingEl.classList.toggle('hidden', !show);
    if (contentEl) contentEl.classList.toggle('hidden', show);
}

// ======================================
// DISPLAY FUNCTIONS
// ======================================

function displayPassage(data) {
    const container = document.getElementById('passage-container');
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
    const container = document.getElementById('questions-container');
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
    const timerEl = document.getElementById('reading-timer');
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

    // Display results
    displayResults(results);

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

function displayResults(results) {
    const resultsPanel = document.getElementById('reading-results-panel');
    if (!resultsPanel) return;

    resultsPanel.classList.remove('hidden');
    resultsPanel.innerHTML = `
    <div class="results-header">
      <h3><i class="fa-solid fa-chart-pie"></i> Results</h3>
      <div class="score-circle">
        <span class="score-value">${results.scorePercentage}%</span>
        <span class="score-label">${results.correctCount}/${results.totalQuestions}</span>
      </div>
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

window.backToReadingSelection = function () {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    const modeSelection = document.getElementById('reading-mode-selection');
    const sessionScreen = document.getElementById('reading-session-screen');

    if (modeSelection) modeSelection.classList.remove('hidden');
    if (sessionScreen) sessionScreen.classList.add('hidden');
};

// ======================================
// HISTORY
// ======================================

async function loadReadingHistory() {
    const historyList = document.getElementById('reading-history-list');
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
