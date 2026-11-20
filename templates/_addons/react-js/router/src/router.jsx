/**
 * App routes. Hash routing (`#/path`) is required inside Domo: the app is served
 * as a single index.html with no server rewrites, so history URLs (BrowserRouter)
 * break on reload. Add pages as `children` of the root layout (App).
 * Navigate in-app with <Link to="/x"> / useNavigate(); leave the app with
 * `navigate()` from @/API/domoApi.
 */
import { createHashRouter, Navigate } from "react-router";
import App from "@/App";
import HomePage from "@/pages/index";

export const router = createHashRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
