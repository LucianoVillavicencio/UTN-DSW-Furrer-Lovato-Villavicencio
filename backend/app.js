
import db from "./config/db.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend funcionando");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

db.query("SELECT 1")
  .then(() => {
    console.log("Conectado a MySQL");
  })
  .catch((error) => {
    console.error("Error MySQL:", error.message);
  });

db.query("SELECT 1")
  .then(() => console.log("Conectado a MySQL"))
  .catch((err) => console.error("Error MySQL:", err.message));