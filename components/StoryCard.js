'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Heart, Clock, ArrowUpRight, Sparkles } from 'lucide-react';
import { likeStory } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import SafeImage from './SafeImage';

export default function StoryCard({ story, featured = false, rank = null }) {
  const router = useRouter();
  const toast = useToast();
  const { user, token, isAuthenticated, syncUserLike } = useAuth();

  const [likes, setLikes] = useState(story.likes || 0);
  const [isLiked, setIsLiked] = useState(false);

  const storyHref = `/story/${story.slug || story._id}`;

  // Synchronize liked state based on authenticated user
  useEffect(() => {
    if (user && story) {
      const likedList = user.likedStories || [];
      const hasLikedThis =
        likedList.includes(story._id) ||
        (story.slug && likedList.includes(story.slug)) ||
        (story.likedBy && user.id && story.likedBy.includes(user.id));
      setIsLiked(Boolean(hasLikedThis));
    } else {
      setIsLiked(false);
    }
  }, [user, story]);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.warning('Please log in to your reader account to like biographies.');
      router.push(`/login?redirect=${encodeURIComponent(storyHref)}`);
      return;
    }

    const storyIdentifier = story.slug || story._id;
    try {
      const res = await likeStory(storyIdentifier, token);
      if (res && res.likes !== undefined) {
        setLikes(res.likes);
        setIsLiked(res.liked);
        if (syncUserLike) syncUserLike(story._id || story.slug, res.liked);
        if (res.liked) {
          toast.success(res.message || 'Appreciation sent!');
        } else {
          toast.info(res.message || 'Like removed.');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Could not record like.');
    }
  };

  return (
    <article
      className={`card bg-base-100 border border-base-300 shadow-sm hover:shadow-xl transition-[box-shadow,border-color] duration-300 group overflow-hidden flex flex-col justify-between ${
        featured ? 'md:col-span-2 md:grid md:grid-cols-12 md:gap-6' : ''
      }`}
    >
      {/* Thumbnail Container */}
      <div
        className={`relative overflow-hidden ${
          featured ? 'md:col-span-7 h-64 md:h-full min-h-[260px]' : 'h-56'
        }`}
      >
        <Link
          href={storyHref}
          className="block w-full h-full relative"
          aria-label={`Read biography: ${story.title}`}
        >
          <SafeImage
            src={story.coverImage || 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80'}
            alt={story.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 384px"
            className="object-cover object-center transform-gpu group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </Link>

        {/* Category & Featured Badges (auto-adjusts height when text spans 2+ lines) */}
        <div
          className={`absolute top-3 left-3 ${
            rank ? 'right-12' : 'right-3'
          } flex flex-wrap items-start gap-1.5`}
        >
          <span className="badge badge-primary h-auto min-h-[1.5rem] py-1 px-2.5 font-semibold text-xs leading-snug tracking-wider uppercase shadow-md whitespace-normal text-left">
            {story.category}
          </span>
          {story.featured && (
            <span className="badge badge-accent h-auto min-h-[1.5rem] py-1 px-2.5 font-semibold text-xs leading-snug tracking-wider uppercase shadow-md inline-flex items-center gap-1 whitespace-normal text-left">
              <Sparkles className="w-3 h-3 shrink-0" />
              <span>Featured</span>
            </span>
          )}
        </div>

        {/* Rank Badge if specified (for trending lists) */}
        {rank && (
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-base-100/90 backdrop-blur text-base-content font-black text-sm flex items-center justify-center shadow-lg border border-base-300">
            #{rank}
          </div>
        )}

        {/* Reading Time Pill */}
        <div className="absolute bottom-3 left-3 bg-base-900/80 backdrop-blur text-white text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{story.readingTime || '5 min read'}</span>
        </div>
      </div>

      {/* Card Body */}
      <div className={`card-body p-5 flex flex-col justify-between ${featured ? 'md:col-span-5 md:p-6' : ''}`}>
        <div className="space-y-2.5">
          {/* Metadata: Author & Date */}
          <div className="flex items-center gap-2 text-xs text-base-content/80">
            <span className="font-semibold text-base-content/90">{story.author || 'Chronicle Desk'}</span>
            <span>•</span>
            <span>
              {story.createdAt ? new Date(story.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
            </span>
          </div>

          {/* Title */}
          <h3 className={`font-display font-bold group-hover:text-primary transition-colors line-clamp-2 ${featured ? 'text-2xl md:text-3xl' : 'text-lg'}`}>
            <Link href={storyHref}>
              {story.title}
            </Link>
          </h3>

          {/* Summary */}
          <p className="text-sm text-base-content/85 line-clamp-3 leading-relaxed">
            {story.summary}
          </p>
        </div>

        {/* Card Footer: Views, Likes, Read link */}
        <div className="pt-4 mt-4 border-t border-base-200 flex items-center justify-between text-xs text-base-content/80">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1" title="Views">
              <Eye className="w-3.5 h-3.5" />
              <span>{(story.views || 0).toLocaleString()}</span>
            </span>

            <button
              onClick={handleLike}
              className={`min-h-[44px] min-w-[44px] -my-2.5 -ml-2 px-2.5 py-2 inline-flex items-center gap-1.5 rounded-lg transition-colors hover:text-error hover:bg-base-200/50 ${
                isLiked ? 'text-error font-bold' : ''
              }`}
              title={`Appreciate biography of ${story.title}`}
              aria-label={`Appreciate biography of ${story.title}`}
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current text-error' : ''}`} />
              <span>{likes.toLocaleString()}</span>
            </button>
          </div>

          <Link
            href={storyHref}
            className="min-h-[44px] -my-2.5 -mr-2 px-2.5 py-2 inline-flex items-center gap-1 font-semibold text-primary group-hover:translate-x-0.5 transition-transform transform-gpu"
            aria-label={`Read full biography of ${story.title}`}
          >
            <span>Read Story</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

