"use client";

import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

const TIMEOUTS = [
  { value: "1min", label: "1 Minute" },
  { value: "5min", label: "5 Minutes" },
  { value: "15min", label: "15 Minutes" },
  { value: "30min", label: "30 Minutes" },
  { value: "1hour", label: "1 Hour" },
];

export default function Home() {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [timeout, setTimeoutVal] = useState("5min");
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const scrollRef = useRef(null);

  // Use ref to keep socket instance persistent across renders
  const socketRef = useRef(null);

  // 1. Socket Setup & Listeners
  useEffect(() => {
    socketRef.current = io();

    socketRef.current.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socketRef.current.on("room_expired", () => {
      alert("This room has self-destructed!");
      setJoined(false);
      setMessages([]);
      setRoomId("");
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // 2. Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. Client-side Countdown (Visual only)
  useEffect(() => {
    if (!joined || !timeLeft) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => (t > 1000 ? t - 1000 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [joined, timeLeft]);

  // Actions
  const joinRoom = () => {
    if (!roomId || !username) return alert("Missing details!");

    if (!socketRef.current) return alert("Socket not connected");

    socketRef.current.emit("join_room", { roomId, username, timeout }, (res) => {
      if (res.error) return alert(res.error);

      setMessages(res.messages);
      setTimeLeft(res.remainingTime);
      setJoined(true);
    });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (socketRef.current) {
      socketRef.current.emit("send_message", { roomId, username, message });
      setMessage("");
    }
  };

  // UI Helpers
  const formatTime = (ms) => {
    if (!ms) return "--:--";
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <main className="min-h-screen p-8 flex items-center justify-center md:p-4">
      <div className="max-w-3xl w-full border-2 border-border-color bg-black">
        {/* Grid pattern overlay */}
        <div className="absolute -top-0.5 -left-0.5 -right-0.5 -bottom-0.5 opacity-5 pointer-events-none"
          style={{
            background: 'linear-gradient(45deg, transparent 48%, white 48%, white 52%, transparent 52%)',
            backgroundSize: '20px 20px'
          }}>
        </div>

        {/* Header */}
        <header className="p-12 pb-8 border-b-2 border-border-color relative md:p-6 md:pb-4">
          <div className="font-mono text-5xl font-bold tracking-tighter mb-2 flex items-baseline md:text-4xl">
            <span className="relative">CHAT-ROOM</span>
            <span className="animate-pulse mx-1">.</span>
          </div>
          <div className="font-mono text-sm text-text-secondary tracking-[0.2em] flex items-center gap-1">
            SELF-DESTRUCTING CHAT ROOMS
            <span className="animate-[blink_1s_step-start_infinite] text-text-primary">_</span>
          </div>
        </header>

        {/* Login View */}
        {!joined ? (
          <div className="p-6 space-y-4">
            <input
              className="w-full p-4 bg-black border-2 border-gray-800 text-white font-mono placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
              placeholder="USERNAME"
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              className="w-full p-4 bg-black border-2 border-gray-800 text-white font-mono placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
              placeholder="ROOM ID"
              onChange={(e) => setRoomId(e.target.value)}
            />
            <div className="relative">
              <select
                className="w-full p-4 bg-black border-2 border-gray-800 text-white font-mono appearance-none focus:outline-none focus:border-white transition-colors cursor-pointer"
                value={timeout}
                onChange={(e) => setTimeoutVal(e.target.value)}
              >
                {TIMEOUTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                </svg>
              </div>
            </div>
            <button
              onClick={joinRoom}
              className="w-full bg-white text-black font-mono font-bold py-4 hover:bg-gray-200 transition-colors uppercase tracking-widest border-2 border-transparent hover:border-white"
            >
              Enter Room
            </button>
          </div>
        ) : (
          /* Chat View */
          <div className="h-[500px] flex flex-col">
            <div className="flex-1 overflow-auto p-4 space-y-2">
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.user === username ? "items-end" : "items-start"}`}>
                  <div className={`px-3 py-2 rounded-lg max-w-[85%] ${m.user === "System" ? "bg-gray-700 text-xs text-gray-400 w-full text-center" :
                    m.user === username ? "bg-red-600" : "bg-gray-700"
                    }`}>
                    {m.user !== "System" && m.user !== username && <span className="text-xs text-red-400 block">{m.user}</span>}
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <form onSubmit={sendMessage} className="p-3 bg-gray-800 border-t border-gray-700 flex gap-2">
              <input
                className="flex-1 p-2 bg-gray-700 rounded"
                placeholder="Message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button type="submit" className="bg-red-600 px-4 rounded font-bold">SEND</button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
