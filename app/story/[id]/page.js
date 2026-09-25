'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Heart,
  Eye,
  Clock,
  Calendar,
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Link2,
  MessageSquare,
  ArrowLeft,
  Sparkles,
  Milestone,
  Send,
  User,
  Check,
  Bookmark
} from 'lucide-react';
import { getStory, likeStory, getComments, postComment } from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import SafeImage from '../../../components/SafeImage';

export default function StoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const { user, token, isAuthenticated, toggleBookmark, isBookmarked, syncUserLike } = useAuth();
  const storyId = params.id;

  const [story, setStory] = useState(null);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Comment form state
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    async function loadStoryAndComments() {
      setLoading(true);
      setError(null);
      try {
        // Fetch story and comments concurrently to eliminate sequential waterfall
        const [storyRes, commentsRes] = await Promise.all([
          getStory(storyId),
          getComments(storyId).catch(() => ({ data: [] }))
        ]);

        if (!storyRes || !storyRes.data) {
          throw new Error('Biography not found.');
        }

        setStory(storyRes.data);
        setLikes(storyRes.data.likes || 0);
        setComments(commentsRes?.data || []);
      } catch (err) {
        console.error('Error loading story:', err);
        setError(err.message || 'Failed to load biography.');
      } finally {
        setLoading(false);
      }
    }

    if (storyId) {
      loadStoryAndComments();
    }
  }, [storyId]);

  // Synchronize liked state based on authenticated user
  useEffect(() => {
    if (user && story) {
      const likedList = user.likedStories || [];
      const isUserLiked =
        likedList.includes(story._id) ||
        (story.slug && likedList.includes(story.slug)) ||
        (story.likedBy && user.id && story.likedBy.includes(user.id));
      setHasLiked(Boolean(isUserLiked));
    } else {
      setHasLiked(false);
    }
  }, [user, story]);

  // Handle Like Button click
  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.warning('Please log in to your reader account to like this biography.');
      router.push(`/login?redirect=${encodeURIComponent(`/story/${storyId}`)}`);
      return;
    }

    try {
      const res = await likeStory(storyId, token);
      if (res && res.likes !== undefined) {
        setLikes(res.likes);
        setHasLiked(res.liked);
        syncUserLike(storyId, res.liked);
        if (res.liked) {
          toast.success(res.message || 'Appreciation recorded!');
        } else {
          toast.info(res.message || 'Like removed.');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update likes.');
    }
  };

  // Handle Social Share
  const handleShare = (platform) => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const title = story?.title || 'Inspiring Biography';

    let shareUrl = '';
    if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentUrl)}`;
    } else if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
    } else if (platform === 'linkedin') {
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(currentUrl);
      toast.success('Biography link copied to clipboard!');
      return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
    }
  };

  // Handle Comment Submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    const finalName = user ? user.name : commentName.trim();
    if (!finalName || !commentText.trim()) {
      toast.warning('Please provide your name and comment message.');
      return;
    }

    setSubmittingComment(true);
    try {
      const res = await postComment(storyId, {
        name: finalName,
        comment: commentText.trim(),
        userId: user?.id || null
      });

      if (res.data) {
        setComments((prev) => [res.data, ...prev]);
        setCommentText('');
        toast.success('Your comment has been published!');
      }
    } catch (err) {
      toast.error(err.message || 'Could not post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 space-y-6">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-14 w-full" />
        <div className="skeleton h-6 w-3/4" />
        <div className="skeleton h-[420px] w-full rounded-2xl" />
        <div className="space-y-3 pt-6">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="alert alert-error">
          <span>{error || 'Biography could not be found.'}</span>
        </div>
        <Link href="/" className="btn btn-primary btn-sm rounded-full">
          <ArrowLeft className="w-4 h-4 mr-1" /> Return to Chronicle Home
        </Link>
      </div>
    );
  }

  return (
    <article className="min-h-screen pb-24">
      {/* ------------------------------------------------------------- */}
      {/* 1. EDITORIAL HEADER & TITLE                                   */}
      {/* ------------------------------------------------------------- */}
      <header className="border-b border-base-300 bg-base-200/40 py-10 lg:py-14 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Breadcrumb / Back Link */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 min-h-[44px] py-2 text-xs font-bold uppercase tracking-wider text-base-content/85 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Biographies
            </Link>

            <span className="badge badge-primary h-auto min-h-[1.5rem] py-1 px-2.5 leading-snug whitespace-normal text-left font-bold text-xs uppercase tracking-widest">
              {story.category}
            </span>
          </div>

          {/* Headline Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold tracking-tight leading-tight mb-4">
            {story.title}
          </h1>

          {/* Standfirst / Summary */}
          <p className="text-lg sm:text-xl font-serif text-base-content/90 leading-relaxed italic mb-6">
            {story.summary}
          </p>

          {/* Author, Date & Reading Metas */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-base-300/70 text-xs text-base-content/85">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold font-serif">
                {story.author ? story.author[0] : 'C'}
              </div>
              <div>
                <p className="font-semibold text-base-content">{story.author || 'Chronicle Desk'}</p>
                <p className="text-[11px] text-base-content/75">
                  Published {story.createdAt ? new Date(story.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recently'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {story.readingTime || '6 min read'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> {(story.views || 0).toLocaleString()} Views
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-error fill-current" /> {likes.toLocaleString()} Likes
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. COVER IMAGE                                                */}
      {/* ------------------------------------------------------------- */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-8 mb-10">
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-base-300 relative aspect-[16/9] max-h-[520px]">
          <SafeImage
            src={story.coverImage}
            alt={story.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover object-center"
          />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-6 text-white text-xs z-10 pointer-events-none">
            <p className="font-serif italic opacity-90">
              Archival Photography • Chronicle Historical Repository
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. INTERACTIVE ACTION BAR (Likes + Social Shares)             */}
      {/* ------------------------------------------------------------- */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-10">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-base-200 border border-base-300 shadow-sm">
          {/* Like & Bookmark Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              className={`btn btn-sm sm:btn-md min-h-[44px] rounded-full gap-2 transition-transform active:scale-95 ${
                hasLiked ? 'btn-error text-white font-bold' : 'btn-outline btn-error'
              }`}
              title={`Like biography of ${story.title}`}
              aria-label={`Like biography of ${story.title}`}
            >
              <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
              <span>{hasLiked ? 'Liked' : 'Like Profile'}</span>
              <span className="badge badge-sm">{likes}</span>
            </button>

            <button
              onClick={() => toggleBookmark(story.slug || story._id)}
              className={`btn btn-sm sm:btn-md min-h-[44px] rounded-full gap-2 transition-transform active:scale-95 ${
                isBookmarked(story.slug || story._id)
                  ? 'btn-primary text-primary-content font-bold'
                  : 'btn-outline border-base-content/20'
              }`}
              title={isBookmarked(story.slug || story._id) ? 'Saved to reading list' : 'Save to reading list'}
              aria-label={isBookmarked(story.slug || story._id) ? `Remove ${story.title} from reading list` : `Save ${story.title} to reading list`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked(story.slug || story._id) ? 'fill-current' : ''}`} />
              <span>{isBookmarked(story.slug || story._id) ? 'Saved' : 'Save'}</span>
            </button>
          </div>

          {/* Social Share Buttons with 44x44px touch targets */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60 mr-2 flex items-center gap-1">
              <Share2 className="w-3.5 h-3.5" /> Share:
            </span>
            <button
              onClick={() => handleShare('twitter')}
              className="btn btn-ghost btn-circle min-w-[44px] min-h-[44px] hover:text-[#1DA1F2]"
              title="Share on X (Twitter)"
              aria-label="Share on X"
            >
              <Twitter className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleShare('linkedin')}
              className="btn btn-ghost btn-circle min-w-[44px] min-h-[44px] hover:text-[#0A66C2]"
              title="Share on LinkedIn"
              aria-label="Share on LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleShare('facebook')}
              className="btn btn-ghost btn-circle min-w-[44px] min-h-[44px] hover:text-[#1877F2]"
              title="Share on Facebook"
              aria-label="Share on Facebook"
            >
              <Facebook className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleShare('copy')}
              className="btn btn-ghost btn-circle min-w-[44px] min-h-[44px]"
              title="Copy Link"
              aria-label="Copy link"
            >
              <Link2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. BIOGRAPHY ARTICLE BODY                                     */}
      {/* ------------------------------------------------------------- */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="prose prose-lg dark:prose-invert font-serif leading-relaxed max-w-none">
          {story.content.split('\n\n').map((paragraph, index) => {
            if (paragraph.startsWith('### ')) {
              return (
                <h3 key={index} className="font-display text-2xl font-bold mt-8 mb-4">
                  {paragraph.replace('### ', '')}
                </h3>
              );
            }
            if (paragraph.startsWith('## ')) {
              return (
                <h2 key={index} className="font-display text-3xl font-bold mt-10 mb-4">
                  {paragraph.replace('## ', '')}
                </h2>
              );
            }
            return (
              <p
                key={index}
                className={`mb-6 text-base-content/85 text-lg leading-relaxed ${
                  index === 0 ? 'drop-cap' : ''
                }`}
              >
                {paragraph}
              </p>
            );
          })}
        </div>

        {/* ----------------------------------------------------------- */}
        {/* 5. LIFE TIMELINE / KEY MILESTONES                           */}
        {/* ----------------------------------------------------------- */}
        {story.milestones && story.milestones.length > 0 && (
          <section className="my-14 p-6 sm:p-8 rounded-2xl bg-base-200/60 border border-base-300">
            <div className="flex items-center gap-2 mb-8">
              <Milestone className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-display font-bold tracking-tight">
                Chronological Milestones
              </h2>
            </div>

            <ul className="timeline timeline-vertical timeline-snap-icon max-md:timeline-compact">
              {story.milestones.map((item, idx) => (
                <li key={idx}>
                  {idx > 0 && <hr className="bg-primary/40" />}
                  <div className="timeline-middle">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold shadow-md">
                      ✓
                    </span>
                  </div>
                  <div
                    className={`${
                      idx % 2 === 0 ? 'timeline-start md:text-end' : 'timeline-end'
                    } mb-8 p-4 rounded-xl bg-base-100 border border-base-300/80 shadow-sm`}
                  >
                    <time className="font-mono text-sm font-black text-accent block mb-1">
                      {item.year}
                    </time>
                    <p className="text-sm font-medium text-base-content/90 leading-normal">
                      {item.event}
                    </p>
                  </div>
                  {idx < story.milestones.length - 1 && <hr className="bg-primary/40" />}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ----------------------------------------------------------- */}
        {/* 6. AUTHOR SIGN-OFF CARD                                     */}
        {/* ----------------------------------------------------------- */}
        <div className="my-10 p-6 rounded-2xl bg-base-200 border border-base-300 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary text-primary-content flex items-center justify-center font-display text-2xl font-bold flex-shrink-0">
            {story.author ? story.author[0] : 'C'}
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">Written by {story.author || 'Chronicle Editorial Board'}</h3>
            <p className="text-xs text-base-content/70 mt-1 leading-relaxed">
              Curated by the biographical research unit at Chronicle Magazine. Dedicated to archiving history's greatest minds and game-changers.
            </p>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* 7. COMMENTS SECTION                                         */}
        {/* ----------------------------------------------------------- */}
        <section className="mt-16 pt-10 border-t border-base-300">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-display font-bold">
                Reader Dialogue ({comments.length})
              </h2>
            </div>
            <span className="text-xs text-base-content/60">
              Join the conversation
            </span>
          </div>

          {/* New Comment Submission Form */}
          <form onSubmit={handleCommentSubmit} className="mb-10 p-5 rounded-2xl bg-base-200/50 border border-base-300 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-base-content/70">
                Leave a Thought or Tribute
              </h3>
              {!user && (
                <span className="text-xs text-base-content/60">
                  Have an account?{' '}
                  <Link href="/login" className="text-primary font-semibold underline">
                    Sign in
                  </Link>
                </span>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-base-100 border border-base-300 text-xs">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-[10px]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-base-content/60">Commenting as </span>
                  <span className="font-bold text-base-content">{user.name}</span>
                  <span className="text-base-content/40 font-mono ml-1">({user.email})</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="comment-author-name" className="label text-xs font-semibold">Your Name</label>
                  <input
                    id="comment-author-name"
                    type="text"
                    placeholder="e.g. Eleanor Vance"
                    value={commentName}
                    onChange={(e) => setCommentName(e.target.value)}
                    className="input input-bordered min-h-[44px] w-full rounded-lg bg-base-100 text-sm"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="comment-body-text" className="label text-xs font-semibold">Comment Message</label>
              <textarea
                id="comment-body-text"
                rows={3}
                placeholder="Share your perspective on this life story..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="textarea textarea-bordered min-h-[88px] w-full rounded-lg text-sm bg-base-100"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submittingComment}
              className="btn btn-primary btn-md min-h-[44px] rounded-full px-6 gap-2"
              aria-label="Publish reader comment"
            >
              {submittingComment ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <span>Post Comment</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Existing Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-10 bg-base-200/30 rounded-xl border border-dashed border-base-300 text-base-content/60 text-sm">
                No comments yet. Be the first reader to reflect on this story!
              </div>
            ) : (
              comments.map((cmt) => (
                <div
                  key={cmt._id}
                  className="p-4 rounded-xl bg-base-100 border border-base-300 space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-sm text-base-content">{cmt.name}</span>
                    </div>
                    <time className="text-[11px] text-base-content/50">
                      {cmt.createdAt
                        ? new Date(cmt.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Just now'}
                    </time>
                  </div>
                  <p className="text-sm text-base-content/85 pl-9 leading-relaxed">
                    {cmt.comment}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </article>
  );
}

