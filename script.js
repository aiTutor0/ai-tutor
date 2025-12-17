// ================================================================
// 1. AYARLAR (API ANAHTARLARI)
// ================================================================

// Ekran görüntüsündeki URL'in:
const SUPABASE_URL = 'https://haowbfhlmhgwjgpgbtyn.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhb3diZmhsbWhnd2pncGdidHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3OTk0MDgsImV4cCI6MjA4MTM3NTQwOH0.oc2LfHXXTRo8YPXrgpbxV6Ts6jvKNOFaaDR15ay9H0A'; 
const OPENAI_API_KEY = 'sk-1234abcd1234abcd1234abcd1234abcd1234abcd'; 


// ================================================================
// 2. SUPABASE BAĞLANTISI (Hata Korumalı)
// ================================================================
let supabase = null;

try {
  if (SUPABASE_URL && SUPABASE_KEY && window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("Supabase bağlantısı hazır.");
  } else {
    console.warn("Supabase anahtarları eksik! Site Demo modunda çalışacak.");
  }
} catch (err) {
  console.error("Supabase başlatılamadı:", err);
}

// ================================================================
// 3. SEÇİCİLER (HTML Elemanlarını Seçiyoruz)
// ================================================================
const views = {
  landing: document.getElementById('landing-view'),
  auth: document.getElementById('auth-view'),
  dashboard: document.getElementById('dashboard-view'),
  workspace: document.getElementById('workspace-view')
};

const components = {
  loginForm: document.getElementById('login-form'),
  registerForm: document.getElementById('register-form'),
  tabLogin: document.getElementById('tab-login'),
  tabRegister: document.getElementById('tab-register'),
  authError: document.getElementById('auth-error'),
  roleFields: document.getElementById('role-fields'),
  profileAvatar: document.getElementById('profile-avatar'),
  profileName: document.getElementById('profile-name'),
  profileRole: document.getElementById('profile-role'),
  chatWindow: document.getElementById('chat-window'),
  userInput: document.getElementById('user-input'),
  toolTitle: document.getElementById('tool-title'),
  correctionBox: document.getElementById('correction-box'),
  correctionText: document.getElementById('correction-text'),
  btnGoogle: document.getElementById('btn-google-login')
};

// ================================================================
// 4. YARDIMCI FONKSİYONLAR
// ================================================================
function showView(viewName) {
  Object.values(views).forEach(el => el && el.classList.add('hidden'));
  if (views[viewName]) {
    views[viewName].classList.remove('hidden');
  }
  if (viewName === 'dashboard' || viewName === 'workspace') {
    document.body.classList.remove('public');
  } else {
    document.body.classList.add('public');
  }
}

function showAuthError(msg) {
  if (components.authError) {
    components.authError.textContent = msg;
    components.authError.classList.remove('hidden');
  }
}

function clearAuthError() {
  if (components.authError) {
    components.authError.textContent = '';
    components.authError.classList.add('hidden');
  }
}

// Demo modu için LocalStorage yardımcıları (DEĞİŞTİRİLMEDİ)
function getLocalUsers() {
  return JSON.parse(localStorage.getItem('linguaai_users')) || [];
}

function saveLocalUser(user) {
  const users = getLocalUsers();
  users.push(user);
  localStorage.setItem('linguaai_users', JSON.stringify(users));
}

let currentUser = null; 
let currentSessionId = null; // Veritabanı için oturum ID'si

// ================================================================
// 5. GLOBAL FONKSİYONLAR 
// ================================================================

window.showDashboard = function() {
  if (!currentUser) {
    window.showLanding();
    return;
  }
  showView('dashboard');
};

window.showLanding = function() {
  showView('landing');
};

window.showAuth = function(tab) {
  clearAuthError();
  showView('auth');
  
  if (tab === 'login') {
    components.tabLogin.classList.add('active');
    components.tabRegister.classList.remove('active');
    components.loginForm.classList.remove('hidden');
    components.registerForm.classList.add('hidden');
  } else {
    components.tabRegister.classList.add('active');
    components.tabLogin.classList.remove('active');
    components.registerForm.classList.remove('hidden');
    components.loginForm.classList.add('hidden');
  }
};

window.logout = async function() {
  if (confirm('Çıkış yapmak istiyor musunuz?')) {
    if (supabase) await supabase.auth.signOut();
    currentUser = null;
    currentSessionId = null;
    window.location.reload(); 
  }
};

window.openTool = function(mode) {
  if (!currentUser) return window.showLanding();
  
  showView('workspace');
  components.chatWindow.innerHTML = '';
  currentSessionId = null; // Yeni araç açıldığında oturumu sıfırla
  
  let title = "Tool";
  let welcomeMsg = "Hello!";
  
  if (mode === 'chat') { title = "Free Conversation"; welcomeMsg = "Let's chat about anything!"; }
  else if (mode === 'interview') { title = "Mock Interview"; welcomeMsg = "Tell me about yourself."; }
  else if (mode === 'grammar') { title = "Grammar Fixer"; welcomeMsg = "Paste your text here."; }
  else if (mode === 'tutor') { title = "Topic Explainer"; welcomeMsg = "Ask me a grammar rule."; }
  
  components.toolTitle.innerText = title;
  addMessage(welcomeMsg, 'ai');
};

// ----------------------------------------------------------------
// [GÜNCELLENDİ] SEND MESSAGE FONKSİYONU (DATABASE + OPENAI)
// ----------------------------------------------------------------
window.sendMessage = async function() {
  const text = components.userInput.value.trim();
  if (!text) return;
  
  // 1. Mesajı ekrana yaz
  addMessage(text, 'user');
  components.userInput.value = '';
  
  // Eğer Supabase yoksa Demo modunda çalış (Eski kodun bozulmaması için)
  if (!supabase || !currentUser) {
    setTimeout(() => {
      addMessage("Demo Mode: AI connection not active (Login required).", 'ai');
    }, 1000);
    return;
  }

  try {
    // 2. Oturum yoksa veritabanında oluştur
    if (!currentSessionId) {
      const { data: sessionData, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert([{ 
            user_id: (await supabase.auth.getUser()).data.user.id,
            title: text.substring(0, 30) + "..." 
        }])
        .select()
        .single();
      
      if (!sessionError) currentSessionId = sessionData.id;
    }

    // 3. Kullanıcı mesajını kaydet
    if (currentSessionId) {
      await supabase.from('chat_messages').insert([{
        session_id: currentSessionId,
        sender_type: 'user',
        content: text
      }]);
    }

    // 4. OpenAI Çağrısı
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai-msg loading-msg';
    loadingDiv.innerHTML = `<div class="msg-avatar"><i class="fa-solid fa-robot"></i></div><div class="msg-bubble">Thinking...</div>`;
    components.chatWindow.appendChild(loadingDiv);
    components.chatWindow.scrollTop = components.chatWindow.scrollHeight;

    const aiResponse = await callOpenAI(text);

    components.chatWindow.removeChild(loadingDiv);
    addMessage(aiResponse, 'ai');

    // 5. AI cevabını kaydet
    if (currentSessionId) {
      await supabase.from('chat_messages').insert([{
        session_id: currentSessionId,
        sender_type: 'ai',
        content: aiResponse
      }]);
    }

  } catch (err) {
    console.error("Hata:", err);
    addMessage("Error connecting to server.", 'ai');
  }
};

// [YENİ EKLENDİ] OpenAI API Fonksiyonu
async function callOpenAI(userMessage) {
  if (!OPENAI_API_KEY || OPENAI_API_KEY.includes('BURAYA')) return "API Key eksik!";

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful English Tutor." },
          { role: "user", content: userMessage }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (data.error) return "OpenAI Error: " + data.error.message;
    return data.choices[0].message.content;
  } catch (error) {
    return "Connection error.";
  }
}

window.exportChat = function() {
  alert("Export feature is coming soon!");
};

function addMessage(text, sender) {
  const div = document.createElement('div');
  div.className = `message ${sender === 'user' ? 'user-msg' : 'ai-msg'}`;
  div.innerHTML = `
    <div class="msg-avatar">${sender === 'user' ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>'}</div>
    <div class="msg-bubble">${text}</div>
  `;
  components.chatWindow.appendChild(div);
  components.chatWindow.scrollTop = components.chatWindow.scrollHeight;
}

// ================================================================
// 6. EVENT LISTENERS
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  
  // Landing ve Tab Butonları (DEĞİŞTİRİLMEDİ)
  document.getElementById('btn-go-login')?.addEventListener('click', () => window.showAuth('login'));
  document.getElementById('btn-go-register')?.addEventListener('click', () => window.showAuth('register'));
  document.getElementById('btn-hero-start')?.addEventListener('click', () => window.showAuth('register'));
  document.getElementById('btn-hero-login')?.addEventListener('click', () => window.showAuth('login'));
  document.getElementById('btn-back-home')?.addEventListener('click', () => window.showLanding());
  document.getElementById('btn-back-home-2')?.addEventListener('click', () => window.showLanding());
  components.tabLogin?.addEventListener('click', () => window.showAuth('login'));
  components.tabRegister?.addEventListener('click', () => window.showAuth('register'));

  document.getElementById('role-pills')?.addEventListener('change', (e) => {
    if (e.target.name === 'role' && components.roleFields) {
       components.roleFields.innerHTML = e.target.value === 'student' 
        ? '<div class="form-group"><label>Level</label><input type="text" placeholder="A1, B2..."></div>' 
        : '';
    }
  });

  // Google Login (Sadece Supabase varsa çalışır)
  if (components.btnGoogle) {
    components.btnGoogle.addEventListener('click', async () => {
      if (supabase) {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.href }
        });
      } else {
        alert("Supabase key eksik, Demo girişi yapılıyor.");
        loginSuccess({ email: "demo@google.com", name: "Demo User", role: "student" });
      }
    });
  }

  // ---------------------------------------------
  // [GÜNCELLENDİ] LOGIN (Supabase Entegreli)
  // ---------------------------------------------
  components.loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    
    // Supabase varsa oradan dene
    if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: pass
        });
        if (error) {
            showAuthError(error.message);
        } else {
            // Başarılı giriş
             loginSuccess({
                name: data.user.user_metadata.full_name || email,
                email: email,
                role: data.user.user_metadata.role || 'student'
            });
        }
    } else {
        // Yoksa eski sistem (Demo) çalışsın
        const users = getLocalUsers();
        const user = users.find(u => u.email === email && u.password === pass);
        if (user) loginSuccess(user);
        else showAuthError("Invalid email or password (Demo).");
    }
  });

  // ---------------------------------------------
  // [GÜNCELLENDİ] REGISTER (Supabase Entegreli)
  // ---------------------------------------------
  components.registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    const roleEl = document.querySelector('input[name="role"]:checked');
    const role = roleEl ? roleEl.value : 'student';

    if (pass !== confirm) return showAuthError("Passwords do not match");

    if (supabase) {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: pass,
            options: { data: { full_name: name, role: role } }
        });
        if (error) {
            showAuthError(error.message);
        } else {
            alert("Registration successful! Check email or login.");
            window.showAuth('login');
        }
    } else {
        // Eski sistem (Demo)
        const newUser = { name, email, password: pass, role: role };
        saveLocalUser(newUser);
        loginSuccess(newUser);
    }
  });

  components.userInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') window.sendMessage();
  });

  initSession();
});

// ================================================================
// 7. OTURUM YÖNETİMİ
// ================================================================
async function initSession() {
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      loginSuccess({
        name: session.user.user_metadata.full_name || session.user.email,
        email: session.user.email,
        role: session.user.user_metadata.role || 'student',
        avatar: session.user.user_metadata.avatar_url
      });
      return;
    }
  }
  // Eğer session yoksa landing sayfasında kalır
}

function loginSuccess(user) {
  currentUser = user;
  if (components.profileName) components.profileName.textContent = user.name;
  if (components.profileRole) components.profileRole.textContent = user.role.toUpperCase();
  if (components.profileAvatar) {
    if (user.avatar) {
      components.profileAvatar.innerHTML = `<img src="${user.avatar}" style="width:100%;height:100%;border-radius:50%">`;
      components.profileAvatar.style.background = 'transparent';
    } else {
      components.profileAvatar.textContent = user.name.charAt(0).toUpperCase();
    }
  }
  window.showDashboard();
}
