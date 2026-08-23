import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  createUserWithEmailAndPassword
} from "firebase/auth";

import { auth } from "./firebase";


export default function Register() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [otp, setOtp] = useState("");

  const [otpSent, setOtpSent] = useState(false);

  const [otpVerified, setOtpVerified] = useState(false);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const [otpLoading, setOtpLoading] = useState(false);


  // --------------------------------------------------
  // Handle input changes
  // --------------------------------------------------

  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value
    });

    setError("");
    setMessage("");
  };


  // --------------------------------------------------
  // Send OTP
  // --------------------------------------------------

  const handleSendOTP = async () => {

    setError("");
    setMessage("");

    // Check email
    if (!form.email.trim()) {

      setError(
        "Please enter your email address."
      );

      return;
    }


    // Check email format
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(form.email.trim())) {

      setError(
        "Please enter a valid email address."
      );

      return;
    }


    try {

      setOtpLoading(true);


      const response = await fetch(
        "http://localhost:5000/send-otp",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email: form.email.trim()
          })
        }
      );


      const data = await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Failed to send OTP."
        );
      }


      setOtpSent(true);

      setMessage(
        "OTP sent successfully! Check your email."
      );


    } catch (error) {

      console.error(error);

      setError(
        error.message ||
        "Unable to send OTP."
      );

    } finally {

      setOtpLoading(false);

    }

  };


  // --------------------------------------------------
  // Verify OTP
  // --------------------------------------------------

  const handleVerifyOTP = async () => {

    setError("");
    setMessage("");


    if (!otp.trim()) {

      setError(
        "Please enter the OTP."
      );

      return;
    }


    if (otp.length !== 6) {

      setError(
        "OTP must contain 6 digits."
      );

      return;
    }


    try {

      setOtpLoading(true);


      const response = await fetch(
        "http://localhost:5000/verify-otp",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email: form.email.trim(),
            otp: otp.trim()
          })
        }
      );


      const data = await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "OTP verification failed."
        );
      }


      setOtpVerified(true);

      setMessage(
        "Email verified successfully!"
      );


    } catch (error) {

      console.error(error);

      setError(
        error.message ||
        "Invalid OTP."
      );

    } finally {

      setOtpLoading(false);

    }

  };


  // --------------------------------------------------
  // Register
  // --------------------------------------------------

  const handleRegister = async (e) => {

    e.preventDefault();

    setError("");
    setMessage("");


    // Check empty fields

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.confirmPassword
    ) {

      setError(
        "Please fill in all fields."
      );

      return;
    }


    // Check password length

    if (form.password.length < 6) {

      setError(
        "Password must contain at least 6 characters."
      );

      return;
    }


    // Check password match

    if (
      form.password !== form.confirmPassword
    ) {

      setError(
        "Passwords do not match."
      );

      return;
    }


    // OTP must be verified

    if (!otpVerified) {

      setError(
        "Please verify your email with OTP first."
      );

      return;
    }


    try {

      setLoading(true);


      // --------------------------------------------------
      // Create Firebase account
      // --------------------------------------------------

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          form.email.trim(),
          form.password
        );


      // --------------------------------------------------
      // Store name locally
      // --------------------------------------------------

      localStorage.setItem(
        "moodifyUserName",
        form.name.trim()
      );


      // User is not automatically considered logged in
      localStorage.removeItem(
        "moodifyLoggedIn"
      );


      alert(
        "Account created successfully!"
      );


      navigate("/login");


    } catch (error) {

      console.error(error);


      if (
        error.code ===
        "auth/email-already-in-use"
      ) {

        setError(
          "This email is already registered."
        );

      } else if (
        error.code ===
        "auth/invalid-email"
      ) {

        setError(
          "Please enter a valid email address."
        );

      } else if (
        error.code ===
        "auth/weak-password"
      ) {

        setError(
          "Password must contain at least 6 characters."
        );

      } else {

        setError(
          error.message ||
          "Registration failed. Please try again."
        );

      }

    } finally {

      setLoading(false);

    }

  };


  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (

    <div className="auth-page">

      <div className="auth-card">


        {/* LOGO */}

        <div className="auth-logo">

          <div className="auth-logo-icon">
            ♫
          </div>

          <span>
            Moodify
          </span>

        </div>


        {/* HEADER */}

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


        {/* FORM */}

        <form onSubmit={handleRegister}>


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
              disabled={otpVerified}
            />

          </div>


          {/* SEND OTP */}

          {!otpVerified && (

            <button
              type="button"
              className="auth-submit"
              onClick={handleSendOTP}
              disabled={otpLoading}
              style={{
                marginBottom: "15px"
              }}
            >

              {otpLoading
                ? "Sending OTP..."
                : otpSent
                  ? "Resend OTP"
                  : "Send OTP"}

            </button>

          )}


          {/* OTP */}

          {otpSent && !otpVerified && (

            <div className="form-group">

              <label>
                Enter OTP
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength="6"
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


              <button
                type="button"
                className="auth-submit"
                onClick={handleVerifyOTP}
                disabled={otpLoading}
                style={{
                  marginTop: "10px"
                }}
              >

                {otpLoading
                  ? "Verifying..."
                  : "Verify OTP"}

              </button>

            </div>

          )}


          {/* VERIFIED */}

          {otpVerified && (

            <div
              style={{
                padding: "10px",
                marginBottom: "15px",
                borderRadius: "8px",
                background: "#e8f7ee",
                color: "#16803c",
                textAlign: "center"
              }}
            >

              ✅ Email verified successfully

            </div>

          )}


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


          {/* CONFIRM PASSWORD */}

          <div className="form-group">

            <label>
              Confirm Password
            </label>

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChange={handleChange}
            />

          </div>


          {/* ERROR */}

          {error && (

            <div className="auth-error">
              ⚠️ {error}
            </div>

          )}


          {/* SUCCESS */}

          {message && !error && (

            <div
              style={{
                marginBottom: "15px",
                color: "#16803c"
              }}
            >
              {message}
            </div>

          )}


          {/* REGISTER */}

          <button
            type="submit"
            className="auth-submit"
            disabled={
              loading ||
              !otpVerified
            }
          >

            {loading
              ? "Creating Account..."
              : "Create My Account →"}

          </button>


        </form>


        {/* LOGIN LINK */}

        <div className="auth-switch">

          <span>
            Already have an account?
          </span>

          <button
            type="button"
            onClick={() => navigate("/login")}
          >
            Login
          </button>

        </div>

      </div>

    </div>

  );

}