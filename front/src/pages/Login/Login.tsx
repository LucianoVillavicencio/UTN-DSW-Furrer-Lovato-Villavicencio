import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Dumbbell,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  loginUser,
  registerUser,
  recoverPassword,
} from "../../services/auth.service";

type AuthMode = "login" | "register" | "recover";

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Status & Feedback State
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetForm = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setSuccessMsg(null);
    setPassword("");
    setConfirmPassword("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setError("Por favor, completa todos los campos requeridos.");
      return;
    }

    setLoading(true);
    try {
      await loginUser(email, password);
      setSuccessMsg("¡Inicio de sesión exitoso! Redirigiendo...");
      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (err: any) {
      setError(err.message || "No se pudo iniciar sesión. Verifica tus credenciales.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!name || !email || !phone || !password || !confirmPassword) {
      setError("Por favor, completa todos los campos del formulario.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (!acceptTerms) {
      setError("Debes aceptar los términos y condiciones para crear una cuenta.");
      return;
    }

    setLoading(true);
    try {
      await registerUser(name, email, phone, password);
      setSuccessMsg("¡Cuenta creada con éxito! Redirigiendo al inicio...");
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Error al crear la cuenta. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email) {
      setError("Por favor, ingresa tu correo electrónico.");
      return;
    }

    setLoading(true);
    try {
      await recoverPassword(email);
      setSuccessMsg(
        `Hemos enviado las instrucciones para restablecer tu contraseña a ${email}. Revisa tu bandeja de entrada.`
      );
    } catch (err: any) {
      setError(
        err.message || "No se pudo procesar la solicitud. Intenta más tarde."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      // Direct integration simulation or Google OAuth redirect
      setTimeout(() => {
        setSuccessMsg("Conectando con Google...");
        setTimeout(() => {
          navigate("/");
        }, 1000);
      }, 800);
    } catch (err) {
      setError("Error al autenticar con Google.");
      setGoogleLoading(false);
    }
  };

  // Simple password strength calculator
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: "", color: "bg-border" };
    if (pass.length < 6) return { score: 1, text: "Débil", color: "bg-red-500" };
    if (pass.length < 10 || !/\d/.test(pass))
      return { score: 2, text: "Media", color: "bg-yellow-500" };
    return { score: 3, text: "Fuerte", color: "bg-primary" };
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen w-full bg-background text-text font-body relative flex flex-col justify-between overflow-x-hidden selection:bg-primary selection:text-background">
      {/* Background Decor Ambient Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[160px]" />
        <div className="absolute top-[40%] right-[15%] w-[350px] h-[350px] bg-emerald-600/5 rounded-full blur-[120px]" />
      </div>

      {/* Navigation Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 group transition-transform duration-200 hover:scale-[1.02]"
        >
          <div className="p-2 rounded-xl bg-surface border border-border group-hover:border-primary/50 transition-colors">
            <Dumbbell className="h-6 w-6 text-primary" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-text">
            FLG
          </span>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al inicio</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Main Card Container */}
          <div className="rounded-3xl border border-border bg-surface/90 backdrop-blur-xl p-8 sm:p-10 shadow-[0_15px_50px_rgba(0,0,0,0.5)] transition-all duration-300">
            
            {/* Top Navigation Tabs for Login & Register */}
            {mode !== "recover" && (
              <div className="flex border-b border-border mb-8 p-1 bg-background/50 rounded-2xl">
                <button
                  type="button"
                  onClick={() => resetForm("login")}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    mode === "login"
                      ? "bg-surface text-text shadow-md border border-border"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => resetForm("register")}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    mode === "register"
                      ? "bg-surface text-text shadow-md border border-border"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  Registrarse
                </button>
              </div>
            )}

            {/* Header Titles per mode */}
            <div className="text-center mb-6">
              {mode === "login" && (
                <>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-text">
                    ¡Hola de nuevo!
                  </h1>
                  <p className="text-text-muted text-sm mt-1">
                    Ingresa a tu cuenta para continuar tu entrenamiento
                  </p>
                </>
              )}

              {mode === "register" && (
                <>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-text">
                    Crear una cuenta
                  </h1>
                  <p className="text-text-muted text-sm mt-1">
                    Únete a FLG y alcanza tus metas hoy mismo
                  </p>
                </>
              )}

              {mode === "recover" && (
                <>
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                  <h1 className="font-display text-2xl font-bold tracking-tight text-text">
                    Recuperar Contraseña
                  </h1>
                  <p className="text-text-muted text-sm mt-2">
                    Ingresa tu correo electrónico registrado y te enviaremos las instrucciones para restablecer tu acceso.
                  </p>
                </>
              )}
            </div>

            {/* Feedback Alerts */}
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3 animate-fadeIn">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-start gap-3 animate-fadeIn">
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider"
                  >
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl text-text placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-body"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-semibold text-text-muted uppercase tracking-wider"
                    >
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={() => resetForm("recover")}
                      className="text-xs text-primary hover:text-primary-hover font-medium transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-11 py-3 bg-background border border-border rounded-xl text-text placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-body"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-muted hover:text-text transition-colors"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background cursor-pointer accent-primary"
                    />
                    <span className="text-xs text-text-muted group-hover:text-text transition-colors">
                      Recordarme en este dispositivo
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 px-4 rounded-xl bg-primary text-background font-display font-semibold hover:bg-primary-hover transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Iniciando sesión...</span>
                    </>
                  ) : (
                    <span>Iniciar Sesión</span>
                  )}
                </button>
              </form>
            )}

            {/* REGISTER FORM */}
            {mode === "register" && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label
                    htmlFor="reg-name"
                    className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider"
                  >
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                      <User className="h-5 w-5" />
                    </div>
                    <input
                      id="reg-name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Juan Pérez"
                      className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl text-text placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-body"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="reg-email"
                    className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider"
                  >
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      id="reg-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl text-text placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-body"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="reg-phone"
                    className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider"
                  >
                    Teléfono / WhatsApp
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                      <Phone className="h-5 w-5" />
                    </div>
                    <input
                      id="reg-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+54 9 342 123-4567"
                      className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl text-text placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-body"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="reg-password"
                    className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-11 py-3 bg-background border border-border rounded-xl text-text placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-body"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-muted hover:text-text transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {/* Strength Meter */}
                  {password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden flex gap-1">
                        <div
                          className={`h-full flex-1 transition-all ${
                            passwordStrength.score >= 1
                              ? passwordStrength.color
                              : "bg-border"
                          }`}
                        />
                        <div
                          className={`h-full flex-1 transition-all ${
                            passwordStrength.score >= 2
                              ? passwordStrength.color
                              : "bg-border"
                          }`}
                        />
                        <div
                          className={`h-full flex-1 transition-all ${
                            passwordStrength.score >= 3
                              ? passwordStrength.color
                              : "bg-border"
                          }`}
                        />
                      </div>
                      <span className="text-[11px] text-text-muted font-medium">
                        Seguridad: {passwordStrength.text}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="reg-confirm-password"
                    className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider"
                  >
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      id="reg-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-11 py-3 bg-background border border-border rounded-xl text-text placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-body"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-muted hover:text-text transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    id="accept-terms"
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background cursor-pointer accent-primary shrink-0"
                  />
                  <label htmlFor="accept-terms" className="text-xs text-text-muted leading-snug cursor-pointer">
                    Acepto los{" "}
                    <a href="#" className="text-primary hover:underline">
                      términos y condiciones
                    </a>{" "}
                    y la{" "}
                    <a href="#" className="text-primary hover:underline">
                      política de privacidad
                    </a>.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 px-4 rounded-xl bg-primary text-background font-display font-semibold hover:bg-primary-hover transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Creando cuenta...</span>
                    </>
                  ) : (
                    <span>Crear Cuenta</span>
                  )}
                </button>
              </form>
            )}

            {/* PASSWORD RECOVERY FORM */}
            {mode === "recover" && (
              <form onSubmit={handleRecoverPassword} className="space-y-4">
                <div>
                  <label
                    htmlFor="recover-email"
                    className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider"
                  >
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      id="recover-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl text-text placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-body"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 px-4 rounded-xl bg-primary text-background font-display font-semibold hover:bg-primary-hover transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <span>Enviar Enlace de Recuperación</span>
                  )}
                </button>

                <div className="text-center pt-3">
                  <button
                    type="button"
                    onClick={() => resetForm("login")}
                    className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Volver a Iniciar sesión</span>
                  </button>
                </div>
              </form>
            )}

            {/* DIVIDER & GOOGLE SINGLE-SIGN-ON */}
            {mode !== "recover" && (
              <>
                <div className="relative my-6 flex items-center justify-center">
                  <div className="w-full border-t border-border" />
                  <span className="absolute bg-surface px-3 text-xs text-text-muted uppercase font-medium tracking-wider">
                    O continuar con
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={googleLoading}
                  className="w-full py-3 px-4 rounded-xl bg-background border border-border hover:border-primary/50 hover:bg-surface-hover text-text text-sm font-medium transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer group disabled:opacity-50"
                >
                  {googleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
                  ) : (
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>
                    {mode === "login"
                      ? "Iniciar sesión con Google"
                      : "Registrarse con Google"}
                  </span>
                </button>
              </>
            )}
          </div>

          {/* Footer Note */}
          <p className="text-center text-xs text-text-muted mt-6">
            © {new Date().getFullYear()} FLG Fitness Center. Todos los derechos reservados.
          </p>
        </div>
      </main>
    </div>
  );
}
