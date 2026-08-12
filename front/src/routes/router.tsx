import { createBrowserRouter, Outlet } from "react-router-dom";
import { ScrollToTop } from "../components/common/ScrollToTop"; // Importamos tu componente

import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import Home from "../pages/Home/Home";
import Classes from "../pages/Classes/Classes";
import About from "../pages/About/About";
import Contact from "../pages/Contact/Contact";
import Plan from "../pages/Plan/Plan";
import NotFound from "../pages/NotFound/NotFound";
import Trainers from "../pages/Trainers/Trainers";

// 1. Creamos el Layout principal
const RootLayout = () => {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
};

// 2. Envolvemos todas las rutas existentes dentro de los 'children' del Layout
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
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
        path: "/contact",
        element: <Contact />,
      },
      {
        path: "/contacto",
        element: <Contact />, 
      },
      {
        path: "/membership",
        element: <Plan />,
      },
      {
        path: "/trainers",
        element: <Trainers />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);