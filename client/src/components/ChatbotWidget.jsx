import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiSend, FiTrash2, FiX } from "react-icons/fi";
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

/**
 * Cute animated Superhero Robot mascot inspired by the floating cape robot.
 * Loops continuously: hovering flight, billowing cape, waving arm, blinking eyes, glowing chest/antenna.
 */
function CuteHeroBot({ size = 68, isThinking = false }) {
  const uid = useId().replace(/:/g, "");
  const shellId = `botShell-${uid}`;
  const capeId = `capeRed-${uid}`;
  const eyeId = `eyeGlow-${uid}`;

  return (
    <div
      className="relative flex items-center justify-center select-none pointer-events-none"
      style={{ width: size, height: size }}
    >
      {/* Ground hover shadow */}
      <motion.div
        animate={{
          scaleX: [0.85, 1.08, 0.85],
          opacity: [0.22, 0.12, 0.22]
        }}
        transition={{
          duration: isThinking ? 0.9 : 2.2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-0.5 w-10 h-2 rounded-full bg-black/40 blur-[3px]"
      />

      {/* Floating Robot Body */}
      <motion.svg
        viewBox="0 0 120 120"
        className="w-full h-full overflow-visible drop-shadow-[0_6px_12px_rgba(28,26,22,0.18)]"
        animate={
          isThinking
            ? { y: [0, -6, 0], rotate: [-4, 4, -4] }
            : { y: [0, -7, 0], rotate: [-2, 2.5, -2] }
        }
        transition={{
          duration: isThinking ? 0.9 : 2.2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <defs>
          <linearGradient id={shellId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#F3F4F6" />
            <stop offset="100%" stopColor="#D1D5DB" />
          </linearGradient>
          <linearGradient id={capeId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="60%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>
          <linearGradient id={eyeId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
        </defs>

        {/* Billowing Superhero Cape */}
        <motion.path
          d="M 38 62 Q 16 74 10 92 Q 30 98 46 89 Q 60 99 76 90 Q 94 97 109 89 Q 100 72 82 62 Z"
          fill={`url(#${capeId})`}
          style={{ transformOrigin: "60px 62px" }}
          animate={{
            skewX: [-3, 4, -3],
            scaleY: [1, 1.06, 0.97, 1],
            rotate: [-1.5, 2, -1.5]
          }}
          transition={{
            duration: isThinking ? 0.7 : 1.6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Left & Right Little Feet (bobbing kick loop) */}
        <motion.g
          animate={{ y: [0, -2.5, 0], rotate: [0, -8, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "50px 92px" }}
        >
          <rect x="47" y="88" width="5" height="7" rx="2.5" fill="#374151" />
          <ellipse cx="48" cy="97" rx="6.5" ry="4.5" fill={`url(#${shellId})`} stroke="#D1D5DB" strokeWidth="1" />
        </motion.g>
        <motion.g
          animate={{ y: [-2, 1, -2], rotate: [0, 8, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "70px 92px" }}
        >
          <rect x="68" y="88" width="5" height="7" rx="2.5" fill="#374151" />
          <ellipse cx="72" cy="96" rx="6.5" ry="4.5" fill={`url(#${shellId})`} stroke="#D1D5DB" strokeWidth="1" />
        </motion.g>

        {/* Left Arm (gentle flight balance) */}
        <motion.g
          animate={{ rotate: [8, -10, 8] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "38px 69px" }}
        >
          <path d="M 38 69 Q 25 72 22 65" stroke="#1F2937" strokeWidth="6" strokeLinecap="round" fill="none" />
          <circle cx="21" cy="64" r="5" fill={`url(#${shellId})`} stroke="#D1D5DB" strokeWidth="1" />
        </motion.g>

        {/* Right Arm (Cute Waving Loop!) */}
        <motion.g
          animate={{ rotate: [0, -28, 10, -28, 0, 0] }}
          transition={{
            duration: 2.6,
            repeat: Infinity,
            times: [0, 0.15, 0.3, 0.45, 0.6, 1],
            ease: "easeInOut"
          }}
          style={{ transformOrigin: "82px 69px" }}
        >
          <path d="M 82 69 Q 96 63 101 50" stroke="#1F2937" strokeWidth="6" strokeLinecap="round" fill="none" />
          <circle cx="102" cy="48" r="5.5" fill={`url(#${shellId})`} stroke="#D1D5DB" strokeWidth="1" />
        </motion.g>

        {/* Chubby Torso */}
        <ellipse cx="60" cy="75" rx="22" ry="18" fill={`url(#${shellId})`} stroke="#E5E7EB" strokeWidth="1.2" />
        {/* Red Cape Collar */}
        <path
          d="M 39 62 Q 60 72 81 62 Q 77 56 60 58 Q 43 56 39 62 Z"
          fill={`url(#${capeId})`}
        />
        {/* Glowing Chest Core */}
        <motion.rect
          x="53"
          y="72"
          width="14"
          height="6"
          rx="3"
          fill="#67E8F9"
          animate={{ opacity: [0.65, 1, 0.65] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Antenna */}
        <motion.g
          animate={{ rotate: [-5, 6, -5] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "43px 22px" }}
        >
          <line x1="43" y1="22" x2="36" y2="7" stroke="#1F2937" strokeWidth="3.2" strokeLinecap="round" />
          <motion.circle
            cx="36"
            cy="7"
            r="3.2"
            fill="#38BDF8"
            animate={{ scale: [1, 1.35, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        </motion.g>

        {/* Side Ear-pods / Headphones */}
        <ellipse cx="27" cy="41" rx="5.5" ry="10" fill="#1F2937" />
        <ellipse cx="27" cy="41" rx="2.5" ry="5.5" fill="none" stroke="#38BDF8" strokeWidth="1.3" />
        <ellipse cx="93" cy="41" rx="5.5" ry="10" fill="#1F2937" />
        <ellipse cx="93" cy="41" rx="2.5" ry="5.5" fill="none" stroke="#38BDF8" strokeWidth="1.3" />

        {/* Big Round Head */}
        <ellipse cx="60" cy="39" rx="32" ry="25" fill={`url(#${shellId})`} stroke="#E5E7EB" strokeWidth="1.2" />

        {/* Soft Visor Blush */}
        <ellipse cx="38" cy="47" rx="4" ry="2.2" fill="#FDA4AF" opacity="0.45" />
        <ellipse cx="82" cy="47" rx="4" ry="2.2" fill="#FDA4AF" opacity="0.45" />

        {/* Blinking Eyes Group */}
        <motion.g
          animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
          transition={{
            duration: 3.4,
            repeat: Infinity,
            times: [0, 0.88, 0.93, 0.98, 1],
            ease: "easeInOut"
          }}
          style={{ transformOrigin: "60px 39px" }}
        >
          {/* Left Eye */}
          <circle cx="44" cy="39" r="9" fill="#0F172A" />
          <path d="M 38.5 34.5 A 6 6 0 0 0 38.5 43.5" fill="none" stroke={`url(#${eyeId})`} strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="46.5" cy="35.5" r="2" fill="#FFFFFF" opacity="0.9" />

          {/* Right Eye */}
          <circle cx="76" cy="39" r="9" fill="#0F172A" />
          <path d="M 81.5 34.5 A 6 6 0 0 1 81.5 43.5" fill="none" stroke={`url(#${eyeId})`} strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="73.5" cy="35.5" r="2" fill="#FFFFFF" opacity="0.9" />
        </motion.g>

        {/* Cute Smile */}
        <path
          d="M 55 47 Q 60 52 65 47"
          fill="none"
          stroke="#1F2937"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </motion.svg>
    </div>
  );
}

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
        .slice(-9, -1)
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
    <div className="fixed bottom-24 right-5 z-50 flex flex-col items-end font-inter">
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
            <div className="px-4 py-3 bg-gradient-to-r from-[#1b4332] via-[#24553f] to-[#2d6a4f] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-white/15 border border-amber-300/40 flex items-center justify-center overflow-visible">
                  <CuteHeroBot size={40} isThinking={loading} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold font-soria tracking-wide">
                      Agalya AI Assistant
                    </h3>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-[11px] text-emerald-100/85">
                    {loading ? "Flying to get your answer..." : `Online • ${currentLang?.nativeName || "English"}`}
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

              {/* Loading Typing Indicator with Mini Flying Robot */}
              {loading && (
                <div className="flex justify-start items-center gap-2">
                  <CuteHeroBot size={34} isThinking />
                  <div className="bg-white border border-yellow-500/15 rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-sm flex items-center gap-1.5">
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

      {/* Cute Animated Superhero Robot Launcher */}
      <div className="relative flex items-center gap-2">
        {!isOpen && (
          <motion.div
            animate={{ y: [0, -3, 0], scale: [1, 1.03, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            onClick={() => setIsOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setIsOpen(true);
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur border border-yellow-500/30 text-[#1C1A16] text-xs font-bold shadow-[0_6px_20px_rgba(28,26,22,0.12)] hover:border-amber-500 transition-colors cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Ask AI</span>
          </motion.div>
        )}

        <motion.button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          aria-label={isOpen ? "Close AI support chat" : "Open AI support chat"}
          className={`relative flex items-center justify-center transition-all duration-300 ${
            isOpen
              ? "w-12 h-12 rounded-full bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] text-white shadow-[0_6px_24px_rgba(27,67,50,0.45)] border border-amber-400/30"
              : "w-[74px] h-[74px] rounded-full bg-gradient-to-br from-amber-50/95 via-white/95 to-emerald-50/90 backdrop-blur-sm shadow-[0_10px_30px_rgba(28,26,22,0.18)] border border-yellow-500/35"
          }`}
        >
          {isOpen ? <FiX size={22} /> : <CuteHeroBot size={66} />}
        </motion.button>
      </div>
    </div>
  );
}
