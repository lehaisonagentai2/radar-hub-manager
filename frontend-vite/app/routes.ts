import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/login", "routes/login.tsx"),
  route("/dashboard", "routes/dashboard.tsx"),
  route("/stations", "routes/stations.tsx"),
  route("/users", "routes/users.tsx"),
  route("/schedules", "routes/schedules.tsx"),
  route("/documents", "routes/documents.tsx"),
  route("/vessels", "routes/vessels.tsx"),
  route("/about", "routes/about.tsx"),
] satisfies RouteConfig;
