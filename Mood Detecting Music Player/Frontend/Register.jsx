import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  // ==========================================
  // FORM STATE
  // ==========================================

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  // ==========================================
  // OTP STATE
  // ==========================================

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================================
  // HANDLE INPUT
  // ==========================================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  // ==========================================
  // SEND OTP
  // ==========================================

  const handleSendOTP = async () => {
    setError("");

    // Check empty fields
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.phone.trim()
    ) {
      setError("Please fill in all fields.");
      return;
    }

    // Check email
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      setError("Please enter a valid email address.");
      return;
    }

    // Check password
    if (form.password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    // Remove spaces
    const cleanPhone = form.phone.replace(/\s/g, "");

    // Check phone number
    if (!/^\+\d{10,15}$/.test(cleanPhone)) {
      setError(
        "Please enter a valid phone number with country code. Example: +919850365997"
      );
      return;
    }

    try {
      setLoading(true);

      console.log("Sending OTP to:", cleanPhone);

      const response = await fetch(
        "http://localhost:5000/send-otp",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            phone: cleanPhone,
          }),
        }
      );

      // Check server response
      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}`
        );
      }

      const data = await response.json();

      console.log("Send OTP response:", data);

      if (data.success) {
        // Save cleaned phone number
        setForm((prev) => ({
          ...prev,
          phone: cleanPhone,
        }));

        setOtpSent(true);
        setOtp("");
        setError("");

        alert(
          `OTP sent successfully to ${cleanPhone}`
        );
      } else {
        // SHOW ACTUAL BACKEND ERROR
        setError(
          data.message ||
            data.error ||
            "Failed to send OTP."
        );

        console.error(
          "Backend OTP error:",
          data
        );
      }
    } catch (error) {
      console.error("Send OTP error:", error);

      setError(
        "Cannot connect to Moodify backend. Make sure server.cjs is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // VERIFY OTP
  // ==========================================

  const handleVerifyOTP = async () => {
    setError("");

    // Check OTP
    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }

    // Check 6 digits
    if (!/^\d{6}$/.test(otp)) {
      setError(
        "OTP must contain exactly 6 digits."
      );
      return;
    }

    // Check phone
    if (!form.phone) {
      setError("Phone number not found.");
      return;
    }

    try {
      setLoading(true);

      console.log(
        "Verifying OTP for:",
        form.phone
      );

      const response = await fetch(
        "http://localhost:5000/verify-otp",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            phone: form.phone,
            otp: otp,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}`
        );
      }

      const data = await response.json();

      console.log(
        "Verify OTP response:",
        data
      );

      if (data.success) {
        // ======================================
        // SAVE USER
        // ======================================

        const user = {
          name: form.name.trim(),

          email: form.email
            .trim()
            .toLowerCase(),

          password: form.password,

          phone: form.phone,
        };

        localStorage.setItem(
          "moodifyUser",
          JSON.stringify(user)
        );

        // User registered but not logged in
        localStorage.removeItem(
          "moodifyLoggedIn"
        );

        alert(
          "Registration successful!"
        );

        navigate("/login");
      } else {
        setError(
          data.message ||
            data.error ||
            "Invalid or expired OTP."
        );
      }
    } catch (error) {
      console.error(
        "Verify OTP error:",
        error
      );

      setError(
        "Cannot connect to Moodify backend. Make sure server.cjs is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CHANGE PHONE NUMBER
  // ==========================================

  const handleChangePhone = () => {
    setOtpSent(false);
    setOtp("");
    setError("");

    console.log(
      "User can enter another phone number now."
    );
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="auth-page">

      <div className="auth-card">

        {/* ==================================
            LOGO
        ================================== */}

        <div className="auth-logo">

          <div className="auth-logo-icon">
            ♫
          </div>

          <span>
            Moodify
          </span>

        </div>


        {/* ==================================
            HEADER
        ================================== */}

        <div className="auth-header">

          <span className="auth-badge">
            ✨ JOIN MOODIFY
          </span>

          <h1>
            Create your account
          </h1>

          <p>
            Start your personalized music journey.
          </p>

        </div>


        {/* ==================================
            REGISTRATION FORM
        ================================== */}

        {!otpSent ? (

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendOTP();
            }}
          >

            {/* NAME */}

            <div className="form-group">

              <label>
                Full Name
              </label>

              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
              />

            </div>


            {/* EMAIL */}

            <div className="form-group">

              <label>
                Email Address
              </label>

              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
              />

            </div>


            {/* PASSWORD */}

            <div className="form-group">

              <label>
                Password
              </label>

              <input
                type="password"
                name="password"
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
              />

            </div>


            {/* PHONE */}

            <div className="form-group">

              <label>
                Phone Number
              </label>

              <input
                type="tel"
                name="phone"
                placeholder="+919850365997"
                value={form.phone}
                onChange={handleChange}
              />

            </div>


            {/* ERROR */}

            {error && (

              <div className="auth-error">
                ⚠️ {error}
              </div>

            )}


            {/* SEND OTP */}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >

              {loading
                ? "Sending OTP..."
                : "Send OTP →"}

            </button>

          </form>

        ) : (

          /* ==================================
             OTP SCREEN
          ================================== */

          <div>

            <div className="form-group">

              <label>
                Verification Code
              </label>

              <p
                style={{
                  marginBottom: "12px",
                  color: "#888",
                  lineHeight: "1.6",
                }}
              >
                OTP sent to:
                <br />

                <strong
                  style={{
                    color: "#fff",
                  }}
                >
                  {form.phone}
                </strong>
              </p>


              {/* OTP */}

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => {
                  const value =
                    e.target.value.replace(
                      /\D/g,
                      ""
                    );

                  setOtp(value);
                  setError("");
                }}
              />

            </div>


            {/* ERROR */}

            {error && (

              <div className="auth-error">
                ⚠️ {error}
              </div>

            )}


            {/* VERIFY OTP */}

            <button
              type="button"
              className="auth-submit"
              onClick={handleVerifyOTP}
              disabled={loading}
            >

              {loading
                ? "Verifying..."
                : "Verify OTP →"}

            </button>


            {/* CHANGE PHONE */}

            <button
              type="button"
              onClick={handleChangePhone}
              disabled={loading}
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "10px",
                background: "transparent",
                border: "none",
                color: "#aaa",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              ← Change phone number
            </button>

          </div>

        )}


        {/* ==================================
            LOGIN
        ================================== */}

        <div className="auth-switch">

          <span>
            Already have an account?
          </span>

          <button
            type="button"
            onClick={() =>
              navigate("/login")
            }
            disabled={loading}
          >
            Login
          </button>

        </div>

      </div>

    </div>
  );
}