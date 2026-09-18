'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, getUserMe, toggleStoryBookmark } from '../lib/api';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Hydrate auth state on client mount
  useEffect(() => {
    async function initAuth() {
      try {
        const savedToken = localStorage.getItem('chronicle_user_token');
        const savedUser = localStorage.getItem('chronicle_user_data');

        if (savedToken) {
          setToken(savedToken);
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
          // Validate and fetch fresh profile from server
          const meRes = await getUserMe(savedToken).catch(() => null);
          if (meRes && meRes.user) {
            setUser(meRes.user);
            localStorage.setItem('chronicle_user_data', JSON.stringify(meRes.user));
            // If user is no longer an administrator, purge any remaining admin tokens
            if (meRes.user.role !== 'admin' && meRes.user.role !== 'superadmin') {
              localStorage.removeItem('chronicle_admin_token');
              localStorage.removeItem('chronicle_admin_user');
              document.cookie = 'chronicle_admin_token=; path=/; max-age=0; SameSite=Lax';
            }
          } else {
            // Token expired or invalid
            localStorage.removeItem('chronicle_user_token');
            localStorage.removeItem('chronicle_user_data');
            setUser(null);
            setToken(null);
          }
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  // Login handler
  const login = async (email, password) => {
    const res = await loginUser(email, password);
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('chronicle_user_token', res.token);
      localStorage.setItem('chronicle_user_data', JSON.stringify(res.user));

      // If user is admin, also set admin token for admin dashboard access
      if (res.user.role === 'admin' || res.user.role === 'superadmin') {
        localStorage.setItem('chronicle_admin_token', res.token);
        localStorage.setItem('chronicle_admin_user', JSON.stringify(res.user));
        document.cookie = `chronicle_admin_token=${res.token}; path=/; max-age=604800; SameSite=Lax`;
      }

      toast.success(`Welcome back, ${res.user.name}!`);
      return res;
    }
    throw new Error(res.error || 'Login failed.');
  };

  // Register handler
  const register = async ({ name, email, password }) => {
    const res = await registerUser({ name, email, password });
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('chronicle_user_token', res.token);
      localStorage.setItem('chronicle_user_data', JSON.stringify(res.user));
      toast.success(`Welcome to Chronicle, ${res.user.name}!`);
      return res;
    }
    throw new Error(res.error || 'Registration failed.');
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('chronicle_user_token');
    localStorage.removeItem('chronicle_user_data');
    localStorage.removeItem('chronicle_admin_token');
    localStorage.removeItem('chronicle_admin_user');
    document.cookie = 'chronicle_admin_token=; path=/; max-age=0; SameSite=Lax';
    setUser(null);
    setToken(null);
    toast.info('You have been signed out.');
  };

  // Bookmark toggle
  const toggleBookmark = useCallback(async (storyId) => {
    if (!token) {
      toast.warning('Please sign in to save stories to your reading list.');
      return false;
    }

    // Optimistic update
    const currentBookmarks = user?.bookmarks || [];
    const isCurrentlyBookmarked = currentBookmarks.includes(storyId);
    const updatedBookmarks = isCurrentlyBookmarked
      ? currentBookmarks.filter((id) => id !== storyId)
      : [...currentBookmarks, storyId];

    setUser((prev) => ({
      ...prev,
      bookmarks: updatedBookmarks
    }));

    try {
      const res = await toggleStoryBookmark(storyId, token);
      if (res && res.bookmarks) {
        setUser((prev) => ({
          ...prev,
          bookmarks: res.bookmarks
        }));
        localStorage.setItem(
          'chronicle_user_data',
          JSON.stringify({ ...user, bookmarks: res.bookmarks })
        );
        toast.success(res.message || 'Bookmark updated.');
        return res.bookmarked;
      }
    } catch (err) {
      // Revert on error
      setUser((prev) => ({
        ...prev,
        bookmarks: currentBookmarks
      }));
      toast.error('Failed to update bookmark.');
    }
    return !isCurrentlyBookmarked;
  }, [token, user, toast]);

  const isBookmarked = useCallback(
    (storyId) => {
      if (!user || !user.bookmarks) return false;
      return user.bookmarks.includes(storyId);
    },
    [user]
  );

  const syncUserLike = useCallback((storyId, isLiked) => {
    setUser((prev) => {
      if (!prev) return prev;
      const currentLikes = prev.likedStories || [];
      const updated = isLiked
        ? (currentLikes.includes(storyId) ? currentLikes : [...currentLikes, storyId])
        : currentLikes.filter((id) => id !== storyId);

      const updatedUser = { ...prev, likedStories: updated };
      try {
        localStorage.setItem('chronicle_user_data', JSON.stringify(updatedUser));
      } catch (e) {}
      return updatedUser;
    });
  }, []);

  const hasLiked = useCallback(
    (storyIdOrSlug) => {
      if (!user || !user.likedStories) return false;
      return user.likedStories.includes(storyIdOrSlug);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
        login,
        register,
        logout,
        toggleBookmark,
        isBookmarked,
        syncUserLike,
        hasLiked
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

