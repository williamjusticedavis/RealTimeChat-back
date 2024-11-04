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
  }
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

  socket.on("joinRoom", (userId) => {
    socket.join(userId);
    console.log(`User ${socket.id} joined room ${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
