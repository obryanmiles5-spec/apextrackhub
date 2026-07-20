import React, { useState } from 'react';
import { Lock, ShieldAlert, KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginPortalProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function LoginPortal({ onSuccess, onCancel }: LoginPortalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Simulate secure handshaking
    setTimeout(() => {
      if (username === 'admin' && password === 'BEOK@1991!@@@') {
        onSuccess();
      } else {
        setError('Invalid secure token credentials. Please contact terminal logistics desk.');
        setIsSubmitting(false);
      }
    }, 850);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-150 shadow-2xl overflow-hidden my-6">
      <div className="bg-slate-950 p-6 text-center relative overflow-hidden">
        {/* Decorative backdrop elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-90" />
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-sky-500/10 rounded-full blur-2xl" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 bg-slate-900 border border-slate-800 text-sky-400 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
            <Lock className="w-5 h-5 animate-pulse" />
          </div>
          <h3 className="text-white font-sans font-black tracking-tight text-lg uppercase">
            Broker Terminal Gate
          </h3>
          <p className="text-slate-400 font-mono text-[10px] uppercase tracking-wider mt-1">
            WooCommerce Cargo Authorization
          </p>
        </div>
      </div>

      <div className="p-8">
        <div className="bg-sky-50 border border-sky-100/80 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-600 font-sans leading-relaxed">
            <span className="font-semibold text-slate-900 block animate-pulse">Access Restriction Protocols:</span>
            This workspace connects to live marine manifests, custom declarations, and freight bill of ladings. Every connection is fully audited.
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-2 font-sans">
              Operator Account (Username)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-slate-400">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                required
                disabled={isSubmitting}
                placeholder="Enter operator code (e.g. admin)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-950 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-hidden transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-2 font-sans">
              Secure Key Token (Password)
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                disabled={isSubmitting}
                placeholder="Enter secure password token"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-950 rounded-xl px-4 py-3 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-hidden transition pr-10"
              />
            </div>
          </div>

          <div className="pt-3 flex flex-col gap-2">
            <button
              id="submit-login-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-950 hover:bg-slate-900 text-white font-sans font-bold text-xs py-3.5 px-4 rounded-xl uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-md disabled:bg-slate-400"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> Authenticating Dispatch...
                </>
              ) : (
                'Unlock Terminal Access'
              )}
            </button>
            
            {onCancel && (
              <button
                id="cancel-login-btn"
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="w-full bg-transparent hover:bg-slate-100/50 text-slate-500 hover:text-slate-950 font-sans font-bold text-xs py-2 px-4 rounded-xl uppercase tracking-wider transition cursor-pointer"
              >
                Return to Port Home
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
