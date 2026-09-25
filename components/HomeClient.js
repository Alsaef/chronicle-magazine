'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Sparkles,
  Flame,
  ArrowRight,
  BookOpen,
  Filter,
  RefreshCw,
  Clock,
  Eye,
  Heart
} from 'lucide-react';
import { getStories, getCategories } from '../lib/api';
import StoryCard from './StoryCard';
import SafeImage from './SafeImage';

export default function HomeClient({
  initialStories = [],
  initialTrendingStories = [],
  initialCategories = []
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeCategory = searchParams.get('category') || 'All';
  const searchQuery = searchParams.get('search') || '';
  const sortParam = searchParams.get('sort') || '';

  const isInitialParams = !searchQuery && activeCategory === 'All' && !sortParam;

  const [stories, setStories] = useState(initialStories);
  const [featuredStory, setFeaturedStory] = useState(() => (
    initialStories.find((s) => s.featured) || initialStories[0] || null
  ));
  const [trendingStories, setTrendingStories] = useState(() => (
    initialTrendingStories.length > 0 ? initialTrendingStories : initialStories.slice(0, 3)
  ));
  const [categories, setCategories] = useState(initialCategories);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Track initial mount so we do not re-fetch when initial server data is already present
  const isFirstMount = useRef(true);

  useEffect(() => {
    // If it's the very first render and we already have server-rendered default data, skip client fetch
    if (isFirstMount.current && isInitialParams && initialStories.length > 0) {
      isFirstMount.current = false;
      return;
    }
    isFirstMount.current = false;

    let isCancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const storiesPromise = getStories({
          category: activeCategory !== 'All' ? activeCategory : undefined,
          search: searchQuery || undefined,
          sort: sortParam || undefined
        });

        const trendingPromise = (!searchQuery && activeCategory === 'All')
          ? (trendingStories.length > 0 ? Promise.resolve({ data: trendingStories }) : getStories({ sort: 'views', limit: 3 }).catch(() => ({ data: [] })))
          : Promise.resolve(null);

        const categoriesPromise = categories.length > 0
          ? Promise.resolve({ data: categories })
          : getCategories().catch(() => ({ data: [] }));

        const [storiesRes, trendingRes, catRes] = await Promise.all([
          storiesPromise,
          trendingPromise,
          categoriesPromise
        ]);

        if (isCancelled) return;

        const list = storiesRes?.data || [];
        setStories(list);

        const feat = list.find((s) => s.featured) || list[0] || null;
        setFeaturedStory(feat);

        if (trendingRes?.data?.length > 0) {
          setTrendingStories(trendingRes.data);
        } else if (list.length > 0 && trendingStories.length === 0) {
          setTrendingStories(list.slice(0, 3));
        }

        if (catRes?.data?.length > 0) {
          setCategories(catRes.data);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to load stories:', err);
          setError(err.message || 'Could not connect to the API server.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [activeCategory, searchQuery, sortParam]);

  const handleCategoryChange = (cat) => {
    if (cat === 'All') {
      router.push('/');
    } else {
      router.push(`/?category=${encodeURIComponent(cat)}`);
    }
  };

  const displayCategories = [
    'All',
    ...(categories.length > 0
      ? categories.filter((c) => (c.name || c) !== 'All').map((c) => c.name || c)
      : ['Tech Leaders', 'World Leaders', 'Pioneers', 'Athletes & Sports'])
  ];

  return (
    <div className="min-h-screen pb-20">
      {/* ------------------------------------------------------------- */}
      {/* 1. HERO BANNER: Featured Person of the Week                   */}
      {/* ------------------------------------------------------------- */}
      {!searchQuery && activeCategory === 'All' && (
        loading ? (
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
        ) : (
          featuredStory && (
            <section className="border-b border-base-300 bg-base-200/50 py-8 sm:py-10 lg:py-16 transition-colors">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left Column: Editorial Headline & Copy */}
                  <div className="lg:col-span-7 space-y-5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider w-fit">
                      <Sparkles className="w-3.5 h-3.5" /> Person of the Week • Exclusive Profile
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold tracking-tight leading-tight">
                      <Link
                        href={`/story/${featuredStory.slug || featuredStory._id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {featuredStory.title}
                      </Link>
                    </h1>

                    <p className="text-base sm:text-lg text-base-content/85 leading-relaxed drop-cap font-serif">
                      {featuredStory.summary}
                    </p>

                    {/* Meta details & CTA */}
                    <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-base-content/80">
                      <span className="badge badge-primary badge-outline h-auto min-h-[1.5rem] py-1 px-2.5 leading-snug whitespace-normal text-left font-semibold uppercase tracking-wider">
                        {featuredStory.category}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5" /> {featuredStory.readingTime || '6 min read'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> {(featuredStory.views || 0).toLocaleString()} Views
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-error fill-current" /> {(featuredStory.likes || 0).toLocaleString()} Likes
                      </span>
                    </div>

                    <div className="pt-3">
                      <Link
                        href={`/story/${featuredStory.slug || featuredStory._id}`}
                        className="btn btn-primary btn-md rounded-full px-8 shadow-lg hover:shadow-primary/30 transition-colors duration-200 gap-2 text-sm uppercase tracking-wider font-bold"
                        aria-label={`Read full biography of ${featuredStory.title}`}
                      >
                        <span>Read Full Biography</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Right Column: Hero Cover Image Frame with Next.js Image priority */}
                  <div className="lg:col-span-5">
                    <div className="relative group rounded-2xl overflow-hidden shadow-2xl border border-base-300 aspect-[16/10] sm:aspect-[4/3] lg:aspect-[4/5] w-full">
                      <Link
                        href={`/story/${featuredStory.slug || featuredStory._id}`}
                        className="block w-full h-full relative"
                        aria-label={`Read featured biography: ${featuredStory.title}`}
                      >
                        <SafeImage
                          src={featuredStory.coverImage}
                          alt={featuredStory.title}
                          fill
                          priority
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 480px"
                          className="object-cover transform-gpu group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-white z-10 pointer-events-none">
                          <span className="text-xs uppercase tracking-widest text-primary-content font-bold mb-1">
                            Featured Archival Portrait
                          </span>
                          <p className="text-sm font-serif italic text-slate-200 line-clamp-2">
                            "{featuredStory.summary.slice(0, 100)}..."
                          </p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )
        )
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. CATEGORY FILTER TABS & SEARCH INDICATOR                    */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-base-300 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
              <Filter className="w-3.5 h-3.5" /> Filter by Sphere of Impact
            </div>
            <h2 className="text-2xl font-display font-bold">
              {searchQuery ? `Search Results for "${searchQuery}"` : 'Curated Biographies'}
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {displayCategories.map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`btn btn-sm min-h-[44px] px-4 rounded-full transition-colors duration-200 text-xs uppercase tracking-wider ${
                    isSelected
                      ? 'btn-primary shadow'
                      : 'btn-ghost bg-base-200 hover:bg-base-300'
                  }`}
                >
                  {cat}
                </button>
              );
            })}

            {searchQuery && (
              <button
                onClick={() => router.push('/')}
                className="btn btn-sm min-h-[44px] px-4 btn-error btn-outline rounded-full text-xs transition-colors duration-200"
              >
                Clear Search ✕
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. TRENDING / TOP VIEWED PERSONALITIES                        */}
      {/* ------------------------------------------------------------- */}
      {!searchQuery && activeCategory === 'All' && (
        loading ? (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-accent animate-pulse" />
                <h2 className="text-xl font-display font-bold uppercase tracking-wider">
                  Trending Personalities
                </h2>
              </div>
              <span className="text-xs text-base-content/80 uppercase tracking-widest">
                Most Read This Month
              </span>
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
        ) : (
          trendingStories.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-accent animate-pulse" />
                  <h2 className="text-xl font-display font-bold uppercase tracking-wider">
                    Trending Personalities
                  </h2>
                </div>
                <span className="text-xs text-base-content/80 uppercase tracking-widest">
                  Most Read This Month
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {trendingStories.map((story, index) => (
                  <StoryCard
                    key={story._id || story.slug}
                    story={story}
                    rank={index + 1}
                  />
                ))}
              </div>
            </section>
          )
        )
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. MAIN BIOGRAPHIES GRID                                      */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-display font-bold uppercase tracking-wider">
              {searchQuery
                ? `Matching Biographies (${stories.length})`
                : activeCategory !== 'All'
                ? `${activeCategory} Profiles (${stories.length})`
                : 'All Published Life Stories'}
            </h2>
          </div>

          <div className="text-xs text-base-content/80 flex items-center gap-2">
            <label htmlFor="sort-stories-select" className="sr-only">
              Sort biographies
            </label>
            <span aria-hidden="true">Sort:</span>
            <select
              id="sort-stories-select"
              aria-label="Sort biographies by criteria"
              value={sortParam}
              onChange={(e) => {
                const val = e.target.value;
                const params = new URLSearchParams(searchParams.toString());
                if (val) params.set('sort', val);
                else params.delete('sort');
                router.push(`/?${params.toString()}`);
              }}
              className="select select-bordered select-sm min-h-[44px] rounded-full bg-base-200 text-xs"
            >
              <option value="">Latest Published</option>
              <option value="views">Most Viewed</option>
              <option value="likes">Most Liked</option>
            </select>
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading && (
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
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="alert alert-error shadow-lg my-8 max-w-xl mx-auto">
            <div>
              <h3 className="font-bold">Backend Connection Notice</h3>
              <p className="text-sm">{error}</p>
              <div className="mt-3">
                <button
                  onClick={() => window.location.reload()}
                  className="btn btn-sm btn-ghost border border-white text-white flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && stories.length === 0 && (
          <div className="text-center py-20 bg-base-200/50 rounded-2xl border border-base-300 max-w-md mx-auto my-8 p-8 space-y-4">
            <BookOpen className="w-12 h-12 text-base-content/40 mx-auto" />
            <h3 className="text-xl font-display font-bold">No Biographies Found</h3>
            <p className="text-sm text-base-content/80">
              {searchQuery
                ? `No profile matches "${searchQuery}". Try a different keyword.`
                : `No biographies currently filed under "${activeCategory}".`}
            </p>
            <button
              onClick={() => router.push('/')}
              className="btn btn-primary btn-sm rounded-full"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Stories Grid */}
        {!loading && !error && stories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stories.map((story) => (
              <StoryCard
                key={story._id || story.slug}
                story={story}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
