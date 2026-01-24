// Level Test - Multiple Choice Quiz System
const LEVEL_TEST_KEY_PREFIX = 'aitutor_level_results_';

// Get user-specific storage key
function getLevelTestKey() {
  const currentUserStr = localStorage.getItem('aitutor_current_user');
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const email = currentUser?.email || 'anonymous';
  return LEVEL_TEST_KEY_PREFIX + email.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

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

// IELTS Practice Questions (Reading + Vocabulary focused)
const ieltsQuestions = [
  {
    section: 'Vocabulary',
    question: 'The scientist\'s hypothesis was ___ by the experimental results.',
    options: ['corroborated', 'deprecated', 'exacerbated', 'ameliorated'],
    correct: 0
  },
  {
    section: 'Vocabulary',
    question: 'The government implemented ___ measures to control inflation.',
    options: ['stringent', 'lenient', 'ambiguous', 'superficial'],
    correct: 0
  },
  {
    section: 'Reading',
    question: 'In academic writing, "furthermore" is used to:',
    options: ['add supporting information', 'show contrast', 'give examples', 'conclude an argument'],
    correct: 0
  },
  {
    section: 'Reading',
    question: 'Which word best replaces "ubiquitous" in: "Smartphones have become ubiquitous in modern society."',
    options: ['rare', 'expensive', 'everywhere', 'dangerous'],
    correct: 2
  },
  {
    section: 'Grammar',
    question: 'The data ___ collected over a period of five years.',
    options: ['was', 'were', 'has', 'have'],
    correct: 1
  },
  {
    section: 'Grammar',
    question: 'Neither the students nor the teacher ___ aware of the change.',
    options: ['was', 'were', 'are', 'been'],
    correct: 0
  },
  {
    section: 'Vocabulary',
    question: 'A "paradigm shift" refers to:',
    options: ['a minor adjustment', 'a fundamental change in approach', 'a temporary solution', 'a gradual decline'],
    correct: 1
  },
  {
    section: 'Reading',
    question: '"The findings are consistent with previous research" means:',
    options: ['The findings contradict earlier studies', 'The findings support earlier studies', 'The findings are inconclusive', 'The findings are groundbreaking'],
    correct: 1
  },
  {
    section: 'Vocabulary',
    question: 'The prefix "dis-" in "disassemble" indicates:',
    options: ['together', 'apart/reverse', 'before', 'after'],
    correct: 1
  },
  {
    section: 'Grammar',
    question: 'Despite ___ hard, he failed the exam.',
    options: ['study', 'studied', 'studying', 'to study'],
    correct: 2
  }
];

// TOEFL Practice Questions (Academic English focused)
const toeflQuestions = [
  {
    section: 'Structure',
    question: '___ the experiment was conducted, the results were analyzed.',
    options: ['After', 'Although', 'Despite', 'However'],
    correct: 0
  },
  {
    section: 'Structure',
    question: 'The professor, along with her assistants, ___ conducting the research.',
    options: ['is', 'are', 'were', 'have been'],
    correct: 0
  },
  {
    section: 'Vocabulary',
    question: '"The study yielded significant results" - "yielded" means:',
    options: ['delayed', 'produced', 'questioned', 'ignored'],
    correct: 1
  },
  {
    section: 'Reading',
    question: 'In the sentence "The evidence substantiates the claim," what does "substantiates" mean?',
    options: ['weakens', 'supports', 'replaces', 'questions'],
    correct: 1
  },
  {
    section: 'Structure',
    question: 'Not until the 20th century ___ widely accepted.',
    options: ['the theory was', 'was the theory', 'the theory is', 'is the theory'],
    correct: 1
  },
  {
    section: 'Vocabulary',
    question: 'A "preliminary" study is:',
    options: ['a final study', 'an initial study', 'a rejected study', 'a conclusive study'],
    correct: 1
  },
  {
    section: 'Reading',
    question: '"The author posits that..." means the author:',
    options: ['denies', 'questions', 'suggests/claims', 'proves'],
    correct: 2
  },
  {
    section: 'Structure',
    question: 'Had the researchers ___ more time, they would have found more evidence.',
    options: ['have', 'has', 'had', 'having'],
    correct: 2
  },
  {
    section: 'Vocabulary',
    question: '"To mitigate" means to:',
    options: ['make worse', 'make less severe', 'eliminate completely', 'investigate thoroughly'],
    correct: 1
  },
  {
    section: 'Reading',
    question: 'Academic texts often use passive voice to:',
    options: ['be more personal', 'emphasize the action over the actor', 'simplify sentences', 'add emotion'],
    correct: 1
  }
];

// Current test type
let currentTestType = 'general'; // 'general', 'ielts', 'toefl'

let currentQuizState = {
  currentQuestion: 0,
  answers: [],
  inProgress: false
};

// Get saved results for current user only
function getLevelResults() {
  const key = getLevelTestKey();
  const json = localStorage.getItem(key);
  return json ? JSON.parse(json) : [];
}

// Save result for current user
function saveLevelResult(result) {
  const key = getLevelTestKey();
  const results = getLevelResults();
  results.unshift(result);
  // Keep only last 10 results
  if (results.length > 10) results.pop();
  localStorage.setItem(key, JSON.stringify(results));
}

// Delete result for current user
window.deleteLevelResult = function (id) {
  if (!confirm('Delete this result?')) return;
  const key = getLevelTestKey();
  let results = getLevelResults();
  results = results.filter(r => r.id !== id);
  localStorage.setItem(key, JSON.stringify(results));
  renderPreviousResults();
};

// Calculate level based on correct answers and test type
function calculateLevel(correctAnswers) {
  const score = correctAnswers.length;
  const percentage = (score / 10) * 100;

  if (currentTestType === 'ielts') {
    return calculateIELTSBand(percentage);
  } else if (currentTestType === 'toefl') {
    return calculateTOEFLScore(percentage);
  }

  // General level test (CEFR)
  if (percentage <= 20) return { level: 'A1', description: 'Beginner' };
  if (percentage <= 40) return { level: 'A2', description: 'Elementary' };
  if (percentage <= 60) return { level: 'B1', description: 'Intermediate' };
  if (percentage <= 80) return { level: 'B2', description: 'Upper Intermediate' };
  return { level: 'C1', description: 'Advanced' };
}

// Calculate estimated IELTS Band score
function calculateIELTSBand(percentage) {
  if (percentage <= 20) return { level: 'Band 4.0', description: 'Limited User', band: 4.0 };
  if (percentage <= 30) return { level: 'Band 4.5', description: 'Limited User', band: 4.5 };
  if (percentage <= 40) return { level: 'Band 5.0', description: 'Modest User', band: 5.0 };
  if (percentage <= 50) return { level: 'Band 5.5', description: 'Modest User', band: 5.5 };
  if (percentage <= 60) return { level: 'Band 6.0', description: 'Competent User', band: 6.0 };
  if (percentage <= 70) return { level: 'Band 6.5', description: 'Competent User', band: 6.5 };
  if (percentage <= 80) return { level: 'Band 7.0', description: 'Good User', band: 7.0 };
  if (percentage <= 90) return { level: 'Band 7.5', description: 'Good User', band: 7.5 };
  return { level: 'Band 8.0+', description: 'Very Good User', band: 8.0 };
}

// Calculate estimated TOEFL iBT score
function calculateTOEFLScore(percentage) {
  const estimatedScore = Math.round((percentage / 100) * 120);

  if (percentage <= 20) return { level: `${estimatedScore}/120`, description: 'Basic (A1-A2)', toeflScore: estimatedScore };
  if (percentage <= 40) return { level: `${estimatedScore}/120`, description: 'Low Intermediate (A2-B1)', toeflScore: estimatedScore };
  if (percentage <= 60) return { level: `${estimatedScore}/120`, description: 'High Intermediate (B1-B2)', toeflScore: estimatedScore };
  if (percentage <= 80) return { level: `${estimatedScore}/120`, description: 'Advanced (B2-C1)', toeflScore: estimatedScore };
  return { level: `${estimatedScore}/120`, description: 'Expert (C1-C2)', toeflScore: estimatedScore };
}

// Get current questions based on test type
function getCurrentQuestions() {
  if (currentTestType === 'ielts') return ieltsQuestions;
  if (currentTestType === 'toefl') return toeflQuestions;
  return levelQuestions;
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

// Start test with specific type
window.startLevelTest = function (testType = 'general') {
  // Teachers cannot take tests
  if (window.isTeacher) {
    alert('Teachers can only view student results, not take tests.');
    return;
  }

  currentTestType = testType;
  currentQuizState = {
    currentQuestion: 0,
    answers: [],
    inProgress: true,
    testType: testType
  };

  document.getElementById('level-start-screen')?.classList.add('hidden');
  document.getElementById('level-quiz-screen')?.classList.remove('hidden');
  document.getElementById('level-result-screen')?.classList.add('hidden');

  // Update quiz title based on test type
  const quizTitle = document.getElementById('quiz-title');
  if (quizTitle) {
    if (testType === 'ielts') {
      quizTitle.innerHTML = '<i class="fa-solid fa-graduation-cap"></i> IELTS Practice Test';
    } else if (testType === 'toefl') {
      quizTitle.innerHTML = '<i class="fa-solid fa-university"></i> TOEFL Practice Test';
    } else {
      quizTitle.innerHTML = '<i class="fa-solid fa-chart-line"></i> General Level Test';
    }
  }

  renderQuestion();
};

// Render teacher view - shows student results from Supabase (only from students in same group rooms)
async function renderTeacherLevelView() {
  const container = document.getElementById('level-test-area');
  if (!container) return;

  // Show loading state
  container.innerHTML = `
    <div style="background:var(--color-card-bg); border:1px solid var(--color-border); border-radius:16px; padding:24px;">
      <div style="text-align:center; padding:40px; color:var(--color-text-muted);">
        <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; margin-bottom:12px;"></i>
        <p>Loading student results...</p>
      </div>
    </div>
  `;

  // Get results from Supabase only (filtered by group room membership)
  let results = [];
  let errorMessage = null;

  try {
    const { getAllLevelTestResults } = await import('../services/chatService.js');
    const { data, error } = await getAllLevelTestResults();

    if (error) {
      errorMessage = error.message;
    } else if (data && data.length > 0) {
      results = data.map(r => ({
        ...r,
        studentEmail: r.profiles?.email || 'Unknown',
        studentName: r.profiles?.full_name || r.profiles?.email?.split('@')[0] || 'Student',
        date: r.created_at
      }));
    }
  } catch (err) {
    console.log('Supabase fetch failed:', err);
    errorMessage = 'Could not connect to database';
  }

  // NOTE: No localStorage fallback - teachers should only see results from their group room students

  container.innerHTML = `
    <div style="background:var(--color-card-bg); border:1px solid var(--color-border); border-radius:16px; padding:24px;">
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:20px;">
        <i class="fa-solid fa-chart-bar" style="font-size:2rem; color:var(--color-accent);"></i>
        <div>
          <h3 style="margin:0;">Student Level Results</h3>
          <p class="muted" style="margin:0; font-size:0.9rem;">View test results from students in your group rooms</p>
        </div>
      </div>
      
      ${errorMessage ? `
        <div style="text-align:center; padding:40px; color:var(--color-text-muted);">
          <i class="fa-solid fa-exclamation-triangle" style="font-size:3rem; margin-bottom:12px; color:var(--color-error-text);"></i>
          <p>${errorMessage}</p>
        </div>
      ` : results.length === 0 ? `
        <div style="text-align:center; padding:40px; color:var(--color-text-muted);">
          <i class="fa-solid fa-inbox" style="font-size:3rem; margin-bottom:12px;"></i>
          <p>No student results yet</p>
          <p style="font-size:0.85rem; margin-top:8px;">You'll see results from students who are in the same group chat rooms as you.</p>
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
                  <div style="font-weight:600;">${r.studentName || r.description || 'Student'}</div>
                  <div style="font-size:0.85rem; color:var(--color-text-muted);">
                    ${r.studentEmail ? `<i class="fa-solid fa-envelope"></i> ${r.studentEmail} • ` : ''}
                    Score: ${r.score}/10 • ${new Date(r.date || r.created_at).toLocaleDateString()} ${new Date(r.date || r.created_at).toLocaleTimeString()}
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
  const questions = getCurrentQuestions();
  const q = questions[currentQuizState.currentQuestion];
  const area = document.getElementById('quiz-question-area');
  const progressText = document.getElementById('quiz-progress-text');
  const progressFill = document.getElementById('quiz-progress-fill');

  if (progressText) progressText.textContent = `Question ${currentQuizState.currentQuestion + 1} of 10`;
  if (progressFill) progressFill.style.width = `${((currentQuizState.currentQuestion + 1) / 10) * 100}%`;

  if (!area) return;

  // Badge text differs by test type
  const badgeText = q.section || q.level || 'Question';
  const badgeColor = currentTestType === 'ielts' ? '#4f46e5' : currentTestType === 'toefl' ? '#0891b2' : 'var(--color-accent)';

  area.innerHTML = `
    <div class="quiz-question-card" style="background:var(--color-card-bg); border:1px solid var(--color-border); border-radius:16px; padding:24px; margin-top:20px;">
      <div class="question-level-badge" style="display:inline-block; padding:4px 10px; background:${badgeColor}22; color:${badgeColor}; border-radius:20px; font-size:0.8rem; font-weight:bold; margin-bottom:12px;">
        ${badgeText}
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
          onmouseover="this.style.borderColor='${badgeColor}'; this.style.background='${badgeColor}22';"
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
  const questions = getCurrentQuestions();
  const q = questions[currentQuizState.currentQuestion];
  const isCorrect = answerIndex === q.correct;

  currentQuizState.answers.push({
    question: currentQuizState.currentQuestion,
    answer: answerIndex,
    correct: isCorrect,
    section: q.section || q.level || '',
    testType: currentTestType
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

  // Save result to localStorage
  const resultData = {
    id: Date.now(),
    level: result.level,
    description: result.description,
    score: score,
    testType: currentTestType,
    date: new Date().toISOString(),
    answers: currentQuizState.answers
  };
  saveLevelResult(resultData);

  // Save to Supabase for teacher visibility
  console.log('📝 [Level Test] Attempting to save to Supabase...');
  try {
    import('../services/chatService.js').then(({ saveLevelTestResult }) => {
      console.log('📝 [Level Test] Calling saveLevelTestResult with:', { level: result.level, description: result.description, score: score });
      saveLevelTestResult(result.level, result.description, score, currentQuizState.answers)
        .then(response => {
          if (response.error) {
            console.error('❌ [Level Test] Supabase save FAILED:', response.error);
          } else {
            console.log('✅ [Level Test] Saved to Supabase successfully! Response:', response.data);
          }
        })
        .catch(err => {
          console.error('❌ [Level Test] Supabase save caught error:', err);
        });
    }).catch(err => {
      console.error('❌ [Level Test] Failed to import chatService:', err);
    });
  } catch (err) {
    console.error('❌ [Level Test] Could not save to Supabase:', err);
  }


  // Notify teacher (simulated)
  console.log('📊 Teacher Notification - Level Test Result:', resultData);

  // Test-type-specific styling
  const badgeColor = currentTestType === 'ielts' ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
    : currentTestType === 'toefl' ? 'linear-gradient(135deg, #0891b2, #0e7490)'
      : 'linear-gradient(135deg, #10b981, #059669)';
  const testName = currentTestType === 'ielts' ? 'IELTS Practice'
    : currentTestType === 'toefl' ? 'TOEFL Practice'
      : 'General Level';
  const icon = currentTestType === 'ielts' ? 'graduation-cap'
    : currentTestType === 'toefl' ? 'university'
      : 'chart-line';

  const resultScreen = document.getElementById('level-result-screen');
  if (resultScreen) {
    resultScreen.innerHTML = `
      <div class="level-result-card" style="text-align:center; background:var(--color-card-bg); border:1px solid var(--color-border); border-radius:20px; padding:40px; margin-top:20px;">
        <div style="width:100px; height:100px; background:${badgeColor}; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.3rem; font-weight:bold; margin:0 auto 20px; flex-direction:column;">
          <i class="fa-solid fa-${icon}" style="font-size:1.8rem; margin-bottom:4px;"></i>
          <span style="font-size:0.8rem;">${currentTestType === 'ielts' ? result.level.replace('Band ', '') : currentTestType === 'toefl' ? '' : result.level}</span>
        </div>
        <div style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:8px;">${testName} Result</div>
        <h2 style="margin-bottom:8px; font-size:1.8rem;">${result.level}</h2>
        <p style="color:var(--color-text-muted); margin-bottom:20px; font-size:1.1rem;">${result.description}</p>
        
        <div style="background:var(--color-bg-tertiary); border-radius:12px; padding:16px; margin-bottom:24px;">
          <span style="font-size:2rem; font-weight:bold; color:var(--color-accent);">${score}</span>
          <span style="color:var(--color-text-muted);">/10 correct answers</span>
        </div>

        <p style="color:var(--color-text-muted); font-size:0.9rem; margin-bottom:20px;">
          <i class="fa-solid fa-info-circle"></i> ${currentTestType === 'ielts' ? 'This is an estimated IELTS Band score based on your performance.' : currentTestType === 'toefl' ? 'This is an estimated TOEFL iBT score based on your performance.' : 'Your teacher has been notified of your result.'}
        </p>

        <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
          <button class="primary-btn" onclick="integrateLevel('${result.level}', '${result.description}')" id="integrate-level-btn">
            <i class="fa-solid fa-link"></i> Integrate Level
          </button>
          <button class="ghost-btn" onclick="retakeLevelTest()">
            <i class="fa-solid fa-rotate"></i> Take Again
          </button>
          <button class="ghost-btn" onclick="goToLevelStart()">
            <i class="fa-solid fa-arrow-left"></i> Choose Another Test
          </button>
        </div>
      </div>
    `;
  }
}

// Integrate level - save to user preferences
window.integrateLevel = async function (level, description) {
  const btn = document.getElementById('integrate-level-btn');
  if (!btn) return;

  // Disable button during save
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Integrating...';

  try {
    const { saveUserLevel } = await import('../services/chatService.js');
    const { error } = await saveUserLevel(level, description);

    if (error) {
      console.error('❌ Failed to integrate level:', error);
      alert('Seviye entegrasyonu başarısız oldu. Lütfen tekrar deneyin.');
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-link"></i> Integrate Level';
    } else {
      console.log('✅ Level integrated successfully:', level, description);
      alert('Seviyeniz entegre edilmiştir! 🎉\n\nAI artık tüm sohbetlerde seviyenizi bilerek cevap verecek.');

      // Update button to show success
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Integrated';
      btn.style.background = 'var(--color-success-bg)';
      btn.style.color = 'var(--color-success-text)';

      // Keep button disabled to prevent re-integration
      btn.disabled = true;
    }
  } catch (err) {
    console.error('❌ Error integrating level:', err);
    alert('Seviye entegrasyonu başarısız oldu. Lütfen tekrar deneyin.');
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-link"></i> Integrate Level';
  }
};

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
