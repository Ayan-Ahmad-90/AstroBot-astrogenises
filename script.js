let qaPairs = [];
let fuse;
let selectedVoiceLang = "hi-IN";
let isSpeaking = false;

// Load JSON and setup Fuse.js
fetch("qa_pairs.json")
  .then(res => res.json())
  .then(data => {
    qaPairs = data;
    fuse = new Fuse(qaPairs, {
      keys: ["question"],
      threshold: 0.4,
      includeScore: true
    });
  });

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("userInput");
  const themeToggle = document.getElementById("btn-mode");
  const voiceSelector = document.getElementById("voice-toggle");
  const clearBtn = document.getElementById("clear-btn");
  const exportBtn = document.getElementById("export-btn");
  const micBtn = document.getElementById("mic-btn");

  setTheme(false);
  loadChatHistory();

  input.addEventListener("input", handleSuggestions);
  input.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
  });

  themeToggle.addEventListener("change", () => {
    setTheme(themeToggle.checked);
  });

  voiceSelector.addEventListener("change", () => {
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

  micBtn?.addEventListener("click", startVoiceInput);
});

// Theme toggle
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

// Main chat handler
async function sendMessage() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();
  if (!message) return;
  appendMessage("user", message);
  input.value = "";
  stopSpeaking();
  hideSuggestions();
  showTypingIndicator();

  const results = fuse.search(message);
  if (results.length > 0 && results[0].score < 0.5) {
    const best = results[0].item;
    setTimeout(() => {
      removeTypingIndicator();
      appendMessage("bot", best.answer);
    }, 1000);
    return;
  }

  try {
    const res = await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    const data = await res.json();
    const reply = data.response || "🤖 Sorry, I don't have an answer.";
    setTimeout(() => {
      removeTypingIndicator();
      appendMessage("bot", reply);
    }, 1000);
  } catch {
    removeTypingIndicator();
    appendMessage("bot", "⚠ Server error. Please try again.");
  }
}

function appendMessage(sender, text) {
  const chatBox = document.querySelector(".chat-box");
  const msg = document.createElement("div");
  msg.className = `${sender}-msg`;
  msg.classList.add(document.getElementById("btn-mode").checked ? "night" : "light");

  if (sender === "bot") {
    let i = 0;
    msg.innerText = "";
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    const typing = setInterval(() => {
      if (i < text.length) {
        msg.innerText += text.charAt(i);
        chatBox.scrollTop = chatBox.scrollHeight;
        i++;
      } else {
        clearInterval(typing);
        saveChat(sender, text);
        speak(text);
      }
    }, 30);
  } else {
    msg.innerText = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    saveChat(sender, text);
  }
}

function speak(text) {
  if (selectedVoiceLang === "off") return;
  const utter = new SpeechSynthesisUtterance(text.replace(/\s+/g, " "));
  utter.lang = selectedVoiceLang;
  utter.rate = 0.98;
  utter.pitch = 1;
  window.speechSynthesis.speak(utter);
  isSpeaking = true;
  utter.onend = () => (isSpeaking = false);
}

function stopSpeaking() {
  if (isSpeaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
  }
}

function saveChat(sender, text) {
  let history = JSON.parse(localStorage.getItem("chatHistory")) || [];
  history.push({ sender, text });
  localStorage.setItem("chatHistory", JSON.stringify(history));
}

function loadChatHistory() {
  let history = JSON.parse(localStorage.getItem("chatHistory")) || [];
  history.forEach(msg => appendMessage(msg.sender, msg.text));
}

// Typing dots
function showTypingIndicator() {
  const chatBox = document.querySelector(".chat-box");
  const dot = document.createElement("div");
  dot.className = "bot-msg typing-dots";
  dot.innerText = "AstroBot is typing...";
  chatBox.appendChild(dot);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTypingIndicator() {
  const dot = document.querySelector(".typing-dots");
  dot?.remove();
}

// Suggestions
function handleSuggestions(e) {
  const val = e.target.value.trim();
  const box = document.getElementById("suggestions");
  if (!val || !fuse) return (box.innerHTML = "");
  const result = fuse.search(val).slice(0, 3);
  box.innerHTML = result.map(r => `<div class='suggestion'>${r.item.question}</div>`).join("\n");
  document.querySelectorAll(".suggestion").forEach(el => {
    el.addEventListener("click", () => {
      document.getElementById("userInput").value = el.innerText;
      box.innerHTML = "";
    });
  });
}

function hideSuggestions() {
  document.getElementById("suggestions").innerHTML = "";
}

// Voice input
function startVoiceInput() {
  if (!('webkitSpeechRecognition' in window)) {
    alert("🎙️ Your browser does not support voice recognition.");
    return;
  }
  const recognition = new webkitSpeechRecognition();
  recognition.lang = selectedVoiceLang;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (e) => {
    document.getElementById("userInput").value = e.results[0][0].transcript;
    sendMessage();
  };
  recognition.onerror = (e) => console.error("Speech error:", e);
  recognition.start();
}
