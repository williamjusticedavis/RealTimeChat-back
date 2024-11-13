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
  
router.post("/react", async (req, res) => {
  const { messageId, emoji, userId } = req.body;
  
  try {
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });

    // Check if the reaction already exists
    const existingReaction = message.emojisReacted.find(
      (reaction) => reaction.emoji === emoji && reaction.reactedBy.toString() === userId
    );

    if (existingReaction) {
      // Remove reaction
      message.emojisReacted = message.emojisReacted.filter(
        (reaction) => !(reaction.emoji === emoji && reaction.reactedBy.toString() === userId)
      );
    } else {
      // Add new reaction
      message.emojisReacted.push({ emoji, reactedBy: userId });
    }

    await message.save();
    res.status(200).json(message.emojisReacted);
  } catch (error) {
    res.status(500).json({ error: "Failed to update reaction" });
  }
});

