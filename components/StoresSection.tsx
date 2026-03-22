import React from 'react';
import { MapPin, Phone, Clock, Star, Navigation, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';

const STORES = [
  {
    city: 'O Porriño',
    brand: 'Galaxia Phone',
    address: 'Rúa Ramón González, 54, 36400 O Porriño',
    phone: '+34 603 93 69 78',
    hours: 'Lun–Vie 10–20h · Sáb 10–14h',
    rating: 4.7,
    reviews: 53,
    color: 'from-emerald-600 to-emerald-700',
    emoji: '🏪',
    mapsUrl: 'https://maps.google.com/?q=Galaxia+Phone+O+Porrino+Pontevedra',
    route: ROUTES.LOCAL_PORRINO,
  },
  {
    city: 'Baiona',
    brand: 'Galaxia Phone',
    address: 'Rúa Carabela a Pinta, 14, 36300 Baiona',
    phone: '+34 623 97 93 19',
    hours: 'Lun–Vie 10–20h · Sáb 10–14h',
    rating: 5.0,
    reviews: 15,
    color: 'from-teal-600 to-teal-700',
    emoji: '⚓',
    mapsUrl: 'https://maps.google.com/?q=Galaxia+Phone+Baiona+Pontevedra',
    route: ROUTES.LOCAL_BAIONA,
  },
  {
    city: 'Lalín',
    brand: 'Galaxia Phone',
    address: 'Rúa Wenceslao Calvo Garra, 10, 36500 Lalín',
    phone: '+34 611 32 12 67',
    hours: 'Lun–Vie 10–20h · Sáb 10–14h',
    rating: 4.7,
    reviews: 31,
    color: 'from-green-600 to-green-700',
    emoji: '🌿',
    mapsUrl: 'https://maps.google.com/?q=Galaxia+Phone+Lalin+Pontevedra',
    route: ROUTES.LOCAL_LALIN,
  },
];

export default function StoresSection() {
  const navigate = useNavigate();

  return (
    <section className="py-14 px-4 bg-gray-50" aria-label="Nuestras tiendas">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-brand-primary font-semibold text-sm uppercase tracking-widest mb-2">Estamos cerca de ti</p>
          <h2 className="text-3xl font-bold text-gray-900">Nuestras tiendas en Galicia</h2>
          <p className="text-gray-500 mt-2">Visítanos sin cita previa · Reparamos en el momento</p>
        </div>

        {/* Store cards */}
        <div className="grid sm:grid-cols-3 gap-5">
          {STORES.map((store) => (
            <div
              key={store.city}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col"
            >
              {/* Top banner */}
              <div className={`bg-gradient-to-r ${store.color} px-5 py-4 flex items-center justify-between`}>
                <div>
                  <p className="text-white/80 text-xs font-medium uppercase tracking-wide">{store.brand}</p>
                  <h3 className="text-white text-xl font-bold">{store.city}</h3>
                </div>
                <span className="text-3xl">{store.emoji}</span>
              </div>

              {/* Rating */}
              <div className="px-5 pt-4 flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star
                      key={i}
                      size={14}
                      className={i <= Math.round(store.rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-200 fill-gray-200'}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-900">{store.rating.toFixed(1)}</span>
                <span className="text-sm text-gray-400">({store.reviews} reseñas)</span>
              </div>

              {/* Info */}
              <div className="px-5 pt-3 pb-4 space-y-2.5 flex-1">
                <div className="flex items-start gap-2.5 text-sm text-gray-600">
                  <MapPin size={15} className="text-brand-primary mt-0.5 flex-shrink-0" />
                  <span>{store.address}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                  <Phone size={15} className="text-brand-primary flex-shrink-0" />
                  <a href={`tel:${store.phone}`} className="hover:text-brand-primary transition-colors font-medium">
                    {store.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                  <Clock size={15} className="text-brand-primary flex-shrink-0" />
                  <span>{store.hours}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 pb-5 flex gap-2">
                <a
                  href={store.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 bg-brand-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-primary-dark transition-colors"
                >
                  <Navigation size={14} />
                  Cómo llegar
                </a>
                <button
                  onClick={() => navigate(store.route)}
                  className="flex items-center justify-center gap-1 border border-gray-200 text-gray-600 py-2.5 px-3 rounded-xl text-sm hover:border-brand-primary hover:text-brand-primary transition-colors"
                >
                  Info
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          🔧 Reparamos iPhone, Samsung, Xiaomi y todas las marcas · Sin cita previa · Garantía 3 meses
        </p>
      </div>
    </section>
  );
}
