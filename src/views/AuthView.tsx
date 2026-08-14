import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import {
  Flame,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';

export const AuthView: React.FC = () => {
  const { signIn, signUp, resetPassword, isConfigured } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const switchMode = (newMode: 'login' | 'signup' | 'reset') => {
    setMode(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (mode === 'reset') {
      setIsSubmitting(true);
      const { error } = await resetPassword(email);
      setIsSubmitting(false);
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Password reset instructions have been sent to your email.');
      }
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
    }

    setIsSubmitting(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      setIsSubmitting(false);
      if (error) {
        setErrorMsg(error.message || 'Invalid login credentials.');
      }
    } else if (mode === 'signup') {
      const { error, user } = await signUp(email, password);
      setIsSubmitting(false);
      if (error) {
        setErrorMsg(error.message);
      } else {
        if (user && !user.identities?.length) {
          setErrorMsg('An account with this email already exists.');
        } else {
          setSuccessMsg(
            'Account created successfully! Check your email for a confirmation link if required, or sign in.'
          );
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white shadow-xl shadow-orange-500/20 mb-1">
            <Flame className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            90 DAYS <span className="text-orange-500">LIFE UPGRADE</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            {mode === 'login' && 'Sign in to access your personal growth dashboard.'}
            {mode === 'signup' && 'Create your account to start your 90-day transformation.'}
            {mode === 'reset' && 'Enter your email to receive password reset instructions.'}
          </p>
        </div>

        {!isConfigured && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Supabase Configuration Warning</p>
              <p className="mt-0.5 text-[11px] text-amber-300/80">
                Please set <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-200">VITE_SUPABASE_URL</code> and <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-200">VITE_SUPABASE_PUBLISHABLE_KEY</code> in your environment variables.
              </p>
            </div>
          </div>
        )}

        {/* Auth Form Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5">
          {/* Mode Switch Tabs */}
          {mode !== 'reset' && (
            <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Field (Login & Signup modes) */}
            {mode !== 'reset' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Password *
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchMode('reset')}
                      className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password Field (Signup mode only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full py-3 text-sm font-bold shadow-lg shadow-indigo-600/20"
              icon={isSubmitting ? undefined : mode === 'reset' ? <KeyRound className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            >
              {isSubmitting
                ? 'Processing...'
                : mode === 'login'
                ? 'Sign In to Dashboard'
                : mode === 'signup'
                ? 'Create My Account'
                : 'Send Reset Link'}
            </Button>
          </form>

          {/* Reset Mode Back Link */}
          {mode === 'reset' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-xs font-bold text-slate-400 hover:text-white underline cursor-pointer"
              >
                ← Back to Sign In
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-center text-slate-500">
          Encrypted & secured by Supabase Authentication
        </p>
      </div>
    </div>
  );
};
