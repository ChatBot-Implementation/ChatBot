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
    <div className="flex justify-center items-center h-screen bg-[#f0f8ff]">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col border border-gray-200" style={{ height: "75vh" }}>
        {/* Chat Header */}
        <div className="bg-white text-center py-4 text-lg font-semibold border-b border-gray-300">
          <span className="text-gray-700">Hi, I'm AI Chatbot.</span>
          <p className="text-sm text-gray-500">How can I help you today?</p>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3" style={{ maxHeight: "calc(75vh - 130px)" }}>
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`p-3 rounded-lg max-w-xs ${msg.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Field */}
        <div className="p-4 bg-white border-t border-gray-300 flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            placeholder="Message Chatbot"
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none shadow-lg"
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
}