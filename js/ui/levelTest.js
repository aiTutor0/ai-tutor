// Level Test - Multiple Choice Quiz System
const LEVEL_TEST_KEY = 'aitutor_level_results';

const levelQuestions = [
  // A1 Level (2 questions)
  {
    level: 'A1',
    question: 'What ___ your name?',
    options: ['is', 'are', 'am', 'be'],
    correct: 0
  },
  {
    level: 'A1',
    question: 'She ___ a teacher.',
    options: ['am', 'is', 'are', 'be'],
    correct: 1
  },
  // A2 Level (2 questions)
  {
    level: 'A2',
    question: 'I ___ to the cinema yesterday.',
    options: ['go', 'goes', 'went', 'going'],
    correct: 2
  },
  {
    level: 'A2',
    question: 'There aren\'t ___ apples in the fridge.',
    options: ['some', 'any', 'a', 'the'],
    correct: 1
  },
  // B1 Level (2 questions)
  {
    level: 'B1',
    question: 'If I ___ more money, I would travel the world.',
    options: ['have', 'had', 'has', 'having'],
    correct: 1
  },
  {
    level: 'B1',
    question: 'She asked me where I ___.',
    options: ['live', 'lived', 'living', 'lives'],
    correct: 1
  },
  // B2 Level (2 questions)
  {
    level: 'B2',
    question: 'By this time next year, I ___ my degree.',
    options: ['will finish', 'will have finished', 'am finishing', 'finish'],
    correct: 1
  },
  {
    level: 'B2',
    question: 'The report ___ by the time you arrive.',
    options: ['will complete', 'will be completed', 'will have been completed', 'is completed'],
    correct: 2
  },
  // C1 Level (2 questions)
  {
    level: 'C1',
    question: 'Had I known about the delay, I ___ earlier.',
    options: ['would leave', 'would have left', 'will leave', 'had left'],
    correct: 1
  },
  {
    level: 'C1',
    question: 'The phenomenon, ___ scientists have long debated, remains unexplained.',
    options: ['which', 'that', 'what', 'whom'],
    correct: 0
  }
];

let currentQuizState = {
  currentQuestion: 0,
  answers: [],
  inProgress: false
};

// Get saved results
function getLevelResults() {
  const json = localStorage.getItem(LEVEL_TEST_KEY);
  return json ? JSON.parse(json) : [];
}

// Save result
function saveLevelResult(result) {
  const results = getLevelResults();
  results.unshift(result);
  // Keep only last 10 results
  if (results.length > 10) results.pop();
  localStorage.setItem(LEVEL_TEST_KEY, JSON.stringify(results));
}

// Delete result
window.deleteLevelResult = function (id) {
  if (!confirm('Delete this result?')) return;
  let results = getLevelResults();
  results = results.filter(r => r.id !== id);
  localStorage.setItem(LEVEL_TEST_KEY, JSON.stringify(results));
  renderPreviousResults();
};

// Calculate level based on correct answers
function calculateLevel(correctAnswers) {
  const score = correctAnswers.length;
  const percentage = (score / 10) * 100;

  if (percentage <= 20) return { level: 'A1', description: 'Beginner' };
  if (percentage <= 40) return { level: 'A2', description: 'Elementary' };
  if (percentage <= 60) return { level: 'B1', description: 'Intermediate' };
  if (percentage <= 80) return { level: 'B2', description: 'Upper Intermediate' };
  return { level: 'C1', description: 'Advanced' };
}

// Render previous results
function renderPreviousResults() {
  const container = document.getElementById('previous-results');
  if (!container) return;

  const results = getLevelResults();

  if (results.length === 0) {
    container.innerHTML = '<p class="muted" style="text-align:center; margin-top:20px;">No previous test results</p>';
    return;
  }

  container.innerHTML = `
    <h4 style="margin-top:20px; margin-bottom:10px;">Previous Results</h4>
    ${results.map(r => `
      <div class="level-result-item" style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--color-bg-tertiary); border-radius:8px; margin-bottom:8px;">
        <div>
          <strong style="color:var(--color-accent);">${r.level}</strong> - ${r.score}/10 correct
          <span class="muted" style="font-size:0.8rem; margin-left:10px;">${new Date(r.date).toLocaleDateString()}</span>
        </div>
        <button class="ghost-btn" style="padding:6px 10px; font-size:0.8rem;" onclick="deleteLevelResult(${r.id})">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `).join('')}
  `;
}

// Start test
window.startLevelTest = function () {
  // Teachers cannot take tests
  if (window.isTeacher) {
    alert('Teachers can only view student results, not take tests.');
    return;
  }

  currentQuizState = {
    currentQuestion: 0,
    answers: [],
    inProgress: true
  };

  document.getElementById('level-start-screen')?.classList.add('hidden');
  document.getElementById('level-quiz-screen')?.classList.remove('hidden');
  document.getElementById('level-result-screen')?.classList.add('hidden');

  renderQuestion();
};

// Render teacher view - shows all student results
function renderTeacherLevelView() {
  const container = document.getElementById('level-test-area');
  if (!container) return;

  const results = getLevelResults();

  container.innerHTML = `
    <div style="background:var(--color-card-bg); border:1px solid var(--color-border); border-radius:16px; padding:24px;">
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:20px;">
        <i class="fa-solid fa-chart-bar" style="font-size:2rem; color:var(--color-accent);"></i>
        <div>
          <h3 style="margin:0;">Student Level Results</h3>
          <p class="muted" style="margin:0; font-size:0.9rem;">View all student test results</p>
        </div>
      </div>
      
      ${results.length === 0 ? `
        <div style="text-align:center; padding:40px; color:var(--color-text-muted);">
          <i class="fa-solid fa-inbox" style="font-size:3rem; margin-bottom:12px;"></i>
          <p>No student results yet</p>
        </div>
      ` : `
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${results.map(r => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:16px; background:var(--color-bg-tertiary); border:1px solid var(--color-border); border-radius:12px;">
              <div style="display:flex; align-items:center; gap:12px;">
                <div style="width:50px; height:50px; border-radius:50%; background:var(--color-accent); color:white; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1.2rem;">
                  ${r.level}
                </div>
                <div>
                  <div style="font-weight:600;">${r.description}</div>
                  <div style="font-size:0.85rem; color:var(--color-text-muted);">
                    Score: ${r.score}/10 • ${new Date(r.date).toLocaleDateString()} ${new Date(r.date).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <div style="text-align:right;">
                <span style="padding:6px 12px; background:${r.score >= 8 ? 'rgba(34,197,94,0.2)' : r.score >= 5 ? 'rgba(234,179,8,0.2)' : 'rgba(239,68,68,0.2)'}; color:${r.score >= 8 ? '#22c55e' : r.score >= 5 ? '#eab308' : '#ef4444'}; border-radius:20px; font-size:0.85rem; font-weight:600;">
                  ${r.score >= 8 ? '✓ Excellent' : r.score >= 5 ? '◐ Average' : '✗ Needs Work'}
                </span>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

// Render current question
function renderQuestion() {
  const q = levelQuestions[currentQuizState.currentQuestion];
  const area = document.getElementById('quiz-question-area');
  const progressText = document.getElementById('quiz-progress-text');
  const progressFill = document.getElementById('quiz-progress-fill');

  if (progressText) progressText.textContent = `Question ${currentQuizState.currentQuestion + 1} of 10`;
  if (progressFill) progressFill.style.width = `${((currentQuizState.currentQuestion + 1) / 10) * 100}%`;

  if (!area) return;

  area.innerHTML = `
    <div class="quiz-question-card" style="background:var(--color-card-bg); border:1px solid var(--color-border); border-radius:16px; padding:24px; margin-top:20px;">
      <div class="question-level-badge" style="display:inline-block; padding:4px 10px; background:var(--color-accent-light); color:var(--color-accent-text); border-radius:20px; font-size:0.8rem; font-weight:bold; margin-bottom:12px;">
        ${q.level} Level
      </div>
      <h3 style="margin-bottom:20px; font-size:1.3rem;">${q.question}</h3>
      <div class="quiz-options" style="display:flex; flex-direction:column; gap:10px;">
        ${q.options.map((opt, idx) => `
          <button class="quiz-option-btn" onclick="selectAnswer(${idx})" style="
            width:100%; 
            padding:14px 18px; 
            background:var(--color-bg-secondary); 
            border:2px solid var(--color-border); 
            border-radius:12px; 
            text-align:left; 
            font-size:1rem; 
            font-weight:600;
            color:var(--color-text-primary);
            cursor:pointer;
            transition:all 0.2s;
          " 
          onmouseover="this.style.borderColor='var(--color-accent)'; this.style.background='var(--color-accent-light)';"
          onmouseout="this.style.borderColor='var(--color-border)'; this.style.background='var(--color-bg-secondary)';">
            <span style="display:inline-block; width:28px; height:28px; background:var(--color-bg-tertiary); border-radius:50%; text-align:center; line-height:28px; margin-right:12px; font-weight:bold; color:var(--color-text-primary);">
              ${String.fromCharCode(65 + idx)}
            </span>
            ${opt}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

// Select answer
window.selectAnswer = function (answerIndex) {
  const q = levelQuestions[currentQuizState.currentQuestion];
  const isCorrect = answerIndex === q.correct;

  currentQuizState.answers.push({
    question: currentQuizState.currentQuestion,
    answer: answerIndex,
    correct: isCorrect,
    level: q.level
  });

  currentQuizState.currentQuestion++;

  if (currentQuizState.currentQuestion >= 10) {
    showResults();
  } else {
    renderQuestion();
  }
};

// Show results
function showResults() {
  document.getElementById('level-quiz-screen')?.classList.add('hidden');
  document.getElementById('level-result-screen')?.classList.remove('hidden');

  const correctAnswers = currentQuizState.answers.filter(a => a.correct);
  const score = correctAnswers.length;
  const result = calculateLevel(correctAnswers);

  // Save result
  const resultData = {
    id: Date.now(),
    level: result.level,
    description: result.description,
    score: score,
    date: new Date().toISOString(),
    answers: currentQuizState.answers
  };
  saveLevelResult(resultData);

  // Notify teacher (simulated)
  console.log('📊 Teacher Notification - Level Test Result:', resultData);

  const resultScreen = document.getElementById('level-result-screen');
  if (resultScreen) {
    resultScreen.innerHTML = `
      <div class="level-result-card" style="text-align:center; background:var(--color-card-bg); border:1px solid var(--color-border); border-radius:20px; padding:40px; margin-top:20px;">
        <div style="width:100px; height:100px; background:var(--color-accent); color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:2.5rem; font-weight:bold; margin:0 auto 20px;">
          ${result.level}
        </div>
        <h2 style="margin-bottom:8px;">Your Level: ${result.level}</h2>
        <p style="color:var(--color-text-muted); margin-bottom:20px; font-size:1.1rem;">${result.description}</p>
        
        <div style="background:var(--color-bg-tertiary); border-radius:12px; padding:16px; margin-bottom:24px;">
          <span style="font-size:2rem; font-weight:bold; color:var(--color-accent);">${score}</span>
          <span style="color:var(--color-text-muted);">/10 correct answers</span>
        </div>

        <p style="color:var(--color-text-muted); font-size:0.9rem; margin-bottom:20px;">
          <i class="fa-solid fa-bell"></i> Your teacher has been notified of your result.
        </p>

        <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
          <button class="primary-btn" onclick="retakeLevelTest()">
            <i class="fa-solid fa-rotate"></i> Take Again
          </button>
          <button class="ghost-btn" onclick="goToLevelStart()">
            <i class="fa-solid fa-arrow-left"></i> Back
          </button>
        </div>
      </div>
    `;
  }
}

// Retake test
window.retakeLevelTest = function () {
  startLevelTest();
};

// Go back to start
window.goToLevelStart = function () {
  document.getElementById('level-start-screen')?.classList.remove('hidden');
  document.getElementById('level-quiz-screen')?.classList.add('hidden');
  document.getElementById('level-result-screen')?.classList.add('hidden');
  renderPreviousResults();
};

// Initialize on load
function initLevelTest() {
  // Check if teacher and render teacher view
  if (window.isTeacher) {
    renderTeacherLevelView();
  } else {
    renderPreviousResults();
  }
}

// Make teacher view accessible globally
window.renderTeacherLevelView = renderTeacherLevelView;

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLevelTest);
} else {
  initLevelTest();
}
