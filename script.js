let qaPairs = [];
let fuse;
let selectedVoiceLang = "hi-IN";
let isSpeaking = false;

// Load Q&A JSON
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

  setTheme(false);
  loadChatHistory();

  input.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
  });

  input.addEventListener("input", showSuggestions);

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

  setupMic(); // 🎤 Initialize voice input
});

// THEME TOGGLE
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

// MAIN MESSAGE HANDLER
async function sendMessage() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();
  if (!message) return;

  appendMessage("user", message);
  input.value = "";
  stopSpeaking();
  clearSuggestions();

  // Try local match first
  const results = fuse.search(message);
  if (results.length > 0 && results[0].score < 0.5) {
    const best = results[0].item;
    appendMessage("bot", best.answer);
    speak(best.answer);
    return;
  }

  // API fallback
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

// APPEND CHAT TO UI
function appendMessage(sender, text) {
  const chatBox = document.querySelector(".chat-box");
  const msg = document.createElement("div");
  msg.className = `${sender}-msg`;
  msg.classList.add(document.getElementById("btn-mode").checked ? "night" : "light");
  msg.innerText = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  saveChat(sender, text);
}

// TEXT-TO-SPEECH
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

// SAVE CHAT
function saveChat(sender, text) {
  let history = JSON.parse(localStorage.getItem("chatHistory")) || [];
  history.push({ sender, text });
  localStorage.setItem("chatHistory", JSON.stringify(history));
}

function loadChatHistory() {
  let history = JSON.parse(localStorage.getItem("chatHistory")) || [];
  history.forEach(msg => {
    appendMessage(msg.sender, msg.text);
  });
}

// 🎙️ MIC VOICE INPUT
function setupMic() {
  const micBtn = document.getElementById("mic-btn");
  const inputBox = document.getElementById("userInput");

  let recognition;
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      inputBox.value = transcript;
      sendMessage(); // optional: auto-send
    };

    recognition.onerror = (event) => {
      console.error("Voice error:", event.error);
    };

    micBtn.addEventListener("click", () => {
      recognition.lang = document.getElementById("voice-toggle").value.includes("hi") ? "hi-IN" : "en-IN";
      recognition.start();
    });
  } else {
    micBtn.disabled = true;
    micBtn.title = "Voice not supported in this browser";
  }
}

// 🧠 AUTO SUGGESTIONS
function showSuggestions() {
  const query = document.getElementById("userInput").value.trim();
  const suggestionBox = document.getElementById("suggestions");

  if (!query) {
    suggestionBox.innerHTML = "";
    return;
  }

  const results = fuse.search(query).slice(0, 5);
  suggestionBox.innerHTML = results.map(r =>
    `<div class="suggestion-item" onclick="fillSuggestion('${r.item.question}')">${r.item.question}</div>`
  ).join("");
}

function fillSuggestion(text) {
  document.getElementById("userInput").value = text;
  document.getElementById("suggestions").innerHTML = "";
  sendMessage(); // Optional: auto-send
}

function clearSuggestions() {
  const suggestionBox = document.getElementById("suggestions");
  suggestionBox.innerHTML = "";
}
