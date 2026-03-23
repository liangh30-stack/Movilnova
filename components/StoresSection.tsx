import React from 'react';
import { MapPin, Phone, Clock, Star, Navigation, ChevronRight, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';

const STORES = [
  {
    city: 'O Porriño',
    brand: 'Galaxia Phone',
    address: 'Rúa Ramón González, 54, 36400 O Porriño',
    phone: '+34 603 93 69 78',
    hours: 'Lun–Sáb 10:00–14:00 / 16:30–20:30',
    rating: 4.7,
    reviews: 55,
    mapsUrl: 'https://maps.google.com/?q=42.1606837,-8.6211395',
    mapsEmbed: 'https://www.openstreetmap.org/export/embed.html?bbox=-8.6251,42.1567,-8.6171,42.1647&layer=mapnik&marker=42.1606837,-8.6211395',
    route: ROUTES.LOCAL_PORRINO,
  },
  {
    city: 'Baiona',
    brand: 'Galaxia Phone',
    address: 'Rúa Carabela a Pinta, 14, 36300 Baiona',
    phone: '+34 623 97 93 19',
    hours: 'Lun–Sáb 10:00–14:00 / 16:30–20:30',
    rating: 5.0,
    reviews: 23,
    mapsUrl: 'https://maps.google.com/?q=42.1203563,-8.8509722',
    mapsEmbed: 'https://www.openstreetmap.org/export/embed.html?bbox=-8.8550,42.1163,-8.8470,42.1243&layer=mapnik&marker=42.1203563,-8.8509722',
    route: ROUTES.LOCAL_BAIONA,
  },
  {
    city: 'Lalín',
    brand: 'Galaxia Phone',
    address: 'Rúa Wenceslao Calvo Garra, 10, 36500 Lalín',
    phone: '+34 611 32 12 67',
    hours: 'Lun–Sáb 10:00–14:00 / 16:30–20:30',
    rating: 4.7,
    reviews: 31,
    mapsUrl: 'https://maps.google.com/?q=42.6616099,-8.1106365',
    mapsEmbed: 'https://www.openstreetmap.org/export/embed.html?bbox=-8.1146,42.6576,-8.1066,42.6656&layer=mapnik&marker=42.6616099,-8.1106365',
    route: ROUTES.LOCAL_LALIN,
  },
];

export default function StoresSection() {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4" aria-label="Nuestras tiendas">
      <div className="max-w-5xl mx-auto">

        {/* Header — Apple style */}
        <div className="text-center mb-14">
          <p className="text-brand-primary font-semibold text-xs uppercase tracking-[0.2em] mb-3">
            Tiendas físicas
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Visítanos en Galicia
          </h2>
          <p className="text-gray-400 mt-3 text-base max-w-md mx-auto">
            Sin cita previa · Reparamos mientras esperas
          </p>
        </div>

        {/* Store cards — glassmorphism */}
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
          {STORES.map((store) => (
            <div
              key={store.city}
              className="group relative bg-white/80 backdrop-blur-xl rounded-[20px] border border-gray-200/60 overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-brand-primary/8 hover:border-brand-primary/20 hover:-translate-y-1 flex flex-col"
            >
              {/* Google Maps preview */}
              <a
                href={store.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative h-36 overflow-hidden bg-gray-100"
                aria-label={`Ver ${store.city} en Google Maps`}
              >
                <iframe
                  src={store.mapsEmbed}
                  width="100%"
                  height="144"
                  style={{ border: 0, pointerEvents: 'none' }}
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Mapa ${store.city}`}
                  className="w-full h-full"
                />
                {/* Overlay to make whole area clickable */}
                <div className="absolute inset-0" />
              </a>

              {/* Header */}
              <div className="px-5 pt-4 pb-3">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                  {store.city}
                </h3>
              </div>

              {/* Rating */}
              <div className="px-5 pb-3 flex items-center gap-2">
                <div className="flex gap-[2px]">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star
                      key={i}
                      size={13}
                      className={i <= Math.round(store.rating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-200 fill-gray-200'}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-900">{store.rating.toFixed(1)}</span>
                <span className="text-xs text-gray-400">({store.reviews})</span>
              </div>

              {/* Divider */}
              <div className="mx-5 border-t border-gray-100" />

              {/* Info */}
              <div className="px-5 pt-4 pb-4 space-y-3 flex-1">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-brand-primary/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin size={14} className="text-brand-primary" />
                  </div>
                  <span className="text-[13px] text-gray-600 leading-relaxed">{store.address}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-brand-primary/8 flex items-center justify-center flex-shrink-0">
                    <Phone size={14} className="text-brand-primary" />
                  </div>
                  <a
                    href={`tel:${store.phone}`}
                    className="text-[13px] text-gray-900 font-medium hover:text-brand-primary transition-colors"
                  >
                    {store.phone}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-brand-primary/8 flex items-center justify-center flex-shrink-0">
                    <Clock size={14} className="text-brand-primary" />
                  </div>
                  <span className="text-[13px] text-gray-500">{store.hours}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 pb-5 flex gap-2">
                <a
                  href={store.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  <Navigation size={13} />
                  Llegar
                </a>
                <button
                  onClick={() => navigate(store.route)}
                  className="flex items-center justify-center gap-1 text-gray-500 py-2.5 px-4 rounded-xl text-sm font-medium hover:text-brand-primary hover:bg-brand-primary/5 transition-all"
                >
                  Más info
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 text-center">
          <p className="text-xs text-gray-400">
            Reparamos iPhone · Samsung · Xiaomi · Todas las marcas — Garantía 3 meses
          </p>
        </div>
      </div>
    </section>
  );
}
