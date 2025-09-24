const socket = io();

const form = document.getElementById("chat-form");
const input = document.getElementById("message-input");
const messages = document.getElementById("messages");

// Get username from localStorage or prompt
let username = localStorage.getItem("chatUsername");
if (!username) {
  username = prompt("Enter your username:");
  if (!username) username = "Anonymous";
  localStorage.setItem("chatUsername", username);
}

// Send message
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value) {
    const msgData = {
      user: username,
      text: input.value,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    socket.emit("chat message", msgData);
    input.value = "";
  }
});

// Receive message
socket.on("chat message", (msgData) => {
  const li = document.createElement("li");
  li.classList.add(msgData.user === username ? "my-message" : "other-message");

  li.innerHTML = `<span class="msg-text">${msgData.text}</span>
                  <span class="msg-meta">${msgData.user} • ${msgData.time}</span>`;

  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
});
