// Schedule Session Functionality
window.scheduleSession = function () {
  const dateInput = document.getElementById('session-date');
  const topicInput = document.getElementById('session-topic');

  const date = dateInput?.value;
  const topic = topicInput?.value || 'Learning Session';

  if (!date) {
    alert('Please select a date and time.');
    return;
  }

  // Create session object
  const session = {
    id: Date.now(),
    date: new Date(date).toLocaleString(),
    topic: topic,
    timestamp: date
  };

  // Get existing sessions
  const sessions = JSON.parse(localStorage.getItem('scheduled_sessions') || '[]');
  sessions.push(session);
  localStorage.setItem('scheduled_sessions', JSON.stringify(sessions));

  // Send notification to teacher (simulated)
  console.log('📅 Teacher Notification:', {
    student: 'Current User',
    session: session.topic,
    scheduledFor: session.date
  });

  alert(`✅ Session scheduled for ${session.date}`);

  // Clear inputs
  if (dateInput) dateInput.value = '';
  if (topicInput) topicInput.value = '';

  // Render sessions
  renderScheduledSessions();
};

function renderScheduledSessions() {
  const list = document.getElementById('schedule-list');
  if (!list) return;

  const sessions = JSON.parse(localStorage.getItem('scheduled_sessions') || '[]');

  if (sessions.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>No scheduled sessions yet</p></div>';
    return;
  }

  list.innerHTML = sessions.map(session => `
    <div class="schedule-item">
      <div class="schedule-icon">
        <i class="fa-solid fa-calendar-check"></i>
      </div>
      <div class="schedule-content">
        <div class="schedule-topic">${session.topic}</div>
        <div class="schedule-date">${session.date}</div>
      </div>
      <button class="schedule-delete" onclick="deleteSession(${session.id})" title="Cancel session">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `).join('');
}

window.deleteSession = function (id) {
  if (!confirm('Cancel this session?')) return;

  let sessions = JSON.parse(localStorage.getItem('scheduled_sessions') || '[]');
  sessions = sessions.filter(s => s.id !== id);
  localStorage.setItem('scheduled_sessions', JSON.stringify(sessions));

  renderScheduledSessions();
};

// Render on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderScheduledSessions);
} else {
  renderScheduledSessions();
}
