import { createBrowserRouter } from "react-router-dom";

import Login from "../pages/Login/Login";
import Home from "../pages/Home/Home";
import NotFound from "../pages/NotFound/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Login />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
