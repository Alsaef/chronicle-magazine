const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chronicle-magazine.vercel.app';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const baseRoutes = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  try {
    const res = await fetch(`${apiUrl}/stories?limit=500`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      const stories = json.data || [];

      const storyRoutes = stories.map((story) => ({
        url: `${siteUrl}/story/${story.slug || story._id}`,
        lastModified: story.updatedAt ? new Date(story.updatedAt) : (story.createdAt ? new Date(story.createdAt) : new Date()),
        changeFrequency: 'weekly',
        priority: story.featured ? 0.9 : 0.8,
      }));

      return [...baseRoutes, ...storyRoutes];
    }
  } catch (err) {
    // If backend is unavailable during build, gracefully return base routes
    console.warn('Sitemap story fetch skipped (backend unavailable):', err.message);
  }

  return baseRoutes;
}

