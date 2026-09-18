'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  BookOpen,
  Eye,
  Heart,
  MessageSquare,
  Plus,
  Edit2,
  Trash2,
  LogOut,
  Sparkles,
  ExternalLink,
  Search,
  CheckCircle,
  RefreshCw,
  X,
  Calendar,
  Layers,
  Users,
  UserCheck,
  UserX,
  UserPlus,
  FolderPlus,
  Tag
} from 'lucide-react';
import {
  getAdminMe,
  getAdminStats,
  getAdminStories,
  createStory,
  updateStory,
  deleteStory,
  getAdminComments,
  deleteComment,
  seedDatabase,
  getAdminUsers,
  makeUserAdmin,
  revokeUserAdmin,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';

export default function AdminDashboardPage() {
  const router = useRouter();
  const toast = useToast();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [token, setToken] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState('stories'); // 'stories' | 'comments' | 'categories' | 'users'

  // Dashboard Data
  const [stats, setStats] = useState({ totalStories: 0, totalViews: 0, totalLikes: 0, totalComments: 0, totalCategories: 0 });
  const [stories, setStories] = useState([]);
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [storySearch, setStorySearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [promoteEmail, setPromoteEmail] = useState('');
  const [promoting, setPromoting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal State for Story Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStoryId, setEditingStoryId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'Tech Leaders',
    coverImage: '',
    summary: '',
    author: 'Editorial Staff',
    readingTime: '5 min read',
    content: '',
    featured: false,
    milestones: []
  });
  const [isSaving, setIsSaving] = useState(false);

  // Milestone Row input helper
  const [newYear, setNewYear] = useState('');
  const [newEvent, setNewEvent] = useState('');

  // -------------------------------------------------------------
  // Verify Admin Auth against backend on mount
  // -------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    const verifyAccess = async () => {
      setCheckingAuth(true);
      const savedToken = localStorage.getItem('chronicle_admin_token');

      if (!savedToken) {
        if (isMounted) {
          setIsAuthorized(false);
          setCheckingAuth(false);
        }
        toast.warning('Please log in to access the admin dashboard.');
        router.replace('/admin/login');
        return;
      }

      try {
        const res = await getAdminMe(savedToken);
        if (res && res.admin && (res.admin.role === 'admin' || res.admin.role === 'superadmin')) {
          if (isMounted) {
            setToken(savedToken);
            setAdminUser(res.admin);
            setIsAuthorized(true);
            document.cookie = `chronicle_admin_token=${savedToken}; path=/; max-age=604800; SameSite=Lax`;
          }
          await fetchDashboardData(savedToken);
        } else {
          throw new Error('Administrative privileges required.');
        }
      } catch (err) {
        console.error('Admin authentication verification failed:', err);
        localStorage.removeItem('chronicle_admin_token');
        localStorage.removeItem('chronicle_admin_user');
        document.cookie = 'chronicle_admin_token=; path=/; max-age=0; SameSite=Lax';
        if (isMounted) {
          setIsAuthorized(false);
        }
        toast.error(err.message || 'Session expired or unauthorized. Please sign in as an admin.');
        router.replace('/admin/login');
      } finally {
        if (isMounted) {
          setCheckingAuth(false);
        }
      }
    };

    verifyAccess();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Load all dashboard stats, stories, comments, registered users, and categories
  const fetchDashboardData = async (authToken) => {
    setLoading(true);
    try {
      const [statsRes, storiesRes, commentsRes, usersRes, categoriesRes] = await Promise.all([
        getAdminStats(authToken),
        getAdminStories(authToken),
        getAdminComments(authToken),
        getAdminUsers(authToken),
        getCategories()
      ]);

      if (statsRes && statsRes.stats) setStats(statsRes.stats);
      if (storiesRes && storiesRes.data) setStories(storiesRes.data);
      if (commentsRes && commentsRes.data) setComments(commentsRes.data);
      if (usersRes && usersRes.data) setUsers(usersRes.data);
      if (categoriesRes && categoriesRes.data) setCategories(categoriesRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      if (err.message && (err.message.includes('Access denied') || err.message.includes('privileges') || err.message.includes('expired') || err.message.includes('token'))) {
        toast.error('Session expired or unauthorized.');
        handleLogout();
        return;
      }
      toast.error('Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  // Promote User to Admin
  const handlePromoteUser = async (email) => {
    try {
      const res = await makeUserAdmin({ email }, token);
      toast.success(res.message || 'User promoted to administrator!');
      setUsers((prev) =>
        prev.map((u) => (u.email === email ? { ...u, role: 'admin' } : u))
      );
    } catch (err) {
      toast.error(err.message || 'Failed to promote user to admin.');
    }
  };

  // Revoke Admin Privileges
  const handleRevokeUser = async (email) => {
    if (!window.confirm(`Are you sure you want to revoke administrator privileges from ${email}?`)) {
      return;
    }
    try {
      const res = await revokeUserAdmin({ email }, token);
      toast.success(res.message || 'Admin privileges revoked.');
      setUsers((prev) =>
        prev.map((u) => (u.email === email ? { ...u, role: 'reader' } : u))
      );

      // If the currently active admin on this device was the one revoked, remove token and cookie immediately
      const currentEmail = (adminUser?.email || adminUser?.username || '').toLowerCase();
      if (currentEmail && (currentEmail === email.toLowerCase() || email.toLowerCase().includes(currentEmail))) {
        localStorage.removeItem('chronicle_admin_token');
        localStorage.removeItem('chronicle_admin_user');
        document.cookie = 'chronicle_admin_token=; path=/; max-age=0; SameSite=Lax';
        setIsAuthorized(false);
        toast.warning('Your administrator privileges have been revoked.');
        router.replace('/admin/login');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to revoke admin privileges.');
    }
  };

  // Listen for admin revocation event dispatched by API client
  useEffect(() => {
    const onAdminRevoked = (e) => {
      localStorage.removeItem('chronicle_admin_token');
      localStorage.removeItem('chronicle_admin_user');
      document.cookie = 'chronicle_admin_token=; path=/; max-age=0; SameSite=Lax';
      setIsAuthorized(false);
      toast.error(e?.detail || 'Your administrator privileges have been revoked by super admin.');
      router.replace('/admin/login');
    };

    window.addEventListener('chronicle_admin_revoked', onAdminRevoked);
    return () => window.removeEventListener('chronicle_admin_revoked', onAdminRevoked);
  }, [router, toast]);

  // Periodic heartbeat & window focus check to promptly detect revocation
  useEffect(() => {
    if (!isAuthorized || !token) return;

    const checkRevocation = async () => {
      try {
        const res = await getAdminMe(token);
        if (!res || !res.admin || (res.admin.role !== 'admin' && res.admin.role !== 'superadmin')) {
          throw new Error('Administrative privileges revoked');
        }
      } catch (err) {
        localStorage.removeItem('chronicle_admin_token');
        localStorage.removeItem('chronicle_admin_user');
        document.cookie = 'chronicle_admin_token=; path=/; max-age=0; SameSite=Lax';
        setIsAuthorized(false);
        toast.error('Your administrator privileges have been revoked by super admin.');
        router.replace('/admin/login');
      }
    };

    const interval = setInterval(checkRevocation, 10000); // 10s heartbeat
    window.addEventListener('focus', checkRevocation);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkRevocation);
    };
  }, [isAuthorized, token, router, toast]);

  // Quick Promote by Email Submit
  const handlePromoteByEmail = async (e) => {
    e.preventDefault();
    if (!promoteEmail.trim() || !promoteEmail.includes('@')) {
      toast.warning('Please enter a valid user email address to promote.');
      return;
    }

    setPromoting(true);
    try {
      const res = await makeUserAdmin({ email: promoteEmail.trim() }, token);
      toast.success(res.message || 'User promoted to administrator!');
      setPromoteEmail('');
      fetchDashboardData(token);
    } catch (err) {
      toast.error(err.message || 'Could not find or promote user.');
    } finally {
      setPromoting(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('chronicle_admin_token');
    localStorage.removeItem('chronicle_admin_user');
    document.cookie = 'chronicle_admin_token=; path=/; max-age=0; SameSite=Lax';
    setIsAuthorized(false);
    toast.info('Logged out of admin dashboard.');
    router.replace('/admin/login');
  };

  // Reseed Database
  const handleReseed = async () => {
    if (!window.confirm('Reset database with initial biography profiles? Current modifications will be refreshed.')) {
      return;
    }
    try {
      await seedDatabase();
      toast.success('Database successfully reset and re-seeded!');
      fetchDashboardData(token);
    } catch (err) {
      toast.error('Failed to reseed database.');
    }
  };

  // Category Handlers
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.warning('Please provide a category name.');
      return;
    }
    setIsCreatingCategory(true);
    try {
      const res = await createCategory(
        {
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim()
        },
        token
      );
      toast.success(res.message || 'Category created successfully!');
      setNewCategoryName('');
      setNewCategoryDescription('');
      const catRes = await getCategories().catch(() => ({ data: [] }));
      if (catRes.data) setCategories(catRes.data);
    } catch (err) {
      toast.error(err.message || 'Failed to create category.');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    const confirmMsg = cat.count > 0
      ? `Warning: "${cat.name}" has ${cat.count} biographies categorized under it. Are you sure you want to delete this category?`
      : `Are you sure you want to delete category "${cat.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await deleteCategory(cat._id, token);
      toast.success(res.message || 'Category deleted successfully.');
      setCategories((prev) => prev.filter((c) => c._id !== cat._id));
    } catch (err) {
      toast.error(err.message || 'Failed to delete category.');
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingStoryId(null);
    setFormData({
      title: '',
      slug: '',
      category: categories.length > 0 ? categories[0].name : 'Tech Leaders',
      coverImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
      summary: '',
      author: 'Editorial Staff',
      readingTime: '5 min read',
      content: '',
      featured: false,
      milestones: [
        { year: '1970', event: 'Early childhood and education.' },
        { year: '1995', event: 'Key historical breakthrough or founding.' }
      ]
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (story) => {
    setEditingStoryId(story._id);
    setFormData({
      title: story.title || '',
      slug: story.slug || '',
      category: story.category || 'Tech Leaders',
      coverImage: story.coverImage || '',
      summary: story.summary || '',
      author: story.author || 'Editorial Staff',
      readingTime: story.readingTime || '5 min read',
      content: story.content || '',
      featured: Boolean(story.featured),
      milestones: story.milestones || []
    });
    setIsModalOpen(true);
  };

  // Delete Story
  const handleDeleteStory = async (story) => {
    if (!window.confirm(`Are you sure you want to delete biography "${story.title}"?`)) {
      return;
    }

    try {
      await deleteStory(story._id, token);
      toast.success('Biography deleted successfully.');
      setStories((prev) => prev.filter((s) => s._id !== story._id));
      // Update stats locally
      setStats((prev) => ({
        ...prev,
        totalStories: Math.max(0, prev.totalStories - 1)
      }));
    } catch (err) {
      toast.error(err.message || 'Failed to delete story.');
    }
  };

  // Delete Comment (Moderation)
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment from publication?')) {
      return;
    }

    try {
      await deleteComment(commentId, token);
      toast.success('Comment deleted.');
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setStats((prev) => ({
        ...prev,
        totalComments: Math.max(0, prev.totalComments - 1)
      }));
    } catch (err) {
      toast.error('Failed to delete comment.');
    }
  };

  // Add Milestone Row
  const handleAddMilestone = () => {
    if (!newYear.trim() || !newEvent.trim()) {
      toast.warning('Please enter both year and milestone description.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      milestones: [...prev.milestones, { year: newYear.trim(), event: newEvent.trim() }]
    }));
    setNewYear('');
    setNewEvent('');
  };

  // Remove Milestone Row
  const handleRemoveMilestone = (index) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  // Handle Form Submit (Create or Update)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.warning('Title and content are required.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingStoryId) {
        // Update
        const res = await updateStory(editingStoryId, formData, token);
        toast.success('Biography updated successfully!');
      } else {
        // Create
        const res = await createStory(formData, token);
        toast.success('Biography created successfully!');
      }
      setIsModalOpen(false);
      fetchDashboardData(token);
    } catch (err) {
      toast.error(err.message || 'Operation failed.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter stories by search
  const filteredStories = stories.filter((s) =>
    s.title.toLowerCase().includes(storySearch.toLowerCase()) ||
    s.category.toLowerCase().includes(storySearch.toLowerCase())
  );

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-base-200/50 flex flex-col items-center justify-center p-4">
        <div className="card w-full max-w-sm bg-base-100 border border-base-300 shadow-xl p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
            <Shield className="w-7 h-7 animate-pulse text-primary" />
          </div>
          <div>
            <h2 className="font-display font-black text-lg">Verifying Access</h2>
            <p className="text-xs text-base-content/60 mt-1">Checking administrative credentials...</p>
          </div>
          <span className="loading loading-bars loading-md text-primary mx-auto"></span>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-base-200/50 flex flex-col items-center justify-center p-4">
        <div className="card w-full max-w-sm bg-base-100 border border-error/30 shadow-xl p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-error/10 text-error flex items-center justify-center mx-auto shadow-inner">
            <Shield className="w-7 h-7 text-error" />
          </div>
          <div>
            <h2 className="font-display font-black text-lg text-error">Access Restricted</h2>
            <p className="text-xs text-base-content/70 mt-1">
              Administrative privileges are required to view the editorial console. Redirecting...
            </p>
          </div>
          <span className="loading loading-spinner loading-sm text-error mx-auto"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200/40 pb-24">
      {/* Top Header */}
      <header className="bg-base-100 border-b border-base-300 py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-content flex items-center justify-center font-bold shadow">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-display font-black tracking-tight">
                Chronicle Editorial Console
              </h1>
              <p className="text-xs text-base-content/60">
                Logged in as <span className="font-bold text-base-content">{adminUser?.username || 'admin'}</span> (Super Administrator)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReseed}
              className="btn btn-sm btn-ghost border border-base-300 text-xs gap-1.5"
              title="Reset initial biographies"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset / Seed Data</span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="btn btn-sm btn-ghost border border-base-300 text-xs gap-1.5"
            >
              <span>View Magazine</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handleLogout}
              className="btn btn-sm btn-error btn-outline text-xs gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 space-y-8">
        {/* ------------------------------------------------------------- */}
        {/* 1. DASHBOARD OVERVIEW STATS                                   */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat bg-base-100 rounded-2xl border border-base-300 shadow-sm p-5">
            <div className="stat-figure text-primary">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="stat-title text-xs font-bold uppercase tracking-wider">Total Biographies</div>
            <div className="stat-value text-2xl sm:text-3xl text-primary font-display font-black">
              {stats.totalStories || stories.length}
            </div>
            <div className="stat-desc text-xs mt-1">Archived life profiles</div>
          </div>

          <div className="stat bg-base-100 rounded-2xl border border-base-300 shadow-sm p-5">
            <div className="stat-figure text-info">
              <Eye className="w-8 h-8" />
            </div>
            <div className="stat-title text-xs font-bold uppercase tracking-wider">Total Impressions</div>
            <div className="stat-value text-2xl sm:text-3xl text-info font-display font-black">
              {(stats.totalViews || 0).toLocaleString()}
            </div>
            <div className="stat-desc text-xs mt-1">Article readers tracked</div>
          </div>

          <div className="stat bg-base-100 rounded-2xl border border-base-300 shadow-sm p-5">
            <div className="stat-figure text-error">
              <Heart className="w-8 h-8" />
            </div>
            <div className="stat-title text-xs font-bold uppercase tracking-wider">Total Likes</div>
            <div className="stat-value text-2xl sm:text-3xl text-error font-display font-black">
              {(stats.totalLikes || 0).toLocaleString()}
            </div>
            <div className="stat-desc text-xs mt-1">Reader appreciations</div>
          </div>

          <div className="stat bg-base-100 rounded-2xl border border-base-300 shadow-sm p-5">
            <div className="stat-figure text-accent">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div className="stat-title text-xs font-bold uppercase tracking-wider">Reader Comments</div>
            <div className="stat-value text-2xl sm:text-3xl text-accent font-display font-black">
              {stats.totalComments || comments.length}
            </div>
            <div className="stat-desc text-xs mt-1">Engaged discussions</div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 2. TAB CONTROLS (Biographies vs Comments Moderation)          */}
        {/* ------------------------------------------------------------- */}
        <div className="flex items-center justify-between border-b border-base-300 pb-3">
          <div className="tabs tabs-boxed bg-base-100 p-1 border border-base-300">
            <button
              onClick={() => setActiveTab('stories')}
              className={`tab text-xs font-bold uppercase tracking-wider ${
                activeTab === 'stories' ? 'tab-active' : ''
              }`}
            >
              Biography Profiles ({stories.length})
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`tab text-xs font-bold uppercase tracking-wider ${
                activeTab === 'comments' ? 'tab-active' : ''
              }`}
            >
              Comment Moderation ({comments.length})
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`tab text-xs font-bold uppercase tracking-wider ${
                activeTab === 'categories' ? 'tab-active' : ''
              }`}
            >
              Categories ({categories.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`tab text-xs font-bold uppercase tracking-wider ${
                activeTab === 'users' ? 'tab-active' : ''
              }`}
            >
              User & Admin Directory ({users.length})
            </button>
          </div>

          {activeTab === 'stories' && (
            <button
              onClick={handleOpenCreate}
              className="btn btn-primary btn-sm rounded-full gap-1.5 text-xs uppercase tracking-wider font-bold shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Create Biography</span>
            </button>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB A: STORIES MANAGEMENT TABLE                               */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'stories' && (
          <div className="space-y-4">
            {/* Search filter for stories */}
            <div className="flex items-center justify-between">
              <div className="relative w-72">
                <input
                  type="text"
                  placeholder="Filter by name or category..."
                  value={storySearch}
                  onChange={(e) => setStorySearch(e.target.value)}
                  className="input input-bordered input-sm w-full pl-9 text-xs rounded-full bg-base-100"
                />
                <Search className="w-4 h-4 text-base-content/40 absolute left-3 top-2.5" />
              </div>
              <span className="text-xs text-base-content/60">
                Showing {filteredStories.length} of {stories.length} stories
              </span>
            </div>

            <div className="overflow-x-auto bg-base-100 rounded-2xl border border-base-300 shadow-sm">
              <table className="table table-zebra w-full text-xs">
                <thead>
                  <tr className="bg-base-200/70 uppercase text-[11px] font-bold text-base-content/70">
                    <th>Profile</th>
                    <th>Category</th>
                    <th>Featured</th>
                    <th>Views</th>
                    <th>Likes</th>
                    <th>Published</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStories.map((story) => (
                    <tr key={story._id} className="hover">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar">
                            <div className="mask mask-squircle w-12 h-12">
                              <img src={story.coverImage} alt={story.title} />
                            </div>
                          </div>
                          <div>
                            <div className="font-bold text-sm text-base-content hover:text-primary transition-colors">
                              <Link href={`/story/${story.slug || story._id}`} target="_blank">
                                {story.title}
                              </Link>
                            </div>
                            <div className="text-[11px] text-base-content/50 font-mono">
                              /{story.slug} • By {story.author || 'Editorial Staff'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-sm badge-outline font-semibold">
                          {story.category}
                        </span>
                      </td>
                      <td>
                        {story.featured ? (
                          <span className="badge badge-sm badge-accent gap-1 font-bold">
                            <Sparkles className="w-2.5 h-2.5" /> Yes
                          </span>
                        ) : (
                          <span className="text-base-content/40">No</span>
                        )}
                      </td>
                      <td className="font-mono font-semibold">
                        {(story.views || 0).toLocaleString()}
                      </td>
                      <td className="font-mono font-semibold text-error">
                        {(story.likes || 0).toLocaleString()}
                      </td>
                      <td>
                        {story.createdAt
                          ? new Date(story.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'N/A'}
                      </td>
                      <td className="text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(story)}
                          className="btn btn-ghost btn-xs btn-circle text-info"
                          title="Edit biography"
                          aria-label="Edit biography"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStory(story)}
                          className="btn btn-ghost btn-xs btn-circle text-error"
                          title="Delete biography"
                          aria-label="Delete biography"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredStories.length === 0 && (
                <div className="text-center py-12 text-base-content/60">
                  No biographies found matching your search.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB B: COMMENTS MODERATION TABLE                              */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'comments' && (
          <div className="overflow-x-auto bg-base-100 rounded-2xl border border-base-300 shadow-sm">
            <table className="table table-zebra w-full text-xs">
              <thead>
                <tr className="bg-base-200/70 uppercase text-[11px] font-bold text-base-content/70">
                  <th>Reader Name</th>
                  <th>Comment Message</th>
                  <th>Profile Subject</th>
                  <th>Date</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {comments.map((cmt) => (
                  <tr key={cmt._id} className="hover">
                    <td className="font-bold text-sm whitespace-nowrap">{cmt.name}</td>
                    <td className="max-w-md">
                      <p className="line-clamp-2 text-base-content/80 leading-relaxed">
                        {cmt.comment}
                      </p>
                    </td>
                    <td>
                      <span className="badge badge-ghost badge-sm max-w-xs truncate">
                        {cmt.storyTitle || cmt.storyId}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-base-content/60">
                      {cmt.createdAt
                        ? new Date(cmt.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Recent'}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleDeleteComment(cmt._id)}
                        className="btn btn-ghost btn-xs text-error gap-1"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {comments.length === 0 && (
              <div className="text-center py-12 text-base-content/60">
                No user comments found across published biographies.
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB C: USER & ADMIN DIRECTORY                                 */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Quick Action Banner: Promote User by Email */}
            <div className="p-5 rounded-2xl bg-base-100 border border-base-300 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                  <UserPlus className="w-4 h-4" />
                  <span>Grant Admin Access</span>
                </div>
                <h3 className="font-display font-bold text-lg">Promote Any User to Administrator</h3>
                <p className="text-xs text-base-content/70">
                  Enter any registered reader's email address to instantly confer full editorial and management privileges.
                </p>
              </div>

              <form onSubmit={handlePromoteByEmail} className="flex items-center gap-2 max-w-md w-full">
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={promoteEmail}
                  onChange={(e) => setPromoteEmail(e.target.value)}
                  className="input input-bordered input-sm flex-1 rounded-full text-xs bg-base-200"
                  required
                />
                <button
                  type="submit"
                  disabled={promoting}
                  className="btn btn-primary btn-sm rounded-full px-5 text-xs font-bold uppercase tracking-wider"
                >
                  {promoting ? 'Promoting...' : 'Make Admin'}
                </button>
              </form>
            </div>

            {/* Users Directory Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative w-72">
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="input input-bordered input-sm w-full pl-9 text-xs rounded-full bg-base-100"
                  />
                  <Search className="w-4 h-4 text-base-content/40 absolute left-3 top-2.5" />
                </div>
                <span className="text-xs text-base-content/60">
                  Total Users: {users.length}
                </span>
              </div>

              <div className="overflow-x-auto bg-base-100 rounded-2xl border border-base-300 shadow-sm">
                <table className="table table-zebra w-full text-xs">
                  <thead>
                    <tr className="bg-base-200/70 uppercase text-[11px] font-bold text-base-content/70">
                      <th>User</th>
                      <th>Email</th>
                      <th>Current Role</th>
                      <th>Registered</th>
                      <th className="text-right">Administrative Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(
                        (u) =>
                          u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.email?.toLowerCase().includes(userSearch.toLowerCase())
                      )
                      .map((u) => {
                        const isUserAdmin = u.role === 'admin' || u.role === 'superadmin';
                        const isSelf = adminUser?.username === u.email || adminUser?.id === u._id;

                        return (
                          <tr key={u._id} className="hover">
                            <td>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-xs">
                                  {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <span className="font-bold text-sm text-base-content">{u.name}</span>
                              </div>
                            </td>
                            <td className="font-mono text-xs text-base-content/80">{u.email}</td>
                            <td>
                              {isUserAdmin ? (
                                <span className="badge badge-primary badge-sm font-bold gap-1 uppercase tracking-wider">
                                  <Shield className="w-2.5 h-2.5" /> Administrator
                                </span>
                              ) : (
                                <span className="badge badge-ghost badge-sm text-base-content/60 uppercase tracking-wider">
                                  Reader
                                </span>
                              )}
                            </td>
                            <td className="text-base-content/60">
                              {u.createdAt
                                ? new Date(u.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })
                                : 'Recent'}
                            </td>
                            <td className="text-right whitespace-nowrap">
                              {isSelf ? (
                                <span className="text-[11px] text-base-content/40 italic">Current Session</span>
                              ) : isUserAdmin ? (
                                <button
                                  onClick={() => handleRevokeUser(u.email)}
                                  className="btn btn-outline btn-error btn-xs rounded-lg gap-1"
                                  title="Revoke admin access"
                                >
                                  <UserX className="w-3 h-3" />
                                  <span>Revoke Admin</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handlePromoteUser(u.email)}
                                  className="btn btn-outline btn-primary btn-xs rounded-lg gap-1 font-bold"
                                  title="Promote to administrator"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  <span>Make Admin</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>

                {users.length === 0 && (
                  <div className="text-center py-12 text-base-content/60">
                    No registered user accounts found in directory.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB D: DYNAMIC CATEGORY MANAGEMENT                            */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Create New Category Form */}
              <div className="lg:col-span-1">
                <div className="bg-base-100 rounded-2xl border border-base-300 p-6 shadow-sm sticky top-24">
                  <div className="flex items-center gap-2 mb-2">
                    <FolderPlus className="w-5 h-5 text-primary" />
                    <h3 className="font-display font-bold text-base">Add New Category</h3>
                  </div>
                  <p className="text-xs text-base-content/70 mb-5 leading-relaxed">
                    Create dynamic categories to organize biographies across the site, navigation bar, and homepage filters.
                  </p>

                  <form onSubmit={handleCreateCategory} className="space-y-4">
                    <div>
                      <label className="label text-xs font-bold uppercase tracking-wider">Category Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Space Explorers"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="input input-bordered input-sm w-full rounded-lg text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="label text-xs font-bold uppercase tracking-wider">Description (Optional)</label>
                      <textarea
                        placeholder="Brief overview of the personas in this category..."
                        value={newCategoryDescription}
                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                        className="textarea textarea-bordered textarea-sm w-full rounded-lg text-xs h-24"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isCreatingCategory || !newCategoryName.trim()}
                      className="btn btn-primary btn-sm w-full rounded-lg font-bold gap-2 text-xs uppercase tracking-wider"
                    >
                      {isCreatingCategory ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          <span>Publishing...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Publish Category</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Existing Categories Table */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-base-300 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display font-bold text-base flex items-center gap-2">
                        <Tag className="w-4 h-4 text-primary" />
                        <span>Active Categories ({categories.length})</span>
                      </h3>
                      <p className="text-xs text-base-content/60">
                        Categories are dynamically synchronized across the website.
                      </p>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <input
                        type="text"
                        placeholder="Filter categories..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="input input-bordered input-sm w-full pr-8 text-xs rounded-lg"
                      />
                      <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-base-content/50" />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="table table-sm w-full">
                      <thead className="bg-base-200/60 text-xs uppercase tracking-wider">
                        <tr>
                          <th>Category</th>
                          <th>URL Slug</th>
                          <th>Biographies</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-base-200 text-xs">
                        {categories
                          .filter((c) => {
                            if (!categorySearch.trim()) return true;
                            const q = categorySearch.toLowerCase();
                            return (
                              c.name?.toLowerCase().includes(q) ||
                              c.slug?.toLowerCase().includes(q) ||
                              c.description?.toLowerCase().includes(q)
                            );
                          })
                          .map((cat) => (
                            <tr key={cat._id || cat.slug} className="hover:bg-base-200/40">
                              <td className="py-3">
                                <div>
                                  <span className="font-bold text-sm text-base-content block">
                                    {cat.name}
                                  </span>
                                  {cat.description && (
                                    <span className="text-[11px] text-base-content/60 line-clamp-1 mt-0.5">
                                      {cat.description}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <code className="badge badge-sm badge-ghost font-mono text-[11px]">
                                  {cat.slug}
                                </code>
                              </td>
                              <td>
                                <span
                                  className={`badge badge-sm font-semibold ${
                                    cat.count > 0
                                      ? 'badge-primary'
                                      : 'badge-ghost text-base-content/60'
                                  }`}
                                >
                                  {cat.count || 0} {cat.count === 1 ? 'profile' : 'profiles'}
                                </span>
                              </td>
                              <td className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Link
                                    href={`/?category=${encodeURIComponent(cat.name)}`}
                                    target="_blank"
                                    className="btn btn-ghost btn-xs btn-square"
                                    title="View category page in new tab"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 text-base-content/70" />
                                  </Link>
                                  <button
                                    onClick={() => handleDeleteCategory(cat)}
                                    className="btn btn-ghost btn-xs btn-square text-error hover:bg-error/10"
                                    title="Delete category"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>

                    {categories.length === 0 && (
                      <div className="text-center py-12 text-base-content/60">
                        No categories found. Use the form on the left to add a category.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------- */}
      {/* 3. MODAL: CREATE / EDIT BIOGRAPHY                             */}
      {/* ------------------------------------------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-base-100 border border-base-300 rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-base-200 px-6 py-4 border-b border-base-300 flex items-center justify-between">
              <h2 className="text-lg font-display font-bold">
                {editingStoryId ? 'Edit Biography Profile' : 'Publish New Biography'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn btn-ghost btn-xs btn-circle"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="label text-xs font-bold uppercase">Biography Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        title: val,
                        // Auto-generate slug if new story
                        slug: !editingStoryId
                          ? val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                          : prev.slug
                      }));
                    }}
                    placeholder="e.g. Steve Jobs: The Visionary..."
                    className="input input-bordered input-sm w-full rounded-lg"
                    required
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="label text-xs font-bold uppercase">URL Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g. steve-jobs"
                    className="input input-bordered input-sm w-full rounded-lg font-mono text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category */}
                <div>
                  <label className="label text-xs font-bold uppercase">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="select select-bordered select-sm w-full rounded-lg text-xs"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat._id || cat.slug || cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                    {categories.length === 0 && (
                      <>
                        <option value="Tech Leaders">Tech Leaders</option>
                        <option value="World Leaders">World Leaders</option>
                        <option value="Pioneers">Pioneers</option>
                        <option value="Athletes & Sports">Athletes & Sports</option>
                        <option value="Innovators">Innovators</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Reading Time */}
                <div>
                  <label className="label text-xs font-bold uppercase">Estimated Reading Time</label>
                  <input
                    type="text"
                    value={formData.readingTime}
                    onChange={(e) => setFormData({ ...formData, readingTime: e.target.value })}
                    placeholder="e.g. 6 min read"
                    className="input input-bordered input-sm w-full rounded-lg text-xs"
                  />
                </div>

                {/* Featured Switch */}
                <div className="flex flex-col justify-center">
                  <label className="label text-xs font-bold uppercase">Featured Profile</label>
                  <label className="cursor-pointer label justify-start gap-3">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="checkbox checkbox-primary checkbox-sm"
                    />
                    <span className="label-text text-xs">Feature on Homepage Banner</span>
                  </label>
                </div>
              </div>

              {/* Author & Cover Image URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs font-bold uppercase">Author / Byline</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="e.g. Editorial Staff, Jane Doe..."
                    className="input input-bordered input-sm w-full rounded-lg text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="label text-xs font-bold uppercase">Cover Image URL</label>
                  <input
                    type="url"
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="input input-bordered input-sm w-full rounded-lg text-xs font-mono"
                    required
                  />
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="label text-xs font-bold uppercase">Editorial Standfirst / Summary</label>
                <textarea
                  rows={2}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Brief 1-2 sentence lead highlighting the person's historical legacy..."
                  className="textarea textarea-bordered w-full rounded-lg text-xs"
                  required
                />
              </div>

              {/* Content */}
              <div>
                <label className="label text-xs font-bold uppercase">Full Biography Content (Markdown style supported)</label>
                <textarea
                  rows={8}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write the full biography. Use ## or ### for subheadings..."
                  className="textarea textarea-bordered w-full rounded-lg text-xs font-mono leading-relaxed"
                  required
                />
              </div>

              {/* Milestones Editor */}
              <div className="p-4 rounded-xl bg-base-200 border border-base-300 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>Chronological Milestones ({formData.milestones.length})</span>
                  </label>
                </div>

                {/* Existing Milestones List */}
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {formData.milestones.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-base-100 border border-base-300 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-accent">{m.year}</span>
                        <span>{m.event}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(idx)}
                        className="btn btn-ghost btn-xs text-error btn-circle"
                        aria-label="Remove milestone"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Milestone */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Year (e.g. 1984)"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    className="input input-bordered input-xs w-28 rounded-md font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Milestone description..."
                    value={newEvent}
                    onChange={(e) => setNewEvent(e.target.value)}
                    className="input input-bordered input-xs flex-1 rounded-md"
                  />
                  <button
                    type="button"
                    onClick={handleAddMilestone}
                    className="btn btn-primary btn-xs rounded-md"
                  >
                    Add Row
                  </button>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-base-300 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost btn-sm text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary btn-sm px-6 rounded-lg text-xs uppercase tracking-wider font-bold"
                >
                  {isSaving ? 'Saving...' : editingStoryId ? 'Save Changes' : 'Publish Biography'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

