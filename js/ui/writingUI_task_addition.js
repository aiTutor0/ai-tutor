// Task Response functions for IELTS Writing Task 1

import { generateChartData, evaluateTaskResponse, saveTaskResponse } from '../services/writingService.js';

// State
let currentMode = 'task';
let currentChart = null;
let isEvaluating = false;

// ======================================
// TASK RESPONSE (CHART) MODE
// ======================================

// Get new task/chart (called from HTML)
window.getNewTaskTopic = function () {
    currentChart = generateChartData();
    displayChart(currentChart);
    const textarea = document.getElementById('task-textarea');
    if (textarea) textarea.value = '';
    const feedbackPanel = document.getElementById('task-feedback-panel');
    if (feedbackPanel) feedbackPanel.classList.add('hidden');
    window.updateTaskWordCount();
};

window.startTaskResponse = async function (event) {
    if (event) event.preventDefault();
    currentMode = 'task';

    const modeSelection = document.getElementById('writing-mode-selection');
    const sessionScreen = document.getElementById('writing-session-screen');
    const taskSection = document.getElementById('task-response-section');
    const essaySection = document.getElementById('essay-section');

    if (modeSelection) modeSelection.classList.add('hidden');
    if (sessionScreen) sessionScreen.classList.remove('hidden');
    if (taskSection) taskSection.classList.remove('hidden');
    if (essaySection) essaySection.classList.add('hidden');

    // Generate chart
    currentChart = generateChartData();
    displayChart(currentChart);

    // Clear textarea
    const textarea = document.getElementById('task-textarea');
    if (textarea) textarea.value = '';

    updateTaskWordCount();
};

function displayChart(chart) {
    const container = document.getElementById('task-chart-container');
    if (!container) return;

    container.classList.remove('hidden');

    let html = `<h4>${chart.title}</h4>`;

    if (chart.type === 'table') {
        html += '<table class="chart-table"><thead><tr>';
        chart.headers.forEach(h => html += `<th>${h}</th>`);
        html += '</tr></thead><tbody>';
        chart.rows.forEach(row => {
            html += '<tr>';
            row.forEach(cell => html += `<td>${cell}</td>`);
            html += '</tr>';
        });
        html += '</tbody></table>';
    } else if (chart.type === 'pie') {
        html += '<div class="pie-chart">';
        chart.data.forEach(d => {
            html += `<div class="pie-item"><span>${d.name}:</span> <strong>${d.value}%</strong></div>`;
        });
        html += '</div>';
    } else {
        // Bar or Line - simple text representation
        html += `<div class="simple-chart"><p>Categories: ${chart.categories.join(', ')}</p>`;
        chart.series.forEach(s => {
            html += `<p><strong>${s.name}:</strong> ${s.data.join(', ')}</p>`;
        });
        html += `<p class="chart-unit">Unit: ${chart.unit}</p></div>`;
    }

    container.innerHTML = html;
}

window.updateTaskWordCount = function () {
    const textarea = document.getElementById('task-textarea');
    const countDisplay = document.getElementById('task-word-count');

    if (textarea && countDisplay) {
        const words = textarea.value.trim().split(/\s+/).filter(w => w.length > 0);
        const count = words.length;
        countDisplay.textContent = `${count} / 150-200 words`;
        countDisplay.style.color = count >= 150 && count <= 200 ? '#10b981' : '#f59e0b';
    }
};

window.submitTaskResponse = async function () {
    await doSubmitTaskResponse();
};

// Alias for HTML compatibility
window.submitTaskForReview = async function () {
    await doSubmitTaskResponse();
};

async function doSubmitTaskResponse() {
    if (isEvaluating) return;

    const textarea = document.getElementById('task-textarea');
    const responseText = textarea?.value?.trim();

    if (!responseText || responseText.length < 50) {
        alert('Please write at least 50 characters.');
        return;
    }

    isEvaluating = true;
    const submitBtn = document.getElementById('submit-task-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Evaluating...';
    }

    try {
        const evaluation = await evaluateTaskResponse(currentChart, responseText);

        // Try to save but don't fail if table doesn't exist
        try {
            await saveTaskResponse({
                chartType: currentChart.type,
                chartData: currentChart,
                responseText: responseText,
                wordCount: evaluation.wordCount,
                bandScore: evaluation.bandScore,
                taskAchievement: evaluation.taskAchievement,
                coherenceCohesion: evaluation.coherenceCohesion,
                lexicalResource: evaluation.lexicalResource,
                grammarAccuracy: evaluation.grammarAccuracy,
                feedback: evaluation.feedback
            });
        } catch (saveError) {
            console.warn('Could not save task response (table may not exist):', saveError.message);
            // Continue anyway - displaying feedback is more important
        }

        displayTaskFeedback(evaluation);

    } catch (error) {
        console.error('Task evaluation error:', error);
        alert('Error: ' + error.message);
    } finally {
        isEvaluating = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Submit';
        }
    }
};

function displayTaskFeedback(evaluation) {
    const feedbackPanel = document.getElementById('task-feedback-panel');
    if (!feedbackPanel) return;

    feedbackPanel.classList.remove('hidden');
    feedbackPanel.innerHTML = `
        <div class="feedback-header">
            <h3><i class="fa-solid fa-chart-bar"></i> Task 1 Evaluation</h3>
            <div class="band-score-display">
                <span class="band-label">Band Score</span>
                <span class="band-value">${evaluation.bandScore || 'N/A'}</span>
            </div>
        </div>
        <div class="feedback-section">
            <p>${evaluation.feedback || 'No feedback.'}</p>
            ${evaluation.dataAccuracy ? `<p><strong>Data Accuracy:</strong> ${evaluation.dataAccuracy}</p>` : ''}
            ${evaluation.overviewPresent !== undefined ? `<p><strong>Overview Present:</strong> ${evaluation.overviewPresent ? 'Yes ✓' : 'No ✗'}</p>` : ''}
        </div>
        ${evaluation.suggestions?.length ? `<div class="feedback-section"><h4>Suggestions</h4><ul>${evaluation.suggestions.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}
        <button class="outline-btn" onclick="startNewTaskResponse()"><i class="fa-solid fa-plus"></i> Try Another</button>
    `;
}

window.startNewTaskResponse = function () {
    currentChart = generateChartData();
    displayChart(currentChart);
    const textarea = document.getElementById('task-textarea');
    if (textarea) textarea.value = '';
    const feedbackPanel = document.getElementById('task-feedback-panel');
    if (feedbackPanel) feedbackPanel.classList.add('hidden');
    updateTaskWordCount();
};
