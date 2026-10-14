
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  UserRound,
  Wrench,
} from "lucide-react";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";

const roleLabels = {
  buyer: "Comprador",
  junkyard: "Junker / negocio de piezas",
  private_seller: "Vendedor privado",
};

const errorMessages = {
  "auth/email-already-in-use": "Este correo ya tiene una cuenta. Intenta iniciar sesión.",
  "auth/invalid-email": "El correo electrónico no tiene un formato válido.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/invalid-credential": "El correo o la contraseña son incorrectos.",
  "auth/user-not-found": "No encontramos una cuenta con esos datos.",
  "auth/wrong-password": "La contraseña es incorrecta.",
  "auth/too-many-requests": "Hubo demasiados intentos. Espera un momento e inténtalo de nuevo.",
  "permission-denied": "Firebase rechazó el acceso a los datos. Revisa las reglas de Firestore.",
};

export default function Account() {
  const { user, profile, loading, register, login, logout } = useAuth();

  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("buyer");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);

    try {
      if (mode === "register") {
        if (name.trim().length < 2) {
          throw new Error("Escribe tu nombre completo.");
        }

        if (password.length < 6) {
          throw new Error("La contraseña debe tener al menos 6 caracteres.");
        }

        await register({ name, email, password, role });
      } else {
        await login({ email, password });
      }
    } catch (err) {
      const message =
        errorMessages[err.code] ||
        err.message ||
        "No pudimos completar la operación.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    setError("");
    setNotice("");

    try {
      await logout();
      setNotice("Has cerrado sesión correctamente.");
    } catch {
      setError("No pudimos cerrar la sesión. Intenta de nuevo.");
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="auth-page">
          <div className="auth-card auth-status">
            <LoaderCircle className="auth-spinner" size={30} />
            <p>Comprobando tu sesión...</p>
          </div>
        </main>
      </>
    );
  }

  if (user) {
    return (
      <>
        <Header />
        <main className="auth-page">
          <section className="auth-card">
            <div className="auth-brand-mark">
              <UserRound size={28} />
            </div>
            <span className="section-kicker">MI CUENTA ECpartZ</span>
            <h1>¡Bienvenido{profile?.name ? `, ${profile.name}` : ""}!</h1>
            <p className="auth-subtitle">
              Tu sesión está activa.
            </p>

            <div className="account-details">
              <div>
                <span>Correo electrónico</span>
                <strong>{user.email}</strong>
              </div>
              <div>
                <span>Tipo de cuenta</span>
                <strong>
                  {roleLabels[profile?.role] || "Cuenta ECparts"}
                </strong>
              </div>
              <div>
                <span>Identificador de usuario</span>
                <strong className="account-uid">{user.uid}</strong>
              </div>
            </div>

            {error && <div className="auth-message auth-error">{error}</div>}
            {notice && <div className="auth-message auth-success">{notice}</div>}

            <button
              className="auth-submit"
              type="button"
              onClick={() => {
                window.location.assign("/");
              }}
            >
              Ir al marketplace
            </button>

            <button
              className="auth-logout"
              type="button"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="auth-page">
        <section className="auth-card">
          <Link className="auth-back" to="/">
            <ArrowLeft size={16} /> Volver al marketplace
          </Link>

          <div className="auth-brand-mark">
            <Wrench size={28} />
          </div>

          <span className="section-kicker">TU CUENTA ECparts</span>
          <h1>
            {mode === "login"
              ? "Qué bueno tenerte de vuelta."
              : "Únete a ECparts."}
          </h1>
          <p className="auth-subtitle">
            {mode === "login"
              ? "Inicia sesión para continuar."
              : "Crea tu cuenta para comprar o vender piezas en Puerto Rico."}
          </p>

          <div className="auth-tabs">
            <button
              type="button"
              className={mode === "login" ? "auth-tab active" : "auth-tab"}
              onClick={() => {
                setMode("login");
                setError("");
                setNotice("");
              }}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              className={mode === "register" ? "auth-tab active" : "auth-tab"}
              onClick={() => {
                setMode("register");
                setError("");
                setNotice("");
              }}
            >
              Crear cuenta
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === "register" && (
              <>
                <label>
                  Nombre completo
                  <span className="auth-input-wrap">
                    <UserRound size={18} />
                    <input
                      type="text"
                      autoComplete="name"
                      placeholder="Tu nombre o negocio"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      minLength={2}
                      required
                    />
                  </span>
                </label>

                <label>
                  Tipo de cuenta
                  <select
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    required
                  >
                    <option value="buyer">Comprador</option>
                    <option value="junkyard">Junker / negocio de piezas</option>
                    <option value="private_seller">Vendedor privado</option>
                  </select>
                </label>
              </>
            )}

            <label>
              Correo electrónico
              <span className="auth-input-wrap">
                <Mail size={18} />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="nombre@correo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </span>
            </label>

            <label>
              Contraseña
              <span className="auth-input-wrap">
                <LockKeyhole size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                  required
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            {error && (
              <div className="auth-message auth-error" role="alert">
                {error}
              </div>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <LoaderCircle className="auth-spinner" size={18} />
                  Procesando...
                </>
              ) : mode === "login" ? (
                "Iniciar sesión"
              ) : (
                "Crear mi cuenta"
              )}
            </button>
          </form>

          <p className="auth-terms">
            Al continuar, aceptas utilizar ECparts conforme a sus términos y
            políticas aplicables.
          </p>
        </section>
      </main>
      <footer className="site-footer">
        <Link className="brand footer-brand" to="/">
          <span className="brand-mark">
            <Wrench size={20} />
          </span>
          <span>
            EC<span>parts</span>
            <small>PUERTO RICO</small>
          </span>
        </Link>
        <span>© {new Date().getFullYear()} ECparts</span>
      </footer>
    </>
  );
}
