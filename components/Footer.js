'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Send, Heart, Sparkles, Twitter, Linkedin, Github } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Footer() {
  const [email, setEmail] = useState('');
  const toast = useToast();

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      toast.success('Thank you for subscribing to Chronicle Magazine!');
      setEmail('');
    } else {
      toast.warning('Please provide a valid email address.');
    }
  };

  return (
    <footer className="bg-base-200 text-base-content border-t border-base-300 transition-colors">
      {/* Editorial Newsletter Strip */}
      <div className="border-b border-base-300 py-10 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Weekly Life Stories Edition
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold">
            Read inspiring profiles delivered directly to your inbox.
          </h2>
          <p className="text-sm text-base-content/70 max-w-xl mx-auto">
            Deep-dive biographies into world leaders, tech visionaries, athletic legends, and cultural icons every Sunday.
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row justify-center items-center gap-2 max-w-md mx-auto pt-2">
            <input
              type="email"
              placeholder="Enter your email address..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input input-bordered input-sm sm:input-md w-full focus:input-primary rounded-full"
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm sm:btn-md rounded-full px-6 flex items-center gap-2 whitespace-nowrap"
            >
              <span>Subscribe</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <span className="font-display text-2xl font-black uppercase tracking-tight">
              Chronicle
            </span>
          </div>
          <p className="text-sm text-base-content/70 max-w-md leading-relaxed">
            Chronicle Magazine celebrates human endeavor, visionary leadership, and historical milestones through richly narrated biographies and in-depth cultural portraits.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm btn-circle" aria-label="Twitter">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm btn-circle" aria-label="LinkedIn">
              <Linkedin className="w-4 h-4" />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm btn-circle" aria-label="GitHub">
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-bold uppercase tracking-wider text-xs text-base-content/50 mb-4">
            Curated Categories
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/?category=Tech+Leaders" className="hover:text-primary transition-colors">
                Tech Leaders & CEOs
              </Link>
            </li>
            <li>
              <Link href="/?category=World+Leaders" className="hover:text-primary transition-colors">
                World Leaders & Peacemakers
              </Link>
            </li>
            <li>
              <Link href="/?category=Pioneers" className="hover:text-primary transition-colors">
                Scientific Pioneers & Innovators
              </Link>
            </li>
            <li>
              <Link href="/?category=Athletes+%26+Sports" className="hover:text-primary transition-colors">
                Athletic Legends & Sports
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold uppercase tracking-wider text-xs text-base-content/50 mb-4">
            Editorial & Access
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/?sort=featured" className="hover:text-primary transition-colors">
                Featured Cover Profiles
              </Link>
            </li>
            <li>
              <Link href="/?sort=likes" className="hover:text-primary transition-colors">
                Most Appreciated Biographies
              </Link>
            </li>
            <li>
              <Link href="/?sort=views" className="hover:text-primary transition-colors">
                Top Viewed Biographies
              </Link>
            </li>
            <li>
              <a href="#top" className="hover:text-primary transition-colors">
                Back to Top ↑
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-base-300 py-6 text-center text-xs text-base-content/60">
        <p className="flex items-center justify-center gap-1">
          © {new Date().getFullYear()} Chronicle Magazine. Built with Next.js, Express & MongoDB Native Driver.
        </p>
      </div>
    </footer>
  );
}

