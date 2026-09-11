import React from "react";
import { useNavigate } from "react-router";
import { API_BASE_URL, fetchUserDetails } from "../api";

export default function LoginPage() {
  const navigate = useNavigate();
    //React component called LoginPage is created
  const [status, setStatus] = React.useState("");
  //status is created, the state is set to empty
  const [statusType, setStatusType] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  //these states above are created, loading set to false since not currently logging in 
  const handleSubmit = async (event) => {
    event.preventDefault();
// function handle submit for when the user presses login, dont do default html actions
    const email = event.target.email.value.trim();
    const password = event.target.password.value;
    // users credentials stored in these variables

    if (!email || !password) {
      setStatus("Please enter both email and password.");
      setStatusType("error");
      return;
    }
    // if missing one of the required login parameters

    setLoading(true);
    setStatus("Signing in...");
    setStatusType("pending");
    //indicate the user is logging in

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
// Sends the post request with JSON formatted content, the body being the email and password
      if (!response.ok) {
        const errorResult = await response.json().catch(() => null);
        const errorMessage = errorResult?.error?.message;
        throw new Error(errorMessage || `Login failed (${response.status})`);
      }
    
      const authToken = await response.text();
      localStorage.setItem("authToken", authToken);
      localStorage.setItem("authEmail", email);
// if response is ok, the token gets sent and stored in the browser
      const user = await fetchUserDetails(email, authToken);
      setStatus("Login successful. Redirecting!");
      setStatusType("ok");
      const roleName = user.role?.name?.toLowerCase();
      let destination = "/dashboard";
      if (roleName === "admin") {
        destination = "/admin";
      } else if (roleName === "manager") {
        destination = "/management";
      }
      navigate(destination);
    } catch (error) {
      setStatus(
        error.message === "Failed to fetch"
          ? "Could not connect to the API. Check that it is running on port 8900."
          : error.message,
      );
      setStatusType("error");
    } finally {
      setLoading(false);
    }
    // whether successfull or not, set loading to false
  };

  return (
    <main className="page-shell">
      <section className="login-card" aria-label="Login form">
        <a href="https://capula.com" className="brand-link" aria-label="Capula website">
          <img src="CAPULA_LOGO_SMALL.png" alt="Capula logo" className="logo" />
          <span className="brand-name">Leave Booking</span>
        </a>

        <h1>Welcome</h1>
        <p className="subtitle">Sign in to view and manage leave requests.</p>
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" placeholder="name@company.com" required />
        {/* email and password parameters */}
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" placeholder="Enter password" required />

          <button type="submit" id="login-button" disabled={loading}>
            {loading ? "Signing In" : "Sign In"} 
            {/* function for when Login is true or false */}
          </button>
        </form>

        <p id="login-status" className={`status ${statusType}`} aria-live="polite">
          {status}
        </p>

        <nav className="support-nav" aria-label="Support links">
          <a href="https://capula.com">Contact Support</a>
        </nav>
      </section>
    </main>
  );
}