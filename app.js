// app.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat"); // Import chat routes



dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite frontend URL
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({ origin: "https://your-netlify-app.netlify.app" })); // Replace with your Netlify URL

// Use routes
app.use("/auth", authRoutes);
app.use("/chat", chatRoutes); // Add chat routes here

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch((error) => console.log("MongoDB connection error:", error));

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on("message", ({ roomId, message }) => {
    io.to(roomId).emit("message", message); // Broadcast to the room only
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
