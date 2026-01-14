// js/ui/chatUI.js
import { callOpenAI } from "../services/openaiService.js";

let els = {};
let currentToolMode = "chat";

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function addMessage(text, sender) {
  const div = document.createElement("div");
  div.className = `message ${sender === "user" ? "user-msg" : "ai-msg"}`;
  div.innerHTML = `
    <div class="msg-avatar">${sender === "user" ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>'}</div>
    <div class="msg-bubble">${escapeHtml(text)}</div>
  `;
  els.chatWindow.appendChild(div);
  els.chatWindow.scrollTop = els.chatWindow.scrollHeight;
}

function getToolMeta(mode) {
  if (mode === "chat") return { title: "Free Conversation", welcome: "Let's chat about anything!" };
  if (mode === "interview") return { title: "Mock Interview", welcome: "Tell me about yourself. (Start with your experience!)" };
  if (mode === "grammar") return { title: "Grammar Fixer", welcome: "Paste your text here and I will correct it." };
  if (mode === "tutor") return { title: "Topic Explainer", welcome: "Ask me a grammar rule or topic." };
  return { title: "Tool", welcome: "Hello!" };
}

export function setTool(mode) {
  currentToolMode = mode;
  const meta = getToolMeta(mode);

  if (els.toolTitle) els.toolTitle.textContent = meta.title;
  if (els.chatWindow) els.chatWindow.innerHTML = "";
  addMessage(meta.welcome, "ai");
}

export async function sendMessage() {
  const text = (els.userInput?.value ?? "").trim();
  if (!text) return;

  els.userInput.value = "";
  addMessage(text, "user");

  // typing indicator
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "message ai-msg";
  loadingDiv.innerHTML = `
    <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
    <div class="msg-bubble">Thinking...</div>
  `;
  els.chatWindow.appendChild(loadingDiv);
  els.chatWindow.scrollTop = els.chatWindow.scrollHeight;

  try {
    const aiText = await callOpenAI({ toolMode: currentToolMode, userText: text });
    loadingDiv.remove();
    addMessage(aiText, "ai");
  } catch (err) {
    loadingDiv.remove();
    addMessage("Connection error. (Check OpenAI proxy / API)", "ai");
    console.error(err);
  }
}

export function exportChat() {
  alert("Export feature is coming soon!");
}

export function initChatUI() {
  els = {
    chatWindow: document.getElementById("chat-window"),
    userInput: document.getElementById("user-input"),
    toolTitle: document.getElementById("tool-title"),
  };

  
  els.userInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  
  window.sendMessage = sendMessage;
  window.exportChat = exportChat;
}
