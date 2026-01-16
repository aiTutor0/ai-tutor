# 🧠 AITutor - AI-Powered English Learning Platform

<div align="center">

![AITutor](https://img.shields.io/badge/AITutor-English%20Learning-4f46e5?style=for-the-badge&logo=openai&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)

**Practice English with AI — faster, simpler, and more fun.**

[🚀 Live Demo](#) • [📖 Documentation](#features) • [🐳 Docker Setup](#docker-setup)

</div>

---

## ✨ Features

### 🎓 For Students

- 💬 **Free Conversation** | Practice daily speaking and be fluent with AI
- 👔 **Mock Interview** | Prepare for job interviews with realistic AI simulations
- ✏️ **Grammar Fixer** | Get instant corrections with explanations
- 👨‍🏫 **Topic Explainer** | Learn grammar rules with clear examples
- 📊 **Level Test** | Assess your CEFR level (A1-C1) with 10 questions
- 🌐 **Translate** | Translate text with context
- 👥 **Group Chat** | Create rooms and chat with other users

### 👩‍🏫 For Teachers

- 📅 **Schedule Management** - Plan learning sessions
- 📁 **File Sharing** - Share learning materials
- 👀 **Student Progress** - Monitor student activities

### ⚙️ For Admins

- 👥 **User Management** - View all registered users
- 💬 **Chat Monitoring** - View and manage user conversations
- 🗑️ **Content Moderation** - Delete inappropriate chats

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Vanilla JavaScript, HTML5, CSS3 |
| **Backend** | Node.js, Express (via Netlify Functions) |
| **Database** | Supabase (PostgreSQL) |
| **AI** | OpenAI GPT-4o API |
| **Auth** | Supabase Auth + Google OAuth |
| **Hosting** | Netlify / Docker |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- OpenAI API Key
- (Optional) Supabase account for full features

### Local Development

```bash
# Clone the repository
git clone https://github.com/aiTutor0/ai-tutor.git
cd ai-tutor

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Start development server
npm run dev
```

Open http://localhost:3000 in your browser.

---

## 🐳 Docker Setup

```bash
# Build and run with Docker Compose
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## 📁 Project Structure

```
ai-tutor/
├── assets/
│   └── css/
│       ├── base/
│       │   ├── base.css
│       │   └── theme.css
│       ├── layout/
│       │   └── layout.css
│       ├── views/
│       │   └── views.css
│       └── landingExtras.css
│
├── js/
│   ├── app.js                    # Main entry point
│   ├── config/
│   │   ├── env.js                # Environment config
│   │   └── supabaseClient.js     # Supabase client setup
│   ├── services/
│   │   ├── authService.js        # Authentication
│   │   ├── chatService.js        # Chat operations
│   │   ├── groupChatService.js   # Group chat operations
│   │   ├── openaiService.js      # OpenAI API calls
│   │   ├── roomService.js        # Room management
│   │   └── userService.js        # User management
│   └── ui/
│       ├── adminPanel.js         # Admin panel UI
│       ├── chatUI.js             # Chat interface
│       ├── groupChat.js          # Group chat UI
│       ├── levelTest.js          # English level test
│       ├── router.js             # Page routing
│       ├── scheduleManager.js    # Schedule management
│       ├── themeManager.js       # Dark/light theme
│       └── voiceRecording.js     # Voice recording
│
├── netlify/
│   └── functions/
│       ├── openai.js             # OpenAI serverless function
│       └── transcribe.js         # Speech transcription
│
├── server/
│   └── index.js                  # Express server
│
├── .github/                      # GitHub workflows
├── index.html                    # Main HTML file
├── Dockerfile                    # Docker configuration
├── docker-compose.yml            # Docker Compose config
├── netlify.toml                  # Netlify configuration
├── package.json                  # Dependencies
├── .env.example                  # Environment variables template
├── .gitignore
├── .dockerignore
├── LICENSE
└── README.md
```

---

## 🎨 Features Showcase

### 🌙 Dark Mode
Full dark theme support across all pages with smooth transitions.

### 💬 Chat Features
- Real-time AI responses with typing animation
- Message search and filtering
- Edit and delete messages
- File and image attachments
- Export chat history as TXT

### 👥 Group Chat
- Create and join chat rooms
- Invite other users
- Room-based conversations

### 📊 Level Test
- 10 multiple-choice questions
- CEFR level assessment (A1-C1)
- Progress tracking

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ for English learners worldwide**

</div>
