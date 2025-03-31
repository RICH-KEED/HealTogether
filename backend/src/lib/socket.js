import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5176", "http://127.0.0.1:5176"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Join group rooms for this user
  if (userId) {
    const joinUserGroups = async () => {
      try {
        // This would require importing Group model, which complicates things
        // In a real app, you'd fetch user's groups and join those rooms
        // For now, we'll join rooms when user explicitly accesses a group
      } catch (error) {
        console.error("Error joining user groups:", error);
      }
    };
    
    joinUserGroups();
  }

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
