// front/src/pages/Login.tsx
import React, { useState } from 'react';
import { loginUser } from '../services/auth.service';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, completá todos los campos.');
      return;
    }

    try {
      const userData = await loginUser(email, password);
      console.log('Login exitoso:', userData);
    } catch (err) {
      setError('Error al iniciar sesión. Revisá tus credenciales.');
    }
  };

  return (
    // Agregamos 'w-full' para forzar que tome el 100% del ancho de la pantalla
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-sans bg-[#0f172a]">
      
      {/* MITAD IZQUIERDA: Formulario */}
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center p-8 relative z-10">
        
        {/* En móvil se ve con el efecto cristal (bg-white/10), en PC es transparente para un look más limpio */}
        <div className="w-full max-w-md bg-white/10 lg:bg-transparent p-10 lg:p-0 rounded-3xl lg:rounded-none shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] lg:shadow-none backdrop-blur-md lg:backdrop-blur-none border border-white/20 lg:border-none">
          
          <div className="text-center lg:text-left mb-10">
            <h2 className="text-4xl font-black text-white tracking-wider uppercase">
              Fit<span className="text-orange-500">System</span>
            </h2>
            <p className="text-gray-400 mt-2 font-medium tracking-wide text-sm">
              Panel de Administración
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-gray-300 mb-2 uppercase tracking-wider">
                Correo Electrónico
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gimnasio.com"
                className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-gray-300 mb-2 uppercase tracking-wider">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm text-center font-medium">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-orange-500/30 uppercase tracking-widest"
            >
              Ingresar
            </button>
          </form>
        </div>
      </div>

      {/* MITAD DERECHA: Imagen */}
      <div 
        className="hidden lg:block lg:w-1/2 min-h-screen bg-cover bg-center relative"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* Fondo de imagen solo para móvil */}
      <div className="lg:hidden absolute inset-0 bg-cover bg-center z-[-1]" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop')" }}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      </div>
      
    </div>
  );
};