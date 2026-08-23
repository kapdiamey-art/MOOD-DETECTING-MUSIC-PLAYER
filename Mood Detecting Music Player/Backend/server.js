const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();

const PORT = 5000;

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

// --------------------------------------------------
// Brevo SMTP
// --------------------------------------------------

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: Number(process.env.BREVO_SMTP_PORT),
  secure: false,

  auth: {
     user: process.env.BREVO_SMTP_USER,
     pass: process.env.BREVO_SMTP_PASS,
  },
});

// Check SMTP connection when server starts
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Brevo SMTP connection failed:");
    console.error(error.message);
  } else {
    console.log("✅ Brevo SMTP connection successful");
  }
});

// --------------------------------------------------
// Temporary OTP storage
// --------------------------------------------------

// email -> {
//   otp,
//   expiresAt,
//   attempts
// }

const otpStore = new Map();

// OTP expires after 5 minutes
const OTP_EXPIRY = 5 * 60 * 1000;

// Maximum wrong OTP attempts
const MAX_ATTEMPTS = 5;

// --------------------------------------------------
// Generate OTP
// --------------------------------------------------

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// --------------------------------------------------
// SEND OTP
// --------------------------------------------------

app.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Basic email validation
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Save OTP
    otpStore.set(cleanEmail, {
      otp: otp,
      expiresAt: Date.now() + OTP_EXPIRY,
      attempts: 0,
    });

    // Send email using Brevo
    await transporter.sendMail({
      from: {
        name: "Moodify",
        address: process.env.EMAIL_FROM,
      },

      to: cleanEmail,

      subject: "Your Moodify Verification OTP",

      text: `Your Moodify verification OTP is ${otp}.

This OTP will expire in 5 minutes.

If you did not create a Moodify account, you can ignore this email.`,

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 500px;
          margin: auto;
          padding: 30px;
          border: 1px solid #ddd;
          border-radius: 12px;
        ">

          <h2 style="text-align:center;">
            🎵 Moodify
          </h2>

          <p>
            Your verification OTP is:
          </p>

          <div style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            text-align: center;
            padding: 20px;
            background: #f5f5f5;
            border-radius: 10px;
          ">
            ${otp}
          </div>

          <p>
            This OTP will expire in <strong>5 minutes</strong>.
          </p>

          <p style="color:#777;">
            If you did not request this OTP, you can ignore this email.
          </p>

        </div>
      `,
    });

    console.log(`✅ OTP sent to ${cleanEmail}`);

    res.json({
      success: true,
      message: "OTP sent successfully.",
    });

  } catch (error) {
    console.error("❌ Error sending OTP:");
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again.",
    });
  }
});

// --------------------------------------------------
// VERIFY OTP
// --------------------------------------------------

app.post("/verify-otp", (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const storedData = otpStore.get(cleanEmail);

    // OTP doesn't exist
    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please request a new OTP.",
      });
    }

    // Check expiry
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(cleanEmail);

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    // Check maximum attempts
    if (storedData.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(cleanEmail);

      return res.status(400).json({
        success: false,
        message:
          "Too many incorrect attempts. Please request a new OTP.",
      });
    }

    // Check OTP
    if (storedData.otp !== otp.toString().trim()) {
      storedData.attempts++;

      return res.status(400).json({
        success: false,
        message: "Incorrect OTP.",
      });
    }

    // OTP correct
    otpStore.delete(cleanEmail);

    console.log(`✅ OTP verified for ${cleanEmail}`);

    res.json({
      success: true,
      message: "OTP verified successfully.",
    });

  } catch (error) {
    console.error("❌ OTP verification error:");
    console.error(error);

    res.status(500).json({
      success: false,
      message: "OTP verification failed.",
    });
  }
});

// --------------------------------------------------
// Test route
// --------------------------------------------------

app.get("/", (req, res) => {
  res.send("Moodify OTP server is running!");
});

// --------------------------------------------------
// Start server
// --------------------------------------------------

app.listen(PORT, () => {
  console.log("");
  console.log("=================================");
  console.log("🎵 Moodify OTP Server");
  console.log("=================================");
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("");
});