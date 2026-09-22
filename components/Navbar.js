'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Sun,
  Moon,
  Search,
  Shield,
  Menu,
  X,
  BookOpen,
  Sparkles,
  TrendingUp,
  Bookmark,
  User,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getCategories } from '../lib/api';

export default function Navbar() {
  const { theme, toggleTheme, mounted } = useTheme();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    } else {
      router.push('/');
    }
  };

  // Format today's date in classic editorial style
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const [categories, setCategories] = useState([
    'All',
    'Tech Leaders',
    'World Leaders',
    'Pioneers',
    'Athletes & Sports'
  ]);

  useEffect(() => {
    let isMounted = true;
    getCategories()
      .then((res) => {
        if (isMounted && res?.data && res.data.length > 0) {
          const names = ['All', ...res.data.map((c) => c.name)];
          setCategories(names);
        }
      })
      .catch((err) => {
        console.error('Navbar getCategories error:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="w-full border-b border-base-300 bg-base-100/95 backdrop-blur sticky top-0 z-40 transition-colors">
      {/* Editorial Top Bar: Date, Edition info, Reader/Admin status */}
      <div className="border-b border-base-300 py-1 px-4 text-xs tracking-wider uppercase text-base-content/70 hidden sm:flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <span>{todayFormatted}</span>
          <span>•</span>
          <span className="flex items-center gap-1 font-semibold text-accent">
            <Sparkles className="w-3 h-3" /> Digital Editorial Edition
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/?sort=views" className="hover:text-primary transition-colors flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Trending
          </Link>
          <span>•</span>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link href="/profile" className="hover:text-primary transition-colors flex items-center gap-1 font-semibold">
                <Bookmark className="w-3 h-3 text-primary" /> My Reading List ({user?.bookmarks?.length || 0})
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="hover:text-primary transition-colors">
                Reader Sign In
              </Link>
              <span>•</span>
              <Link href="/register" className="text-primary font-bold hover:underline">
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Masthead Banner */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Mobile menu toggle */}
        <div className="flex items-center lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-ghost btn-square min-w-[48px] min-h-[48px] flex items-center justify-center"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Brand Logo */}
        <div className="flex-1 text-center lg:text-left">
          <Link href="/" className="inline-block group" aria-label="Chronicle Magazine Home">
            <div className="flex items-center justify-center lg:justify-start gap-2">
              <BookOpen className="w-7 h-7 text-primary group-hover:rotate-6 transition-transform" />
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight uppercase">
                Chronicle
              </h1>
            </div>
            <p className="text-[10px] sm:text-xs tracking-[0.25em] uppercase text-base-content/75 font-medium">
              The Biography & Profile Magazine
            </p>
          </Link>
        </div>

        {/* Search Bar (Desktop) */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center relative w-64 lg:w-80">
          <input
            type="text"
            placeholder="Search biographies, pioneers..."
            aria-label="Search biographies and pioneers"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered input-sm w-full pr-10 text-xs focus:input-primary rounded-full bg-base-200/60"
          />
          <button
            type="submit"
            className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-base-content/70 hover:text-primary transition-colors"
            aria-label="Submit search"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Right Action Icons: Theme Toggle & User Account Dropdown */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="btn btn-ghost btn-circle min-w-[44px] min-h-[44px] text-base-content flex items-center justify-center"
              title={`Switch to ${theme === 'luxury' ? 'Light' : 'Dark'} theme`}
              aria-label="Toggle Theme"
            >
              {theme === 'luxury' ? (
                <Sun className="w-5 h-5 text-warning" />
              ) : (
                <Moon className="w-5 h-5 text-primary" />
              )}
            </button>
          )}

          {/* User Account Controls */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="btn btn-sm sm:btn-md btn-ghost rounded-full gap-2 px-3 min-h-[44px] border border-base-300 hover:border-primary flex items-center"
                aria-label="User Account Menu"
                aria-expanded={userDropdownOpen}
              >
                <div className="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-semibold max-w-[100px] truncate hidden sm:inline">
                  {user?.name?.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-base-content/60" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-base-100 border border-base-300 rounded-2xl shadow-2xl py-2 z-50 text-xs animate-fadeIn"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-base-200">
                    <p className="font-bold text-sm text-base-content">{user?.name}</p>
                    <p className="text-[11px] text-base-content/60 font-mono truncate">{user?.email}</p>
                    <span className="badge badge-xs badge-primary mt-1 font-bold uppercase">
                      {user?.role || 'Reader'}
                    </span>
                  </div>

                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-base-200 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span>My Profile & Reading List</span>
                  </Link>

                  <div className="border-t border-base-200 mt-1 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        router.push('/');
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 hover:bg-base-200 transition-colors text-error w-full text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className="btn btn-sm btn-ghost rounded-full text-xs"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="btn btn-sm btn-primary rounded-full text-xs px-4 shadow-sm"
              >
                Join Free
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Category Navigation Bar */}
      <nav className="border-t border-base-300/80 hidden lg:block bg-base-100">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center space-x-1 py-1 overflow-x-auto text-xs font-semibold uppercase tracking-wider">
          {categories.map((cat) => {
            const currentCat = searchParams.get('category');
            const isActive = (!currentCat && cat === 'All') || currentCat === cat;
            const href = cat === 'All' ? '/' : `/?category=${encodeURIComponent(cat)}`;

            return (
              <Link
                key={cat}
                href={href}
                className={`px-4 py-2 rounded-md transition-colors duration-150 ${
                  isActive
                    ? 'bg-primary text-primary-content font-bold shadow-sm'
                    : 'hover:bg-base-200 text-base-content/80'
                }`}
              >
                {cat}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-base-300 bg-base-100 px-4 py-4 space-y-4 shadow-lg animate-fadeIn">
          {/* User status in mobile */}
          {isAuthenticated ? (
            <div className="p-3 bg-base-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-xs">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-base-content">{user?.name}</p>
                  <p className="text-[10px] text-base-content/60 font-mono">{user?.email}</p>
                </div>
              </div>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-sm min-h-[44px] px-4 btn-primary rounded-full flex items-center justify-center"
              >
                Profile
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-sm min-h-[44px] btn-outline rounded-xl text-xs flex items-center justify-center"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-sm min-h-[44px] btn-primary rounded-xl text-xs flex items-center justify-center"
              >
                Join Free
              </Link>
            </div>
          )}

          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              placeholder="Search biographies..."
              aria-label="Search biographies"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered input-md w-full pr-12 text-sm rounded-full bg-base-200/60"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-base-content/70 hover:text-primary"
              aria-label="Submit mobile search"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>

          {/* Mobile Category List */}
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-base-content/70 px-2 py-1">
              Categories
            </p>
            {categories.map((cat) => {
              const href = cat === 'All' ? '/' : `/?category=${encodeURIComponent(cat)}`;
              return (
                <Link
                  key={cat}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-3 rounded-lg text-sm font-medium hover:bg-base-200 min-h-[44px] flex items-center"
                >
                  {cat}
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-base-200 flex flex-col gap-2">
            {isAuthenticated && (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                  router.push('/');
                }}
                className="btn btn-md btn-ghost text-error w-full flex items-center justify-center gap-2 text-sm min-h-[44px]"
                aria-label="Sign out of account"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
