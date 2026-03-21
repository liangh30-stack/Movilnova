import { useEffect } from 'react';
import { COMPANY } from '../config/company';

interface DocumentHeadOptions {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalPath?: string;
}

const BASE_TITLE = COMPANY.brandName;
const BASE_URL = 'https://movilnova.es';

/**
 * Updates document <head> with page-specific meta tags for SEO.
 * Restores defaults on unmount.
 */
export const useDocumentHead = ({
  title,
  description,
  ogTitle,
  ogDescription,
  ogImage,
  canonicalPath,
}: DocumentHeadOptions) => {
  useEffect(() => {
    const prevTitle = document.title;

    // Title
    document.title = title ? `${title} | ${BASE_TITLE}` : `${BASE_TITLE} - Smart Repair Shop Management`;

    // Helper to set or create a meta tag
    const setMeta = (property: string, content: string, attr = 'property') => {
      let el = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    if (description) setMeta('description', description, 'name');
    if (ogTitle || title) setMeta('og:title', ogTitle || `${title} | ${BASE_TITLE}`);
    if (ogDescription || description) setMeta('og:description', ogDescription || description || '');
    if (ogImage) setMeta('og:image', ogImage);

    // Canonical URL
    if (canonicalPath) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', `${BASE_URL}${canonicalPath}`);
    }

    // Hreflang tags for multilingual SEO
    const HREFLANG_LOCALES = ['en', 'es', 'fr', 'de', 'zh'];
    const currentPath = canonicalPath || window.location.pathname;
    const hrefBase = `${BASE_URL}${currentPath}`;

    // Remove previous hreflang links
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());

    // Add hreflang for each language
    HREFLANG_LOCALES.forEach(lang => {
      const link = document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', lang);
      link.setAttribute('href', hrefBase);
      document.head.appendChild(link);
    });

    // Add x-default
    const xDefault = document.createElement('link');
    xDefault.setAttribute('rel', 'alternate');
    xDefault.setAttribute('hreflang', 'x-default');
    xDefault.setAttribute('href', hrefBase);
    document.head.appendChild(xDefault);

    return () => {
      document.title = prevTitle;
      document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
    };
  }, [title, description, ogTitle, ogDescription, ogImage, canonicalPath]);
};
