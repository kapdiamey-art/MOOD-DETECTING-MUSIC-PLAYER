const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const twilio = require("twilio");

dotenv.config();

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());

// ==========================================
// PORT
// ==========================================

const PORT = 5000;

// ==========================================
// CHECK ENVIRONMENT VARIABLES
// ==========================================

if (!process.env.TWILIO_ACCOUNT_SID) {
  console.error(
    "❌ TWILIO_ACCOUNT_SID is missing in .env"
  );
}

if (!process.env.TWILIO_AUTH_TOKEN) {
  console.error(
    "❌ TWILIO_AUTH_TOKEN is missing in .env"
  );
}

if (!process.env.TWILIO_VERIFY_SERVICE_SID) {
  console.error(
    "❌ TWILIO_VERIFY_SERVICE_SID is missing in .env"
  );
}

// ==========================================
// TWILIO CLIENT
// ==========================================

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ==========================================
// TEST SERVER
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Moodify Twilio Backend is running!",
  });
});

// ==========================================
// PHONE NUMBER VALIDATION
// ==========================================

function isValidPhone(phone) {
  return /^\+\d{10,15}$/.test(phone);
}

// ==========================================
// SEND OTP
// ==========================================

app.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    // ------------------------------------------
    // CHECK PHONE
    // ------------------------------------------

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required.",
      });
    }

    // ------------------------------------------
    // CLEAN PHONE
    // ------------------------------------------

    const cleanPhone = String(phone).replace(
      /\s/g,
      ""
    );

    console.log(
      "📱 Sending OTP to:",
      cleanPhone
    );

    // ------------------------------------------
    // VALIDATE PHONE
    // ------------------------------------------

    if (!isValidPhone(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid phone number. Use country code, for example +919850365997.",
      });
    }

    // ------------------------------------------
    // SEND OTP THROUGH TWILIO VERIFY
    // ------------------------------------------

    const verification =
      await twilioClient.verify.v2
        .services(
          process.env.TWILIO_VERIFY_SERVICE_SID
        )
        .verifications.create({
          to: cleanPhone,
          channel: "sms",
        });

    console.log(
      "✅ Twilio status:",
      verification.status
    );

    console.log(
      "✅ OTP destination:",
      cleanPhone
    );

    return res.status(200).json({
      success: true,
      message:
        "OTP sent successfully.",
      status: verification.status,
      phone: cleanPhone,
    });

  } catch (error) {

    console.error(
      "❌ SEND OTP ERROR:"
    );

    console.error(
      "Code:",
      error.code
    );

    console.error(
      "Message:",
      error.message
    );

    // ==========================================
    // TWILIO TRIAL ACCOUNT
    // ==========================================

    if (error.code === 21608) {
      return res.status(403).json({
        success: false,
        message:
          "This phone number is not verified in your Twilio Trial account. Verify this recipient number in Twilio Console first.",
        twilioCode: error.code,
      });
    }

    // ==========================================
    // INVALID PHONE
    // ==========================================

    if (
      error.code === 21211 ||
      error.code === 60200
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The phone number is invalid. Please enter a valid number with country code.",
        twilioCode: error.code,
      });
    }

    // ==========================================
    // AUTHENTICATION ERROR
    // ==========================================

    if (error.code === 20003) {
      return res.status(500).json({
        success: false,
        message:
          "Twilio authentication failed. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env.",
        twilioCode: error.code,
      });
    }

    // ==========================================
    // SERVICE NOT FOUND
    // ==========================================

    if (error.code === 20404) {
      return res.status(500).json({
        success: false,
        message:
          "Twilio Verify Service was not found. Check TWILIO_VERIFY_SERVICE_SID in .env.",
        twilioCode: error.code,
      });
    }

    // ==========================================
    // GENERAL ERROR
    // ==========================================

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to send OTP. Please try again.",
      twilioCode:
        error.code || null,
    });
  }
});

// ==========================================
// VERIFY OTP
// ==========================================

app.post("/verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // ------------------------------------------
    // CHECK INPUTS
    // ------------------------------------------

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message:
          "Phone number and OTP are required.",
      });
    }

    // ------------------------------------------
    // CLEAN PHONE
    // ------------------------------------------

    const cleanPhone = String(phone).replace(
      /\s/g,
      ""
    );

    // ------------------------------------------
    // VALIDATE PHONE
    // ------------------------------------------

    if (!isValidPhone(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid phone number.",
      });
    }

    // ------------------------------------------
    // VALIDATE OTP
    // ------------------------------------------

    const cleanOTP = String(otp).trim();

    if (!/^\d{6}$/.test(cleanOTP)) {
      return res.status(400).json({
        success: false,
        message:
          "OTP must contain exactly 6 digits.",
      });
    }

    console.log(
      "🔐 Checking OTP for:",
      cleanPhone
    );

    // ------------------------------------------
    // VERIFY OTP
    // ------------------------------------------

    const verificationCheck =
      await twilioClient.verify.v2
        .services(
          process.env.TWILIO_VERIFY_SERVICE_SID
        )
        .verificationChecks.create({
          to: cleanPhone,
          code: cleanOTP,
        });

    console.log(
      "Twilio verification status:",
      verificationCheck.status
    );

    // ------------------------------------------
    // OTP APPROVED
    // ------------------------------------------

    if (
      verificationCheck.status ===
      "approved"
    ) {
      console.log(
        "✅ OTP verified for:",
        cleanPhone
      );

      return res.status(200).json({
        success: true,
        message:
          "OTP verified successfully.",
        phone: cleanPhone,
      });
    }

    // ------------------------------------------
    // OTP NOT APPROVED
    // ------------------------------------------

    return res.status(400).json({
      success: false,
      message:
        "Invalid or expired OTP.",
      status:
        verificationCheck.status,
    });

  } catch (error) {

    console.error(
      "❌ VERIFY OTP ERROR:"
    );

    console.error(
      "Code:",
      error.code
    );

    console.error(
      "Message:",
      error.message
    );

    // ==========================================
    // OTP ALREADY USED / EXPIRED
    // ==========================================

    if (error.code === 20404) {
      return res.status(400).json({
        success: false,
        message:
          "This OTP has expired or has already been used. Please request a new OTP.",
        twilioCode: error.code,
      });
    }

    // ==========================================
    // INVALID OTP
    // ==========================================

    if (
      error.code === 60202 ||
      error.code === 60203
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid OTP. Please check the code and try again.",
        twilioCode: error.code,
      });
    }

    // ==========================================
    // AUTH ERROR
    // ==========================================

    if (error.code === 20003) {
      return res.status(500).json({
        success: false,
        message:
          "Twilio authentication failed. Check your .env credentials.",
        twilioCode: error.code,
      });
    }

    // ==========================================
    // GENERAL ERROR
    // ==========================================

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "OTP verification failed.",
      twilioCode:
        error.code || null,
    });
  }
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(
    "=========================================="
  );

  console.log(
    `🚀 Moodify backend running at http://localhost:${PORT}`
  );

  console.log(
    "📱 SMS OTP service: Twilio Verify"
  );

  console.log(
    "=========================================="
  );
});