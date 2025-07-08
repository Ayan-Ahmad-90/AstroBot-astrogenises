let isVoiceEnabled = true;

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("userInput");
    const toggle = document.getElementById("btn-mode");
    const micButton = document.getElementById("mic-btn");
    const voiceToggle = document.getElementById("voice-toggle");
    const clearButton = document.getElementById("clear-btn");
    const exportButton = document.getElementById("export-btn");

    setTheme(false);
    loadChatHistory();

    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            speechSynthesis.cancel(); // 🛑 Stop speaking
            sendMessage();
        }
    });

    toggle.addEventListener("change", () => {
        setTheme(toggle.checked);
    });

    micButton.addEventListener("click", startVoiceRecognition);

    voiceToggle.addEventListener("click", () => {
        isVoiceEnabled = !isVoiceEnabled;
        voiceToggle.innerText = isVoiceEnabled ? "🔊" : "🔇";
    });

    clearButton.addEventListener("click", clearChat);
    exportButton.addEventListener("click", exportChat);
});

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

async function sendMessage() {
    const input = document.getElementById("userInput");
    const message = input.value.trim();
    if (!message) return;

    appendMessage("user", message);
    input.value = "";

    const chatBox = document.querySelector(".chat-box");
    const loadingMsg = document.createElement("div");
    loadingMsg.className = "bot-msg loading";
    loadingMsg.classList.add(document.getElementById("btn-mode").checked ? "night" : "light");
    loadingMsg.innerText = "AstroBot is typing...";
    chatBox.appendChild(loadingMsg);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetchWithRetry("http://127.0.0.1:8000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        loadingMsg.remove();
        await typeMessage("bot", data.response || "🤖 Sorry, I don't have an answer.");
    } catch (error) {
        loadingMsg.remove();
        appendMessage("bot", "⚠ Server error. Please try again later.");
    }
}

function appendMessage(sender, text) {
    const chatBox = document.querySelector(".chat-box");
    const msg = document.createElement("div");
    msg.className = `${sender}-msg`;
    msg.classList.add(document.getElementById("btn-mode").checked ? "night" : "light");
    msg.innerText = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    saveChatHistory();
}

async function typeMessage(sender, text, delay = 20) {
    const chatBox = document.querySelector(".chat-box");
    const msg = document.createElement("div");
    msg.className = `${sender}-msg`;
    msg.classList.add(document.getElementById("btn-mode").checked ? "night" : "light");
    chatBox.appendChild(msg);

    const cleanText = text.replace(/\s+/g, " ").trim();

    if (isVoiceEnabled) speakText(cleanText);

    for (let i = 0; i < cleanText.length; i++) {
        msg.innerText += cleanText[i];
        await new Promise(res => setTimeout(res, delay));
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    saveChatHistory();
}

async function fetchWithRetry(url, options, retries = 1) {
    try {
        return await fetch(url, options);
    } catch (err) {
        if (retries > 0) {
            console.warn("Retrying fetch...");
            return await fetchWithRetry(url, options, retries - 1);
        } else {
            throw err;
        }
    }
}

function speakText(text) {
    speechSynthesis.cancel(); // Stop previous voice
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1.1;
    speechSynthesis.speak(utterance);
}

function startVoiceRecognition() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById("userInput").value = transcript;
        sendMessage();
    };

    recognition.onerror = (event) => {
        alert("🎙️ Voice error: " + event.error);
    };

    recognition.start();
}

function saveChatHistory() {
    const chatBox = document.querySelector(".chat-box");
    localStorage.setItem("astrobot-chat", chatBox.innerHTML);
}

function loadChatHistory() {
    const chatBox = document.querySelector(".chat-box");
    const saved = localStorage.getItem("astrobot-chat");
    if (saved) {
        chatBox.innerHTML = saved;
        updateMessageTheme(document.getElementById("btn-mode").checked);
    }
}

function clearChat() {
    const chatBox = document.querySelector(".chat-box");
    chatBox.innerHTML = "";
    localStorage.removeItem("astrobot-chat");
    speechSynthesis.cancel();
}

function exportChat() {
    const chatBox = document.querySelector(".chat-box");
    const text = [...chatBox.children]
        .map(div => div.innerText)
        .join("\n");

    const blob = new Blob([text], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "astrobot_chat.txt";
    link.click();
}
