import React, { Suspense } from 'react';
import HomeClient from '../components/HomeClient';

export const revalidate = 60;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function fetchWithTimeout(url, options = {}, timeoutMs = 3500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(id);
  }
}

async function getInitialHomeData() {
  try {
    const [storiesRes, trendingRes, categoriesRes] = await Promise.all([
      fetchWithTimeout(`${API_BASE}/stories`, { next: { revalidate: 60 } }),
      fetchWithTimeout(`${API_BASE}/stories?sort=views&limit=3`, { next: { revalidate: 60 } }),
      fetchWithTimeout(`${API_BASE}/categories`, { next: { revalidate: 300 } }),
    ]);

    return {
      stories: storiesRes?.data || [],
      trendingStories: trendingRes?.data || [],
      categories: categoriesRes?.data || []
    };
  } catch {
    return {
      stories: [],
      trendingStories: [],
      categories: []
    };
  }
}

function HomeSkeleton() {
  return (
    <div className="min-h-screen pb-20">
      {/* Hero Skeleton with fixed layout metrics to eliminate CLS */}
      <section className="border-b border-base-300 bg-base-200/50 py-8 sm:py-10 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="skeleton h-6 w-48 rounded-full" />
              <div className="space-y-2">
                <div className="skeleton h-9 w-full rounded-lg" />
                <div className="skeleton h-9 w-3/4 rounded-lg" />
              </div>
              <div className="space-y-2 pt-1">
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-4/5 rounded" />
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="skeleton h-6 w-24 rounded-full" />
                <div className="skeleton h-5 w-20 rounded-full" />
                <div className="skeleton h-5 w-20 rounded-full" />
              </div>
              <div className="skeleton h-12 w-52 rounded-full mt-2" />
            </div>
            <div className="lg:col-span-5">
              <div className="skeleton rounded-2xl aspect-[16/10] sm:aspect-[4/3] lg:aspect-[4/5] w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Category Tabs Skeleton */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-base-300 pb-5">
          <div className="space-y-2">
            <div className="skeleton h-4 w-36" />
            <div className="skeleton h-8 w-56" />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-11 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </section>

      {/* Trending Skeleton */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex items-center justify-between mb-6">
          <div className="skeleton h-6 w-48" />
          <div className="skeleton h-4 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card bg-base-100 border border-base-300 p-4 space-y-4">
              <div className="skeleton h-56 w-full rounded-xl" />
              <div className="skeleton h-4 w-28" />
              <div className="skeleton h-6 w-full" />
            </div>
          ))}
        </div>
      </section>

      {/* Grid Skeleton */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="flex items-center justify-between mb-6">
          <div className="skeleton h-6 w-48" />
          <div className="skeleton h-6 w-28" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card bg-base-100 border border-base-300 p-4 space-y-4">
              <div className="skeleton h-52 w-full rounded-xl" />
              <div className="skeleton h-4 w-28" />
              <div className="skeleton h-6 w-full" />
              <div className="skeleton h-16 w-full" />
              <div className="skeleton h-8 w-1/3" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default async function HomePage() {
  const { stories, trendingStories, categories } = await getInitialHomeData();

  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeClient
        initialStories={stories}
        initialTrendingStories={trendingStories}
        initialCategories={categories}
      />
    </Suspense>
  );
}
