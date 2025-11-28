const messagesEl = document.getElementById("messages");
const input = document.getElementById("promptInput");
const sendBtn = document.getElementById("sendBtn");
const convList = document.getElementById("conversationsList");
const newBtn = document.getElementById("newConvBtn");
const chatTitle = document.getElementById("chatTitle");

let conversationId = null;
let loading = false;

function addMessage(text, who = "bot") {
  const div = document.createElement("div");
  div.className = "msg " + (who === "user" ? "user" : "bot");
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function setTyping(on) {
  const existing = document.getElementById("typingIndicator");
  if (on) {
    if (!existing) {
      const t = document.createElement("div");
      t.id = "typingIndicator";
      t.className = "msg bot";
      t.textContent = "AI is typing...";
      messagesEl.appendChild(t);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  } else {
    if (existing) existing.remove();
  }
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text || loading) return;
  loading = true;

  addMessage(text, "user");
  input.value = "";

  setTyping(true);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, conversationId }),
    });

    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();

    setTyping(false);
    addMessage(data.reply || "[no reply]", "bot");

    conversationId = data.conversationId || conversationId;

    saveConversationPreview(text, data.reply || "");
  } catch (err) {
    setTyping(false);
    addMessage("Error: " + err.message, "bot");
  } finally {
    loading = false;
  }
}

function saveConversationPreview(userMsg, botReply) {
  let convs = JSON.parse(localStorage.getItem("convs") || "[]");
  const id = conversationId || "local-" + Date.now();

  const idx = convs.findIndex((c) => c.id === id);
  if (idx >= 0) {
    convs[idx].preview = botReply;
  } else {
    convs.unshift({
      id,
      title: userMsg.slice(0, 30) || "New chat",
      preview: botReply.slice(0, 60),
    });
  }

  localStorage.setItem("convs", JSON.stringify(convs));
  renderConversations();
}

function renderConversations() {
  convList.innerHTML = "";
  const convs = JSON.parse(localStorage.getItem("convs") || "[]");

  convs.forEach((c) => {
    const el = document.createElement("div");
    el.className = "conv";
    el.textContent = c.title + "\n" + (c.preview || "");
    el.onclick = () => startConversation(c.id, c.title);
    convList.appendChild(el);
  });
}

function startConversation(id, title) {
  conversationId = id;
  chatTitle.textContent = title || "Chat";
  messagesEl.innerHTML = "";
  addMessage("Conversation restored (only preview stored locally).", "bot");
}

newBtn.addEventListener("click", () => {
  conversationId = null;
  chatTitle.textContent = "New Chat";
  messagesEl.innerHTML = "";
});

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

renderConversations();
