'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, ArrowRight, BookOpen, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const toast = useToast();

  const redirectUrl = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await login(email, password);
      if (redirectUrl && redirectUrl.startsWith('/')) {
        router.push(redirectUrl);
      } else if (res.user.role === 'admin' || res.user.role === 'superadmin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/profile');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const registerHref = redirectUrl
    ? `/register?redirect=${encodeURIComponent(redirectUrl)}`
    : '/register';

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-base-200/40">
      <div className="card w-full max-w-md bg-base-100 border border-base-300 shadow-2xl overflow-hidden">
        {/* Masthead header */}
        <div className="bg-primary text-primary-content p-6 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-white/10 mx-auto flex items-center justify-center backdrop-blur shadow-inner">
            <BookOpen className="w-6 h-6 text-primary-content" />
          </div>
          <h1 className="text-2xl font-display font-black uppercase tracking-wider">
            Chronicle Reader Account
          </h1>
          <p className="text-xs text-primary-content/80 font-mono tracking-widest uppercase">
            Sign In to Like & Bookmark Biographies
          </p>
        </div>

        {/* Card Body */}
        <div className="card-body p-6 sm:p-8 space-y-4">
          {redirectUrl && (
            <div className="alert alert-info py-2 px-3 text-xs rounded-xl">
              <span>Sign in to record your appreciation and return to the biography.</span>
            </div>
          )}

          {error && (
            <div className="alert alert-error text-xs shadow">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="label text-xs font-bold uppercase tracking-wider text-base-content/70">
                Email Address or Admin Username
              </label>
              <div className="relative">
                <input
                  id="login-email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="input input-bordered min-h-[44px] w-full pl-10 text-sm focus:input-primary rounded-xl"
                  required
                />
                <Mail className="w-4 h-4 text-base-content/40 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="label text-xs font-bold uppercase tracking-wider text-base-content/70">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input input-bordered min-h-[44px] w-full pl-10 text-sm focus:input-primary rounded-xl"
                  required
                />
                <Lock className="w-4 h-4 text-base-content/40 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary min-h-[44px] w-full rounded-xl mt-4 gap-2 font-bold uppercase tracking-wider text-xs shadow-md"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="pt-4 border-t border-base-200 text-center space-y-3 text-xs">
            <p className="text-base-content/70">
              Don't have a reader account yet?{' '}
              <Link href={registerHref} className="text-primary font-bold hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[75vh] flex items-center justify-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
