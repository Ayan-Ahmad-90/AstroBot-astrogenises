let qaPairs = [];
let fuse;
let selectedVoiceLang = "hi-IN"; // Default to Hindi
let isSpeaking = false;

// Load Q&A JSON and set up Fuse.js
fetch("qa_pairs.json")
  .then(res => res.json())
  .then(data => {
    qaPairs = data;
    fuse = new Fuse(qaPairs, {
      keys: ["question"],
      threshold: 0.45, // Allow mild spelling mistakes
      includeScore: true
    });
  });

// Wait until DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("userInput");
  const themeToggle = document.getElementById("btn-mode");
  const voiceSelector = document.getElementById("voice-toggle");
  const clearBtn = document.getElementById("clear-btn");
  const exportBtn = document.getElementById("export-btn");

  setTheme(false);
  loadChatHistory();

  input.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
  });

  themeToggle?.addEventListener("change", () => {
    setTheme(themeToggle.checked);
  });

  voiceSelector?.addEventListener("change", () => {
    selectedVoiceLang = voiceSelector.value;
  });

  clearBtn?.addEventListener("click", () => {
    document.querySelector(".chat-box").innerHTML = "";
    localStorage.removeItem("chatHistory");
  });

  exportBtn?.addEventListener("click", () => {
    const chat = document.querySelector(".chat-box").innerText;
    const blob = new Blob([chat], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "astrobot_chat.txt";
    a.click();
  });
});

// Apply Light or Dark Theme
function setTheme(isDark) {
  const body = document.body;
  const container = document.querySelector(".chat-container");
  const chatBox = document.querySelector(".chat-box");

  body.className = isDark ? "night-theme" : "light-theme";
  container.className = `chat-container ${isDark ? "night" : "light"}`;
  chatBox.className = `chat-box ${isDark ? "night" : "light"}`;
  updateMessageTheme(isDark);
}

function updateMessageTheme(isDark) {
  document.querySelectorAll(".user-msg, .bot-msg").forEach(msg => {
    msg.classList.remove("light", "night");
    msg.classList.add(isDark ? "night" : "light");
  });
}

// Normalize input (remove extra spaces, lowercased)
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/g, "") // keep Hindi/English
    .replace(/\s+/g, " ")
    .trim();
}

// Main Chat Function
async function sendMessage() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();
  if (!message) return;

  appendMessage("user", message);
  input.value = "";
  stopSpeaking();

  const query = normalize(message);
  const results = fuse.search(query);

  if (results.length > 0 && results[0].score < 0.5) {
    const best = results[0].item;
    appendMessage("bot", best.answer);
    speak(best.answer);
    return;
  }

  // Fallback to backend API
  try {
    const res = await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    const reply = data.response || "🤖 Sorry, I don't have an answer.";
    appendMessage("bot", reply);
    speak(reply);
  } catch (err) {
    appendMessage("bot", "⚠ Server error. Please try again.");
  }
}

// Append messages to the chat UI
function appendMessage(sender, text) {
  const chatBox = document.querySelector(".chat-box");
  const msg = document.createElement("div");
  msg.className = `${sender}-msg`;
  msg.classList.add(document.getElementById("btn-mode")?.checked ? "night" : "light");
  msg.innerText = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  saveChat(sender, text);
}

// Text-to-Speech
function speak(text) {
  if (selectedVoiceLang === "off") return;

  const utter = new SpeechSynthesisUtterance(text.replace(/\s+/g, " "));
  utter.lang = selectedVoiceLang;
  utter.rate = 1;
  utter.pitch = 1;
  window.speechSynthesis.speak(utter);
  isSpeaking = true;

  utter.onend = () => {
    isSpeaking = false;
  };
}

function stopSpeaking() {
  if (isSpeaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
  }
}

// Save chat to localStorage
function saveChat(sender, text) {
  let history = JSON.parse(localStorage.getItem("chatHistory")) || [];
  history.push({ sender, text });
  localStorage.setItem("chatHistory", JSON.stringify(history));
}

// Load previous chat
function loadChatHistory() {
  let history = JSON.parse(localStorage.getItem("chatHistory")) || [];
  history.forEach(msg => {
    appendMessage(msg.sender, msg.text);
  });
}
