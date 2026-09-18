'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/navigation';
import { Shield, Key, User, ArrowRight, Lock, BookOpen } from 'lucide-react';
import { loginAdmin } from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const toast = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await loginAdmin(username, password);
      if (res.token) {
        localStorage.setItem('chronicle_admin_token', res.token);
        localStorage.setItem('chronicle_admin_user', JSON.stringify(res.admin));
        document.cookie = `chronicle_admin_token=${res.token}; path=/; max-age=604800; SameSite=Lax`;
        toast.success(`Welcome back, ${res.admin.username}!`);
        router.push('/admin/dashboard');
      } else {
        throw new Error('No authentication token received.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid credentials. Please verify username and password.');
      toast.error('Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-base-200/40">
      <div className="card w-full max-w-md bg-base-100 border border-base-300 shadow-2xl overflow-hidden">
        {/* Masthead header */}
        <div className="bg-primary text-primary-content p-6 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-white/10 mx-auto flex items-center justify-center backdrop-blur shadow-inner">
            <Shield className="w-6 h-6 text-primary-content" />
          </div>
          <h1 className="text-2xl font-display font-black uppercase tracking-wider">
            Chronicle Portal
          </h1>
          <p className="text-xs text-primary-content/80 font-mono tracking-widest uppercase">
            Editorial Management Console
          </p>
        </div>

        {/* Login Form */}
        <div className="card-body p-6 sm:p-8 space-y-4">
          {error && (
            <div className="alert alert-error text-xs shadow">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label text-xs font-bold uppercase tracking-wider text-base-content/70">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  className="input input-bordered w-full pl-10 text-sm focus:input-primary rounded-xl"
                  required
                />
                <User className="w-4 h-4 text-base-content/40 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="label text-xs font-bold uppercase tracking-wider text-base-content/70">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="input input-bordered w-full pl-10 text-sm focus:input-primary rounded-xl"
                  required
                />
                <Lock className="w-4 h-4 text-base-content/40 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full rounded-xl mt-4 gap-2 font-bold uppercase tracking-wider text-xs"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

