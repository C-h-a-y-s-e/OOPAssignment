import {
  type RouteConfig,
  index,
  route,
} from "@react-router/dev/routes";

export default [
  index("../routes/LoginPage.jsx"),
  route("login", "../routes/LoginRoute.jsx"),
  route("dashboard", "../routes/Dashboard.jsx"),
  route("leave-request", "../routes/LeaveRequest.jsx"),
  route("*", "../routes/NotFound.jsx"),
] satisfies RouteConfig;