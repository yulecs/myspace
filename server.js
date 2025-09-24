const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// Path for storing messages
const messagesFile = path.join(__dirname, "messages.json");

// Load messages from file at startup
let messages = [];
if (fs.existsSync(messagesFile)) {
  try {
    const data = fs.readFileSync(messagesFile, "utf-8");
    if (data.trim().length > 0) {
      messages = JSON.parse(data);
    } else {
      messages = [];
    }
  } catch (err) {
    console.error("Failed to read messages.json:", err);
    messages = [];
  }
} else {
  fs.writeFileSync(messagesFile, "[]", "utf-8");
}

// Helper: save messages to file
function saveMessages() {
  fs.writeFile(messagesFile, JSON.stringify(messages, null, 2), (err) => {
    if (err) console.error("Failed to save messages:", err);
  });
}

io.on("connection", (socket) => {
  console.log("New user connected");

  // Send chat history to newly connected client
  socket.emit("chat history", messages);

  // Handle new message
  socket.on("chat message", (msgData) => {
    messages.push(msgData);
    saveMessages();
    io.emit("chat message", msgData);
  });

  // ✅ Handle delete message INSIDE here
  socket.on("delete message", (msgId) => {
    messages = messages.filter(m => m.id !== msgId);
    saveMessages();
    io.emit("delete message", msgId); // tell all clients
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
