import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiMessageCircle, FiSend, FiTrash2, FiX } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa6";
import { API_URL } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

const INITIAL_MESSAGE = {
  id: "welcome",
  role: "model",
  text: "Vanakkam! 🌿 I'm **Agalya**, your Kala Agalya Herbals assistant. Ask me anything about our herbal hair oil, ingredients, prices, shipping charges, order tracking, or returns!"
};

const QUICK_QUESTIONS = [
  "Product prices & sizes",
  "How to use herbal hair oil?",
  "Shipping charges to Tamil Nadu",
  "Track my order",
  "Refund & return policy"
];

function renderInlineFormatting(line) {
  const parts = line.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s]+)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-[#1C1A16]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (/^https?:\/\/[^\s]+$/.test(part)) {
      return (
        <a
          key={idx}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="underline text-amber-700 hover:text-amber-800 break-all"
        >
          {part}
        </a>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

function FormattedMessage({ text }) {
  const lines = String(text || "").split("\n");
  return (
    <div className="space-y-1.5 text-[13px] leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;
        const isBullet = /^[-*•]\s+/.test(trimmed);
        const content = isBullet ? trimmed.replace(/^[-*•]\s+/, "") : trimmed;
        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
              <span>{renderInlineFormatting(content)}</span>
            </div>
          );
        }
        return <p key={idx}>{renderInlineFormatting(content)}</p>;
      })}
    </div>
  );
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { currentLang } = useLanguage();

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 180);
    }
  }, [messages, isOpen, loading]);

  const sendMessage = async (rawText) => {
    const text = (rawText ?? input).trim();
    if (!text || loading) return;

    const userMsg = { id: `u-${Date.now()}`, role: "user", text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!rawText) setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("userToken");
      const historyPayload = updatedMessages
        .filter((m) => m.id !== "welcome")
        .slice(-11, -1)
        .map((m) => ({ role: m.role, text: m.text }));

      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          language: currentLang?.name || "English"
        })
      });

      const data = await res.json();
      if (data.success && data.reply) {
        setMessages((prev) => [
          ...prev,
          { id: `m-${Date.now()}`, role: "model", text: data.reply }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: "model",
            text:
              data.message ||
              "Sorry, I ran into an issue. Please message us on WhatsApp at +91 7338758727."
          }
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "model",
          text: "Unable to reach the server right now. Please try again or contact us on WhatsApp (+91 7338758727)."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const resetChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setInput("");
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end font-inter">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="mb-3 w-[calc(100vw-2rem)] sm:w-[385px] h-[520px] max-h-[75vh] bg-[#FDFBF7] rounded-3xl shadow-[0_20px_60px_rgba(28,26,22,0.22)] border border-yellow-500/25 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3.5 bg-gradient-to-r from-[#1b4332] via-[#24553f] to-[#2d6a4f] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-lg">
                  🌿
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold font-soria tracking-wide">
                      Agalya Herbal AI
                    </h3>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-[11px] text-emerald-100/85">
                    Orders, Products & Care • {currentLang?.nativeName || "English"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={resetChat}
                  title="Clear conversation"
                  aria-label="Clear conversation"
                  className="p-2 rounded-full hover:bg-white/10 transition-colors text-emerald-100 hover:text-white"
                >
                  <FiTrash2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close chat"
                  aria-label="Close chat"
                  className="p-2 rounded-full hover:bg-white/10 transition-colors text-emerald-100 hover:text-white"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div
              data-lenis-prevent
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#FDFBF7]"
            >
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                        isUser
                          ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-[#1C1A16] font-medium rounded-br-sm"
                          : "bg-white border border-yellow-500/15 text-[#2C2921] rounded-bl-sm"
                      }`}
                    >
                      {isUser ? (
                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                          {msg.text}
                        </p>
                      ) : (
                        <FormattedMessage text={msg.text} />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Quick Suggestions when conversation starts */}
              {messages.length === 1 && !loading && (
                <div className="pt-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#7C786E] mb-2">
                    Quick Questions
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => sendMessage(q)}
                        className="text-[11px] px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-yellow-500/25 transition-colors text-left"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading Typing Indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-yellow-500/15 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.1s]" />
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="border-t border-yellow-500/15 bg-white px-3 pt-2.5 pb-2 shrink-0">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={1000}
                  disabled={loading}
                  placeholder="Ask about hair oil, orders, shipping..."
                  className="flex-1 px-3.5 py-2.5 bg-[#FDFBF7] border border-yellow-500/20 rounded-xl text-[13px] text-[#1C1A16] placeholder-[#9A9690] focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  aria-label="Send message"
                  className="p-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-[#1C1A16] font-bold shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <FiSend size={17} />
                </button>
              </form>

              <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#7C786E] px-1">
                <span>AI powered • Replies may need verification</span>
                <a
                  href="https://wa.me/917338758727?text=Hi%20Kala%20Agalya%20Herbals,%20I%20need%20help%20with%20a%20query."
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:underline"
                >
                  <FaWhatsapp size={11} />
                  Human Support
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close AI support chat" : "Open AI support chat"}
        className="group relative flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] text-white shadow-[0_6px_24px_rgba(27,67,50,0.45)] hover:scale-105 hover:shadow-[0_10px_30px_rgba(27,67,50,0.55)] transition-all duration-300 border border-amber-400/30"
      >
        {!isOpen && (
          <span className="hidden sm:inline text-xs font-bold tracking-wide">
            Ask AI
          </span>
        )}
        {isOpen ? <FiX size={20} /> : <FiMessageCircle size={20} />}
      </button>
    </div>
  );
}
