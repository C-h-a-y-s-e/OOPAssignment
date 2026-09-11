import {
  type RouteConfig,
  index,
  route,
} from "@react-router/dev/routes";

export default [
  index("../routes/LoginPage.jsx"),
  route("login", "../routes/LoginPage.jsx", { id: "login" }),
  route("dashboard", "../routes/Dashboard.jsx"),
  route("leave-request", "../routes/LeaveRequest.jsx"),
  route("*", "../routes/NotFound.jsx"),
] satisfies RouteConfig;
//When user visits this url, these react router applications should be in use