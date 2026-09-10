import { useState } from "react";

export default function Companion() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Tell me how you feel and I’ll shape a listening direction."
    }
  ]);
  const [loading, setLoading] = useState(false);

  const send = async (event) => {
    event.preventDefault();

    if (!message.trim() || loading) return;

    const userMessage = message.trim();

    setMessages((items) => [
      ...items,
      { role: "user", text: userMessage }
    ]);

    setMessage("");
    setLoading(true);

    try {
      const token = localStorage.getItem("moodifyToken");
      const current = localStorage.getItem("moodify_theme_emotion");

      const headers = {
        "Content-Type": "application/json"
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        "http://localhost:8000/companion/chat",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: userMessage,
            current_mood: current
          })
        }
      );

      const data = await response.json();

      const reply =
        data.reply ||
        data.detail ||
        "I couldn’t respond right now.";

      setMessages((items) => [
        ...items,
        { role: "assistant", text: reply }
      ]);
    } catch {
      setMessages((items) => [
        ...items,
        {
          role: "assistant",
          text: "I couldn’t reach the music companion right now."
        }
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
        aria-label="Open music companion"
      >
        ♫
      </button>

      {open && (
        <section className="companion-panel glass">
          <header className="companion-header">
            <div className="companion-title-wrap">
              <span className="companion-avatar">✦</span>

              <div className="companion-title-text">
                <strong>Moodify Companion</strong>
                <small>Music-focused support</small>
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
              <div
                key={index}
                className={`companion-message-row ${item.role}`}
              >
                <span
                  className={`companion-bubble ${item.role}`}
                >
                  {item.text}
                </span>
              </div>
            ))}

            {loading && (
              <div className="companion-message-row assistant">
                <span className="companion-bubble assistant typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </div>
            )}
          </div>

          <form className="companion-form" onSubmit={send}>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell me how you feel…"
              aria-label="Message the music companion"
            />

            <button type="submit" disabled={loading}>
              Send
            </button>
          </form>
        </section>
      )}
    </div>
  );
}