
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import AppLayout from "./AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import ThemeToggle from "./components/ThemeToggle";
import { PlayerProvider } from "./context/PlayerContext";

import MoodDetection from "./pages/MoodDetection";
import Recommendations from "./pages/Recommendations";
import Discover from "./pages/Discover";
import MyMusic from "./pages/MyMusic";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import MoodJournal from "./pages/MoodJournal";
import MoodJourney from "./pages/MoodJourney";
import Companion from "./components/Companion";
import { applyMoodTheme } from "./utils/moodTheme";
import { useEffect } from "react";
import { auth } from "./services/firebase";
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

        <Route
          path="/reset-password"
          element={
            <Navigate
              to="/login"
              state={{ message: "Password changed successfully! You can login now." }}
              replace
            />
          }
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

