import { useState, useEffect, useRef } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { v4 as uuidv4 } from "uuid";

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

  const sendMessage = async (questionText = input) => {
    if (!questionText.trim()) return;

    const userMessage = { sender: "user", text: questionText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: questionText }),
      });

      if (!res.ok) throw new Error("Failed to fetch response from server");

      const data = await res.json();
      const botMessage = {
        sender: "bot",
        text: data.response,
        suggestions: data.suggestedQuestions || [], // make sure this field exists in backend
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error connecting to server" },
      ]);
    }
  };

  return (
    <div className="flex h-screen bg-[#f0f8ff]">
      {/* Sidebar for Chat History */}
      <div className="w-1/4 bg-white p-4 shadow-md overflow-y-auto border-r border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Chat History</h2>
        {/* Chat history groups */}
        <div className="mb-4">
          <h3 className="text-sm text-gray-500 mb-1">Today</h3>
          <ul>
            <li className="cursor-pointer hover:bg-gray-100 p-2 rounded">Integrate MySQL with Chatbot</li>
            <li className="cursor-pointer hover:bg-gray-100 p-2 rounded">Chatbot Schema Design</li>
          </ul>
        </div>
        <div className="mb-4">
          <h3 className="text-sm text-gray-500 mb-1">Yesterday</h3>
          <ul>
            <li className="cursor-pointer hover:bg-gray-100 p-2 rounded">React Chat Component Explanation</li>
            <li className="cursor-pointer hover:bg-gray-100 p-2 rounded">What is a Token</li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm text-gray-500 mb-1">Previous 7 Days</h3>
          <ul>
            <li className="cursor-pointer hover:bg-gray-100 p-2 rounded">FastAPI Google Chatbot Integration</li>
            <li className="cursor-pointer hover:bg-gray-100 p-2 rounded">Java Developer Introduction</li>
          </ul>
        </div>
      </div>

      {/* Main Chat UI */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 m-4">
        {/* Header */}
        <div className="bg-white text-center py-4 text-lg font-semibold border-b border-gray-300">
          <span className="text-gray-700">Hi, I'm AI Chatbot.</span>
          <p className="text-sm text-gray-500">How can I help you today?</p>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3" style={{ maxHeight: "calc(100vh - 180px)" }}>
          {messages.map((msg, index) => (
            <div key={index} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
              <div className={`p-3 rounded-lg max-w-xs shadow-md ${
                msg.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
              }`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>

              {/* Follow-up question buttons */}
              {msg.sender === "bot" && msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {msg.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(suggestion)}
                      className="text-sm px-3 py-1 bg-gray-300 hover:bg-blue-400 hover:text-white rounded-full transition"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
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
            onClick={() => sendMessage()}
            className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none shadow-lg"
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
}
