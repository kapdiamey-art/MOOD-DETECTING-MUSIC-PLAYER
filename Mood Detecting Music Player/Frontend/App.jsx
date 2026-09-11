
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import AppLayout from "./AppLayout";
import Landing from "./Landing";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";

import ThemeToggle from "./ThemeToggle";
import { PlayerProvider } from "./PlayerContext";

import MoodDetection from "./MoodDetection";
import Recommendations from "./Recommendations";
import Discover from "./Discover";
import MyMusic from "./MyMusic";
import Analytics from "./Analytics";
import Profile from "./Profile";
import MoodJournal from "./MoodJournal";
import MoodJourney from "./MoodJourney";
import Companion from "./Companion";
import { applyMoodTheme } from "./moodTheme";
import { useEffect } from "react";
import { auth } from "./firebase";
import { onIdTokenChanged } from "firebase/auth";


function ProtectedRoute({ children }) {

  const loggedIn =
    localStorage.getItem("moodifyLoggedIn") === "true";

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


export default function App() {
  useEffect(() => {
    applyMoodTheme(localStorage.getItem("moodify_theme_emotion"));

    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        try {
          const freshToken = await user.getIdToken();
          localStorage.setItem("moodifyToken", freshToken);
        } catch (err) {
          console.warn("[App] Failed to auto-refresh ID token:", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (

    <BrowserRouter>
      <PlayerProvider>

        {/* =========================
            LIGHT / DARK MODE BUTTON
        ========================= */}

        <ThemeToggle />
        <Companion />


        <Routes>

        {/* =========================
            PUBLIC PAGES
        ========================= */}

        <Route
          path="/"
          element={<Landing />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />


        {/* =========================
            PROTECTED PAGES
        ========================= */}

        <Route
          path="/mood"
          element={
            <ProtectedRoute>
              <MoodDetection />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recommendations"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Recommendations />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/discover"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Discover />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-music"
          element={
            <ProtectedRoute>
              <AppLayout>
                <MyMusic />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Analytics />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/journal"
          element={
            <ProtectedRoute>
              <AppLayout>
                <MoodJournal />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/journey"
          element={
            <ProtectedRoute>
              <AppLayout>
                <MoodJourney />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Profile />
              </AppLayout>
            </ProtectedRoute>
          }
        />


        {/* =========================
            UNKNOWN URL
        ========================= */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
      </PlayerProvider>

    </BrowserRouter>
  );
}

