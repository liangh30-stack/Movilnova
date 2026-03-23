import React from 'react';
import { MapPin, Phone, Clock, Star, ChevronRight } from 'lucide-react';
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
    whatsapp: 'https://wa.me/34603936978?text=Hola%2C%20quiero%20preguntar%20sobre%20disponibilidad%20en%20vuestra%20tienda%20de%20O%20Porri%C3%B1o%20%F0%9F%93%B1',
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
    whatsapp: 'https://wa.me/34623979319?text=Hola%2C%20quiero%20preguntar%20sobre%20disponibilidad%20en%20vuestra%20tienda%20de%20Baiona%20%F0%9F%93%B1',
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
    whatsapp: 'https://wa.me/34611321267?text=Hola%2C%20quiero%20preguntar%20sobre%20disponibilidad%20en%20vuestra%20tienda%20de%20Lal%C3%ADn%20%F0%9F%93%B1',
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
                {/* Favicon badge — top left */}
                <div className="absolute top-2 left-2 w-8 h-8 rounded-lg overflow-hidden shadow-md border border-white/60 bg-white">
                  <img src="/favicon.svg" alt="MovilNova" width={32} height={32} className="w-full h-full object-cover" />
                </div>
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
                  href={store.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#1ebe5d] transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Preguntar disponibilidad
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
