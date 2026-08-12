import { useState } from "react";
import { useNavigate } from "react-router-dom";


export default function Login() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");


  const handleLogin = (e) => {

    e.preventDefault();


    const savedUser =
      JSON.parse(
        localStorage.getItem("moodifyUser")
      );


    if (!savedUser) {

      setError(
        "No account found. Please register first."
      );

      return;
    }


    if (
      email.trim().toLowerCase() !==
      savedUser.email.toLowerCase()
    ) {

      setError(
        "Incorrect email or password."
      );

      return;
    }


    if (
      password !== savedUser.password
    ) {

      setError(
        "Incorrect email or password."
      );

      return;
    }


    localStorage.setItem(
      "moodifyLoggedIn",
      "true"
    );


    navigate("/mood");

  };


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
            🎧 WELCOME BACK
          </span>

          <h1>
            Welcome back
          </h1>

          <p>
            Your mood. Your music. Your moment.
          </p>

        </div>


        {/* FORM */}

        <form onSubmit={handleLogin}>


          <div className="form-group">

            <label>
              Email Address
            </label>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {

                setEmail(e.target.value);

                setError("");

              }}
            />

          </div>


          <div className="form-group">

            <div className="password-label">

              <label>
                Password
              </label>

              <button
                type="button"
                onClick={() =>
                  navigate("/forgot-password")
                }
              >
                Forgot password?
              </button>

            </div>


            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {

                setPassword(e.target.value);

                setError("");

              }}
            />

          </div>


          {error && (

            <div className="auth-error">
              ⚠️ {error}
            </div>

          )}


          <button
            type="submit"
            className="auth-submit"
          >
            Login to Moodify →
          </button>


        </form>


        {/* REGISTER */}

        <div className="auth-switch">

          <span>
            Don't have an account?
          </span>

          <button
            type="button"
            onClick={() =>
              navigate("/register")
            }
          >
            Create Account
          </button>

        </div>

      </div>

    </div>

  );
}