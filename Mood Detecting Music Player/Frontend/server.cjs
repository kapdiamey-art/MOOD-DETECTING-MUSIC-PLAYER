
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const path = require("path");

// Firebase Admin SDK v14+
const {
  initializeApp,
  cert,
} = require("firebase-admin/app");

const {
  getAuth,
} = require("firebase-admin/auth");

// Load .env
dotenv.config();

const app = express();
const PORT = 5000;

// =====================================================
// FIREBASE ADMIN INITIALIZATION
// =====================================================

try {
  const serviceAccount = require(
    path.join(
      __dirname,
      "serviceAccountKey.json"
    )
  );

  initializeApp({
    credential: cert(serviceAccount),
  });

  console.log(
    "✅ Firebase Admin initialized."
  );

} catch (error) {
  console.error(
    "❌ Firebase Admin initialization failed:"
  );

  console.error(error.message);

  process.exit(1);
}

const firebaseAuth = getAuth();

// =====================================================
// CORS
// =====================================================

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

// =====================================================
// JSON BODY
// =====================================================

app.use(express.json());

// =====================================================
// OTP STORAGE
// =====================================================

const otpStore = new Map();

const OTP_EXPIRY =
  5 * 60 * 1000; // 5 minutes

const MAX_ATTEMPTS = 5;

// =====================================================
// BREVO SMTP
// =====================================================

const transporter =
  nodemailer.createTransport({
    host:
      process.env.BREVO_SMTP_HOST,

    port: Number(
      process.env.BREVO_SMTP_PORT || 587
    ),

    secure: false,

    auth: {
      user:
        process.env.BREVO_SMTP_USER,

      pass:
        process.env.BREVO_SMTP_PASS,
    },

    tls: {
      rejectUnauthorized: true,
    },
  });

// =====================================================
// TEST BREVO CONNECTION
// =====================================================

transporter.verify(
  (error) => {
    if (error) {
      console.error(
        "❌ Brevo SMTP connection failed:"
      );

      console.error(
        error.message
      );

    } else {
      console.log(
        "✅ Brevo SMTP connection successful."
      );
    }
  }
);

// =====================================================
// HELPER - NORMALIZE EMAIL
// =====================================================

function normalizeEmail(
  email
) {
  return String(
    email || ""
  )
    .trim()
    .toLowerCase();
}

// =====================================================
// HELPER - VALIDATE EMAIL
// =====================================================

function isValidEmail(
  email
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

// =====================================================
// HELPER - GENERATE OTP
// =====================================================

function generateOTP() {
  return Math.floor(
    100000 +
      Math.random() * 900000
  ).toString();
}

// =====================================================
// FIREBASE - CHECK REGISTERED EMAIL
// =====================================================

async function isRegisteredEmail(
  email
) {
  try {

    console.log(
      "🔍 Checking Firebase user:",
      email
    );

    const user =
      await firebaseAuth.getUserByEmail(
        email
      );

    console.log(
      "✅ Firebase user found:",
      user.email
    );

    return true;

  } catch (error) {

    if (
      error.code ===
      "auth/user-not-found"
    ) {

      console.log(
        "❌ Firebase user NOT found:",
        email
      );

      return false;
    }

    console.error(
      "❌ Firebase user lookup error:"
    );

    console.error(
      error
    );

    throw error;
  }
}

// =====================================================
// HOME / SERVER TEST
// =====================================================

app.get(
  "/",
  (req, res) => {

    res.json({
      success: true,

      message:
        "Moodify OTP Backend is running!",
    });
  }
);

// =====================================================
// SEND OTP
// =====================================================

app.post(
  "/send-otp",
  async (req, res) => {

    try {

      // -----------------------------------------------
      // GET EMAIL
      // -----------------------------------------------

      const email =
        normalizeEmail(
          req.body.email
        );

      // -----------------------------------------------
      // EMAIL REQUIRED
      // -----------------------------------------------

      if (!email) {

        return res.status(400).json({
          success: false,

          message:
            "Email is required.",
        });
      }

      // -----------------------------------------------
      // EMAIL VALIDATION
      // -----------------------------------------------

      if (
        !isValidEmail(email)
      ) {

        return res.status(400).json({
          success: false,

          message:
            "Please enter a valid email address.",
        });
      }

      // -----------------------------------------------
      // CHECK FIREBASE REGISTRATION
      // -----------------------------------------------

      const registered =
        await isRegisteredEmail(
          email
        );

      // -----------------------------------------------
      // STOP IF NOT REGISTERED
      // -----------------------------------------------

      if (!registered) {

        console.log(
          "🚫 OTP NOT SENT - EMAIL NOT REGISTERED:",
          email
        );

        return res.status(404).json({

          success: false,

          registered: false,

          message:
            "This email is not registered. Please create an account first.",
        });
      }

      // -----------------------------------------------
      // BREVO CONFIG CHECK
      // -----------------------------------------------

      if (
        !process.env.BREVO_SMTP_HOST ||
        !process.env.BREVO_SMTP_USER ||
        !process.env.BREVO_SMTP_PASS ||
        !process.env.EMAIL_FROM
      ) {

        console.error(
          "❌ Brevo environment variables are missing."
        );

        return res.status(500).json({

          success: false,

          message:
            "Email server configuration is incomplete.",
        });
      }

      // -----------------------------------------------
      // GENERATE OTP
      // -----------------------------------------------

      const otp =
        generateOTP();

      // -----------------------------------------------
      // STORE OTP
      // -----------------------------------------------

      otpStore.set(
        email,
        {
          otp: otp,

          expiresAt:
            Date.now() +
            OTP_EXPIRY,

          attempts: 0,
        }
      );

      // -----------------------------------------------
      // SEND EMAIL USING BREVO
      // -----------------------------------------------

      await transporter.sendMail({

        from:
          `"Moodify" <${process.env.EMAIL_FROM}>`,

        to: email,

        subject:
          "Moodify - Your Login OTP",

        text: `
Hello,

Your Moodify login OTP is:

${otp}

This OTP is valid for 5 minutes.

If you did not request this OTP,
please ignore this email.

Regards,
Moodify Team
`,

        html: `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
Moodify Login OTP
</title>

</head>

<body style="
  margin:0;
  padding:0;
  background:#f5f5f5;
  font-family:Arial,sans-serif;
">

<div style="
  max-width:600px;
  margin:40px auto;
  background:white;
  padding:35px;
  border-radius:15px;
">

<h2 style="
  text-align:center;
">

🎵 Moodify

</h2>

<h3 style="
  text-align:center;
">

Login Verification

</h3>

<p>
Hello,
</p>

<p>
Your Moodify login OTP is:
</p>

<div style="
  text-align:center;
  margin:30px 0;
">

<span style="
  display:inline-block;
  font-size:32px;
  font-weight:bold;
  letter-spacing:8px;
  padding:15px 25px;
  background:#f1edff;
  border-radius:10px;
">

${otp}

</span>

</div>

<p>
This OTP is valid for
<strong>5 minutes</strong>.
</p>

<p>
If you did not request this OTP,
please ignore this email.
</p>

<p>
Regards,
<br>
<strong>Moodify Team</strong>
</p>

</div>

</body>

</html>
`,
      });

      // -----------------------------------------------
      // SUCCESS
      // -----------------------------------------------

      console.log(
        `📧 OTP sent successfully to ${email}`
      );

      return res.json({

        success: true,

        registered: true,

        message:
          "OTP sent successfully to your registered email.",
      });

    } catch (error) {

      console.error(
        "❌ SEND OTP ERROR:"
      );

      console.error(
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Failed to send OTP.",
      });
    }
  }
);

// =====================================================
// VERIFY OTP
// =====================================================

app.post(
  "/verify-otp",
  async (req, res) => {

    try {

      const email =
        normalizeEmail(
          req.body.email
        );

      const otp =
        String(
          req.body.otp || ""
        ).trim();

      // -----------------------------------------------
      // EMAIL REQUIRED
      // -----------------------------------------------

      if (!email) {

        return res.status(400).json({

          success: false,

          message:
            "Email is required.",
        });
      }

      // -----------------------------------------------
      // EMAIL VALIDATION
      // -----------------------------------------------

      if (
        !isValidEmail(email)
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid email address.",
        });
      }

      // -----------------------------------------------
      // OTP REQUIRED
      // -----------------------------------------------

      if (!otp) {

        return res.status(400).json({

          success: false,

          message:
            "OTP is required.",
        });
      }

      // -----------------------------------------------
      // OTP FORMAT
      // -----------------------------------------------

      if (
        !/^\d{6}$/.test(
          otp
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "OTP must contain exactly 6 digits.",
        });
      }

      // -----------------------------------------------
      // GET STORED OTP
      // -----------------------------------------------

      const stored =
        otpStore.get(
          email
        );

      if (!stored) {

        return res.status(400).json({

          success: false,

          message:
            "OTP not found. Please request a new OTP.",
        });
      }

      // -----------------------------------------------
      // CHECK EXPIRY
      // -----------------------------------------------

      if (
        Date.now() >
        stored.expiresAt
      ) {

        otpStore.delete(
          email
        );

        return res.status(400).json({

          success: false,

          message:
            "OTP expired. Please request a new OTP.",
        });
      }

      // -----------------------------------------------
      // CHECK MAX ATTEMPTS
      // -----------------------------------------------

      if (
        stored.attempts >=
        MAX_ATTEMPTS
      ) {

        otpStore.delete(
          email
        );

        return res.status(429).json({

          success: false,

          message:
            "Too many incorrect attempts. Please request a new OTP.",
        });
      }

      // -----------------------------------------------
      // CHECK OTP
      // -----------------------------------------------

      if (
        stored.otp !== otp
      ) {

        stored.attempts++;

        return res.status(400).json({

          success: false,

          message:
            "Invalid OTP.",
        });
      }

      // -----------------------------------------------
      // OTP VERIFIED
      // -----------------------------------------------

      otpStore.delete(
        email
      );

      console.log(
        `✅ OTP verified for ${email}`
      );

      return res.json({

        success: true,

        verified: true,

        email: email,

        message:
          "OTP verified successfully!",
      });

    } catch (error) {

      console.error(
        "❌ VERIFY OTP ERROR:"
      );

      console.error(
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Failed to verify OTP.",
      });
    }
  }
);

// =====================================================
// CLEAN EXPIRED OTPs
// =====================================================

setInterval(
  () => {

    const now =
      Date.now();

    for (
      const [
        email,
        data
      ]
      of otpStore.entries()
    ) {

      if (
        now >
        data.expiresAt
      ) {

        otpStore.delete(
          email
        );

        console.log(
          `🧹 Expired OTP removed for ${email}`
        );
      }
    }

  },
  60 * 1000
);

// =====================================================
// START SERVER
// =====================================================

app.listen(
  PORT,
  () => {

    console.log("");

    console.log(
      "=========================================="
    );

    console.log(
      "🎵 MOODIFY OTP BACKEND"
    );

    console.log(
      "=========================================="
    );

    console.log(
      `🚀 Server running on port ${PORT}`
    );

    console.log(
      `🌐 http://localhost:${PORT}`
    );

    console.log(
      "=========================================="
    );

    console.log("");
  }
);

