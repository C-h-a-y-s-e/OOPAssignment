const API_BASE_URL = "http://localhost:8900";
//Address of the backend API
async function fetchUserProfile(email, authToken) {
  const fetchResponse = await fetch(
    `${API_BASE_URL}/api/user/email/${encodeURIComponent(email)}`, //wait for the users login to be confirmed with the token
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  );
//Sends the authorisation code into the backend
  if (fetchResponse == 'Password incorrect')
    throw new Error("Incorrect Password");
  if (!fetchResponse.ok) {
    throw new Error("Could not retrieve user profile");
  } 
//If the API requets is unsuccessful
  const result = await fetchResponse.json();
  return result.data;
  //return the result of fetching the data
}



function Calendar() {
  const today = new Date();
  const [displayDate, setDisplayDate] = React.useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
//Grabs the current year and month and assigns to displayData, 
// 1 for first day of the month(used for getting the first weekday of the month)
  const monthName = displayDate.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  }); 
  // date is provided in the British format
  const firstDay = new Date(
    displayDate.getFullYear(),
    displayDate.getMonth(),
    1,
  ).getDay();
  //Get the weekday of the first day of the month
  const daysInMonth = new Date(
    displayDate.getFullYear(),
    displayDate.getMonth() + 1,
    0,
  ).getDate();
  //0 is like -1, so from the nextmonth get the day before, so 1st to 31st for example
  const startingOffset = (firstDay + 6) % 7;
  //Adjust the calendar so that the first day is Monday instead of Sunday
  const calendarDays = Array.from(
    { length: startingOffset + daysInMonth },
    (_, index) => (index < startingOffset ? null : index - startingOffset + 1),
  );
  //Array with all the included days in the calendar, lenth stating how many gaps the calendar needs, before first space empty

  const changeMonth = (amount) => {
    setDisplayDate(
      new Date(displayDate.getFullYear(), displayDate.getMonth() + amount, 1),
    );
  };
  //change the month by the requested amount
  const isToday = (day) =>
    day &&
    today.getFullYear() === displayDate.getFullYear() &&
    today.getMonth() === displayDate.getMonth() &&
    today.getDate() === day;
//check if day is present and check the year month and day match
  return ( //display calendar
    <section className="calendar-panel" aria-label="Leave calendar">
      <div className="calendar-heading">
        <div>
          <p className="eyebrow">Your schedule</p>
          <h2>Calendar</h2>
        </div>
        {/* title and eyebrow */}
        <div className="calendar-controls">
          <button
            type="button"
            className="calendar-control"
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
          >
            &#8592;
          </button>
          <strong>{monthName}</strong>
          <button
          //buttons for displaying the requested months 
            type="button"
            className="calendar-control"
            onClick={() => changeMonth(1)}
            aria-label="Next month"
          >
            &#8594;
            {/* left arrow */}
          </button>
        </div>
      </div>

      <div className="calendar-grid calendar-weekdays" aria-hidden="true">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      {/* Array of weekdays to show in calendar */}
      <div className="calendar-grid calendar-dates">
        {calendarDays.map((day, index) => (
          <div
            className={`calendar-date ${isToday(day) ? "today" : ""}`}
            key={day ?? `empty-${index}`} 
            // empty spaces get empty and the index
          >
            {day && <span>{day}</span>}
          </div>
        ))}
        {/* go through each item in the calendarDays array and create a div for each calendar position */}
      </div>
    </section>
  );
}

function Dashboard({ userEmail, userFullName, onLogout }) {
  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Leave Booking</h2>
        </div>
        <div className="user-segment">
          <p className="user-fullname">{userFullName || userEmail}</p>
          {/* display the users fullname/email */}
        </div>
        <nav className="sidebar-nav">
          <button className="nav-button active">Home</button>
          {/* navigation button for home */}
        </nav>
        <button className="logout-button" onClick={onLogout}>Log Out</button>
        {/*  button for logging out */}
      </aside>
      <main className="main-content">
        <h1>Welcome to the Leave Booking Website</h1>
        <p>You are logged in as {userEmail}</p>
        <Calendar />
      </main>
    </div>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false); //isLoggedIn state is made, set to false by default
  const [userEmail, setUserEmail] = React.useState("");
  const [userFullName, setUserFullName] = React.useState("");
// user email and fullname instantiated
  React.useEffect(() => {
    const token = localStorage.getItem("authToken");
    const email = localStorage.getItem("authEmail");
    if (token && email) {
      setIsLoggedIn(true);
      setUserEmail(email);
      fetchUserProfile(email, token)
        .then((user) => {
          setUserFullName(`${user.firstname} ${user.surname}`.trim());
        })
        .catch(() => {
          setUserFullName("");
        });
    }
  }, []);
  // if bother of these variables are present set these states as such. And prepare the users fullname

  const handleLoginSuccess = () => {
    const email = localStorage.getItem("authEmail");
    const token = localStorage.getItem("authToken");
    setUserEmail(email);
    setIsLoggedIn(true);
    //store the variables in localstorage and set the variables to it
    if (email && token) { 
      fetchUserProfile(email, token)
        .then((user) => {
          setUserFullName(`${user.firstname} ${user.surname}`.trim());
        })
        .catch(() => {
          setUserFullName("");
        });
    }
    
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authEmail");
    setIsLoggedIn(false);
    setUserEmail("");
    setUserFullName("");
  };
//logout function deletes all saved data
  return isLoggedIn ? (
    <Dashboard
      userEmail={userEmail}
      userFullName={userFullName}
      onLogout={handleLogout}
    />
  ) : (
    <LoginPage onLoginSuccess={handleLoginSuccess} />
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);