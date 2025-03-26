import { useState, useEffect, useRef } from "react";
import { FaPaperPlane } from "react-icons/fa";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages([...messages, userMessage]);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ message: input }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch response from server");
      }

      const data = await res.json();
      const botMessage = { sender: "bot", text: data.response };
      setMessages([...messages, userMessage, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages([...messages, userMessage, { sender: "bot", text: "Error connecting to server" }]);
    }

    setInput("");
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <div className="w-full bg-gray-700 text-white text-center py-4 text-lg font-semibold shadow-md">
        AI Chatbot
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-800">
        {messages.map((msg, index) => (
         <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
         <div className={`p-3 rounded-lg max-w-xs shadow-md ${msg.sender === "user" ? "bg-blue-600 text-white" : "bg-gray-700 text-white"}`}>
     
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-gray-700 border-t border-gray-600 flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-3 border border-gray-600 rounded-full bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="ml-3 bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-md"
        >
          <FaPaperPlane size={18} />
        </button>
      </div>
    </div>
  );
}