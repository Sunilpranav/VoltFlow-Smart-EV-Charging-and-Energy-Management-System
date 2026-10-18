import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const isActive = (path: string) => {
    if (path === '/stations') return location.pathname.startsWith('/stations');
    if (path === '/sessions') return location.pathname.startsWith('/sessions');
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#080c14]/90 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-slate-950 fill-current" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  Volt<span className="text-emerald-400">Flow</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium -mt-1">
                  EV Energy OS
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Link
              to="/stations"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive('/stations')
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Charging Hubs
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive('/dashboard')
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/vehicles"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive('/vehicles')
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  My Garage
                </Link>
                <Link
                  to="/sessions"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive('/sessions')
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Sessions
                </Link>
                <Link
                  to="/wallet"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isActive('/wallet')
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span>Wallet & Plans</span>
                </Link>
                {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                  <Link
                    to="/admin"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      location.pathname.startsWith('/admin')
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                        : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span>Admin Operations</span>
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Right: Auth Profile / Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-800/80">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-100">{user?.fullName || 'Driver'}</span>
                  <span className="text-[10px] text-emerald-400 font-mono tracking-wider">{user?.role || 'CUSTOMER'}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition-all"
                  title="Sign Out"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-slate-800 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98]"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#080c14]"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div id="mobile-nav-menu" className="md:hidden border-t border-slate-800 bg-[#080c14]/95 px-4 pt-3 pb-5 space-y-2 backdrop-blur-xl">
          <Link
            to="/stations"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800"
          >
            Charging Hubs
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Dashboard
              </Link>
              <Link
                to="/vehicles"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800"
              >
                My Garage
              </Link>
              <Link
                to="/sessions"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Charging Sessions
              </Link>
              <Link
                to="/wallet"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Wallet & Plans
              </Link>
              {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20"
                >
                  🛡️ Admin Operations
                </Link>
              )}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{user?.fullName}</div>
                  <div className="text-xs text-slate-400 font-mono">{user?.email}</div>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs text-rose-400 bg-rose-500/10 rounded-lg border border-rose-500/20 font-semibold"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="pt-3 border-t border-slate-800 flex gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2.5 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-800 rounded-xl"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 rounded-xl"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
