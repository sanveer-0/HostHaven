'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, API_URL } from '@/lib/api';
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

  const nmCard: React.CSSProperties = {
    background: 'var(--nm-bg)',
    boxShadow: '12px 12px 28px var(--nm-sd), -12px -12px 28px var(--nm-sl)',
    borderRadius: '28px',
  };
  const nmInset: React.CSSProperties = {
    background: 'var(--nm-bg)',
    boxShadow: 'inset 4px 4px 9px var(--nm-sd), inset -4px -4px 9px var(--nm-sl)',
    borderRadius: '14px',
    border: 'none',
    outline: 'none',
    color: 'var(--nm-text)',
  };
  const nmBtn: React.CSSProperties = {
    background: 'var(--nm-bg)',
    boxShadow: '5px 5px 12px var(--nm-sd), -5px -5px 12px var(--nm-sl)',
    borderRadius: '14px',
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--nm-bg)' }}>
      <div className="w-full max-w-md px-6">
        <div style={nmCard} className="p-10 animate-scale-in">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-6">
              <div
                className="w-20 h-20 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center"
                style={{ boxShadow: '6px 6px 14px var(--nm-sd), -6px -6px 14px var(--nm-sl)' }}
              >
                <i className="fa-solid fa-umbrella-beach text-3xl text-white"></i>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--nm-text)' }}>
              HostHaven
            </h1>
            <p className="text-sm font-medium tracking-wide" style={{ color: 'var(--nm-text-3)' }}>
              🌴 Your Tropical Paradise Awaits 🌊
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 animate-slide-up">
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-circle-exclamation text-rose-500"></i>
                <p className="text-rose-600 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--nm-text-2)' }}>
                Email Address
              </label>
              <div className="relative flex items-center">
                <i className="fa-regular fa-envelope absolute left-4 text-sm" style={{ color: 'var(--nm-text-3)' }}></i>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hosthaven.com"
                  required
                  className="w-full pl-11 pr-4 py-3.5 text-sm placeholder-[#9ab0be] focus:ring-2 focus:ring-teal-300/50"
                  style={nmInset}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--nm-text-2)' }}>
                Password
              </label>
              <div className="relative flex items-center">
                <i className="fa-solid fa-lock absolute left-4 text-sm" style={{ color: 'var(--nm-text-3)' }}></i>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3.5 text-sm placeholder-[#9ab0be] focus:ring-2 focus:ring-teal-300/50"
                  style={nmInset}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-4 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white font-bold rounded-2xl transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              style={{ boxShadow: '5px 5px 14px var(--nm-sd), -5px -5px 14px var(--nm-sl)' }}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Dive Into Dashboard</span>
                  <i className="fa-solid fa-water"></i>
                </>
              )}
            </button>
          </form>

          {/* Credentials hint */}
          <div className="mt-8 p-4 rounded-xl" style={{ boxShadow: 'inset 3px 3px 8px var(--nm-sd), inset -3px -3px 8px var(--nm-sl)', background: 'var(--nm-bg)' }}>
            <div className="flex items-start gap-3">
              <i className="fa-solid fa-circle-info text-teal-500 mt-0.5"></i>
              <div className="text-xs" style={{ color: 'var(--nm-text-2)' }}>
                <p className="font-semibold mb-2" style={{ color: 'var(--nm-text)' }}>Demo Credentials:</p>
                <div className="space-y-1 font-mono">
                  <p>Email: <span className="text-teal-600 font-semibold">admin@hosthaven.com</span></p>
                  <p>Password: <span className="text-teal-600 font-semibold">admin123</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid rgba(197,205,216,0.5)' }}>
            <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--nm-text-3)' }}>
              <i className="fa-solid fa-shield-halved text-teal-400"></i>
              <span>Secured with JWT Authentication</span>
            </div>
          </div>
        </div>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--nm-text-3)' }}>
          © 2026 HostHaven. Making waves in hospitality 🌊
        </p>
      </div>
    </div>
  );
}
