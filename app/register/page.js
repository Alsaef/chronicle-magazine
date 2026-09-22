'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Mail, Lock, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();
  const toast = useToast();

  const redirectUrl = searchParams.get('redirect');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      toast.warning('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password
      });
      if (redirectUrl && redirectUrl.startsWith('/')) {
        router.push(redirectUrl);
      } else {
        router.push('/profile');
      }
    } catch (err) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const loginHref = redirectUrl
    ? `/login?redirect=${encodeURIComponent(redirectUrl)}`
    : '/login';

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-base-200/40">
      <div className="card w-full max-w-md bg-base-100 border border-base-300 shadow-2xl overflow-hidden">
        {/* Masthead header */}
        <div className="bg-primary text-primary-content p-6 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-white/10 mx-auto flex items-center justify-center backdrop-blur shadow-inner">
            <Sparkles className="w-6 h-6 text-primary-content" />
          </div>
          <h1 className="text-2xl font-display font-black uppercase tracking-wider">
            Join Chronicle
          </h1>
          <p className="text-xs text-primary-content/80 font-mono tracking-widest uppercase">
            Create Your Personal Reader Profile
          </p>
        </div>

        {/* Card Body */}
        <div className="card-body p-6 sm:p-8 space-y-4">
          {redirectUrl && (
            <div className="alert alert-info py-2 px-3 text-xs rounded-xl">
              <span>Create an account to record your appreciation and return to the biography.</span>
            </div>
          )}

          {error && (
            <div className="alert alert-error text-xs shadow">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label htmlFor="reg-name" className="label text-xs font-bold uppercase tracking-wider text-base-content/70">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="reg-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="input input-bordered min-h-[44px] w-full pl-10 text-sm focus:input-primary rounded-xl"
                  required
                />
                <User className="w-4 h-4 text-base-content/40 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="label text-xs font-bold uppercase tracking-wider text-base-content/70">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="reg-email"
                  type="email"
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
              <label htmlFor="reg-password" className="label text-xs font-bold uppercase tracking-wider text-base-content/70">
                Create Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="input input-bordered min-h-[44px] w-full pl-10 text-sm focus:input-primary rounded-xl"
                  required
                  minLength={6}
                />
                <Lock className="w-4 h-4 text-base-content/40 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label htmlFor="reg-confirm-password" className="label text-xs font-bold uppercase tracking-wider text-base-content/70">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="reg-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Perks info */}
          <div className="pt-2 text-xs text-base-content/60 space-y-1">
            <p className="flex items-center gap-1.5 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" /> Save and like biographies across the publication
            </p>
            <p className="flex items-center gap-1.5 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" /> Leave verified tributes and commentary
            </p>
          </div>

          {/* Links */}
          <div className="pt-4 border-t border-base-200 text-center text-xs">
            <p className="text-base-content/70">
              Already have an account?{' '}
              <Link href={loginHref} className="text-primary font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
