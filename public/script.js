const socket = io();

const form = document.getElementById("chat-form");
const input = document.getElementById("message-input");
const messages = document.getElementById("messages");

// Get username from localStorage or prompt
let username = localStorage.getItem("chatUsername");
if (!username) {
  username = prompt("Enter your username:") || "Anonymous";
  localStorage.setItem("chatUsername", username);
}

// Change username button
document.getElementById("change-username").addEventListener("click", () => {
  const newName = prompt("Enter new username:", username);
  if (newName && newName.trim().length > 0) {
    username = newName.trim();
    localStorage.setItem("chatUsername", username);
    alert(`Username changed to ${username}`);
  }
});


// Send message
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value) {
    const msgData = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 8), // unique ID
      user: username,
      text: input.value,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    socket.emit("chat message", msgData);
    input.value = "";
  }
});

// Helper to render a message
function renderMessage(msgData) {
  const li = document.createElement("li");
  li.dataset.id = msgData.id;
  li.classList.add(msgData.user === username ? "my-message" : "other-message");

  li.innerHTML = `
    <span class="msg-text">${msgData.text}</span>
    <span class="msg-meta">${msgData.user} • ${msgData.time}</span>
  `;

  // Only sender gets delete button
  if (msgData.user === username) {
    const delBtn = document.createElement("button");
    delBtn.textContent = "×";
    delBtn.className = "delete-btn";
    delBtn.title = "Delete message";
    delBtn.onclick = function() {
      socket.emit("delete message", msgData.id); // tell server
    };
    li.appendChild(delBtn);
  }

  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
}


// Load messages from localStorage on page load
function loadMessages(arr) {
  messages.innerHTML = "";
  arr.forEach((msg, idx) => renderMessage(msg, idx));
}

// On first load, wait for server history
let loadedFromServer = false;
socket.on("chat history", (serverMessages) => {
  // Save to localStorage and render
  localStorage.setItem("chatMessages", JSON.stringify(serverMessages));
  loadMessages(serverMessages);
  loadedFromServer = true;
});

// If server doesn't respond in 1s, fallback to localStorage
setTimeout(() => {
  if (!loadedFromServer) {
    const saved = localStorage.getItem("chatMessages");
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        loadMessages(arr);
      } catch {}
    }
  }
}, 1000);

// Save message to localStorage
function saveMessage(msgData) {
  let arr = [];
  const saved = localStorage.getItem("chatMessages");
  if (saved) {
    try {
      arr = JSON.parse(saved);
    } catch {}
  }
  arr.push(msgData);
  localStorage.setItem("chatMessages", JSON.stringify(arr));
}

// Delete message from localStorage
function deleteMessage(idx) {
  let arr = [];
  const saved = localStorage.getItem("chatMessages");
  if (saved) {
    try {
      arr = JSON.parse(saved);
    } catch {}
  }
  if (idx !== null && idx >= 0 && idx < arr.length) {
    arr.splice(idx, 1);
    localStorage.setItem("chatMessages", JSON.stringify(arr));
  }
}

// Receive message
socket.on("chat message", (msgData) => {
  // Get current messages to determine index
  let arr = [];
  const saved = localStorage.getItem("chatMessages");
  if (saved) {
    try {
      arr = JSON.parse(saved);
    } catch {}
  }
  renderMessage(msgData, arr.length);
  saveMessage(msgData);
});

socket.on("delete message", (msgId) => {
  // Remove from DOM
  const li = messages.querySelector(`li[data-id="${msgId}"]`);
  if (li) li.remove();

  // Remove from localStorage
  let arr = [];
  const saved = localStorage.getItem("chatMessages");
  if (saved) {
    try {
      arr = JSON.parse(saved);
    } catch {}
  }
  arr = arr.filter(m => m.id !== msgId);
  localStorage.setItem("chatMessages", JSON.stringify(arr));
});
