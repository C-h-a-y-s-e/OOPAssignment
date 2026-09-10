import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function LeaveRequest() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedDate = location.state?.selectedDate || "";
  const [startDate, setStartDate] = React.useState(selectedDate);
  const [endDate, setEndDate] = React.useState(selectedDate);

  const handleSubmit = (event) => {
    event.preventDefault();
    // TODO: Connect to API 
};

  return (
    <main className="request-page">
      <section className="request-card" aria-label="Leave request form">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/dashboard")}
        >
          &#8592; Back to calendar
        </button>
        <p className="eyebrow">New request</p>
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

          <label htmlFor="end-date">End date</label>
          <input
            id="end-date"
            type="date"
            min={startDate || undefined}
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