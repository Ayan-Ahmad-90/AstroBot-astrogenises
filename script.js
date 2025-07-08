let qaPairs = [];
let fuse;
let selectedVoiceLang = "hi-IN";
let isSpeaking = false;
let selectedIndex = -1;

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

  input.addEventListener("keydown", (e) => {
    const items = document.querySelectorAll(".suggestion-item");
    if (!items.length) return;

    if (e.key === "ArrowDown") {
      selectedIndex = (selectedIndex + 1) % items.length;
    } else if (e.key === "ArrowUp") {
      selectedIndex = (selectedIndex - 1 + items.length) % items.length;
    } else if (e.key === "Enter" && selectedIndex > -1) {
      e.preventDefault();
      items[selectedIndex].click();
      selectedIndex = -1;
      return;
    }

    items.forEach((item, idx) => {
      item.classList.toggle("selected", idx === selectedIndex);
    });
  });

  document.getElementById("suggestions").addEventListener("click", (e) => {
    const target = e.target.closest(".suggestion-item");
    if (target) {
      input.value = target.innerText;
      document.getElementById("suggestions").innerHTML = "";
    }
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
});

// Theme functions
function setTheme(isDark) {
  document.body.className = isDark ? "night-theme" : "light-theme";
  document.querySelector(".chat-container").className = `chat-container ${isDark ? "night" : "light"}`;
  document.querySelector(".chat-box").className = `chat-box ${isDark ? "night" : "light"}`;
  updateMessageTheme(isDark);
}

function updateMessageTheme(isDark) {
  document.querySelectorAll(".user-msg, .bot-msg").forEach(msg => {
    msg.classList.remove("light", "night");
    msg.classList.add(isDark ? "night" : "light");
  });
}

// Chat
async function sendMessage() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();
  if (!message) return;

  appendMessage("user", message);
  input.value = "";
  stopSpeaking();
  document.getElementById("suggestions").innerHTML = "";

  const results = fuse.search(message);
  if (results.length > 0 && results[0].score < 0.5) {
    const best = results[0].item;
    appendTypingAnimation(best.answer);
    speak(best.answer);
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
    appendTypingAnimation(reply);
    speak(reply);
  } catch (err) {
    appendMessage("bot", "⚠ Server error. Please try again.");
  }
}

// Append message to UI
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

// Typing animation
function appendTypingAnimation(text) {
  const chatBox = document.querySelector(".chat-box");
  const msg = document.createElement("div");
  msg.className = "bot-msg";
  msg.classList.add(document.getElementById("btn-mode").checked ? "night" : "light");
  chatBox.appendChild(msg);

  let i = 0;
  const typing = setInterval(() => {
    msg.textContent += text[i];
    i++;
    if (i >= text.length) clearInterval(typing);
  }, 20);

  chatBox.scrollTop = chatBox.scrollHeight;
  saveChat("bot", text);
}

// Voice
function speak(text) {
  if (selectedVoiceLang === "off") return;
  const utter = new SpeechSynthesisUtterance(text.replace(/\s+/g, " "));
  utter.lang = selectedVoiceLang;
  utter.rate = 0.95;
  utter.pitch = 1;
  window.speechSynthesis.speak(utter);
  isSpeaking = true;
  utter.onend = () => { isSpeaking = false; };
}

function stopSpeaking() {
  if (isSpeaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
  }
}

// Local Storage Chat History
function saveChat(sender, text) {
  let history = JSON.parse(localStorage.getItem("chatHistory")) || [];
  history.push({ sender, text });
  localStorage.setItem("chatHistory", JSON.stringify(history));
}

function loadChatHistory() {
  let history = JSON.parse(localStorage.getItem("chatHistory")) || [];
  history.forEach(msg => appendMessage(msg.sender, msg.text));
}

// Suggestion dropdown
function showSuggestions() {
  const input = document.getElementById("userInput");
  const val = input.value.toLowerCase();
  const suggestionBox = document.getElementById("suggestions");
  if (!val) {
    suggestionBox.innerHTML = "";
    return;
  }

  const matches = qaPairs
    .filter(q => q.question.toLowerCase().includes(val))
    .slice(0, 5);

  if (matches.length === 0) {
    suggestionBox.innerHTML = "";
    return;
  }

  const suggestionHTML = matches.map((q, i) => {
    const matchIndex = q.question.toLowerCase().indexOf(val);
    const before = q.question.slice(0, matchIndex);
    const match = q.question.slice(matchIndex, matchIndex + val.length);
    const after = q.question.slice(matchIndex + val.length);
    return `<div class="suggestion-item" data-index="${i}">
              ${before}<b>${match}</b>${after}
            </div>`;
  }).join("");

  suggestionBox.innerHTML = suggestionHTML;
  selectedIndex = -1;
}
