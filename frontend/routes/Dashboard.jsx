import React from "react";
import { Navigate, useNavigate } from "react-router";
import { fetchUserDetails } from '../api';
//usenavigate allows changing of webpage

function Calendar() {
  const navigate = useNavigate();
  const today = new Date();
  const [displayDate, setDisplayDate] = React.useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  //First day of the current month, for when calendar first opened
  const monthName = displayDate.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
  //September instead of Sep..
  const firstDay = new Date(
    displayDate.getFullYear(),
    displayDate.getMonth(),
    1,
  ).getDay();
// Get the day of the week the month starts on
  const daysInMonth = new Date(
    displayDate.getFullYear(),
    displayDate.getMonth() + 1,
    0,
  ).getDate();
//   Get the day before the first of the next month
  const offset = (firstDay + 6) % 7;
  const days = Array.from({ length: offset + daysInMonth }, (_, index) =>
    index < offset ? null : index - offset + 1,
  );
//monday first, and offsets for weekdays which are the first of the month
  const changeMonth = (amount) => {
    setDisplayDate(
      new Date(displayDate.getFullYear(), displayDate.getMonth() + amount, 1),
    );
  };

  const isToday = (day) =>
    day &&
    today.getFullYear() === displayDate.getFullYear() &&
    today.getMonth() === displayDate.getMonth() &&
    today.getDate() === day;

  const getDateValue = (day) =>
    `${displayDate.getFullYear()}-${String(displayDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
// turns calendar day into a date string
  return (
    <section className="calendar-panel" aria-label="Leave calendar">
      <div className="calendar-heading">
        <div>
          <p className="eyebrow">Your schedule</p>
          <h2>Calendar</h2>
        </div>
        <div className="calendar-controls">
          <button type="button" className="calendar-control" onClick={() => changeMonth(-1)} aria-label="Previous month">&#8592;</button>
          <strong>{monthName}</strong>
          <button type="button" className="calendar-control" onClick={() => changeMonth(1)} aria-label="Next month">&#8594;</button>
        </div>
      </div>
      <div className="calendar-grid calendar-weekdays" aria-hidden="true">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="calendar-grid calendar-dates">
        {days.map((day, index) => (
          day ? (
            <button
              type="button"
              className={`calendar-date ${isToday(day) ? "today" : ""}`}
              key={day}
              onClick={() => navigate("/leave-request", {
                state: { selectedDate: getDateValue(day) },
              })}
              aria-label={`Select ${day} ${monthName}`}
            >
              <span>{day}</span>
            </button>
          ) : (
            <div className="calendar-date calendar-date-empty" key={`empty-${index}`} />
          )
        ))}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");
  const [userEmail, setUserEmail] = React.useState(localStorage.getItem("authEmail") || "");
  const [userFullName, setUserFullName] = React.useState("");
  const [userRole, setUserRole] = React.useState("");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  React.useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token || !userEmail) return;

    fetchUserDetails(userEmail, token)
      .then((user) => {
        setUserFullName(`${user.firstname} ${user.surname}`.trim());
        setUserRole(user.role?.name?.toLowerCase() || "");
      })
      .catch(() => setUserFullName(""));
  }, [userEmail]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authEmail");
    navigate("/login");
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header"><h2>Leave Booking</h2></div>
        <div className="user-section"><p className="user-fullname">{userFullName || userEmail}</p></div>
        <nav className="sidebar-nav"><button className="nav-button active" onClick={() => navigate("/dashboard")}>Home</button></nav>
        {(userRole === "manager" || userRole === "admin") && (
          <nav className="sidebar-nav">
            <button className="nav-button management-nav-button" onClick={() => navigate("/management")}>Management</button>
          </nav>
        )}
        {userRole === "admin" && (
          <nav className="sidebar-nav">
            <button className="nav-button admin-nav-button" onClick={() => navigate("/admin")}>Admin</button>
          </nav>
        )}
        <button className="logout-button" onClick={handleLogout}>Log Out</button>
      </aside>
      <main className="main-content">
        <h1>Welcome to Leave Booking</h1>
        <p>You are logged in as {userEmail}</p>
        <Calendar />
      </main>
    </div>
  );
}
