const sendBtn = document.getElementById("sendBtn");
const input = document.getElementById("promptInput");
const messages = document.getElementById("messages");

const OPENAI_API_KEY = "YOUR_API_KEY_HERE";

async function sendMessage() {
  const userText = input.value.trim();
  if (userText === "") return;

  addMessage(userText, "user");
  input.value = "";

  addMessage("Thinking...", "bot-temp");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: userText }],
    }),
  });

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || "No reply";

  removeTempMessage();
  addMessage(reply, "bot");
}

function addMessage(text, who) {
  const div = document.createElement("div");
  div.className = "msg " + who;
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function removeTempMessage() {
  const temp = document.querySelector(".bot-temp");
  if (temp) temp.remove();
}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
