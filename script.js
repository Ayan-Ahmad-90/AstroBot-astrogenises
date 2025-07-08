document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("userInput");
    const toggle = document.getElementById("btn-mode");
    setTheme(false);

    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
    });
    toggle.addEventListener("change", () => {
        const isDark = toggle.checked;
        setTheme(isDark);
    });
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

    try {
        const response = await fetch("http://127.0.0.1:8000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });
        const data = await response.json();
        appendMessage("bot", data.response || "🤖 Sorry, I don't have an answer.");
    } catch (error) {
        appendMessage("bot", "⚠ Server error. Please try again.");
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
}