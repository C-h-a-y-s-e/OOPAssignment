import React from "react";
import { Navigate, useLocation, useNavigate } from "react-router";

export default function LeaveRequest() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("authToken");
  const selectedDate = location.state?.selectedDate || "";
  //the state passed on by the calendar date clicked on, if not empty string
  const [startDate, setStartDate] = React.useState(selectedDate);
  const [endDate, setEndDate] = React.useState(selectedDate);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    
    // TODO: Connect to API 
};

  return (
    <main className="request-page">
      <section className="request-form" aria-label="Leave request form">
        {/*  Aria for screen readers*/}
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/dashboard")}
        >
          &#8592; Return to calendar
        </button>
        <p className="eyebrow">Submit a new request</p>
        <h1>Select your leave dates</h1>
        <p className="subtitle">Select the first and last day of your leave.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="start-date">Start date</label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            required
          />
          {/* using the browser provided date picker*/}

          <label htmlFor="end-date">End date</label>
          <input
            id="end-date"
            type="date"
            min={startDate || undefined}
            //dont allow endDate to be before start 
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            required
          />

          <button type="submit">Continue</button>
        </form>
      </section>
    </main>
  );
}