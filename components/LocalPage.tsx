import React, { useEffect } from 'react';
import { MapPin, Phone, Clock, Star, Wrench, Shield, ArrowRight, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';

export type CitySlug = 'porrino' | 'baiona' | 'lalin';

const CITY_DATA: Record<CitySlug, {
  cityName: string;
  fullName: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  mapUrl: string;
  reviews: number;
  rating: number;
  hours: string;
  description: string;
  keywords: string[];
  services: { name: string; price: string; time: string }[];
  faq: { q: string; a: string }[];
}> = {
  porrino: {
    cityName: 'O Porriño',
    fullName: 'Galaxia Phone Porriño',
    address: 'C/ Principal 123, 36400 O Porriño, Pontevedra',
    phone: '+34 986 123 456',
    lat: 42.1674,
    lng: -8.6192,
    mapUrl: 'https://maps.google.com/?q=Galaxia+Phone+Porriño',
    reviews: 53,
    rating: 4.7,
    hours: 'Lun-Vie 10:00-20:00 | Sáb 10:00-14:00',
    description: 'Tu tienda de reparación de móviles de confianza en O Porriño. Reparamos iPhone, Samsung, Xiaomi y todas las marcas con garantía. Cambio de pantallas y baterías en menos de 1 hora.',
    keywords: ['reparación móviles Porriño', 'reparar iPhone Porriño', 'cambio pantalla Samsung Porriño', 'tienda fundas Porriño', 'servicio técnico móviles O Porriño'],
    services: [
      { name: 'Cambio de pantalla iPhone', price: 'Desde €79', time: '30-60 min' },
      { name: 'Cambio de pantalla Samsung', price: 'Desde €59', time: '30-60 min' },
      { name: 'Cambio de batería', price: 'Desde €39', time: '20-30 min' },
      { name: 'Reparación conector carga', price: 'Desde €49', time: '45-60 min' },
      { name: 'Fundas y protectores', price: 'Desde €9.99', time: 'Inmediato' },
      { name: 'Cargadores y cables', price: 'Desde €12.99', time: 'Inmediato' },
    ],
    faq: [
      { q: '¿Cuánto tarda la reparación de una pantalla en Porriño?', a: 'La mayoría de reparaciones de pantalla se realizan en 30-60 minutos mientras esperas en nuestra tienda de O Porriño.' },
      { q: '¿Ofrecéis garantía en las reparaciones?', a: 'Sí, todas nuestras reparaciones incluyen garantía de 3 meses en piezas y mano de obra.' },
      { q: '¿Reparáis todas las marcas de móviles?', a: 'Reparamos iPhone, Samsung, Xiaomi, Huawei, Oppo, Realme y prácticamente todas las marcas del mercado.' },
      { q: '¿Puedo ver el estado de mi reparación online?', a: 'Sí, en movilnova.es/seguimiento puedes consultar el estado de tu reparación con tu número de orden.' },
    ],
  },
  baiona: {
    cityName: 'Baiona',
    fullName: 'Galaxia Phone Baiona',
    address: 'C/ Victoria R. Cadaval 9, 36300 Baiona, Pontevedra',
    phone: '+34 986 123 457',
    lat: 42.1197,
    lng: -8.8503,
    mapUrl: 'https://maps.google.com/?q=Galaxia+Phone+Baiona',
    reviews: 15,
    rating: 5.0,
    hours: 'Lun-Vie 10:00-20:00 | Sáb 10:00-14:00',
    description: 'La mejor tienda de móviles en Baiona con valoración perfecta ⭐⭐⭐⭐⭐. Reparación de móviles, fundas, cargadores y accesorios. Tu servicio técnico de confianza en la Costa de la Vela.',
    keywords: ['reparación móviles Baiona', 'tienda móviles Baiona', 'accesorios móvil Baiona', 'reparar iPhone Baiona Pontevedra', 'tienda fundas Baiona'],
    services: [
      { name: 'Cambio de pantalla iPhone', price: 'Desde €79', time: '30-60 min' },
      { name: 'Cambio de pantalla Samsung', price: 'Desde €59', time: '30-60 min' },
      { name: 'Cambio de batería', price: 'Desde €39', time: '20-30 min' },
      { name: 'Reparación conector carga', price: 'Desde €49', time: '45-60 min' },
      { name: 'Fundas y protectores', price: 'Desde €9.99', time: 'Inmediato' },
      { name: 'Cargadores y cables', price: 'Desde €12.99', time: 'Inmediato' },
    ],
    faq: [
      { q: '¿Dónde estáis en Baiona?', a: 'Estamos en la C/ Victoria R. Cadaval 9, en el centro de Baiona, muy cerca del Parador y del paseo marítimo.' },
      { q: '¿Reparáis móviles en el momento?', a: 'Sí, la mayoría de reparaciones se hacen mientras esperas: pantallas y baterías en 30-60 minutos.' },
      { q: '¿Tenéis accesorios para turistas?', a: 'Sí, tenemos una amplia selección de fundas, protectores, cargadores y adaptadores para todos los modelos.' },
      { q: '¿Puedo encargar una funda personalizada?', a: 'Sí, con nuestro diseñador AI de movilnova.es puedes crear tu funda personalizada y recogerla en tienda.' },
    ],
  },
  lalin: {
    cityName: 'Lalín',
    fullName: 'Galaxia Phone Lalín',
    address: 'Rúa Principal 45, 36500 Lalín, Pontevedra',
    phone: '+34 986 123 458',
    lat: 42.6600,
    lng: -8.1130,
    mapUrl: 'https://maps.google.com/?q=Galaxia+Phone+Lalín',
    reviews: 31,
    rating: 4.7,
    hours: 'Lun-Vie 10:00-20:00 | Sáb 10:00-14:00',
    description: 'Galaxia Phone Lalín: tu servicio técnico de móviles en el corazón de Deza. Reparación económica y rápida de pantallas, baterías y conectores. Tienda de accesorios para móvil.',
    keywords: ['reparación móviles Lalín', 'Galaxia Phone Lalín', 'tienda accesorios móvil Lalín', 'cambio pantalla iPhone Lalín', 'servicio técnico móviles Deza'],
    services: [
      { name: 'Cambio de pantalla iPhone', price: 'Desde €79', time: '30-60 min' },
      { name: 'Cambio de pantalla Samsung', price: 'Desde €59', time: '30-60 min' },
      { name: 'Cambio de batería', price: 'Desde €39', time: '20-30 min' },
      { name: 'Reparación conector carga', price: 'Desde €49', time: '45-60 min' },
      { name: 'Fundas y protectores', price: 'Desde €9.99', time: 'Inmediato' },
      { name: 'Cargadores y cables', price: 'Desde €12.99', time: 'Inmediato' },
    ],
    faq: [
      { q: '¿Sois la misma tienda que Galaxia Phone?', a: 'Sí, Galaxia Phone Lalín forma parte de la red de tiendas MovilNova con presencia en O Porriño, Baiona y Lalín.' },
      { q: '¿Cuánto cuesta cambiar la pantalla de un Xiaomi en Lalín?', a: 'El cambio de pantalla de Xiaomi Redmi Note empieza desde €49. Pídenos presupuesto sin compromiso.' },
      { q: '¿Hacéis reparaciones urgentes?', a: 'Sí, para la mayoría de modelos podemos hacer la reparación el mismo día que traes el móvil.' },
      { q: '¿Puedo comprar accesorios online?', a: 'Sí, en movilnova.es tienes fundas, cargadores y accesorios con envío rápido a toda España.' },
    ],
  },
};

interface LocalPageProps {
  city: CitySlug;
}

export default function LocalPage({ city }: LocalPageProps) {
  const navigate = useNavigate();
  const data = CITY_DATA[city];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: data.fullName,
    description: data.description,
    url: `https://movilnova.es/tienda/${city}`,
    image: 'https://movilnova.es/og-image.png',
    telephone: data.phone,
    email: 'info@movilnova.es',
    address: {
      '@type': 'PostalAddress',
      streetAddress: data.address.split(',')[0],
      addressLocality: data.cityName,
      addressRegion: 'Pontevedra',
      addressCountry: 'ES',
    },
    geo: { '@type': 'GeoCoordinates', latitude: data.lat, longitude: data.lng },
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '10:00', closes: '20:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '10:00', closes: '14:00' },
    ],
    aggregateRating: { '@type': 'AggregateRating', ratingValue: data.rating, reviewCount: data.reviews },
    priceRange: '€€',
    parentOrganization: { '@type': 'Organization', name: 'MovilNova', url: 'https://movilnova.es' },
  };

  useEffect(() => {
    document.title = `${data.cityName} - Reparación de Móviles y Accesorios | Galaxia Phone`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', data.description);
    const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonical) canonical.href = `https://movilnova.es/tienda/${city}`;
    // Inject JSON-LD
    const existing = document.getElementById('local-jsonld');
    if (existing) existing.remove();
    const script = document.createElement('script');
    script.id = 'local-jsonld';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => { document.getElementById('local-jsonld')?.remove(); };
  }, [city]);

  return (
    <>

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-br from-brand-primary to-brand-primary-dark text-white py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-brand-primary-light text-sm mb-3">
              <span className="cursor-pointer hover:underline" onClick={() => navigate(ROUTES.HOME)}>MovilNova</span>
              <ChevronRight size={14} />
              <span>Tiendas</span>
              <ChevronRight size={14} />
              <span>{data.cityName}</span>
            </div>
            <h1 className="text-4xl font-bold mb-3">Reparación de Móviles en {data.cityName}</h1>
            <p className="text-xl text-green-100 mb-6">{data.description}</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
                <Star size={16} className="text-yellow-300 fill-yellow-300" />
                <span className="font-bold">{data.rating}</span>
                <span className="text-green-100">({data.reviews} reseñas)</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
                <Clock size={16} />
                <span>Reparación en 1 hora</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
                <Shield size={16} />
                <span>3 meses de garantía</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">

          {/* Info + Mapa */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900">📍 Cómo llegar</h2>
              <div className="flex items-start gap-3">
                <MapPin className="text-brand-primary mt-1 flex-shrink-0" size={20} />
                <span className="text-gray-700">{data.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="text-brand-primary flex-shrink-0" size={20} />
                <a href={`tel:${data.phone}`} className="text-brand-primary font-semibold hover:underline">{data.phone}</a>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="text-brand-primary mt-1 flex-shrink-0" size={20} />
                <span className="text-gray-700">{data.hours}</span>
              </div>
              <a
                href={data.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-brand-primary text-white text-center py-3 rounded-lg font-semibold hover:bg-brand-primary-dark transition-colors"
              >
                Ver en Google Maps →
              </a>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">⚡ Reparación urgente</h2>
              <p className="text-gray-600 mb-4">¿Se te ha roto la pantalla o el móvil no carga? Tráelo ahora mismo a nuestra tienda en {data.cityName}. Sin cita previa.</p>
              <div className="space-y-2">
                {[
                  '✅ Presupuesto gratuito en el momento',
                  '✅ Reparación en 30-60 minutos',
                  '✅ Piezas de calidad con garantía',
                  '✅ Seguimiento online de tu reparación',
                ].map((item, i) => (
                  <p key={i} className="text-gray-700 text-sm">{item}</p>
                ))}
              </div>
              <button
                onClick={() => navigate(ROUTES.REPAIR_LOOKUP)}
                className="mt-4 w-full border-2 border-brand-primary text-brand-primary py-2 rounded-lg font-semibold hover:bg-brand-primary-light transition-colors"
              >
                Ver estado de mi reparación
              </button>
            </div>
          </div>

          {/* Servicios y precios */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🔧 Servicios y Precios en {data.cityName}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.services.map((s, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench size={16} className="text-brand-primary" />
                    <h3 className="font-semibold text-gray-900 text-sm">{s.name}</h3>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-brand-primary font-bold">{s.price}</span>
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">{s.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-500">* Precios orientativos. El precio final depende del modelo. Presupuesto gratuito sin compromiso.</p>
          </div>

          {/* CTA Tienda Online */}
          <div className="bg-gradient-to-r from-brand-primary-light to-white rounded-xl border border-brand-primary/20 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">📦 Compra online, recibe en casa</h2>
              <p className="text-gray-600">Fundas, cargadores, cables y accesorios con envío rápido a toda España. También puedes recoger en tienda en {data.cityName}.</p>
            </div>
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className="flex-shrink-0 bg-brand-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-primary-dark transition-colors flex items-center gap-2"
            >
              Ver tienda <ArrowRight size={18} />
            </button>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">❓ Preguntas Frecuentes — {data.cityName}</h2>
            <div className="space-y-4">
              {data.faq.map((item, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-2">{item.q}</h3>
                  <p className="text-gray-600">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Otras tiendas */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">📍 Otras tiendas MovilNova en Galicia</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {(Object.keys(CITY_DATA) as CitySlug[]).filter(c => c !== city).map(c => (
                <button
                  key={c}
                  onClick={() => navigate(`/tienda/${c}`)}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-left hover:shadow-md hover:border-brand-primary/30 transition-all"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={14} className="text-brand-primary" />
                    <span className="font-semibold text-gray-900">{CITY_DATA[c].cityName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-sm text-gray-500">{CITY_DATA[c].rating} · {CITY_DATA[c].reviews} reseñas</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

