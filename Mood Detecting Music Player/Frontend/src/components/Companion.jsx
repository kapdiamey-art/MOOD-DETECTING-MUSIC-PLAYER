import { useState, useRef } from "react";

export default function Companion() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Welcome to your musical therapy session. Tell me how you feel, and I'll guide your soundtrack."
    }
  ]);
  const [loading, setLoading] = useState(false);

  // ── Voice / Mic state ──
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError]       = useState("");
  const recognitionRef                = useRef(null);

  const toggleVoice = () => {
    setMicError("");
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError("Voice input not supported. Use Chrome or Edge.");
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous      = false;
    recognition.interimResults  = true;
    recognition.lang            = "en-US";
    recognition.maxAlternatives = 1;

    let finalText = message;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += (finalText ? " " : "") + t.trim();
          setMessage(finalText);
        } else {
          interim = t;
        }
      }
      if (interim) {
        setMessage((finalText + (finalText ? " " : "") + interim));
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") setMicError("Microphone access denied.");
      else if (event.error === "no-speech") setMicError("No speech detected. Try again.");
      else setMicError(`Voice error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const send = async (event) => {
    event.preventDefault();
    if (!message.trim() || loading) return;

    // Stop mic if still listening
    if (isListening && recognitionRef.current) recognitionRef.current.stop();

    const userMessage = message.trim();
    setMessages((items) => [...items, { role: "user", text: userMessage }]);
    setMessage("");
    setLoading(true);

    try {
      const token   = localStorage.getItem("moodifyToken");
      const current = localStorage.getItem("moodify_theme_emotion");
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch("http://localhost:8000/companion/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ message: userMessage, current_mood: current })
      });

      const data  = await response.json();
      const reply = data.reply || data.detail || "I couldn't respond right now.";
      setMessages((items) => [...items, { role: "assistant", text: reply }]);
    } catch {
      setMessages((items) => [
        ...items,
        { role: "assistant", text: "I couldn't reach your music therapist right now." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="companion">
      <button
        className="companion-toggle"
        onClick={() => setOpen(!open)}
        aria-label="Open music therapist"
      >
        🩺
      </button>

      {open && (
        <section className="companion-panel glass">
          <header className="companion-header">
            <div className="companion-title-wrap">
              <span className="companion-avatar">🩺</span>
              <div className="companion-title-text">
                <strong>Moodify Music Therapist</strong>
                <small>AI Music Therapy &amp; Wellness</small>
              </div>
            </div>
            <button
              className="companion-close"
              onClick={() => setOpen(false)}
              aria-label="Close companion"
            >
              ×
            </button>
          </header>

          <div className="companion-messages">
            {messages.map((item, index) => (
              <div key={index} className={`companion-message-row ${item.role}`}>
                <span className={`companion-bubble ${item.role}`}>{item.text}</span>
              </div>
            ))}
            {loading && (
              <div className="companion-message-row assistant">
                <span className="companion-bubble assistant typing-indicator">
                  <span></span><span></span><span></span>
                </span>
              </div>
            )}
          </div>

          <form className="companion-form" onSubmit={send}>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isListening ? "Listening… speak now" : "Tell me how you feel…"}
              aria-label="Message the music companion"
              style={isListening ? { borderColor: "rgba(139,92,246,0.7)", boxShadow: "0 0 0 2px rgba(139,92,246,0.2)" } : {}}
            />

            {/* 🎤 Mic Button */}
            <button
              type="button"
              onClick={toggleVoice}
              aria-label={isListening ? "Stop recording" : "Voice input"}
              title={isListening ? "Stop recording" : "Speak your message"}
              style={{
                background: isListening
                  ? "linear-gradient(135deg,#8b5cf6,#ec4899)"
                  : "rgba(139,92,246,0.15)",
                border: "none",
                borderRadius: "50%",
                width: "38px",
                height: "38px",
                minWidth: "38px",
                cursor: "pointer",
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isListening ? "#fff" : "#a78bfa",
                boxShadow: isListening ? "0 0 0 4px rgba(139,92,246,0.25)" : "none",
                animation: isListening ? "micPulse 1.4s ease-in-out infinite" : "none",
                transition: "all 0.2s ease",
                flexShrink: 0,
              }}
            >
              {isListening ? "⏹" : "🎤"}
            </button>

            <button type="submit" disabled={loading}>Send</button>
          </form>

          {micError && (
            <div style={{
              padding: "6px 12px",
              background: "rgba(239,68,68,0.1)",
              borderTop: "1px solid rgba(239,68,68,0.2)",
              fontSize: "0.75rem",
              color: "#f87171",
              textAlign: "center"
            }}>
              🚫 {micError}
            </div>
          )}
        </section>
      )}

      {/* Mic pulse animation */}
      <style>{`
        @keyframes micPulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(139,92,246,0.25); }
          50%       { box-shadow: 0 0 0 8px rgba(139,92,246,0.1); }
        }
      `}</style>
    </div>
  );
}