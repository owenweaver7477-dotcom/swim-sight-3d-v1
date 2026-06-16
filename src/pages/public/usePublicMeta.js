import { useEffect } from 'react';

const FALLBACK_BASE_URL = 'https://swim-sight-3d-v1.vercel.app';

function getPublicBaseUrl() {
  const configured = import.meta.env.VITE_PUBLIC_SITE_URL || import.meta.env.VITE_APP_BASE_URL;
  if (configured && !configured.includes('localhost') && !configured.includes('127.0.0.1')) {
    return configured.replace(/\/$/, '');
  }
  return FALLBACK_BASE_URL;
}

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

function upsertCanonical(href) {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

function normaliseMeta(input, description) {
  if (typeof input === 'object' && input !== null) {
    return input;
  }

  return {
    title: input ? `${input} | Swim Sight 3D` : 'Swim Sight 3D',
    description,
    path: '/',
  };
}

export default function usePublicMeta(input, legacyDescription) {
  const metadata = normaliseMeta(input, legacyDescription);

  useEffect(() => {
    const {
      title = 'Swim Sight 3D',
      description = 'AI-assisted swimming analysis report software for serious coaches and clubs.',
      path = '/',
      canonicalPath = path,
      image = '/og-swim-sight-3d.svg',
      noindex = false,
      type = 'website',
    } = metadata;

    const baseUrl = getPublicBaseUrl();
    const canonicalUrl = `${baseUrl}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`;
    const twitterCard = image ? 'summary_large_image' : 'summary';

    document.title = title;
    upsertCanonical(canonicalUrl);
    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[name="robots"]', { name: 'robots', content: noindex ? 'noindex,nofollow' : 'index,follow' });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: twitterCard });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });

    if (image) {
      const imageUrl = image.startsWith('http') ? image : `${baseUrl}${image.startsWith('/') ? image : `/${image}`}`;
      upsertMeta('meta[property="og:image"]', { property: 'og:image', content: imageUrl });
      upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: imageUrl });
    }
  }, [metadata]);
}
