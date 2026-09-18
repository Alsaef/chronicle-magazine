const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chronicle-magazine.vercel.app';

async function fetchStory(id) {
  try {
    const res = await fetch(`${apiUrl}/stories/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || json;
  } catch (err) {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const story = await fetchStory(params.id);

  if (!story) {
    return {
      title: 'Biography Profile',
      description: 'Explore the life, milestones, and breakthroughs of iconic pioneers on Chronicle Magazine.',
    };
  }

  const title = story.title;
  const description = story.summary || `Read the full biography and milestone timeline of ${story.title} on Chronicle Magazine.`;
  const url = `${siteUrl}/story/${story.slug || story._id}`;
  const images = story.coverImage
    ? [
        {
          url: story.coverImage,
          width: 1200,
          height: 630,
          alt: story.title,
        },
      ]
    : [];

  return {
    title,
    description,
    authors: [{ name: story.author || 'Editorial Staff' }],
    keywords: [
      story.category,
      story.title,
      'biography',
      'profile',
      'timeline',
      'legacy',
      'chronicle',
      story.author || 'Editorial Staff'
    ],
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      siteName: 'Chronicle Magazine',
      publishedTime: story.createdAt,
      modifiedTime: story.updatedAt || story.createdAt,
      section: story.category,
      authors: [story.author || 'Editorial Staff'],
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: story.coverImage ? [story.coverImage] : [],
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function StoryLayout({ children, params }) {
  const story = await fetchStory(params.id);

  const articleJsonLd = story
    ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: story.title,
        description: story.summary || story.title,
        image: story.coverImage ? [story.coverImage] : [],
        datePublished: story.createdAt,
        dateModified: story.updatedAt || story.createdAt,
        author: {
          '@type': 'Person',
          name: story.author || 'Editorial Staff',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Chronicle Magazine',
          logo: {
            '@type': 'ImageObject',
            url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&h=600&q=80',
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${siteUrl}/story/${story.slug || story._id}`,
        },
      }
    : null;

  return (
    <>
      {articleJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
      )}
      {children}
    </>
  );
}

