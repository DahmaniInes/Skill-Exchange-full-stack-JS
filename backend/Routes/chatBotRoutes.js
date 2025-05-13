const express = require("express");
const router = express.Router();
const axios = require("axios");

const ChatBotMessage = require("../Models/ChatBotMessage");
const verifySession = require("../middleware/verifySession");

const User = require("../Models/User");
const attachUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error("Attach user error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

router.post("/", verifySession, attachUser, async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === "") {
    return res.status(400).json({ error: "Message utilisateur requis" });
  }

  try {
    const flaskResponse = await axios.post("http://localhost:5005/chat", {
      message,
    });

    const botResponse = flaskResponse.data.response;

    const savedMessage = await ChatBotMessage.create({
      userMessage: message,
      botResponse,
      userId: req.user._id,
    });

    res.status(200).json({
      response: botResponse,
      messageId: savedMessage._id,
    });
  } catch (err) {
    console.error("[Chatbot POST Error]", err.message);
    res
      .status(500)
      .json({ error: "Erreur de communication avec l'API du chatbot." });
  }
});

router.get("/history", verifySession, attachUser, async (req, res) => {
  try {
    const userId = req.user._id;

    const history = await ChatBotMessage.find({ userId })
      .sort({ createdAt: -1 })
      .select("userMessage botResponse createdAt")
      .lean();

    res.status(200).json({ history });
  } catch (err) {
    console.error("Chatbot history error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
