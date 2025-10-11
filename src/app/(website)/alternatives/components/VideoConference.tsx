"use client";

import React, { useState, useEffect } from "react";

interface VideoConferenceProps {
  onClose: () => void;
  isOpen: boolean;
}

export default function VideoConference({
  onClose,
  isOpen,
}: VideoConferenceProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      sender: "Adrata Team",
      message: "Welcome! We'll be with you shortly.",
      time: "2:34 PM",
    },
    {
      sender: "AI Assistant",
      message: "I can help answer any questions while you wait.",
      time: "2:35 PM",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsConnected(true), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

  const startScreenShare = async () => {
    try {
      setIsScreenSharing(true);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "System",
          message: "Screen sharing started",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
      return true;
    } catch (err) {
      console.error("Error starting screen share:", err);
      return false;
    }
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "You",
          message: newMessage,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
      setNewMessage("");

      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "AI Assistant",
            message:
              "Thanks for that question! Our team will address that in detail.",
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      }, 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--foreground)] rounded-2xl w-full max-w-6xl h-[90vh] border border-[var(--border)] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-white">Meet with Adrata</h2>
            {isConnected && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm font-medium">
                  Connected
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 flex">
          <div className="flex-1 p-6">
            <div className="aspect-video bg-black rounded-xl mb-4 relative overflow-hidden">
              {!isConnected ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-300 text-lg">
                      Connecting to our team...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full">
                  {isScreenSharing ? (
                    <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="text-4xl mb-4">🖥️</div>
                        <p className="text-lg">Screen sharing active</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                          AT
                        </div>
                        <p className="text-lg font-semibold">Adrata Team</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 rounded-full transition ${
                  isMuted
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                {isMuted ? "🔇" : "🎤"}
              </button>

              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`p-3 rounded-full transition ${
                  isVideoOff
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                {isVideoOff ? "📹" : "📷"}
              </button>

              <button
                onClick={startScreenShare}
                className={`p-3 rounded-full transition ${
                  isScreenSharing
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                🖥️
              </button>

              <button
                onClick={onClose}
                className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition"
              >
                📞
              </button>
            </div>
          </div>

          <div className="w-80 border-l border-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-800">
              <h3 className="font-semibold text-white">Chat</h3>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatMessages.map((msg, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm text-blue-400">
                      {msg.sender}
                    </span>
                    <span className="text-xs text-[var(--muted)]">{msg.time}</span>
                  </div>
                  <p className="text-gray-300 text-sm">{msg.message}</p>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-800">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e['key'] === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-gray-800 border border-[var(--border)] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={sendMessage}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
