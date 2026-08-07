import { RouterProvider } from "react-router-dom";
import { router } from "./routes/router"; // Dependiendo de la ruta de tu archivo

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;