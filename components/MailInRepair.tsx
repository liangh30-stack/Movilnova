import React, { useState } from 'react';
import { Package, CheckCircle, Clock, Truck, CreditCard, Wrench, Send, Upload } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

const MailInRepair: React.FC = () => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', phone: '', email: '', model: '', problem: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.model || !form.problem) {
      setError('Por favor rellena todos los campos obligatorios.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const functions = getFunctions(getApp(), 'europe-west1');
      const submit = httpsCallable(functions, 'submitMailInRepair');
      const result = await submit(form) as any;
      setTicketId(result.data.ticketId);
    } catch (err: any) {
      setError('Error al enviar. Escríbenos por WhatsApp: +34 603 93 69 78');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    {
      icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
      title: 'Consúltanos por WhatsApp',
      desc: 'Cuéntanos el problema y el modelo de tu móvil. Te damos un presupuesto orientativo sin compromiso.',
    },
    {
      icon: <Package size={28} />,
      title: 'Envíanos tu móvil',
      desc: 'Si el presupuesto te convence, embala bien tu dispositivo y envíanoslo a nuestra tienda de O Porriño.',
    },
    {
      icon: <Wrench size={28} />,
      title: 'Diagnóstico gratuito',
      desc: 'Al recibirlo, lo revisamos a fondo y te confirmamos el diagnóstico exacto y precio final.',
    },
    {
      icon: <CreditCard size={28} />,
      title: 'Confirmas y pagás señal',
      desc: 'Si aceptas, pagas una señal y empezamos. Si no, te lo devolvemos — solo pagas el envío de vuelta.',
    },
    {
      icon: <Truck size={28} />,
      title: 'Te lo devolvemos reparado',
      desc: 'Reparado y probado. El envío de vuelta corre de nuestra cuenta. ¡Listo para usar!',
    },
  ];

  return (
    <div className="min-h-screen bg-brand-light">
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-primary to-brand-accent py-20 px-6 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Truck size={16} /> Servicio de reparación por correo — toda España
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            Repara tu móvil<br />desde casa
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-xl mx-auto">
            Envíanos tu dispositivo, lo reparamos y te lo devolvemos como nuevo. Sin desplazamientos.
          </p>
          <a
            href="https://wa.me/34603936978?text=Hola%2C%20quiero%20enviar%20mi%20m%C3%B3vil%20para%20reparaci%C3%B3n%20por%20correo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20b858] text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:scale-105"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Iniciar reparación por WhatsApp
          </a>
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-black text-brand-dark text-center mb-12">¿Cómo funciona?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-brand-border text-center hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                {s.icon}
              </div>
              <div className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-2">Paso {i + 1}</div>
              <h3 className="font-bold text-brand-dark mb-2">{s.title}</h3>
              <p className="text-sm text-brand-muted leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Conditions */}
      <div className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-brand-dark text-center mb-12">Condiciones del servicio</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <CheckCircle className="text-green-600 mb-3" size={28} />
              <h3 className="font-bold text-green-800 mb-2">Si aceptas el presupuesto</h3>
              <ul className="text-sm text-green-700 space-y-2">
                <li>✅ Diagnóstico gratuito</li>
                <li>✅ Gastos de devolución incluidos</li>
                <li>✅ Garantía de 6 meses en la reparación</li>
              </ul>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
              <Package className="text-orange-600 mb-3" size={28} />
              <h3 className="font-bold text-orange-800 mb-2">Si rechazas el presupuesto</h3>
              <ul className="text-sm text-orange-700 space-y-2">
                <li>⚠️ 10€ de gastos de gestión</li>
                <li>⚠️ Gastos de devolución a tu cargo</li>
                <li>✅ Tu móvil devuelto sin tocar</li>
              </ul>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <Clock className="text-blue-600 mb-3" size={28} />
              <h3 className="font-bold text-blue-800 mb-2">Tiempos estimados</h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li>📦 Recepción: 1–2 días</li>
                <li>🔧 Diagnóstico: 24–48h</li>
                <li>⚙️ Reparación: 7–14 días</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-6 py-16" id="formulario">
        <h2 className="text-3xl font-black text-brand-dark text-center mb-4">Solicitar reparación</h2>
        <p className="text-brand-muted text-center mb-10">Rellena el formulario antes de enviar tu dispositivo. Te responderemos en menos de 24h.</p>

        {ticketId ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <CheckCircle className="text-green-600 mx-auto mb-4" size={48} />
            <h3 className="text-2xl font-black text-green-800 mb-2">¡Solicitud recibida!</h3>
            <p className="text-green-700 mb-4">Tu número de ticket es:</p>
            <div className="bg-white border-2 border-green-400 rounded-xl px-8 py-4 inline-block mb-6">
              <span className="text-3xl font-black text-green-700 tracking-widest">{ticketId}</span>
            </div>
            <p className="text-green-700 text-sm mb-6">Guarda este número. Podrás seguir el estado de tu reparación en <strong>movilnova.es/seguimiento</strong></p>
            <p className="text-green-600 font-semibold">Ahora envíanos tu dispositivo a la dirección indicada abajo ↓</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-brand-border p-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-brand-dark mb-1">Nombre *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-brand-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="Tu nombre completo" />
              </div>
              <div>
                <label className="block text-sm font-bold text-brand-dark mb-1">Teléfono *</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border border-brand-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="+34 600 000 000" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-brand-dark mb-1">Email (para recibir actualizaciones)</label>
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border border-brand-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="tu@email.com" type="email" />
            </div>
            <div>
              <label className="block text-sm font-bold text-brand-dark mb-1">Modelo del dispositivo *</label>
              <input value={form.model} onChange={e => setForm({...form, model: e.target.value})} className="w-full border border-brand-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="Ej: iPhone 14 Pro, Samsung Galaxy S23..." />
            </div>
            <div>
              <label className="block text-sm font-bold text-brand-dark mb-1">Descripción del problema *</label>
              <textarea value={form.problem} onChange={e => setForm({...form, problem: e.target.value})} rows={4} className="w-full border border-brand-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none" placeholder="Describe el problema con el mayor detalle posible: pantalla rota, no carga, no enciende, cámara rota..." />
            </div>
            <div>
              <label className="block text-sm font-bold text-brand-dark mb-1">Contraseña del dispositivo</label>
              <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full border border-brand-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="Necesaria para diagnosticar y reparar" />
              <p className="text-xs text-brand-muted mt-1">🔒 Solo la usamos para el diagnóstico. Se elimina tras la reparación.</p>
            </div>
            {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
            <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-brand-primary to-brand-accent text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-50">
              {submitting ? 'Enviando...' : <><Send size={20} /> Enviar solicitud</>}
            </button>
          </form>
        )}
      </div>

      {/* Shipping address */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-brand-dark text-white rounded-2xl p-8 md:p-12 text-center">
          <Package size={40} className="mx-auto mb-4 text-brand-accent" />
          <h2 className="text-2xl font-black mb-2">Dirección de envío</h2>
          <p className="text-white/70 mb-6">Envía tu dispositivo a nuestra tienda principal:</p>
          <div className="bg-white/10 rounded-xl p-6 inline-block text-left mb-8">
            <p className="font-bold text-lg">Galaxia Phone — MovilNova</p>
            <p className="text-white/80">Rúa Ramón González, 54</p>
            <p className="text-white/80">36400 O Porriño, Pontevedra</p>
            <p className="text-white/80 mt-2">📞 +34 603 93 69 78</p>
          </div>
          <div className="text-sm text-white/60 mb-8">
            ⚠️ Incluye dentro del paquete un papel con tu nombre, teléfono y descripción del problema
          </div>
          <a
            href="https://wa.me/34603936978?text=Hola%2C%20quiero%20enviar%20mi%20m%C3%B3vil%20para%20reparaci%C3%B3n%20por%20correo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20b858] text-white px-8 py-4 rounded-xl font-bold text-lg transition-all"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Avisar antes de enviar
          </a>
        </div>
      </div>
    </div>
  );
};

export default MailInRepair;
