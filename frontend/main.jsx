import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import App from "./App";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import LeaveRequest from "./pages/LeaveRequest";
import "./index.css";

function PermittedRoute({ children }) { //This function ensures only logged in users can access certain pages
  const token = localStorage.getItem("authToken");
  return token ? children : <Navigate to="/login" replace />; //if logged in the requested page is displayed, else sent to login
}

function RouterApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <PermittedRoute>
              <App />
            </PermittedRoute>
          }
        />
        {/* app = children */}
{/* When /login is accessed diaply LoginPage */}
        <Route
          path="/dashboard"
          element={
            <PermittedRoute>
              <Dashboard />
            </PermittedRoute>
          }
        />

        <Route
          path="/leave-request"
          element={
            <PermittedRoute>
              <LeaveRequest />
            </PermittedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  ); 
//   Any non matching thing can just go to login
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterApp />
  </React.StrictMode>
);