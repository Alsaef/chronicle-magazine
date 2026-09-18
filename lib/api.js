// Client-side API service for Chronicle Magazine

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // If admin privileges have been revoked or denied, immediately remove chronicle_admin_token
    if (res.status === 403 && (data.revoked || (data.error && data.error.toLowerCase().includes('revok')))) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('chronicle_admin_token');
        localStorage.removeItem('chronicle_admin_user');
        document.cookie = 'chronicle_admin_token=; path=/; max-age=0; SameSite=Lax';
        window.dispatchEvent(new CustomEvent('chronicle_admin_revoked', { detail: data.error }));
      }
    }
    const errorMsg = data.error || `HTTP error! Status: ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.revoked = data.revoked;
    throw err;
  }
  return data;
}

// -------------------------------------------------------------
// Reader / Public APIs
// -------------------------------------------------------------

export async function getStories({ category, featured, sort, search, limit } = {}) {
  const params = new URLSearchParams();
  if (category && category !== 'All') params.append('category', category);
  if (featured) params.append('featured', 'true');
  if (sort) params.append('sort', sort);
  if (search) params.append('search', search);
  if (limit) params.append('limit', limit);

  const res = await fetch(`${API_BASE}/stories?${params.toString()}`, {
    cache: 'no-store'
  });
  return handleResponse(res);
}

export async function getCategories() {
  const res = await fetch(`${API_BASE}/categories`, { cache: 'no-store' });
  return handleResponse(res);
}

export async function getStory(idOrSlug) {
  const res = await fetch(`${API_BASE}/stories/${encodeURIComponent(idOrSlug)}`, {
    cache: 'no-store'
  });
  return handleResponse(res);
}

export async function likeStory(idOrSlug, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}/stories/${encodeURIComponent(idOrSlug)}/like`, {
    method: 'POST',
    headers
  });
  return handleResponse(res);
}

export async function getComments(idOrSlug) {
  const res = await fetch(`${API_BASE}/stories/${encodeURIComponent(idOrSlug)}/comments`, {
    cache: 'no-store'
  });
  return handleResponse(res);
}

export async function postComment(idOrSlug, { name, comment }) {
  const res = await fetch(`${API_BASE}/stories/${encodeURIComponent(idOrSlug)}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, comment })
  });
  return handleResponse(res);
}

// -------------------------------------------------------------
// Admin APIs
// -------------------------------------------------------------

export async function loginAdmin(username, password) {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return handleResponse(res);
}

export async function getAdminMe(token) {
  const res = await fetch(`${API_BASE}/admin/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(res);
}

export async function getAdminStats(token) {
  const res = await fetch(`${API_BASE}/admin/stats`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(res);
}

export async function getAdminStories(token) {
  const res = await fetch(`${API_BASE}/admin/stories`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(res);
}

export async function createStory(storyData, token) {
  const res = await fetch(`${API_BASE}/stories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(storyData)
  });
  return handleResponse(res);
}

export async function updateStory(id, storyData, token) {
  const res = await fetch(`${API_BASE}/stories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(storyData)
  });
  return handleResponse(res);
}

export async function deleteStory(id, token) {
  const res = await fetch(`${API_BASE}/stories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(res);
}

export async function getAdminComments(token) {
  const res = await fetch(`${API_BASE}/admin/comments`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(res);
}

export async function deleteComment(id, token) {
  const res = await fetch(`${API_BASE}/comments/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(res);
}

export async function seedDatabase() {
  const res = await fetch(`${API_BASE}/seed`, {
    method: 'POST'
  });
  return handleResponse(res);
}

// -------------------------------------------------------------
// Reader / User Authentication & Bookmarks APIs
// -------------------------------------------------------------

export async function registerUser({ name, email, password }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  return handleResponse(res);
}

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return handleResponse(res);
}

export async function getUserMe(token) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(res);
}

export async function toggleStoryBookmark(storyId, token) {
  const res = await fetch(`${API_BASE}/users/bookmarks/${encodeURIComponent(storyId)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(res);
}

export async function getUserBookmarks(token) {
  const res = await fetch(`${API_BASE}/users/bookmarks`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(res);
}

export async function getAdminUsers(token) {
  const res = await fetch(`${API_BASE}/admin/users`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(res);
}

export async function makeUserAdmin(payload, token) {
  const res = await fetch(`${API_BASE}/admin/make-admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function revokeUserAdmin(payload, token) {
  const res = await fetch(`${API_BASE}/admin/revoke-admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

// -------------------------------------------------------------
// Category Management APIs
// -------------------------------------------------------------

export async function createCategory(categoryData, token) {
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(categoryData)
  });
  return handleResponse(res);
}

export async function updateCategory(id, categoryData, token) {
  const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(categoryData)
  });
  return handleResponse(res);
}

export async function deleteCategory(id, token) {
  const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(res);
}
