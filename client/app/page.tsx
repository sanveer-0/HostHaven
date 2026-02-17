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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-sky-100 via-cyan-50 to-blue-100">
      {/* Beach wave pattern background */}
      <div className="absolute inset-0 opacity-30">
        <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="#0ea5e9" fillOpacity="0.3" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
        <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="#06b6d4" fillOpacity="0.2" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      {/* Floating elements - beach themed */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-amber-200 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-cyan-200 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/3 w-32 h-32 bg-sky-200 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-teal-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-3000"></div>
      </div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="backdrop-blur-xl bg-white/80 border border-white/60 rounded-3xl shadow-2xl p-10 animate-scale-in">
          {/* Logo section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl blur-lg opacity-60 animate-pulse"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-cyan-500 via-blue-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <i className="fa-solid fa-umbrella-beach text-3xl text-white"></i>
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">
                HostHaven
              </span>
            </h1>
            <p className="text-slate-600 text-sm font-medium">
              🌴 Your Tropical Paradise Awaits 🌊
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-slide-up">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-circle-exclamation text-red-500"></i>
                </div>
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity"></div>
                <div className="relative flex items-center">
                  <div className="absolute left-4 flex items-center pointer-events-none">
                    <i className="fa-regular fa-envelope text-slate-400 group-focus-within:text-cyan-500 transition-colors"></i>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@hosthaven.com"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:bg-white/80 focus:ring-2 focus:ring-cyan-200 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity"></div>
                <div className="relative flex items-center">
                  <div className="absolute left-4 flex items-center pointer-events-none">
                    <i className="fa-solid fa-lock text-slate-400 group-focus-within:text-cyan-500 transition-colors"></i>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:bg-white/80 focus:ring-2 focus:ring-cyan-200 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full group mt-6"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-500 rounded-xl blur-md opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="relative w-full py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-500 hover:from-cyan-600 hover:via-blue-600 hover:to-teal-600 text-white font-bold rounded-xl transition-all duration-200 transform group-hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 shadow-lg">
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
          <div className="mt-6 p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
            <div className="flex items-start gap-3">
              <i className="fa-solid fa-circle-info text-cyan-600 mt-0.5"></i>
              <div className="text-xs text-cyan-700">
                <p className="font-semibold mb-1">Demo Credentials:</p>
                <p>Email: <span className="font-mono bg-white px-2 py-0.5 rounded">admin@test.com</span></p>
                <p>Password: <span className="font-mono bg-white px-2 py-0.5 rounded">password123</span></p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <i className="fa-solid fa-shield-halved text-cyan-500"></i>
              <span>Secured with JWT Authentication</span>
            </div>
          </div>
        </div>

        {/* Bottom text */}
        <p className="text-center mt-6 text-sm text-slate-600">
          © 2026 HostHaven. Making waves in hospitality 🌊
        </p>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
