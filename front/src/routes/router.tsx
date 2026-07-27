import { createBrowserRouter } from "react-router-dom";

import Login from "../pages/Login/Login";
import Home from "../pages/Home/Home";
import Classes from "../pages/Classes/Classes";

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
    path: "/class",
    element: <Classes />,
  },
]);