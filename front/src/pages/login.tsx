// front/src/pages/Login.tsx
import { useState } from 'react';
import { loginUser } from '../services/auth.service';
// Si usas react-router-dom, importarás useNavigate para redireccionar después
// import { useNavigate } from 'react-router-dom'; 

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Limpiamos errores previos

    if (!email || !password) {
      setError('Por favor, completá todos los campos.');
      return;
    }

    try {
      const userData = await loginUser(email, password);
      console.log('Login exitoso:', userData);
      
      // Acá deberías guardar el token (ej: en localStorage o en tu Context)
      // localStorage.setItem('token', userData.token);
      
      // Y luego redirigir al panel principal del gimnasio
      // navigate('/dashboard');
      
    } catch (err) {
      setError('Error al iniciar sesión. Revisá tus credenciales.');
    }
  };
  
  return (
    <div className="login-container">
      <h2>Ingreso al Sistema</h2>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Correo Electrónico:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@gimnasio.com"
          />
        </div>

        <div>
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
          />
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit">Iniciar Sesión</button>
      </form>
    </div>
  );
};