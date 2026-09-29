import { useState, useRef, useEffect } from "react";
import AppLayout from "../AppLayout";
import { useNavigate } from "react-router-dom";
import { applyMoodTheme } from "../utils/moodTheme";
import { API_BASE_URL } from "../services/apiConfig";

const MOOD_MAPPING = {
  joy:      { emoji: "🤩", name: "Joyful",    description: "You're radiating happiness and positive energy!",    gradient: "linear-gradient(135deg,#f59e0b,#ef4444)", color: "#f59e0b" },
  sadness:  { emoji: "😢", name: "Sad",        description: "It's okay to feel down. Let the music comfort you.", gradient: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#3b82f6" },
  anger:    { emoji: "😡", name: "Angry",      description: "Let off some steam with these tracks.",             gradient: "linear-gradient(135deg,#ef4444,#f97316)", color: "#ef4444" },
  fear:     { emoji: "😨", name: "Fearful",    description: "Take a deep breath. You are safe here.",            gradient: "linear-gradient(135deg,#8b5cf6,#6366f1)", color: "#8b5cf6" },
  love:     { emoji: "🥰", name: "Loving",     description: "Love is in the air!",                               gradient: "linear-gradient(135deg,#ec4899,#f43f5e)", color: "#ec4899" },
  surprise: { emoji: "😲", name: "Surprised",  description: "Expect the unexpected!",                            gradient: "linear-gradient(135deg,#22c55e,#06b6d4)", color: "#22c55e" },
  neutral:  { emoji: "😐", name: "Neutral / Calm", description: "Balanced and calm. Here is some easy-listening music for your day.", gradient: "linear-gradient(135deg,#9ca3af,#4b5563)", color: "#9ca3af" },
};

export default function MoodDetection() {
  const [text,            setText           ] = useState("");
  const [genre,           setGenre          ] = useState("");
  const [artist,          setArtist         ] = useState("");
  const [language,        setLanguage       ] = useState("all");
  const [mood,            setMood           ] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading,         setLoading        ] = useState(false);
  const [inlineMessage,   setInlineMessage  ] = useState("");
  const [weatherContext,  setWeatherContext ] = useState(null);
  const [detectedLocation, setDetectedLocation] = useState("Detecting location...");
  const [customCity,       setCustomCity      ] = useState(localStorage.getItem("moodify_user_city") || "");
  const [useWeather,       setUseWeather      ] = useState(false);
  const [isUpdatingWeather, setIsUpdatingWeather] = useState(false);

  // ── Feedback / Correction state ──────────────────────────────────────
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctedEmotion,    setCorrectedEmotion   ] = useState(null);   // null = user accepted model result
  const [feedbackSent,        setFeedbackSent        ] = useState(false);
  const [isFetchingCorrected, setIsFetchingCorrected ] = useState(false);
  // The emotion we actually use for the playlist (model result OR user correction)
  const effectiveEmotion = correctedEmotion || mood?.emotion || null;
  // ─────────────────────────────────────────────────────────────────────

  // Autocomplete states
  const [genreSuggestions,   setGenreSuggestions  ] = useState([]);
  const [artistSuggestions,  setArtistSuggestions ] = useState([]);
  const [showGenreDropdown,  setShowGenreDropdown ] = useState(false);
  const [showArtistDropdown, setShowArtistDropdown] = useState(false);

  // Fetch genre suggestions (initial or search query)
  const fetchGenreSuggestions = async (query = "") => {
    try {
      const res = await fetch(`${API_BASE_URL}/mood/genres?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setGenreSuggestions(data.genres || []);
      }
    } catch (err) {
      console.error("Genre fetch error:", err);
    }
  };

  // Fetch artist suggestions (initial or search query)
  const fetchArtistSuggestions = async (query = "") => {
    try {
      const res = await fetch(`${API_BASE_URL}/mood/artists?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setArtistSuggestions(data.artists || []);
      }
    } catch (err) {
      console.error("Artist fetch error:", err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGenreSuggestions(genre.trim());
    }, 120);
    return () => clearTimeout(timer);
  }, [genre]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchArtistSuggestions(artist.trim());
    }, 120);
    return () => clearTimeout(timer);
  }, [artist]);

  // Voice / Whisper speech-to-text state
  const [isListening,     setIsListening    ] = useState(false);
  const [micError,        setMicError       ] = useState("");
  const recognitionRef = useRef(null);

  const navigate = useNavigate();

  // Helper to fetch weather for a specific city name and save it to localStorage
  const updateCityWeather = async (targetCity) => {
    if (!targetCity || !targetCity.trim()) return;
    const cleanCity = targetCity.trim();
    setIsUpdatingWeather(true);
    try {
      const res = await fetch(`${API_BASE_URL}/context/weather?city=${encodeURIComponent(cleanCity)}`);
      if (res.ok) {
        const data = await res.json();
        setWeatherContext(data);
        setDetectedLocation(`${data.city} (Active)`);
        setCustomCity(data.city);
        localStorage.setItem("moodify_user_city", data.city);
      }
    } catch (err) {
      console.error("Error updating city weather:", err);
    } finally {
      setIsUpdatingWeather(false);
    }
  };

  // Auto-detect Location & Fetch Weather Context on Load
  useEffect(() => {
    async function autoDetectLocationAndWeather() {
      // 1. Check if user already set a city preference in localStorage
      const savedCity = localStorage.getItem("moodify_user_city");
      if (savedCity) {
        setCustomCity(savedCity);
        await updateCityWeather(savedCity);
        return;
      }

      // 2. Try Browser GPS first (most accurate — OWM reverse-geocodes to real city)
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            try {
              const res = await fetch(`${API_BASE_URL}/context/weather?lat=${latitude}&lon=${longitude}`);
              if (res.ok) {
                const data = await res.json();
                setWeatherContext(data);
                setDetectedLocation(`${data.city} (GPS)`);
                setCustomCity(data.city);
                return;
              }
            } catch (err) {
              console.warn("GPS weather fetch failed, falling back to IP:", err);
            }
            fallbackIPLocation();
          },
          () => { fallbackIPLocation(); },
          { timeout: 8000, enableHighAccuracy: false, maximumAge: 120000 }
        );
      } else {
        fallbackIPLocation();
      }
    }

    async function fallbackIPLocation() {
      // Key fix: use lat/lon from IP API → pass to OWM reverse-geocoding for accurate city.
      // This avoids hyper-local ISP-mapped locations like "Davorlim" (a tiny Goa village).
      const ipProviders = [
        "https://freeipapi.com/api/json",
        "https://ipwho.is/",
        "https://ipapi.co/json/"
      ];

      for (const provider of ipProviders) {
        try {
          const ipRes = await fetch(provider);
          if (!ipRes.ok) continue;
          const ipData = await ipRes.json();

          // Prefer lat/lon — OWM's reverse geocoding gives the proper city name
          const lat = ipData.latitude ?? ipData.lat;
          const lon = ipData.longitude ?? ipData.lon;

          if (lat != null && lon != null) {
            try {
              const res = await fetch(`${API_BASE_URL}/context/weather?lat=${lat}&lon=${lon}`);
              if (res.ok) {
                const data = await res.json();
                setWeatherContext(data);
                setDetectedLocation(`${data.city} (Auto-Detected)`);
                setCustomCity(data.city);
                return;
              }
            } catch (_) {}
          }

          // Secondary: use raw city string if no coords available
          const rawCity = ipData.cityName || ipData.city;
          if (rawCity) {
            try {
              const res = await fetch(`${API_BASE_URL}/context/weather?city=${encodeURIComponent(rawCity)}`);
              if (res.ok) {
                const data = await res.json();
                setWeatherContext(data);
                setDetectedLocation(`${data.city} (Auto-Detected)`);
                setCustomCity(data.city);
                return;
              }
            } catch (_) {}
          }
        } catch (e) {
          console.warn(`IP provider ${provider} failed:`, e);
        }
      }

      // Final default fallback if all auto-detect mechanisms fail
      try {
        const res = await fetch(`${API_BASE_URL}/context/weather?city=Mumbai`);
        if (res.ok) {
          const data = await res.json();
          setWeatherContext(data);
          setDetectedLocation("Mumbai (Default)");
          setCustomCity("Mumbai");
        }
      } catch (err) {
        console.error("Default weather fetch failed:", err);
      }
    }

    autoDetectLocationAndWeather();
  }, []);

  const userInitial = (() => {
    const name = localStorage.getItem("moodifyUserName") || "";
    const email = localStorage.getItem("moodifyEmail") || "";
    const effective = name || (email ? email.split("@")[0] : "User");
    return (effective.trim().charAt(0) || "U").toUpperCase();
  })();
  // ── VOICE / WHISPER INPUT ──────────────────────────────────────────
  const toggleVoice = () => {
    setMicError("");

    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError("Your browser does not support voice input. Please use Chrome or Edge.");
      return;
    }

    // If already listening → stop
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous      = true;   // keep listening until stopped
    recognition.interimResults  = true;   // show live transcript while speaking
    recognition.lang            = "en-US";
    recognition.maxAlternatives = 1;

    let finalTranscript = text; // start from whatever is already typed

    recognition.onstart = () => {
      setIsListening(true);
      setMicError("");
    };

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? " " : "") + t.trim();
          setText(finalTranscript.slice(0, 500));
        } else {
          interim = t;
        }
      }
      // Show live preview (interim) while speaking, but clamp to 500 chars
      if (interim) {
        setText((finalTranscript + (finalTranscript ? " " : "") + interim).slice(0, 500));
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setMicError("Microphone access denied. Please allow microphone permissions in your browser.");
      } else if (event.error === "no-speech") {
        setMicError("No speech detected. Please speak clearly and try again.");
      } else {
        setMicError(`Voice error: ${event.error}. Please try again.`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };
  // ───────────────────────────────────────────────────────────────────

  const detectMood = async () => {
    if (!text.trim()) {
      setInlineMessage("Please tell us how you are feeling first.");
      return;
    }

    setInlineMessage("");
    setLoading(true);
    setMood(null);
    setRecommendations([]);
    // Reset feedback state on each new detection
    setCorrectedEmotion(null);
    setFeedbackSent(false);
    setShowCorrectionModal(false);

    try {
      const token = localStorage.getItem("moodifyToken");

      // ── STEP 1: Detect mood ──
      const response = await fetch(`${API_BASE_URL}/mood/detect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          text,
          genre:    genre.trim()  || undefined,
          artist:   artist.trim() || undefined,
          language: language,
          weather:  useWeather && weatherContext ? weatherContext.condition : undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to detect mood");

      const data     = await response.json();
      if (data.status === "invalid") {
        setInlineMessage(data.message || "Please enter a meaningful sentence describing how you feel.");
        return;
      }
      const moodData = MOOD_MAPPING[data.emotion] || MOOD_MAPPING.neutral;

      const detectedMood = {
        emoji:       moodData.emoji,
        name:        moodData.name,
        description: moodData.description,
        confidence:  Math.floor(data.confidence * 10000) / 100,  // 0.9999 → 99.99
        gradient:    moodData.gradient,
        color:       moodData.color,
        emotion:     data.emotion,
      };

      setMood(detectedMood);
      applyMoodTheme(data.emotion);

      // ── STEP 2: Use recommendations from the detect response directly ──
      const recs = data.recommendations || [];

      // Shuffle and pick 15 from the full pool of 50
      const shuffled = [...recs].sort(() => Math.random() - 0.5);
      const display15 = shuffled.slice(0, 15);

      setRecommendations(display15);

      // Store full 50-song pool so Recommendations page can reshuffle freely
      localStorage.setItem("moodify_mood",            JSON.stringify(detectedMood));
      localStorage.setItem("moodify_song_pool",       JSON.stringify(recs));      // full 50
      localStorage.setItem("moodify_recommendations", JSON.stringify(display15)); // initial 15
      localStorage.setItem("moodify_weather_enabled", useWeather ? "true" : "false");
      if (useWeather && weatherContext) {
        localStorage.setItem("moodify_weather_context", JSON.stringify(weatherContext));
      } else {
        localStorage.removeItem("moodify_weather_context");
      }

    } catch (error) {
      console.error(error);
      setInlineMessage("Error analyzing mood. Make sure the backend is running!");
    } finally {
      setLoading(false);
    }
  };

  // ── Send feedback to backend ─────────────────────────────────────────
  const sendFeedback = async (userCorrect, chosenEmotion = null) => {
    if (!mood) return;
    const token = localStorage.getItem("moodifyToken");
    try {
      await fetch(`${API_BASE_URL}/mood/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          text:               text,
          predicted_emotion:  mood.emotion,
          user_correct:       userCorrect,
          actual_emotion:     chosenEmotion,
          model_version:      "v1.0",
        }),
      });
    } catch (err) {
      console.warn("Feedback submission failed (non-critical):", err);
    }
  };

  // ── Fetch new recommendations for the corrected emotion ──────────────
  const fetchRecsForCorrectEmotion = async (emotion) => {
    setIsFetchingCorrected(true);
    const token = localStorage.getItem("moodifyToken");
    try {
      const res = await fetch(`${API_BASE_URL}/mood/detect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          text:     `I am feeling ${emotion}`,  // minimal text to force correct emotion
          genre:    genre.trim() || undefined,
          artist:   artist.trim() || undefined,
          language: language,
          weather:  useWeather && weatherContext ? weatherContext.condition : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.recommendations) {
          const shuffled = [...data.recommendations].sort(() => Math.random() - 0.5);
          const display15 = shuffled.slice(0, 15);
          setRecommendations(display15);
          localStorage.setItem("moodify_song_pool",       JSON.stringify(data.recommendations));
          localStorage.setItem("moodify_recommendations", JSON.stringify(display15));
        }
      }
    } catch (err) {
      console.warn("Could not re-fetch recs for corrected emotion:", err);
    } finally {
      setIsFetchingCorrected(false);
    }
  };

  // ── Handle correction: user selected the right emotion ───────────────
  const handleEmotionCorrection = (chosenEmotion) => {
    setCorrectedEmotion(chosenEmotion);
    setShowCorrectionModal(false);
    setFeedbackSent(true);

    const moodData = MOOD_MAPPING[chosenEmotion] || MOOD_MAPPING.neutral;
    const correctedMood = {
      emoji:       moodData.emoji,
      name:        moodData.name,
      description: moodData.description,
      confidence:  mood ? mood.confidence : 99.9,
      gradient:    moodData.gradient,
      color:       moodData.color,
      emotion:     chosenEmotion,
    };

    // 1. Instantly update UI mood state & theme with zero delay
    setMood(correctedMood);
    applyMoodTheme(chosenEmotion);

    // 2. Persist corrected mood in localStorage immediately for Recommendations page
    localStorage.setItem("moodify_mood", JSON.stringify(correctedMood));

    // 3. Fire-and-forget feedback submission to backend DB (non-blocking)
    sendFeedback(false, chosenEmotion);

    // 4. Fetch fresh recommendations for corrected emotion asynchronously
    fetchRecsForCorrectEmotion(chosenEmotion);
  };
  // ─────────────────────────────────────────────────────────────────────

  return (
    <div className="mood-page">

      <style>{`
        /* ── Ambient background orbs ── */
        .md-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          z-index: 0;
          will-change: transform, opacity;
          transform: translateZ(0);
          animation: orbPulse 8s ease-in-out infinite alternate;
        }
        .md-orb-1 { width:500px; height:500px; background:rgba(139,92,246,0.18); top:-150px; right:-100px; }
        .md-orb-2 { width:400px; height:400px; background:rgba(236,72,153,0.12); bottom:-100px; left:-100px; animation-delay: 3s; }
        @keyframes orbPulse {
          from { transform: translateZ(0) scale(1);   opacity: 0.8; }
          to   { transform: translateZ(0) scale(1.2); opacity: 1;   }
        }

        /* ── Page layout ── */
        .md-page {
          position: relative;
          min-height: 100vh;
          padding: 40px 20px 60px;
          z-index: 1;
        }

        /* ── Hero heading ── */
        .md-hero {
          text-align: center;
          margin-bottom: 40px;
        }
        .md-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(139,92,246,0.15);
          border: 1px solid rgba(139,92,246,0.3);
          color: #a78bfa;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 2px;
          padding: 6px 16px;
          border-radius: 99px;
          margin-bottom: 20px;
          text-transform: uppercase;
        }
        .md-hero h1 {
          font-size: clamp(2.2rem, 5vw, 3.8rem);
          font-weight: 800;
          color: var(--text);
          line-height: 1.1;
          letter-spacing: -2px;
          margin-bottom: 14px;
        }
        .md-hero h1 span {
          background: linear-gradient(135deg,#8b5cf6,#ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .md-hero p {
          color: var(--text-secondary);
          font-size: 1.05rem;
          max-width: 500px;
          margin: 0 auto;
          line-height: 1.7;
        }

        /* ── Card ── */
        .md-card {
          max-width: 720px;
          margin: 0 auto;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 28px;
          padding: 36px;
          position: relative;
          overflow: visible;
          backdrop-filter: blur(20px);
        }
        .md-card-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at top left, rgba(139,92,246,0.08), transparent 60%);
          pointer-events: none;
        }

        /* ── Textarea ── */
        .md-textarea-wrap {
          position: relative;
          margin-bottom: 16px;
        }
        .md-textarea {
          width: 100%;
          min-height: 140px;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          border-radius: 16px;
          color: var(--input-text);
          font-size: 1rem;
          padding: 18px 60px 18px 18px;
          resize: vertical;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
          line-height: 1.7;
        }
        .md-textarea.listening {
          border-color: rgba(139,92,246,0.7);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.2), 0 0 20px rgba(139,92,246,0.15);
        }
        .md-textarea:focus {
          border-color: rgba(139,92,246,0.5);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.12);
        }
        .md-textarea::placeholder { color: var(--input-placeholder); }

        /* ── Mic button ── */
        .md-mic-btn {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          transition: all 0.2s ease;
          z-index: 2;
          background: rgba(139,92,246,0.12);
          color: #a78bfa;
        }
        .md-mic-btn:hover {
          background: rgba(139,92,246,0.22);
          transform: scale(1.08);
        }
        .md-mic-btn.active {
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          color: white;
          box-shadow: 0 0 0 4px rgba(139,92,246,0.25), 0 0 16px rgba(139,92,246,0.4);
          animation: micPulse 1.4s ease-in-out infinite;
        }
        @keyframes micPulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(139,92,246,0.25), 0 0 16px rgba(139,92,246,0.4); }
          50%       { box-shadow: 0 0 0 8px rgba(139,92,246,0.12), 0 0 28px rgba(139,92,246,0.55); }
        }

        /* ── Mic status label ── */
        .md-mic-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #a78bfa;
          animation: fadeIn 0.3s ease;
        }
        .md-mic-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #a78bfa;
          animation: micDot 1s ease-in-out infinite;
        }
        @keyframes micDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.7); }
        }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

        /* ── Mic error ── */
        .md-mic-error {
          margin-top: 8px;
          padding: 10px 14px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 10px;
          font-size: 0.83rem;
          color: #f87171;
        }

        .md-textarea-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 4px 0;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        /* ── Preference Inputs ── */
        .md-prefs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 24px;
        }
        @media (max-width: 520px) { .md-prefs { grid-template-columns: 1fr; } }
        .md-pref-input {
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          border-radius: 12px;
          color: var(--input-text);
          font-size: 0.9rem;
          padding: 12px 16px;
          outline: none;
          width: 100%;
          transition: border-color 0.2s;
          font-family: inherit;
        }
        .md-pref-input:focus {
          border-color: rgba(139,92,246,0.4);
        }
        .md-pref-input::placeholder { color: var(--input-placeholder); }

        /* ── Search & Select Autocomplete Dropdown ── */
        .md-pref-group {
          position: relative;
          width: 100%;
        }
        .md-input-with-clear {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
        }
        .md-clear-btn {
          position: absolute;
          right: 12px;
          background: rgba(255,255,255,0.1);
          border: none;
          color: var(--text-secondary);
          width: 22px;
          height: 22px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          transition: all 0.15s ease;
          z-index: 2;
        }
        .md-clear-btn:hover {
          background: rgba(239, 68, 68, 0.25);
          color: #ef4444;
        }
        .md-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: #161124;
          border: 1px solid rgba(139, 92, 246, 0.4);
          border-radius: 16px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.65), 0 0 25px rgba(139, 92, 246, 0.18);
          backdrop-filter: blur(24px);
          z-index: 999;
          overflow: hidden;
          animation: dropDownSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes dropDownSlide {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        html.light .md-dropdown {
          background: #ffffff;
          border-color: rgba(139, 92, 246, 0.25);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.14);
        }
        .md-dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: rgba(139, 92, 246, 0.12);
          border-bottom: 1px solid rgba(139, 92, 246, 0.18);
          font-size: 0.74rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #a78bfa;
        }
        .md-dropdown-hint {
          font-size: 0.7rem;
          color: var(--text-secondary);
          font-weight: 500;
          text-transform: none;
          letter-spacing: 0;
        }
        .md-dropdown-list {
          max-height: 230px;
          overflow-y: auto;
        }
        .md-dropdown-list::-webkit-scrollbar {
          width: 6px;
        }
        .md-dropdown-list::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.35);
          border-radius: 99px;
        }
        .md-dropdown-item {
          padding: 11px 16px;
          font-size: 0.9rem;
          color: var(--text);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: background 0.15s ease, color 0.15s ease;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        }
        .md-dropdown-item:last-child { border-bottom: none; }
        .md-dropdown-item:hover, .md-dropdown-item.selected {
          background: rgba(139, 92, 246, 0.22);
          color: #c4b5fd;
        }
        .md-item-icon { font-size: 1rem; flex-shrink: 0; }
        .md-item-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .md-item-check { color: #a78bfa; font-weight: bold; }
        .md-dropdown-empty {
          padding: 16px;
          font-size: 0.85rem;
          color: var(--text-secondary);
          text-align: center;
        }

        /* ── Language Selector Pills ── */
        .md-lang-wrap {
          margin-bottom: 20px;
        }
        .md-lang-label {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: var(--text-secondary);
          margin-bottom: 8px;
          display: block;
        }
        .md-lang-group {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .md-lang-pill {
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          color: var(--text-secondary);
          padding: 8px 18px;
          border-radius: 99px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .md-lang-pill:hover {
          border-color: rgba(139,92,246,0.4);
          color: var(--text);
        }
        .md-lang-pill.active {
          background: linear-gradient(135deg, rgba(139,92,246,0.25), rgba(236,72,153,0.25));
          border-color: rgba(139,92,246,0.6);
          color: var(--text);
          box-shadow: 0 4px 14px rgba(139,92,246,0.2);
        }

        /* ── Inline feedback message ── */
        .md-inline-message {
          margin-top: 14px;
          padding: 12px 16px;
          border-radius: 14px;
          border: 1px solid rgba(139,92,246,0.36);
          color: var(--text);
          background: rgba(139,92,246,0.10);
          font-size: 0.92rem;
          line-height: 1.55;
          box-shadow: 0 10px 30px rgba(0,0,0,0.16);
        }

        /* ── Analyze button ── */
        .md-analyze-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          color: #fff;
          border: none;
          border-radius: 14px;
          font-size: 1.05rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          position: relative;
          overflow: hidden;
        }
        .md-analyze-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 16px 40px rgba(139,92,246,0.4);
        }
        .md-analyze-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .md-analyze-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg,rgba(255,255,255,0.15),transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .md-analyze-btn:hover::before { opacity: 1; }
        .md-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Result card ── */
        .md-result {
          margin-top: 28px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 24px;
          animation: fadeUp 0.4s ease;
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        .md-result-top {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 20px;
        }
        .md-result-emoji {
          font-size: 3.5rem;
          filter: drop-shadow(0 0 16px var(--result-color, #8b5cf6));
          flex-shrink: 0;
        }
        .md-result-label {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--result-color, #a78bfa);
          margin-bottom: 4px;
        }
        .md-result-name {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--text);
          margin-bottom: 4px;
        }
        .md-result-desc {
          color: var(--text-secondary);
          font-size: 0.9rem;
          line-height: 1.6;
        }
        .md-conf-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.82rem;
          color: var(--muted);
          margin-bottom: 8px;
        }
        .md-conf-track {
          height: 8px;
          background: rgba(255,255,255,0.07);
          border-radius: 99px;
          overflow: hidden;
          margin-bottom: 22px;
        }
        .md-conf-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 0.8s ease;
        }
        .md-playlist-btn {
          width: 100%;
          padding: 14px;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          color: var(--text);
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: background 0.2s, border-color 0.2s;
        }
        .md-playlist-btn:hover {
          background: rgba(139,92,246,0.12);
          border-color: rgba(139,92,246,0.3);
        }

        /* ── Feature strip ── */
        .md-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          max-width: 720px;
          margin: 36px auto 0;
        }
        @media (max-width: 600px) { .md-features { grid-template-columns: 1fr; } }
        .md-feature {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .md-feature-icon {
          font-size: 1.6rem;
          flex-shrink: 0;
        }
        .md-feature h3 {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 4px;
        }
        .md-feature p {
          font-size: 0.82rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        /* ── Weather Section Responsive Styling ── */
        .md-weather-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 22px 24px;
          margin-bottom: 26px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(16px);
          transition: all 0.3s ease;
        }
        .md-weather-section.active {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%);
          border: 1px solid rgba(168, 85, 247, 0.35);
          box-shadow: 0 12px 35px rgba(139, 92, 246, 0.15);
        }
        .md-weather-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
        }
        .md-weather-title-group {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .md-weather-toggle-btn {
          width: 48px;
          height: 26px;
          border-radius: 13px;
          position: relative;
          border: none;
          cursor: pointer;
          transition: background 0.3s ease, box-shadow 0.3s ease;
          flex-shrink: 0;
        }
        .md-weather-toggle-thumb {
          width: 20px;
          height: 20px;
          background: #fff;
          border-radius: 50%;
          position: absolute;
          top: 3px;
          transition: left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
        }
        .md-weather-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.92rem;
          color: #fff;
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(99, 102, 241, 0.2));
          padding: 7px 18px;
          border-radius: 99px;
          border: 1px solid rgba(168, 85, 247, 0.4);
          box-shadow: 0 4px 15px rgba(168, 85, 247, 0.2);
        }
        .md-weather-input-container {
          margin-top: 18px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .md-weather-field-wrap {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
          width: 100%;
        }
        .md-weather-field-icon {
          position: absolute;
          left: 14px;
          font-size: 1.1rem;
          pointer-events: none;
          opacity: 0.7;
          z-index: 1;
        }
        .md-weather-city-input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(0, 0, 0, 0.25);
          color: #fff;
          font-size: 0.93rem;
          box-sizing: border-box;
          outline: none;
          font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .md-weather-city-input:focus {
          border-color: rgba(168, 85, 247, 0.6);
          box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.2);
        }
        .md-weather-city-input::placeholder {
          color: rgba(255, 255, 255, 0.45);
        }
        .md-weather-update-btn {
          background: linear-gradient(135deg, #a855f7, #6366f1);
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 12px 24px;
          font-weight: 700;
          font-size: 0.92rem;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(168, 85, 247, 0.35);
          transition: all 0.2s ease;
          white-space: nowrap;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .md-weather-update-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(168, 85, 247, 0.5);
        }
        .md-weather-update-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .md-weather-update-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .md-weather-location-bar {
          margin-top: 14px;
          font-size: 0.86rem;
          color: #94a3b8;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          word-break: break-word;
        }

        /* Mobile / Phone Responsive Optimization:
           Place input given full width so the place is properly visible,
           and Update button positioned below the place input. */
        @media (max-width: 640px) {
          .md-weather-section {
            padding: 18px 16px;
          }
          .md-weather-input-container {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          .md-weather-field-wrap {
            width: 100%;
          }
          .md-weather-city-input {
            width: 100%;
            font-size: 0.95rem;
            padding-top: 12px;
            padding-bottom: 12px;
          }
          .md-weather-update-btn {
            width: 100%;
            padding: 12px 18px;
            font-size: 0.95rem;
          }
        }

        /* ── Light mode overrides (inside same <style> to win cascade) ── */
        html.light .md-hero h1 { color: #17131f; }
        html.light .md-hero p { color: #52525b; }
        html.light .md-badge {
          color: #7c3aed;
          background: #f3e8ff;
          border-color: #ddd6fe;
        }
        html.light .md-card {
          background: #ffffff;
          border-color: rgba(0,0,0,0.08);
          box-shadow: 0 8px 32px rgba(0,0,0,0.08);
        }
        html.light .md-card-glow {
          background: radial-gradient(ellipse at top left, rgba(139,92,246,0.04), transparent 60%);
        }
        html.light .md-textarea {
          background: #f9f9fb;
          border-color: #d4d4d8;
          color: #17131f;
        }
        html.light .md-textarea::placeholder { color: #a1a1aa; }
        html.light .md-textarea-footer { color: #71717a; }
        html.light .md-pref-input {
          background: #f4f4f5;
          border-color: #d4d4d8;
          color: #17131f;
        }
        html.light .md-pref-input::placeholder { color: #a1a1aa; }
        html.light .md-weather-section {
          background: #ffffff;
          border-color: rgba(0,0,0,0.08);
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        html.light .md-weather-section.active {
          background: linear-gradient(135deg, rgba(168,85,247,0.07) 0%, rgba(99,102,241,0.04) 100%);
          border-color: rgba(168,85,247,0.3);
        }
        html.light .md-weather-city-input {
          background: #f4f4f5;
          border-color: #d4d4d8;
          color: #17131f;
        }
        html.light .md-weather-city-input::placeholder {
          color: #a1a1aa;
        }
        html.light .md-weather-badge {
          color: #1e1b4b;
          background: rgba(168,85,247,0.12);
          border-color: rgba(168,85,247,0.28);
        }
        html.light .md-weather-location-bar {
          color: #64748b;
        }
        html.light .md-weather-location-bar strong {
          color: #0f172a !important;
        }
        html.light .md-result {
          background: #ffffff;
          border-color: rgba(0,0,0,0.08);
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        html.light .md-result-name { color: #17131f; }
        html.light .md-result-desc { color: #52525b; }
        html.light .md-conf-label { color: #71717a; }
        .md-conf-value { color: #ffffff; font-weight: 700; }
        html.light .md-conf-value { color: #17131f; }
        html.light .md-conf-track { background: rgba(0,0,0,0.08); }
        html.light .md-playlist-btn {
          background: #f4f4f5;
          border-color: #d4d4d8;
          color: #17131f;
        }
        html.light .md-playlist-btn:hover {
          background: rgba(139,92,246,0.08);
          border-color: rgba(139,92,246,0.3);
        }
        html.light .md-feature {
          background: #f4f4f5;
          border-color: rgba(0,0,0,0.07);
        }
        html.light .md-feature h3 { color: #17131f; }
        html.light .md-feature p  { color: #71717a; }

        /* ── Feedback / Correction UI ── */
        .md-feedback-wrapper {
          display: flex;
          justify-content: center;
          width: 100%;
          margin-top: 10px;
        }
        .md-feedback-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 4px 11px;
          border-radius: 99px;
          background: rgba(168, 85, 247, 0.07);
          border: 1px solid rgba(168, 85, 247, 0.22);
          color: rgba(196, 181, 253, 0.65);
          font-weight: 500;
          font-size: 0.72rem;
          font-family: inherit;
          cursor: pointer;
          opacity: 0.8;
          transition: all 0.2s ease;
        }
        .md-feedback-link:hover {
          background: rgba(168, 85, 247, 0.18);
          border-color: rgba(168, 85, 247, 0.5);
          color: #d8b4fe;
          opacity: 1;
          transform: translateY(-1px);
          box-shadow: 0 3px 10px rgba(168, 85, 247, 0.2);
        }
        .md-feedback-icon { font-size: 0.75rem; }
        .md-feedback-arrow {
          opacity: 0.5;
          font-size: 0.72rem;
          transition: transform 0.2s;
        }
        .md-feedback-link:hover .md-feedback-arrow {
          transform: translateX(2px);
          opacity: 0.9;
        }

        .md-feedback-confirmed {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 99px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.25);
          color: rgba(52, 211, 153, 0.75);
          font-size: 0.7rem;
          font-weight: 500;
          animation: fadeIn 0.3s ease;
        }
        .md-feedback-check-circle {
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: #10b981;
          color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 0.55rem;
          flex-shrink: 0;
        }

        /* Modal overlay */
        .md-correction-overlay {
          position: fixed;
          inset: 0;
          background: rgba(6, 4, 15, 0.82);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.25s ease-out;
        }

        .md-correction-modal {
          background: linear-gradient(165deg, rgba(24, 18, 43, 0.96), rgba(13, 9, 26, 0.98));
          border: 1px solid rgba(168, 85, 247, 0.4);
          border-radius: 28px;
          padding: 34px 28px 28px;
          max-width: 520px;
          width: 100%;
          box-shadow: 0 32px 90px rgba(0,0,0,0.85), 0 0 50px rgba(168,85,247,0.25);
          animation: modalPop 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }
        @keyframes modalPop {
          0% { transform: scale(0.92) translateY(20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }

        html.light .md-correction-modal {
          background: linear-gradient(165deg, #ffffff, #f8fafc);
          border-color: rgba(168,85,247,0.3);
          box-shadow: 0 24px 60px rgba(0,0,0,0.15), 0 0 40px rgba(168,85,247,0.15);
        }

        .md-modal-header-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 5px 12px;
          border-radius: 99px;
          background: rgba(168, 85, 247, 0.15);
          border: 1px solid rgba(168, 85, 247, 0.35);
          color: #c4b5fd;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          margin-bottom: 14px;
        }
        .md-pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #a855f7;
          box-shadow: 0 0 8px #a855f7;
          animation: pulseDot 1.5s infinite;
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }

        .md-correction-close {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.06);
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .md-correction-close:hover {
          background: rgba(239, 68, 68, 0.25);
          border-color: rgba(239, 68, 68, 0.5);
          color: #f87171;
          transform: rotate(90deg);
        }

        .md-correction-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text);
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }

        .md-correction-sub {
          font-size: 0.88rem;
          color: var(--text-secondary);
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .md-correction-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        @media (max-width: 440px) {
          .md-correction-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .md-emotion-chip {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 16px 10px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
          overflow: hidden;
        }

        html.light .md-emotion-chip {
          background: #f1f5f9;
          border-color: #e2e8f0;
        }

        .md-emotion-chip:hover {
          border-color: var(--chip-color, #a855f7);
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 25px -5px var(--chip-color, rgba(168,85,247,0.4));
        }

        .md-emotion-chip.active {
          border-color: var(--chip-color, #a855f7);
          background: var(--chip-gradient, linear-gradient(135deg, #a855f7, #6366f1));
          box-shadow: 0 8px 25px -4px var(--chip-color, rgba(168,85,247,0.5));
        }
        .md-emotion-chip.active .md-emotion-chip-name {
          color: #ffffff;
        }

        .md-emotion-chip-emoji {
          font-size: 2.1rem;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .md-emotion-chip:hover .md-emotion-chip-emoji {
          transform: scale(1.2) rotate(6deg);
        }

        .md-emotion-chip-name {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text);
          text-transform: capitalize;
        }

        .md-corrected-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 99px;
          background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.25));
          border: 1px solid rgba(16,185,129,0.4);
          color: #34d399;
          font-size: 0.85rem;
          font-weight: 700;
          margin-bottom: 18px;
          box-shadow: 0 4px 15px rgba(16,185,129,0.15);
        }

        .md-fetching-corrected {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          border-radius: 12px;
          background: rgba(168, 85, 247, 0.1);
          border: 1px solid rgba(168, 85, 247, 0.25);
          color: #c4b5fd;
          font-size: 0.86rem;
          font-weight: 600;
          margin-bottom: 16px;
          animation: fadeIn 0.3s ease;
        }
      `}</style>

      {/* Ambient orbs */}
      <div className="md-orb md-orb-1" />
      <div className="md-orb md-orb-2" />



      {/* ── MAIN ── */}
      <main className="md-page">

        {/* Hero */}
        <div className="md-hero">
          <div className="md-badge">✦ AI Mood Detection</div>
          <h1>How are you <span>feeling?</span></h1>
          <p>
            Tell Moodify what's on your mind and let AI
            create a soundtrack that matches your emotions.
          </p>
        </div>

        {/* Detection Card */}
        <section className="md-card">
          <div className="md-card-glow" />

          {/* Textarea + Mic Button */}
          <div className="md-textarea-wrap">
            <textarea
              className={`md-textarea${isListening ? " listening" : ""}`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={500}
              placeholder="Example: I've had a long day and I just want to relax with some peaceful music... or click 🎤 to speak"
            />
            {/* 🎤 Microphone / Voice Input Button */}
            <button
              type="button"
              className={`md-mic-btn${isListening ? " active" : ""}`}
              onClick={toggleVoice}
              title={isListening ? "Stop recording" : "Speak your mood (Voice input)"}
            >
              {isListening ? "⏹" : "🎤"}
            </button>
            <div className="md-textarea-footer">
              {isListening ? (
                <span className="md-mic-status">
                  <span className="md-mic-dot" />
                  Listening... speak now, click ⏹ to stop
                </span>
              ) : (
                <span>✨ AI will analyze your emotions</span>
              )}
              <span>{text.length}/500</span>
            </div>
            {micError && <div className="md-mic-error">🚫 {micError}</div>}
          </div>

          {/* Preferences with Proper Search & Select Dropdowns */}
          <div className="md-prefs">
            {/* Genre Search Dropdown */}
            <div
              className="md-pref-group"
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setShowGenreDropdown(false);
                }
              }}
            >
              <div className="md-input-with-clear">
                <input
                  className="md-pref-input"
                  type="text"
                  value={genre}
                  onFocus={() => {
                    setShowGenreDropdown(true);
                    fetchGenreSuggestions(genre.trim());
                  }}
                  onChange={(e) => {
                    setGenre(e.target.value);
                    setShowGenreDropdown(true);
                  }}
                  placeholder="🎸 Search or Select Genre..."
                />
                {genre && (
                  <button
                    type="button"
                    className="md-clear-btn"
                    onClick={() => setGenre("")}
                    title="Clear genre"
                  >
                    ✕
                  </button>
                )}
              </div>

              {showGenreDropdown && (
                <div className="md-dropdown">
                  <div className="md-dropdown-header">
                    <span>{genre.trim() ? "Matching Genres" : "Top Dataset Genres"}</span>
                    <span className="md-dropdown-hint">Type initials to search</span>
                  </div>
                  <div className="md-dropdown-list">
                    {genreSuggestions.length > 0 ? (
                      genreSuggestions.map((g) => (
                        <div
                          key={g}
                          className={`md-dropdown-item${genre === g ? " selected" : ""}`}
                          onMouseDown={() => {
                            setGenre(g);
                            setShowGenreDropdown(false);
                          }}
                        >
                          <span className="md-item-icon">🎵</span>
                          <span className="md-item-name">{g}</span>
                          {genre === g && <span className="md-item-check">✓</span>}
                        </div>
                      ))
                    ) : (
                      <div className="md-dropdown-empty">No matching genre found</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Artist Search Dropdown */}
            <div
              className="md-pref-group"
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setShowArtistDropdown(false);
                }
              }}
            >
              <div className="md-input-with-clear">
                <input
                  className="md-pref-input"
                  type="text"
                  value={artist}
                  onFocus={() => {
                    setShowArtistDropdown(true);
                    fetchArtistSuggestions(artist.trim());
                  }}
                  onChange={(e) => {
                    setArtist(e.target.value);
                    setShowArtistDropdown(true);
                  }}
                  placeholder="🎤 Search or Select Artist..."
                />
                {artist && (
                  <button
                    type="button"
                    className="md-clear-btn"
                    onClick={() => setArtist("")}
                    title="Clear artist"
                  >
                    ✕
                  </button>
                )}
              </div>

              {showArtistDropdown && (
                <div className="md-dropdown">
                  <div className="md-dropdown-header">
                    <span>{artist.trim() ? "Matching Artists" : "Top Dataset Artists"}</span>
                    <span className="md-dropdown-hint">30,000+ available</span>
                  </div>
                  <div className="md-dropdown-list">
                    {artistSuggestions.length > 0 ? (
                      artistSuggestions.map((a) => (
                        <div
                          key={a}
                          className={`md-dropdown-item${artist === a ? " selected" : ""}`}
                          onMouseDown={() => {
                            setArtist(a);
                            setShowArtistDropdown(false);
                          }}
                        >
                          <span className="md-item-icon">🎤</span>
                          <span className="md-item-name">{a}</span>
                          {artist === a && <span className="md-item-check">✓</span>}
                        </div>
                      ))
                    ) : (
                      <div className="md-dropdown-empty">No matching artist found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* =========================================================
              WEATHER-BASED RECOMMENDATIONS CARD
             ========================================================= */}
          <div className={`md-weather-section${useWeather ? ' active' : ''}`}>
            <div className="md-weather-header">
              <div className="md-weather-title-group">
                <button
                  type="button"
                  onClick={() => setUseWeather(!useWeather)}
                  className="md-weather-toggle-btn"
                  style={{
                    background: useWeather ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'rgba(255,255,255,0.15)',
                    boxShadow: useWeather ? '0 0 12px rgba(168,85,247,0.5)' : 'none',
                  }}
                  title={useWeather ? 'Disable weather recommendations' : 'Enable weather recommendations'}
                >
                  <div
                    className="md-weather-toggle-thumb"
                    style={{ left: useWeather ? '25px' : '3px' }}
                  />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.25rem' }}>🌤️</span>
                  <span style={{ color: 'var(--text)', fontSize: '1.02rem', fontWeight: '700', letterSpacing: '-0.01em' }}>
                    Weather-based Recommendations
                  </span>
                </div>
              </div>

              {useWeather && weatherContext && (
                <div className="md-weather-badge">
                  <span style={{ fontSize: '1.2rem' }}>{weatherContext.icon}</span>
                  <span style={{ fontWeight: '800', fontSize: '1.05rem', color: '#f3e8ff' }}>{weatherContext.temp_c}°C</span>
                  <span style={{ opacity: 0.85, fontWeight: '500', color: '#cbd5e1' }}>• {weatherContext.condition}</span>
                </div>
              )}
            </div>

            {useWeather && (
              <div className="md-weather-input-container">
                <div className="md-weather-field-wrap">
                  <span className="md-weather-field-icon">
                    📍
                  </span>
                  <input
                    type="text"
                    className="md-weather-city-input"
                    placeholder="Enter city name (e.g. London, Bicholim, Tokyo)..."
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') updateCityWeather(customCity); }}
                  />
                </div>

                <button
                  type="button"
                  className="md-weather-update-btn"
                  onClick={() => updateCityWeather(customCity)}
                  disabled={isUpdatingWeather}
                  title="Update weather for entered city"
                >
                  {isUpdatingWeather ? 'Updating...' : 'Update'}
                </button>
              </div>
            )}
            
            {useWeather && weatherContext && (
               <div className="md-weather-location-bar">
                 <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e', display: 'inline-block', flexShrink: 0 }} />
                 <span>Active Location:</span>
                 <strong style={{ color: '#f8fafc', fontWeight: '700' }}>{detectedLocation}</strong>
               </div>
            )}
          </div>

          {/* Analyze Button */}
          <button
            className="md-analyze-btn"
            onClick={detectMood}
            disabled={loading}
          >
            {loading ? (
              <><div className="md-spinner" /> Analyzing your mood...</>
            ) : (
              <>✨ Analyze My Mood</>
            )}
          </button>

          {inlineMessage && (
            <div className="md-inline-message">
              {inlineMessage}
            </div>
          )}

          {/* ── RESULT CARD ── */}
          {mood && (
            <div
              className="md-result"
              style={{ "--result-color": (correctedEmotion ? MOOD_MAPPING[correctedEmotion]?.color : mood.color) }}
            >
              <div className="md-result-top">
                <div className="md-result-emoji">
                  {correctedEmotion ? MOOD_MAPPING[correctedEmotion]?.emoji : mood.emoji}
                </div>
                <div>
                  <div className="md-result-label">Mood Detected</div>
                  <div className="md-result-name">
                    You seem {correctedEmotion ? MOOD_MAPPING[correctedEmotion]?.name : mood.name}
                  </div>
                  <div className="md-result-desc">
                    {correctedEmotion ? MOOD_MAPPING[correctedEmotion]?.description : mood.description}
                  </div>
                </div>
              </div>

              {/* Corrected badge */}
              {correctedEmotion && (
                <div className="md-corrected-badge">
                  ✅ Corrected to <strong style={{ textTransform: 'capitalize', marginLeft: 4 }}>{correctedEmotion}</strong>
                  &nbsp;— thanks for helping us improve!
                </div>
              )}

              {useWeather && weatherContext && (
                <div style={{ marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#a78bfa', background: 'rgba(139,92,246,0.1)', padding: '6px 12px', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <span>{weatherContext.icon}</span>
                  <span>Songs filtered for <strong>{weatherContext.condition}</strong> weather</span>
                </div>
              )}

              <div className="md-conf-label">
                <span>AI Confidence</span>
                <strong className="md-conf-value">{mood.confidence}%</strong>
              </div>
              <div className="md-conf-track">
                <div
                  className="md-conf-fill"
                  style={{ width: `${mood.confidence}%`, background: correctedEmotion ? MOOD_MAPPING[correctedEmotion]?.gradient : mood.gradient }}
                />
              </div>

              {/* Loading state while fetching corrected recs */}
              {isFetchingCorrected && (
                <div className="md-fetching-corrected">
                  <div className="md-spinner" style={{ borderColor: 'rgba(139,92,246,0.3)', borderTopColor: '#a78bfa' }} />
                  Fetching songs for your corrected mood...
                </div>
              )}

              <button
                className="md-playlist-btn"
                onClick={() => navigate("/recommendations")}
                disabled={isFetchingCorrected}
                style={isFetchingCorrected ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              >
                {isFetchingCorrected
                  ? "Updating playlist..."
                  : `Create My ${correctedEmotion ? MOOD_MAPPING[correctedEmotion]?.name : mood.name} Playlist →`
                }
              </button>

              {/* ── Feedback link pill ── */}
              <div className="md-feedback-wrapper">
                {!feedbackSent && !correctedEmotion ? (
                  <button
                    className="md-feedback-link"
                    onClick={() => setShowCorrectionModal(true)}
                    title="Let us know if we got your mood wrong"
                  >
                    <span className="md-feedback-icon">💡</span>
                    <span>Guessed wrong? Help us correct your mood</span>
                    <span className="md-feedback-arrow">→</span>
                  </button>
                ) : (
                  <div className="md-feedback-confirmed">
                    <span className="md-feedback-check-circle">✓</span>
                    <span>Feedback saved! Model will learn from this correction.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Emotion Correction Modal ── */}
          {showCorrectionModal && (
            <div
              className="md-correction-overlay"
              onClick={(e) => { if (e.target === e.currentTarget) setShowCorrectionModal(false); }}
            >
              <div className="md-correction-modal">
                <button
                  className="md-correction-close"
                  onClick={() => setShowCorrectionModal(false)}
                  title="Close"
                >✕</button>

                <div className="md-modal-header-badge">
                  <span className="md-pulse-dot" />
                  LIVE AI CONTINUOUS LEARNING
                </div>

                <div className="md-correction-title">What emotion were you actually feeling?</div>
                <div className="md-correction-sub">
                  We detected <strong style={{ color: mood?.color || "#a855f7" }}>
                    {mood?.emoji} {mood?.name}
                  </strong>. Select your true mood below — your input directly trains and improves our model!
                </div>

                <div className="md-correction-grid">
                  {Object.entries(MOOD_MAPPING).map(([key, val]) => {
                    const isSelected = (correctedEmotion === key) || (mood?.emotion === key && !correctedEmotion);
                    return (
                      <button
                        key={key}
                        className={`md-emotion-chip ${isSelected ? "active" : ""}`}
                        style={{
                          "--chip-color": val.color,
                          "--chip-gradient": val.gradient,
                        }}
                        onClick={() => handleEmotionCorrection(key)}
                        title={val.name}
                      >
                        <span className="md-emotion-chip-emoji">{val.emoji}</span>
                        <span className="md-emotion-chip-name">{val.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Feature strip */}
        <div className="md-features">
          <div className="md-feature">
            <div className="md-feature-icon">🧠</div>
            <div>
              <h3>AI Powered</h3>
              <p>Understand emotions using our custom-trained LSTM model.</p>
            </div>
          </div>
          <div className="md-feature">
            <div className="md-feature-icon">🎵</div>
            <div>
              <h3>Personalized Music</h3>
              <p>Songs selected specifically for your current emotional state.</p>
            </div>
          </div>
          <div className="md-feature">
            <div className="md-feature-icon">📊</div>
            <div>
              <h3>Mood Insights</h3>
              <p>Track your emotional journey through your listening history.</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
