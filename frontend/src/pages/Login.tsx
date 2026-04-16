import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, LogIn } from "lucide-react";
import { motion } from "framer-motion";

const employeeUsers = ["janaina@eva.com", "veronica@eva.com", "ana@eva.com", "vitor@eva.com"];

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);
    if (result.success) {
      navigate("/");
    } else {
      setError(result.error || "Erro ao entrar");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="eva-card-elevated rounded-3xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-primary flex items-center justify-center mb-4">
              <span className="font-heading text-2xl font-bold text-primary-foreground">E</span>
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              EVA Escritórios Virtuais
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Acesso interno - Controle de Encomendas
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Email ou usuário
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full rounded-xl border border-border bg-surface-2 py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-border bg-surface-2 py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-eva-danger bg-eva-danger-light rounded-lg px-3 py-2 text-center"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold py-3 px-4 text-sm transition-all duration-200 hover:bg-eva-red-dark eva-glow-red hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? (
                <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Entrar
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Esqueceu sua senha?
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-border text-center">
            <p className="text-[11px] text-muted-foreground/70">
              Acesso exclusivo para funcionários EVA
            </p>
          </div>

          <div className="mt-4 rounded-xl bg-surface-2 border border-border p-3">
            <p className="text-[11px] text-muted-foreground text-center mb-2 font-medium">Funcionários cadastrados:</p>
            <div className="grid grid-cols-2 gap-1.5">
              {employeeUsers.map((employeeUser) => (
                <button
                  key={employeeUser}
                  type="button"
                  onClick={() => {
                    setEmail(employeeUser);
                    setPassword("1958");
                  }}
                  className="text-[11px] text-primary hover:bg-eva-red-light rounded-lg py-1.5 px-2 transition-colors font-medium"
                >
                  {employeeUser}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
