const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { email, password, username } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const newUser = new User({ email, password: hashedPassword, username });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(400).json({ error: "User registration failed" });
  }
});

// routes/auth.js
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Incorrect password" });
      }
  
      // Generate JWT Token
      const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
        expiresIn: "1h",
      });
      res.status(200).json({ token, username: user.username, userId: user._id });

    } catch (error) {
      console.error("Login error:", error); // Add this line to log the error
      res.status(500).json({ error: "Login failed" });
    }
  });
  

router.get("/users", async (req, res) => {
    try {
      const users = await User.find({}, "username"); // Retrieve only the username field
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: "Could not fetch users" });
    }
  });


module.exports = router;
