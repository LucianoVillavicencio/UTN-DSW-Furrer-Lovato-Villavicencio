import { createBrowserRouter } from "react-router-dom";

import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import Home from "../pages/Home/Home";
import Classes from "../pages/Classes/Classes";
import About from "../pages/About/About";
import Plan from "../pages/Plan/Plan";
import NotFound from "../pages/NotFound/NotFound";
import Trainer from "../pages/trainers/trainers";

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
    element: <Register />,
  },
  {
    path: "/class",
    element: <Classes />,
  },
  {
    path: "/about",
    element: <About />,
  },
  {
    path: "/membership",
    element: <Plan />,
  },
  {
    path: "/trainers",
    element: <Trainer />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);