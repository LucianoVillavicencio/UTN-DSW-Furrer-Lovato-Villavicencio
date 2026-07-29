// front/src/services/auth.service.ts

export interface RegisterUserData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export const loginUser = async (email: string, password: string) => {
  try {
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
    return data;
  } catch (error) {
    console.error("Error en el login:", error);
    throw error;
  }
};

export const registerUser = async (userData: RegisterUserData) => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('No se pudo registrar el usuario. El correo puede estar en uso.');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error en el registro:", error);
    throw error;
  }
};

export const loginWithGoogle = () => {
  // Redirige al flujo de OAuth de Google del backend
  window.location.href = 'http://localhost:3000/api/auth/google';
};