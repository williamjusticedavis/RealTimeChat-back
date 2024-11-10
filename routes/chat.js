const express = require("express");
const Message = require("../models/Message");

const router = express.Router();

// Send a message
router.post("/send", async (req, res) => {
  const { senderId, receiverId, content } = req.body;
  const io = req.app.get("io");

  try {
    console.log('Sending message');
    const message = new Message({ sender: senderId, receiver: receiverId, content });
    await message.save();

    if (senderId === receiverId) {
      console.log(`Emitting self-message to user ${senderId}`);
      io.to(senderId).emit("newMessage", message);
    } else {
      console.log(`Emitting message from ${senderId} to ${receiverId}`);
      io.to(receiverId).emit("newMessage", message);
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
});


router.get("/messages/:userId/:contactId", async (req, res) => {
    const { userId, contactId } = req.params;
  
    try {
      const messages = await Message.find({
        $or: [
          { sender: userId, receiver: contactId },
          { sender: contactId, receiver: userId },
        ],
      }).sort({ timestamp: 1 });
  
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve messages" });
    }
  });
  
module.exports = router;
  
