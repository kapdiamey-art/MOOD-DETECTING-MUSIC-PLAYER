import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Landing from "./Landing";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";

import MoodDetection from "./MoodDetection";
import Recommendations from "./Recommendations";
import Discover from "./Discover";
import MyMusic from "./MyMusic";
import Analytics from "./Analytics";
import Profile from "./Profile";


function ProtectedRoute({ children }) {

  const loggedIn =
    localStorage.getItem("moodifyLoggedIn") === "true";

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


export default function App() {

  return (

    <BrowserRouter>

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
              <Recommendations />
            </ProtectedRoute>
          }
        />

        <Route
          path="/discover"
          element={
            <ProtectedRoute>
              <Discover />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-music"
          element={
            <ProtectedRoute>
              <MyMusic />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />


        {/* Unknown URL */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>

    </BrowserRouter>
  );
}