import { useState } from "react";
import { useNavigate } from "react-router-dom";


export default function Register() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");


  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value
    });

    setError("");
  };


  const handleRegister = (e) => {

    e.preventDefault();


    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.confirmPassword
    ) {

      setError("Please fill in all fields.");

      return;
    }


    if (form.password.length < 6) {

      setError(
        "Password must contain at least 6 characters."
      );

      return;
    }


    if (
      form.password !== form.confirmPassword
    ) {

      setError(
        "Passwords do not match."
      );

      return;
    }


    const existingUser =
      JSON.parse(
        localStorage.getItem("moodifyUser")
      );


    if (
      existingUser &&
      existingUser.email === form.email
    ) {

      setError(
        "This email is already registered."
      );

      return;
    }


    const user = {

      name: form.name.trim(),

      email: form.email.trim(),

      password: form.password

    };


    localStorage.setItem(
      "moodifyUser",
      JSON.stringify(user)
    );


    localStorage.removeItem(
      "moodifyLoggedIn"
    );


    alert(
      "Account created successfully! Please login."
    );


    navigate("/login");

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
            />

          </div>


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


          {error && (

            <div className="auth-error">
              ⚠️ {error}
            </div>

          )}


          <button
            type="submit"
            className="auth-submit"
          >
            Create My Account →
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