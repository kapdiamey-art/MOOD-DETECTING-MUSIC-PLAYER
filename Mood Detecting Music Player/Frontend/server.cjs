const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config();

const app = express();
const PORT = 5000;

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

// =====================================================
// OTP STORAGE
// =====================================================

const otpStore = new Map();

const OTP_EXPIRY = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

// =====================================================
// BREVO SMTP
// =====================================================

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: Number(process.env.BREVO_SMTP_PORT || 587),
  secure: false,

  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },

  tls: {
    rejectUnauthorized: true,
  },
});

// =====================================================
// CHECK SMTP
// =====================================================

transporter.verify((error) => {
  if (error) {
    console.error("❌ Brevo SMTP connection failed:");
    console.error(error.message);
  } else {
    console.log("✅ Brevo SMTP connection successful.");
  }
});

// =====================================================
// EMAIL VALIDATION
// =====================================================

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// =====================================================
// NORMALIZE EMAIL
// =====================================================

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

// =====================================================
// GENERATE OTP
// =====================================================

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// =====================================================
// TEST ROUTE
// =====================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Moodify OTP Backend is running!",
  });
});

// =====================================================
// SEND OTP
// =====================================================

app.post("/send-otp", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // Check environment variables
    if (
      !process.env.BREVO_SMTP_HOST ||
      !process.env.BREVO_SMTP_USER ||
      !process.env.BREVO_SMTP_PASS ||
      !process.env.EMAIL_FROM
    ) {
      console.error("❌ Brevo environment variables are missing.");

      return res.status(500).json({
        success: false,
        message: "Email server configuration is incomplete.",
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + OTP_EXPIRY,
      attempts: 0,
    });

    // Send email
    await transporter.sendMail({
      from: `"Moodify" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Moodify - Your Login OTP",

      text: `
Your Moodify login verification OTP is:

${otp}

This OTP will expire in 5 minutes.

If you did not request this OTP, please ignore this email.
`,

      html: `
<!DOCTYPE html>

<html>

<head>
  <meta charset="UTF-8">
  <title>Moodify OTP</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f5f3ff;
    font-family:Arial,sans-serif;
  "
>

<div
  style="
    max-width:500px;
    margin:40px auto;
    background:white;
    padding:30px;
    border-radius:15px;
    text-align:center;
    box-shadow:0 5px 20px rgba(0,0,0,0.08);
  "
>

<h1>🎵 Moodify</h1>

<h2>Your Login OTP</h2>

<p>
Use the following OTP to continue:
</p>

<div
  style="
    font-size:36px;
    font-weight:bold;
    letter-spacing:8px;
    padding:20px;
    margin:20px 0;
    background:#f3f0ff;
    border-radius:10px;
  "
>
${otp}
</div>

<p>
This OTP will expire in
<strong>5 minutes</strong>.
</p>

<p
  style="
    color:#777;
    font-size:13px;
  "
>
If you did not request this OTP,
you can safely ignore this email.
</p>

</div>

</body>

</html>
`,
    });

    console.log(`✅ OTP sent to ${email}`);

    return res.json({
      success: true,
      message: "OTP sent successfully!",
    });

  } catch (error) {
    console.error("❌ Send OTP error:");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to send OTP.",
    });
  }
});

// =====================================================
// VERIFY OTP
// =====================================================

app.post("/verify-otp", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address.",
      });
    }

    // Validate OTP
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required.",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "OTP must contain exactly 6 digits.",
      });
    }

    // Get stored OTP
    const stored = otpStore.get(email);

    if (!stored) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please request a new OTP.",
      });
    }

    // Check expiry
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email);

      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new OTP.",
      });
    }

    // Check attempts
    if (stored.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(email);

      return res.status(429).json({
        success: false,
        message:
          "Too many incorrect attempts. Please request a new OTP.",
      });
    }

    // Check OTP
    if (stored.otp !== otp) {
      stored.attempts++;

      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    // OTP correct
    otpStore.delete(email);

    console.log(`✅ OTP verified for ${email}`);

    return res.json({
      success: true,
      verified: true,
      email,
      message: "OTP verified successfully!",
    });

  } catch (error) {
    console.error("❌ Verify OTP error:");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify OTP.",
    });
  }
});

// =====================================================
// CLEAN EXPIRED OTPs
// =====================================================

setInterval(() => {
  const now = Date.now();

  for (const [email, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(email);
    }
  }
}, 60 * 1000);

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {
  console.log("");
  console.log("==========================================");
  console.log("🎵 MOODIFY OTP BACKEND");
  console.log("==========================================");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log("==========================================");
  console.log("");
});