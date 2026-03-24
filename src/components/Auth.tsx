import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, Mail, Lock, Sun, Moon } from 'lucide-react';

// Nexli Icon Component (matching dashboard exactly)
const NexliIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="nexli-auth-icon-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#06B6D4" />
      </linearGradient>
    </defs>
    <path d="M12 36L28 24L12 12L12 18L18 24L12 30L12 36Z" fill="url(#nexli-auth-icon-grad)" />
    <path d="M20 36L44 24L20 12L20 18L32 24L20 30L20 36Z" fill="#06B6D4" />
  </svg>
);

const NexliWordmark = ({ className = '' }: { className?: string }) => (
  <span
    className={`font-display text-xl font-extrabold tracking-tight ${className}`}
    style={{ color: 'var(--text-primary)' }}
  >
    NEXLI
  </span>
);

interface AuthProps {
  onAuthSuccess: () => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Theme state (default to dark, matching dashboard)
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('nexli-theme');
    if (stored) return stored === 'dark';
    return true; // Default to dark mode
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('nexli-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Sign up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // Create user profile
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              full_name: fullName,
            });

          if (profileError) throw profileError;

          onAuthSuccess();
        }
      } else {
        // Sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        onAuthSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 p-3 rounded-xl transition-colors z-50"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
        }}
      >
        {isDark ? (
          <Sun className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        ) : (
          <Moon className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        )}
      </button>

      <div className="relative w-full max-w-md">
        {/* Logo and Title (matching navbar layout) */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <NexliIcon className="w-8 h-8" />
          <NexliWordmark />
        </div>

        <p
          className="text-center mb-6 text-sm font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          Lead Scraper Dashboard
        </p>

        {/* Auth Card */}
        <div
          className="glass-card rounded-3xl p-8 shadow-2xl"
          style={{ border: '1px solid var(--border-color)' }}
        >
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsSignUp(false)}
              className="flex-1 py-3 rounded-xl font-bold transition-all"
              style={{
                background: !isSignUp ? 'linear-gradient(135deg, #2563EB, #06B6D4)' : 'var(--bg-elevated)',
                color: !isSignUp ? 'white' : 'var(--text-secondary)',
                border: `1px solid ${!isSignUp ? 'transparent' : 'var(--border-color)'}`,
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className="flex-1 py-3 rounded-xl font-bold transition-all"
              style={{
                background: isSignUp ? 'linear-gradient(135deg, #2563EB, #06B6D4)' : 'var(--bg-elevated)',
                color: isSignUp ? 'white' : 'var(--text-secondary)',
                border: `1px solid ${isSignUp ? 'transparent' : 'var(--border-color)'}`,
              }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-3"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div
                className="absolute inset-0 flex items-center"
              >
                <div className="w-full border-t" style={{ borderColor: 'var(--border-color)' }}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span
                  className="px-4 text-sm"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}
                >
                  Or continue with email
                </span>
              </div>
            </div>

            {isSignUp && (
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 outline-none transition-colors text-sm"
                    style={{
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                    }}
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl pl-12 pr-4 py-3 outline-none transition-colors text-sm"
                  style={{
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl pl-12 pr-4 py-3 outline-none transition-colors text-sm"
                  style={{
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div
                className="rounded-xl p-3 text-sm"
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#EF4444',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full nexli-gradient-bg font-bold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2 text-white"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </>
              )}
            </button>
          </form>

          <p
            className="text-center text-sm mt-6"
            style={{ color: 'var(--text-muted)' }}
          >
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-semibold hover:underline nexli-gradient-text"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>

        <p
          className="text-center text-sm mt-6"
          style={{ color: 'var(--text-muted)' }}
        >
          Secure authentication powered by Supabase
        </p>
      </div>
    </div>
  );
}
