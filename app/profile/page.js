'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Bookmark,
  BookOpen,
  Calendar,
  LogOut,
  Sparkles,
  ArrowRight,
  Shield,
  Clock,
  Heart,
  Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getUserBookmarks } from '../../lib/api';
import StoryCard from '../../components/StoryCard';

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, loading: authLoading, logout, isAdmin } = useAuth();

  const [bookmarks, setBookmarks] = useState([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    async function loadBookmarks() {
      if (!token) return;
      setLoadingBookmarks(true);
      try {
        const res = await getUserBookmarks(token);
        if (res && res.data) {
          setBookmarks(res.data);
        }
      } catch (err) {
        console.error('Failed to load bookmarks:', err);
      } finally {
        setLoadingBookmarks(false);
      }
    }

    if (token) {
      loadBookmarks();
    }
  }, [user, token, authLoading, router]);

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="loading loading-spinner loading-lg text-primary" />
        <p className="text-xs uppercase tracking-widest text-base-content/60 mt-4">
          Loading Reader Profile...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-base-200/30">
      {/* Editorial Profile Header */}
      <header className="border-b border-base-300 bg-base-100 py-10 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary text-primary-content flex items-center justify-center font-display font-black text-2xl sm:text-3xl shadow-lg flex-shrink-0">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight">
                  {user.name}
                </h1>
                {isAdmin ? (
                  <span className="badge badge-primary font-bold text-xs uppercase tracking-wider">
                    <Shield className="w-3 h-3 mr-1" /> Admin
                  </span>
                ) : (
                  <span className="badge badge-accent font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 mr-1" /> Reader Member
                  </span>
                )}
              </div>
              <p className="text-xs text-base-content/60 font-mono">{user.email}</p>
              <p className="text-xs text-base-content/50 flex items-center gap-1 pt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Member since{' '}
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    : '2026'}
                </span>
              </p>
              <div className="flex items-center gap-2 pt-2 text-xs">
                <span className="badge badge-sm badge-outline gap-1">
                  <Bookmark className="w-3 h-3 text-primary" /> {user.bookmarks?.length || 0} Saved
                </span>
                <span className="badge badge-sm badge-outline gap-1">
                  <Heart className="w-3 h-3 text-error" /> {user.likedStories?.length || 0} Liked
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="btn btn-sm min-h-[44px] px-4 btn-outline btn-error rounded-full text-xs gap-1.5 flex items-center"
              aria-label="Sign out of reader account"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Bookmarked / Saved Biographies Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-10">
        <div className="flex items-center justify-between border-b border-base-300 pb-4 mb-8">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-primary" />
            <h2 className="text-xl sm:text-2xl font-display font-bold">
              My Reading List ({bookmarks.length})
            </h2>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-wider text-primary hover:underline flex items-center gap-1"
          >
            <span>Explore More Biographies</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Loading Skeletons */}
        {loadingBookmarks && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card bg-base-100 border border-base-300 p-4 space-y-4">
                <div className="skeleton h-48 w-full rounded-xl" />
                <div className="skeleton h-4 w-28" />
                <div className="skeleton h-6 w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loadingBookmarks && bookmarks.length === 0 && (
          <div className="text-center py-16 bg-base-100 rounded-2xl border border-dashed border-base-300 max-w-md mx-auto p-8 space-y-4 shadow-sm">
            <Bookmark className="w-12 h-12 text-base-content/30 mx-auto" />
            <h3 className="text-lg font-display font-bold">Your Reading List is Empty</h3>
            <p className="text-xs text-base-content/70 leading-relaxed">
              When you find a biography you want to read or reflect upon later, click the "Bookmark" icon on the story page to save it here.
            </p>
            <Link href="/" className="btn btn-primary btn-sm rounded-full px-6">
              Browse Biographies
            </Link>
          </div>
        )}

        {/* Bookmarks Grid */}
        {!loadingBookmarks && bookmarks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {bookmarks.map((story) => (
              <StoryCard key={story._id || story.slug} story={story} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

