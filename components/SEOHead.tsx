import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface SEOHeadProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  noindex?: boolean;
}

const BASE_URL = 'https://movilnova.es';

/**
 * Componente SEO dinámico para cada página.
 * Actualiza title, meta description, Open Graph y canonical en cada ruta.
 */
export default function SEOHead({
  title,
  description,
  path = '',
  image = '/og-image.png',
  type = 'website',
  noindex = false,
}: SEOHeadProps) {
  const { i18n } = useTranslation();

  const fullTitle = title
    ? `${title} | MovilNova`
    : 'MovilNova - Reparación de móviles y accesorios | Envío rápido en España';

  const fullDescription =
    description ||
    'MovilNova: reparación de móviles con garantía, fundas, cargadores, cables y accesorios al mejor precio. Reserva online y seguimiento en tiempo real.';

  const canonicalUrl = `${BASE_URL}${path}`;
  const imageUrl = image.startsWith('http') ? image : `${BASE_URL}${image}`;
  const currentLang = i18n.language || 'es';

  return (
    <Helmet>
      {/* Básico */}
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <html lang={currentLang} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:locale" content={currentLang === 'es' ? 'es_ES' : currentLang} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={imageUrl} />
    </Helmet>
  );
}
