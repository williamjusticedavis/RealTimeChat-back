const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");

dotenv.config();
const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS for Netlify front end
const io = new Server(server, {
  cors: {
    origin: "https://realtimechat-front.netlify.app",
    methods: ["GET", "POST"],
    credentials: true
  },
});
app.set("io", io);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// CORS setup for Express routes
const allowedOrigins = [
  "https://realtimechat-front.netlify.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

// Use routes
app.use("/auth", authRoutes);
app.use("/chat", chatRoutes);

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

  // Join Room
  socket.on("joinRoom", (userId) => {
    socket.join(userId);
    console.log(`User ${socket.id} joined room ${userId}`);
  });

  // Add or remove reaction
  socket.on("addReaction", async ({ messageId, emoji, userId }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;

      // Check if the reaction already exists
      const existingReaction = message.emojisReacted.find(
        (reaction) => reaction.emoji === emoji && reaction.reactedBy.toString() === userId
      );

      if (existingReaction) {
        // Remove the existing reaction
        message.emojisReacted = message.emojisReacted.filter(
          (reaction) => !(reaction.emoji === emoji && reaction.reactedBy.toString() === userId)
        );
      } else {
        // Add a new reaction
        message.emojisReacted.push({ emoji, reactedBy: userId });
      }

      await message.save();

      // Emit updated reactions to both the sender and receiver
      io.to(message.sender.toString()).emit("updateReactions", { messageId, emojisReacted: message.emojisReacted });
      io.to(message.receiver.toString()).emit("updateReactions", { messageId, emojisReacted: message.emojisReacted });

    } catch (error) {
      console.error("Failed to update reaction:", error);
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
