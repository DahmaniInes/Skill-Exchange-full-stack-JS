import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Send } from "lucide-react";
import "./ChatbotPage.css";
import { toast } from "react-toastify";

const ChatbotPage = () => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const scrollRef = useRef();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/chatbot/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const history = res.data.history.map((msg) => [
          { sender: "user", text: msg.userMessage, time: msg.createdAt },
          { sender: "bot", text: msg.botResponse, time: msg.createdAt },
        ]);
        setMessages(history.flat());
      } catch (err) {
        toast.error("Impossible de charger l’historique");
      }
    };

    fetchHistory();
  }, [token]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!userInput.trim()) return;

    const userMsg = { sender: "user", text: userInput };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/chatbot",
        { message: userInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const botMsg = { sender: "bot", text: res.data.response };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      toast.error("Erreur de communication avec le bot.");
    }

    setUserInput("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <section className="chatbot-page">
      <h3 className="section-title">Chat with our Virtual Assistant</h3>

      <div className="chat-window enhanced-card">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="no-messages">Aucune conversation pour le moment.</div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`chat-bubble ${msg.sender}`}>
                {msg.text}
              </div>
            ))
          )}
          <div ref={scrollRef} style={{ height: "1px" }} />
        </div>

        <div className="chat-input-area">
          <input
            type="text"
            placeholder="Écris un message..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <button onClick={handleSend}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ChatbotPage;
