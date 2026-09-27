// Centralized API configuration for local development & Render/Vercel cloud deployment

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const OTP_BASE_URL = import.meta.env.VITE_OTP_URL || "http://localhost:5000";
