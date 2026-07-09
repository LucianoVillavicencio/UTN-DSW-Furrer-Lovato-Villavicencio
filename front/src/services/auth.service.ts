// front/src/services/auth.service.ts

export const loginUser = async (email: string, password: string) => {
  try {
    // Aquí luego reemplazarás la URL con la de tu endpoint real del backend
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Credenciales inválidas');
    }

    const data = await response.json();
    return data; // Seguramente devuelva un token (JWT) y datos del usuario
  } catch (error) {
    console.error("Error en el login:", error);
    throw error;
  }
};