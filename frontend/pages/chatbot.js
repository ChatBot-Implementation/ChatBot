import { useState, useEffect, useRef } from "react";
import { FaPaperPlane, FaTrash, FaPlus } from "react-icons/fa";
import { useRouter } from "next/router";
import { v4 as uuidv4 } from "uuid";
import ChatBot from "../components/ChatBot";

const ITEMS_PER_PAGE = 10;

export default function Chat() {
  const [sessions, setSessions] = useState({});
  const [activeSession, setActiveSession] = useState(null);
  const [input, setInput] = useState("");
  const [chatPage, setChatPage] = useState(0);
  const [messagePage, setMessagePage] = useState(0);
  const messagesEndRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const storedSessions = JSON.parse(localStorage.getItem("sessions")) || {};
    const sessionIds = Object.keys(storedSessions);
    setSessions(storedSessions);
    if (sessionIds.length > 0) setActiveSession(sessionIds[0]);
    else handleNewChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeSession, sessions, messagePage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleNewChat = () => {
    const newId = uuidv4();
    const updated = { ...sessions, [newId]: [] };
    setSessions(updated);
    setActiveSession(newId);
    setChatPage(0);
    setMessagePage(0);
    localStorage.setItem("sessions", JSON.stringify(updated));
  };

  const deleteSession = (id) => {
    const updated = { ...sessions };
    delete updated[id];
    const sessionIds = Object.keys(updated);
    const newActive = sessionIds[0] || null;
    setSessions(updated);
    setActiveSession(newActive);
    setChatPage(0);
    setMessagePage(0);
    localStorage.setItem("sessions", JSON.stringify(updated));
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeSession) return;

    const token = localStorage.getItem("token");
    const userMessage = { sender: "user", text: input };
    const updatedMessages = [...(sessions[activeSession] || []), userMessage];
    const updatedSessions = { ...sessions, [activeSession]: updatedMessages };
    setSessions(updatedSessions);
    setInput("");

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: input }),
      });

      if (!res.ok) throw new Error("Failed to fetch response");

      const data = await res.json();
      const botMessage = { sender: "bot", text: data.response };
      const updatedWithBot = [...updatedMessages, botMessage];
      const finalSessions = { ...sessions, [activeSession]: updatedWithBot };
      setSessions(finalSessions);
      localStorage.setItem("sessions", JSON.stringify(finalSessions));
    } catch (err) {
      console.error("Error sending message:", err);
      const errorMsg = { sender: "bot", text: "Server error. Try again later." };
      const errorSession = [...updatedMessages, errorMsg];
      const finalSessions = { ...sessions, [activeSession]: errorSession };
      setSessions(finalSessions);
      localStorage.setItem("sessions", JSON.stringify(finalSessions));
    }
  };

  const sessionIds = Object.keys(sessions);
  const paginatedSessionIds = sessionIds.slice(chatPage * ITEMS_PER_PAGE, (chatPage + 1) * ITEMS_PER_PAGE);
  const currentMessages = sessions[activeSession] || [];
  const paginatedMessages = currentMessages.slice(messagePage * ITEMS_PER_PAGE, (messagePage + 1) * ITEMS_PER_PAGE);

  return (
    <div className="h-screen flex bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 p-4 flex flex-col space-y-4 border-r border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Chats</h2>
        <button
          onClick={handleNewChat}
          className="flex items-center space-x-2 bg-blue-600 px-3 py-2 rounded-md hover:bg-blue-700"
        >
          <FaPlus />
          <span>New Chat</span>
        </button>
        <div className="overflow-y-auto flex-1 space-y-2">
          {paginatedSessionIds.map((id, index) => (
            <div
              key={id}
              className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer ${
                id === activeSession ? "bg-gray-700" : "hover:bg-gray-700"
              }`}
            >
              <div onClick={() => { setActiveSession(id); setMessagePage(0); }}>
                Chat {(chatPage * ITEMS_PER_PAGE) + index + 1}
              </div>
              <button
                onClick={() => deleteSession(id)}
                className="text-red-400 hover:text-red-500"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>

        {/* Sidebar Pagination */}
        <div className="flex justify-between mt-4">
          <button
            onClick={() => setChatPage((prev) => Math.max(prev - 1, 0))}
            disabled={chatPage === 0}
            className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={() => setChatPage((prev) => (sessionIds.length > (prev + 1) * ITEMS_PER_PAGE ? prev + 1 : prev))}
            disabled={(chatPage + 1) * ITEMS_PER_PAGE >= sessionIds.length}
            className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col">
        <div className="bg-gray-700 py-4 px-6 text-center text-lg font-semibold">AI Chatbot</div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-800">
          {paginatedMessages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`p-3 rounded-lg max-w-xs shadow-md ${
                  msg.sender === "user" ? "bg-blue-600 text-white" : "bg-gray-700 text-white"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Messages Pagination */}
        <div className="flex justify-between items-center px-4 py-2 bg-gray-700 border-t border-gray-600">
          <button
            onClick={() => setMessagePage((prev) => Math.max(prev - 1, 0))}
            disabled={messagePage === 0}
            className="px-3 py-1 bg-gray-600 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={() =>
              setMessagePage((prev) => (currentMessages.length > (prev + 1) * ITEMS_PER_PAGE ? prev + 1 : prev))
            }
            disabled={(messagePage + 1) * ITEMS_PER_PAGE >= currentMessages.length}
            className="px-3 py-1 bg-gray-600 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>

        {/* Message input */}
        <div className="p-4 bg-gray-700 border-t border-gray-600 flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 p-3 border border-gray-600 rounded-full bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type a message..."
          />
          <button
            onClick={sendMessage}
            className="ml-3 bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-md"
          >
            <FaPaperPlane size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}