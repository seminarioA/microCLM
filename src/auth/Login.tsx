import { useState } from "react";
import { LogIn, Lock, Mail } from "lucide-react";
import { useAuth } from "./AuthContext";
import { brandLine } from "../theme/brand";
import "./Login.css";

export function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) setError(error);
  }

  return (
    <div className="login-screen">
      <form className="login-card panel" onSubmit={handleSubmit}>
        <span className="eyebrow">{brandLine()}</span>
        <h1>Iniciar sesión</h1>
        <p className="login-desc">Ingresa con tu cuenta del equipo comercial.</p>

        <div className="form-group">
          <label htmlFor="login-email">
            <Mail size={13} strokeWidth={2} /> Correo electrónico
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="joel@lasegundamordida.pe"
          />
        </div>

        <div className="form-group">
          <label htmlFor="login-password">
            <Lock size={13} strokeWidth={2} /> Contraseña
          </label>
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && <span className="field-error login-error">{error}</span>}

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          <LogIn size={14} strokeWidth={2} /> {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
