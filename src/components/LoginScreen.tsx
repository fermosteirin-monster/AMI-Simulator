// LoginScreen.tsx — Pantalla de acceso con contraseña

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onSuccess: () => void;
}

const CORRECT_PASSWORD = import.meta.env.VITE_APP_PASSWORD ?? 'ami2025';

export default function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState(false);
  const [loading, setLoading]         = useState(false);
  const [shake, setShake]             = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    // Small artificial delay for UX
    await new Promise((r) => setTimeout(r, 600));

    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem('ami_authenticated', 'true');
      onSuccess();
    } else {
      setError(true);
      setLoading(false);
      setShake(true);
      setPassword('');
      setTimeout(() => {
        setShake(false);
        inputRef.current?.focus();
      }, 500);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center mesh-bg font-sans"
      style={{ color: 'var(--text-primary)' }}
    >
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(99,102,241,0.15) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm px-4"
      >
        {/* Card */}
        <motion.div
          animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className="glass rounded-2xl p-8 border"
          style={{
            borderColor: error ? 'rgba(244,63,94,0.4)' : 'var(--border-medium)',
            boxShadow: error
              ? '0 0 0 1px rgba(244,63,94,0.2), 0 24px 64px rgba(0,0,0,0.4)'
              : '0 24px 64px rgba(0,0,0,0.4)',
            background: 'rgba(15,15,46,0.92)',
            backdropFilter: 'blur(24px)',
            transition: 'border-color 0.3s, box-shadow 0.3s',
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg mb-4"
              style={{ boxShadow: '0 0 32px rgba(99,102,241,0.4)' }}
              whileHover={{ scale: 1.05 }}
            >
              <Zap className="w-7 h-7 text-white" />
            </motion.div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              AMI Simulator
            </h1>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Edesur · Acceso restringido
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password field */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Contraseña de acceso
              </label>
              <div className="relative">
                <div
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: error ? 'rgb(244,63,94)' : 'var(--text-muted)' }}
                >
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  ref={inputRef}
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder="••••••••"
                  autoFocus
                  autoComplete="current-password"
                  className="param-input w-full pl-9 pr-10 text-sm"
                  style={{
                    borderColor: error ? 'rgba(244,63,94,0.6)' : undefined,
                    background: error ? 'rgba(244,63,94,0.05)' : undefined,
                  }}
                />
                <button
                  type="button"
                  id="toggle-password-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex items-center gap-1.5 text-xs text-rose-400"
                  >
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    Contraseña incorrecta. Intentá de nuevo.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Submit */}
            <motion.button
              id="login-submit-btn"
              type="submit"
              disabled={loading || !password}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all relative overflow-hidden"
              style={{
                background: loading || !password
                  ? 'rgba(99,102,241,0.4)'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: loading || !password ? 'none' : '0 0 24px rgba(99,102,241,0.4)',
                cursor: loading || !password ? 'not-allowed' : 'pointer',
              }}
              whileHover={!loading && password ? { scale: 1.01 } : {}}
              whileTap={!loading && password ? { scale: 0.98 } : {}}
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <motion.div
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                    />
                    Verificando…
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Ingresar
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </form>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs mt-5" style={{ color: 'var(--text-muted)' }}>
          Acceso exclusivo · Antigravity © 2025
        </p>
      </motion.div>
    </div>
  );
}
