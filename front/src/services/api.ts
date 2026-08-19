
import axios from "axios";

const TOKEN_KEY = "accessToken";
const USER_KEY = "user";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Adjunta el JWT a cada request saliente, si existe.

// Interceptors de request recorre antes que exios mande cada llamada.
// En este caso lo usamos para pegar el header Authorization automaticamente.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    return Promise.reject(error);
  },
);

export default api;