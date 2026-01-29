// js/ui/listeningUI.js
// UI management for Academic Listening feature

import { generateListeningContent, checkListeningAnswers, saveListeningSession, getListeningHistory } from '../services/listeningService.js';

// ======================================
// STATE
// ======================================
let currentListeningData = null;
let userAnswers = {};
let isLoading = false;
let sessionStartTime = null;
let audioPlayer = null;

// ======================================
// INITIALIZATION
// ======================================

export function initListeningUI() {
    console.log('Listening UI initialized');
}

// ======================================
// ACADEMIC LISTENING MODE
// ======================================

// Called by skillsUI.js when academic listening is started
window.loadListeningContent = async function (mode = 'academic') {
    if (isLoading) return;

    try {
        isLoading = true;
        showListeningLoading(mode, true);
        sessionStartTime = Date.now();

        // Generate listening content
        const data = await generateListeningContent(null, mode);
        currentListeningData = data;
        currentListeningData.mode = mode;
        userAnswers = {};

        // Display content based on mode
        displayListeningContent(data, mode);

        showListeningLoading(mode, false);
    } catch (error) {
        console.error('Failed to start listening:', error);
        showListeningLoading(mode, false);
        alert('Failed to generate listening content. Please try again.');
        // Don't go back, let user try again
    } finally {
        isLoading = false;
    }
};

function resetListeningSession() {
    currentListeningData = null;
    userAnswers = {};
    sessionStartTime = null;

    // Stop audio if playing
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer = null;
    }

    // Reset UI
    const transcriptDiv = document.getElementById('listening-transcript-display');
    const questionsDiv = document.getElementById('listening-questions-container');
    const resultsDiv = document.getElementById('listening-results-panel');

    if (transcriptDiv) transcriptDiv.innerHTML = '';
    if (questionsDiv) questionsDiv.innerHTML = '';
    if (resultsDiv) {
        resultsDiv.innerHTML = '';
        resultsDiv.classList.add('hidden');
    }
}

function showListeningLoading(mode, show) {
    const prefix = mode === 'academic' ? 'academic-listening' : 'conversation-listening';
    const loader = document.getElementById(`${prefix}-loading`);
    const content = document.getElementById(`${prefix}-content`);

    if (show) {
        loader?.classList.remove('hidden');
        content?.classList.add('hidden');
    } else {
        loader?.classList.add('hidden');
        content?.classList.remove('hidden');
    }
}

// ======================================
// DISPLAY FUNCTIONS
// ======================================

function displayListeningContent(data, mode = 'academic') {
    const prefix = mode === 'academic' ? 'academic' : 'conversation';

    // Create audio player for transcript
    createAudioPlayer(data.transcript, prefix);

    // Display questions
    displayListeningQuestions(data.questions, prefix);
}

function createAudioPlayer(transcript, prefix = 'academic') {
    const audioContainer = document.getElementById(`${prefix}-audio-container`);
    if (!audioContainer) return;

    // Use Web Speech API for TTS (browser-based, no cost)
    audioContainer.innerHTML = `
        <div class="audio-player-card">
            <div class="audio-header">
                <i class="fa-solid fa-headphones"></i>
                <span>Listen to the passage</span>
            </div>
            <div class="audio-controls">
                <button class="audio-btn play" id="audio-play-btn" onclick="playListeningAudio()">
                    <i class="fa-solid fa-play"></i> Play
                </button>
                <button class="audio-btn pause hidden" id="audio-pause-btn" onclick="pauseListeningAudio()">
                    <i class="fa-solid fa-pause"></i> Pause
                </button>
                <button class="audio-btn" onclick="stopListeningAudio()">
                    <i class="fa-solid fa-stop"></i> Stop
                </button>
                <button class="audio-btn" onclick="replayListeningAudio()">
                    <i class="fa-solid fa-rotate-right"></i> Replay
                </button>
            </div>
            <div class="audio-info">
                <p class="muted">You can replay the audio as many times as needed while answering questions.</p>
            </div>
        </div>
    `;

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(transcript);
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Try to use a good English voice
        const voices = speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith('en-')) || voices[0];
        if (englishVoice) utterance.voice = englishVoice;

        window.currentUtterance = utterance;

        utterance.onend = () => {
            document.getElementById('audio-play-btn')?.classList.remove('hidden');
            document.getElementById('audio-pause-btn')?.classList.add('hidden');
        };
    }
}

window.playListeningAudio = function () {
    if ('speechSynthesis' in window && window.currentUtterance) {
        speechSynthesis.cancel(); // Clear any previous speech
        speechSynthesis.speak(window.currentUtterance);
        document.getElementById('audio-play-btn')?.classList.add('hidden');
        document.getElementById('audio-pause-btn')?.classList.remove('hidden');
    }
};

window.pauseListeningAudio = function () {
    if ('speechSynthesis' in window) {
        speechSynthesis.pause();
        document.getElementById('audio-play-btn')?.classList.remove('hidden');
        document.getElementById('audio-pause-btn')?.classList.add('hidden');
    }
};

window.stopListeningAudio = function () {
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        document.getElementById('audio-play-btn')?.classList.remove('hidden');
        document.getElementById('audio-pause-btn')?.classList.add('hidden');
    }
};

window.replayListeningAudio = function () {
    window.stopListeningAudio();
    setTimeout(() => window.playListeningAudio(), 100);
};

function displayListeningQuestions(questions, prefix = 'academic') {
    const container = document.getElementById(`${prefix}-listening-questions`);
    if (!container) return;

    container.innerHTML = '<h4><i class="fa-solid fa-question-circle"></i> Comprehension Questions</h4>';

    questions.forEach((q, index) => {
        const qDiv = document.createElement('div');
        qDiv.className = 'question-item';

        let inputHTML = '';

        if (q.type === 'multiple_choice') {
            inputHTML = `
                <div class="question-options">
                    ${q.options.map(opt => `
                        <label class="option-label">
                            <input type="radio" name="q${index}" value="${opt.charAt(0)}" onchange="updateListeningAnswer(${index}, this.value)">
                            ${opt}
                        </label>
                    `).join('')}
                </div>
            `;
        } else if (q.type === 'fill_blank') {
            inputHTML = `
                <input type="text" class="fill-blank-input" placeholder="Your answer..." onchange="updateListeningAnswer(${index}, this.value)">
            `;
        } else if (q.type === 'true_false') {
            inputHTML = `
                <div class="question-options">
                    <label class="option-label">
                        <input type="radio" name="q${index}" value="True" onchange="updateListeningAnswer(${index}, this.value)">
                        True
                    </label>
                    <label class="option-label">
                        <input type="radio" name="q${index}" value="False" onchange="updateListeningAnswer(${index}, this.value)">
                        False
                    </label>
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

function formatQuestionType(type) {
    const types = {
        'multiple_choice': 'Multiple Choice',
        'fill_blank': 'Fill in the Blank',
        'true_false': 'True/False'
    };
    return types[type] || type;
}

// ======================================
// ANSWER HANDLING
// ======================================

window.updateListeningAnswer = function (index, value) {
    userAnswers[index] = value;
};

window.submitListeningAnswers = async function () {
    if (!currentListeningData) return;

    // Check if all questions answered
    const totalQuestions = currentListeningData.questions.length;
    const answeredCount = Object.keys(userAnswers).length;

    if (answeredCount < totalQuestions) {
        if (!confirm(`You have only answered ${answeredCount} out of ${totalQuestions} questions. Submit anyway?`)) {
            return;
        }
    }

    // Stop audio
    window.stopListeningAudio();

    // Calculate time taken
    const timeTaken = Math.floor((Date.now() - sessionStartTime) / 1000);

    // Check answers
    const results = checkListeningAnswers(currentListeningData.questions, userAnswers);

    // Display results
    displayListeningResults(results, timeTaken);

    // Save to Supabase
    try {
        await saveListeningSession({
            mode: 'academic',
            topic: currentListeningData.topic || currentListeningData.title,
            transcript: currentListeningData.transcript,
            audioUrl: null, // Using browser TTS, no URL
            questions: currentListeningData.questions,
            userAnswers: userAnswers,
            correctCount: results.correctCount,
            totalQuestions: results.totalQuestions,
            scorePercentage: results.scorePercentage,
            timeTaken: timeTaken
        });

        // Reload history
        loadListeningHistory();
    } catch (error) {
        console.error('Failed to save session:', error);
    }
};

function displayListeningResults(results, timeTaken) {
    const panel = document.getElementById('listening-results-panel');
    if (!panel) return;

    const minutes = Math.floor(timeTaken / 60);
    const seconds = timeTaken % 60;

    let html = `
        <div class="results-header">
            <i class="fa-solid fa-chart-bar"></i>
            <h3>Listening Results</h3>
        </div>
        
        <div class="results-score-card">
            <div class="score-circle ${results.scorePercentage >= 70 ? 'good' : results.scorePercentage >= 50 ? 'ok' : 'poor'}">
                <span class="score-number">${results.scorePercentage}%</span>
            </div>
            <div class="score-details">
                <p><strong>${results.correctCount}</strong> out of <strong>${results.totalQuestions}</strong> correct</p>
                <p class="muted">Time taken: ${minutes}m ${seconds}s</p>
            </div>
        </div>
        
        <div class="results-section">
            <h4><i class="fa-solid fa-list-check"></i> Answer Review</h4>
    `;

    results.results.forEach((r, idx) => {
        const q = currentListeningData.questions[idx];
        html += `
            <div class="result-item ${r.isCorrect ? 'correct' : 'incorrect'}">
                <div class="result-header">
                    <span class="result-icon">${r.isCorrect ? '✓' : '✗'}</span>
                    <span>Question ${idx + 1}</span>
                </div>
                <p class="result-question">${q.question}</p>
                <p class="result-answer"><strong>Your answer:</strong> ${r.userAnswer || '(not answered)'}</p>
                ${!r.isCorrect ? `<p class="result-correct"><strong>Correct answer:</strong> ${r.correctAnswer}</p>` : ''}
                ${r.explanation ? `<p class="result-explanation"><em>${r.explanation}</em></p>` : ''}
            </div>
        `;
    });

    html += `</div>
        
        <div class="results-section">
            <h4><i class="fa-solid fa-file-lines"></i> Full Transcript</h4>
            <div class="transcript-box">${currentListeningData.transcript}</div>
        </div>
        
        <div class="results-actions">
            <button class="primary-btn" onclick="backToListeningSelection()">
                <i class="fa-solid fa-rotate-left"></i> Try Another
            </button>
        </div>
    `;

    panel.innerHTML = html;
    panel.classList.remove('hidden');

    // Hide questions
    document.getElementById('listening-questions-container')?.classList.add('hidden');
    document.getElementById('listening-audio-container')?.classList.add('hidden');
}

// ======================================
// NAVIGATION
// ======================================

window.backToListeningSelection = function () {
    resetListeningSession();

    document.getElementById('listening-mode-selection')?.classList.remove('hidden');
    document.getElementById('listening-session-screen')?.classList.add('hidden');

    loadListeningHistory();
};

// ======================================
// HISTORY
// ======================================

async function loadListeningHistory() {
    const historyDiv = document.getElementById('listening-history-list');
    if (!historyDiv) return;

    const { data, error } = await getListeningHistory(5);

    if (error || !data || data.length === 0) {
        historyDiv.innerHTML = '<p class="no-history">No previous sessions</p>';
        return;
    }

    historyDiv.innerHTML = data.map(session => `
        <div class="history-item">
            <div class="history-header">
                <span class="history-topic">${session.topic}</span>
                <span class="history-score ${session.score_percentage >= 70 ? 'good' : 'ok'}">${session.score_percentage}%</span>
            </div>
            <p class="history-meta">${session.score}/${session.total_questions} correct • ${formatDate(session.created_at)}</p>
        </div>
    `).join('');
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Load voices when available (for Web Speech API)
if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = () => {
        console.log('Voices loaded:', speechSynthesis.getVoices().length);
    };
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initListeningUI);
} else {
    initListeningUI();
}
