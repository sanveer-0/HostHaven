'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { setAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authAPI.login(email, password);
      // Wait for 1 second to show the loading state
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAuth(data.token, {
        _id: data._id,
        username: data.username,
        email: data.email,
        role: data.role,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-slate-100">

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="glass-card-dark rounded-3xl shadow-2xl p-10 animate-scale-in border border-white/10">
          {/* Logo section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl blur-lg opacity-40 animate-pulse"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-cyan-900/40">
                  <i className="fa-solid fa-umbrella-beach text-3xl text-white"></i>
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-2 text-white">
              HostHaven
            </h1>
            <p className="text-cyan-200/80 text-sm font-medium tracking-wide">
              🌴 Your Tropical Paradise Awaits 🌊
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-slide-up">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-circle-exclamation text-red-400"></i>
                </div>
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl opacity-0 group-hover:opacity-10 blur transition-opacity"></div>
                <div className="relative flex items-center">
                  <div className="absolute left-4 flex items-center pointer-events-none">
                    <i className="fa-regular fa-envelope text-slate-500 group-focus-within:text-cyan-400 transition-colors"></i>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@hosthaven.com"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-900/80 focus:ring-1 focus:ring-cyan-500/20 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl opacity-0 group-hover:opacity-10 blur transition-opacity"></div>
                <div className="relative flex items-center">
                  <div className="absolute left-4 flex items-center pointer-events-none">
                    <i className="fa-solid fa-lock text-slate-500 group-focus-within:text-cyan-400 transition-colors"></i>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-900/80 focus:ring-1 focus:ring-cyan-500/20 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full group mt-6"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 rounded-xl blur opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative w-full py-4 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 hover:from-teal-500 hover:via-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all duration-200 transform group-hover:translate-y-[-1px] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 shadow-lg shadow-cyan-900/20">
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin text-lg"></i>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Dive Into Dashboard</span>
                    <i className="fa-solid fa-water group-hover:translate-x-1 transition-transform"></i>
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Credentials hint */}
          <div className="mt-8 p-4 bg-cyan-900/20 border border-cyan-500/20 rounded-xl backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <i className="fa-solid fa-circle-info text-cyan-400"></i>
              </div>
              <div className="text-xs text-cyan-200/80">
                <p className="font-semibold mb-2 text-cyan-100">Demo Credentials:</p>
                <div className="space-y-1 font-mono">
                  <p>Email: <span className="bg-slate-900/50 px-2 py-0.5 rounded text-cyan-300 border border-cyan-500/10">admin@test.com</span></p>
                  <p>Password: <span className="bg-slate-900/50 px-2 py-0.5 rounded text-cyan-300 border border-cyan-500/10">password123</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/5">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <i className="fa-solid fa-shield-halved text-cyan-600"></i>
              <span>Secured with JWT Authentication</span>
            </div>
          </div>
        </div>

        {/* Bottom text */}
        <p className="text-center mt-6 text-sm text-slate-500">
          © 2026 HostHaven. Making waves in hospitality 🌊
        </p>
      </div>
    </div>
  );
}
