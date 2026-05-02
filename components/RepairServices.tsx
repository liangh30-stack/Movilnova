import React, { useState } from 'react';
import { CheckCircle, Send, Search, MapPin, Phone } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { MOCK_REPAIRS } from '../constants';
import type { RepairJob } from '../types';

type Tab = 'tienda' | 'correo' | 'estado';

const RepairServices: React.FC = () => {
  const [tab, setTab] = useState<Tab>('tienda');
  const [form, setForm] = useState({ name: '', phone: '', email: '', model: '', problem: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [formError, setFormError] = useState('');
  const [orderId, setOrderId] = useState('');
  const [trackResult, setTrackResult] = useState<RepairJob | null | undefined>(undefined);
  const [tracking, setTracking] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.model || !form.problem) {
      setFormError('Por favor rellena todos los campos obligatorios.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      // BUGFIX: was hardcoded to 'europe-west1' but the Cloud Function is
      // deployed in the default region. Mismatch caused 404 on every submit.
      const functions = getFunctions(getApp());
      const submit = httpsCallable<typeof form, { success: boolean; ticketId: string }>(
        functions,
        'submitMailInRepair',
      );
      const result = await submit(form);
      setTicketId(result.data.ticketId);
    } catch (err) {
      console.error('submitMailInRepair failed', err);
      setFormError('Error al enviar. Escríbenos por WhatsApp: +34 603 93 69 78');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    setTracking(true);
    await new Promise(r => setTimeout(r, 600));
    const found = MOCK_REPAIRS.find(r => r.id.toLowerCase() === orderId.toLowerCase());
    setTrackResult(found ?? null);
    setTracking(false);
  };

  const stores = [
    { city: 'O Porriño', stars: '4.7', reviews: '55', address: 'Rúa Ramón González, 54\n36400 O Porriño', phone: '+34 603 93 69 78', wa: '34603936978' },
    { city: 'Baiona', stars: '5.0', reviews: '23', address: 'Rúa Carabela a Pinta, 14\n36300 Baiona', phone: '+34 623 97 93 19', wa: '34623979319' },
    { city: 'Lalín', stars: '4.7', reviews: '31', address: 'Rúa Wenceslao Calvo Garra, 10\n36500 Lalín', phone: '+34 611 32 12 67', wa: '34611321267' },
  ];

  const reviews = [
    { name: 'María G.', city: 'O Porriño', stars: 5, text: 'Llevé mi iPhone con la pantalla destrozada y en menos de una hora lo tenía como nuevo. Precio muy justo y atención excelente.' },
    { name: 'Carlos R.', city: 'Baiona', stars: 5, text: 'La batería de mi Samsung no duraba nada. La cambiaron en 30 minutos y funciona perfecta. Muy profesionales.' },
    { name: 'Laura M.', city: 'Lalín', stars: 5, text: 'Se me cayó el móvil al agua y pensé que lo había perdido. Lo dejé aquí y a los dos días lo tenía funcionando. Servicio increíble.' },
    { name: 'Andrés P.', city: 'O Porriño', stars: 5, text: 'Cambio de pantalla de Xiaomi perfecto. Rápido, económico y con garantía. Ya es la segunda vez que vengo.' },
    { name: 'Sofía T.', city: 'Baiona', stars: 5, text: 'El conector de carga no funcionaba. Lo arreglaron en el momento y me cobraron un precio muy razonable.' },
    { name: 'Javier L.', city: 'Lalín', stars: 4, text: 'Buen servicio, me explicaron bien el problema y el presupuesto fue claro. La reparación quedó perfecta.' },
  ];

  const inputCls = "w-full bg-[#1b1c1c] border border-[#434653] rounded-sm px-5 py-3 text-sm text-white placeholder-[#8d909f] font-mono uppercase tracking-widest focus:outline-none focus:border-[#b1c5ff] transition-colors";
  const labelCls = "block text-[10px] font-bold text-[#b1c5ff] uppercase tracking-[0.2em] mb-2 font-mono";

  return (
    <div className="min-h-screen bg-[#131313] text-[#e4e2e1]" style={{fontFamily:'Inter,sans-serif'}}>

      {/* HERO */}
      <section className="relative min-h-[85vh] flex items-end pb-16 sm:items-center sm:pb-0 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img className="w-full h-full object-cover opacity-45"
            src="/repair-hands-working.jpg"
            alt="Reparación profesional de móviles" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-b from-[#131313]/60 via-[#131313]/70 to-[#131313]"></div>
        </div>
        <div className="relative z-10 w-full px-6 sm:px-8 lg:px-24 pb-4">
          <div className="max-w-4xl space-y-4">
            <h1 style={{fontFamily:'Space Grotesk,sans-serif'}} className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white leading-tight tracking-tighter uppercase">
              Reparación<br/>Profesional
            </h1>
            <p className="text-sm sm:text-lg md:text-xl text-[#c3c6d6] max-w-xl font-light leading-relaxed">
              Diagnóstico gratis · Garantía 6 meses · +20 talleres en Galicia
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a href="https://wa.me/34603936978?text=Hola%2C%20quiero%20una%20reparaci%C3%B3n"
                target="_blank" rel="noopener noreferrer"
                style={{fontFamily:'Space Grotesk,sans-serif'}}
                className="bg-[#b1c5ff] text-[#002c71] px-6 py-4 font-bold text-sm uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 hover:bg-white transition-colors w-full sm:w-auto">
                Iniciar Reparación →
              </a>
            </div>
            {/* Stats pills — compact on mobile */}
            <div className="flex flex-wrap gap-2 pt-2">
              {['⭐ 4.8/5', '🔧 +5.000 reps', '🏪 +20 talleres', '✅ 6 meses garantía'].map(p => (
                <span key={p} className="px-3 py-1 rounded-sm bg-[#1b1c1c]/80 border border-[#434653] text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#c3c6d6]">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TABS */}
      <div className="sticky top-16 z-40 bg-[#131313]/95 backdrop-blur-xl border-b border-[#434653]">
        <div className="max-w-5xl mx-auto px-8 flex">
          {([
            { id: 'tienda' as Tab, label: '🏪 Tienda', labelFull: '🏪 Reparar en tienda' },
            { id: 'correo' as Tab, label: '📦 Envío', labelFull: '📦 Envío por correo' },
            { id: 'estado' as Tab, label: '🔍 Estado', labelFull: '🔍 Ver estado' },
          ]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{fontFamily:'Space Grotesk,sans-serif'}}
              className={`flex-1 py-4 font-bold uppercase tracking-wider transition-all border-b-2 text-xs sm:text-sm ${tab === t.id ? 'text-[#b1c5ff] border-[#0051c3]' : 'text-[#8d909f] border-transparent hover:text-white'}`}>
              <span className="sm:hidden">{t.label}</span>
              <span className="hidden sm:inline">{t.labelFull}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB: EN TIENDA */}
      {tab === 'tienda' && (
        <section className="py-24 px-8 bg-[#1b1c1c]">
          <div className="max-w-6xl mx-auto">
            <div className="mb-16">
              <div className="flex items-center gap-4 text-[#b1c5ff] font-mono text-xs tracking-widest uppercase mb-4">
                <span className="w-8 h-px bg-[#b1c5ff]"></span>3 Ubicaciones · Galicia
              </div>
              <h2 style={{fontFamily:'Space Grotesk,sans-serif'}} className="text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">Nuestros<br/><span className="text-[#b1c5ff]">Talleres</span></h2>
              <p className="text-[#8d909f] font-mono text-xs uppercase tracking-widest mt-4">Sin cita previa · Lun–Sáb 10:00–14:00 / 16:30–20:30</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
              {stores.map(store => (
                <div key={store.city} className="bg-[#131313] border border-[#434653] rounded-sm p-8 flex flex-col gap-5 hover:border-[#b1c5ff]/40 transition-colors group">
                  <div>
                    <span className="font-mono text-[#b1c5ff] text-xs tracking-[0.3em] uppercase block mb-2">Taller</span>
                    <h3 style={{fontFamily:'Space Grotesk,sans-serif'}} className="text-2xl font-bold text-white uppercase">{store.city}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-yellow-400 text-sm">{'★'.repeat(Math.round(parseFloat(store.stars)))}</span>
                      <span className="text-[#b1c5ff] font-mono text-xs">{store.stars}</span>
                      <span className="text-[#8d909f] text-xs font-mono">({store.reviews})</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs font-mono uppercase tracking-widest flex-1">
                    <p className="text-[#8d909f] whitespace-pre-line">{store.address}</p>
                    <p className="text-[#8d909f]"><a href={`tel:${store.phone.replace(/\s/g,'')}`} className="hover:text-white transition-colors">{store.phone}</a></p>
                  </div>
                  <a href={`https://wa.me/${store.wa}?text=Hola%2C%20necesito%20reparaci%C3%B3n`} target="_blank" rel="noopener noreferrer"
                    style={{fontFamily:'Space Grotesk,sans-serif'}}
                    className="w-full py-3 bg-[#25D366] text-white font-bold rounded-sm text-center text-xs uppercase tracking-widest hover:bg-[#20b858] transition-colors flex items-center justify-center gap-2">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </a>
                </div>
              ))}
            </div>

            {/* Services bento with real photos */}
            <div className="mb-16">
              <h3 style={{fontFamily:'Space Grotesk,sans-serif'}} className="text-3xl font-bold text-white uppercase tracking-tighter mb-10">
                Micro-Precisión <span className="text-[#b1c5ff]">Técnica</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Big card: iPhone before/after */}
                <div className="md:col-span-2 group relative overflow-hidden bg-[#131313] h-[380px] rounded-sm border border-[#434653] flex items-end p-8 hover:border-[#b1c5ff]/40 transition-colors">
                  <div className="absolute inset-0 opacity-60 group-hover:scale-105 transition-transform duration-700">
                    <img src="/repair-iphone-beforeafter.jpg" className="w-full h-full object-cover" alt="Antes y después reparación iPhone" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-[#131313]/40 to-transparent"></div>
                  <div className="relative z-10 w-full flex justify-between items-end">
                    <div>
                      <span className="font-mono text-[#b1c5ff] text-xs tracking-[0.3em] uppercase block mb-1">[01] Tapa Trasera · Pantalla</span>
                      <h4 style={{fontFamily:'Space Grotesk,sans-serif'}} className="text-3xl font-bold text-white uppercase">Reparación iPhone</h4>
                      <p className="text-[#b1c5ff] font-mono text-sm mt-1">Desde 49€ · Garantía 6 meses</p>
                    </div>
                    <span className="text-[#b1c5ff] text-2xl font-bold">→</span>
                  </div>
                </div>
                {/* Small card: Samsung tools */}
                <div className="group relative overflow-hidden bg-[#131313] h-[380px] rounded-sm border border-[#434653] flex items-end p-6 hover:border-[#b1c5ff]/40 transition-colors">
                  <div className="absolute inset-0 opacity-50 group-hover:scale-105 transition-transform duration-700">
                    <img src="/repair-oppo-open.jpg" className="w-full h-full object-cover" alt="Reparación Android" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-[#131313]/30 to-transparent"></div>
                  <div className="relative z-10">
                    <span className="font-mono text-[#b1c5ff] text-xs tracking-[0.3em] uppercase block mb-1">[02] Diagnóstico</span>
                    <h4 style={{fontFamily:'Space Grotesk,sans-serif'}} className="text-2xl font-bold text-white uppercase">Samsung & Android</h4>
                    <p className="text-[#8d909f] text-xs font-mono mt-2">Reparación a nivel de componentes</p>
                  </div>
                </div>
              </div>
              {/* Service pills */}
              {/* Third bento: machine */}
              <div className="group relative overflow-hidden bg-[#131313] h-[200px] rounded-sm border border-[#434653] hover:border-[#b1c5ff]/40 transition-colors mb-6">
                <div className="absolute inset-0 opacity-60 group-hover:scale-105 transition-transform duration-700">
                  <img src="/repair-machine.jpg" className="w-full h-full object-cover" alt="Maquinaria profesional" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#131313] via-[#131313]/30 to-transparent"></div>
                <div className="relative z-10 p-6 h-full flex flex-col justify-end">
                  <span className="font-mono text-[#b1c5ff] text-xs tracking-[0.3em] uppercase block mb-1">[03] Equipamiento</span>
                  <h4 style={{fontFamily:'Space Grotesk,sans-serif'}} className="text-xl font-bold text-white uppercase">Maquinaria de Precisión</h4>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { icon: '📱', name: 'Pantalla', price: 'Desde 49€' },
                  { icon: '🔋', name: 'Batería', price: 'Desde 29€' },
                  { icon: '⚡', name: 'Conector carga', price: 'Desde 35€' },
                  { icon: '📷', name: 'Cámara', price: 'Desde 39€' },
                  { icon: '🔊', name: 'Altavoz', price: 'Desde 25€' },
                  { icon: '💧', name: 'Daños agua', price: 'Desde 45€' },
                ].map(s => (
                  <div key={s.name} className="bg-[#131313] border border-[#434653] rounded-sm p-4 flex items-center gap-3 hover:border-[#b1c5ff]/40 transition-colors">
                    <span className="text-xl">{s.icon}</span>
                    <div>
                      <p className="text-white text-xs font-mono uppercase tracking-widest">{s.name}</p>
                      <p className="text-[#b1c5ff] text-xs font-mono">{s.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Brand bar */}
            <div className="pt-12 border-t border-[#434653] flex flex-wrap justify-between items-center opacity-30 grayscale">
              {['APPLE', 'SAMSUNG', 'XIAOMI', 'GOOGLE', 'HUAWEI'].map(b => (
                <span key={b} style={{fontFamily:'Space Grotesk,sans-serif'}} className="font-bold text-xl tracking-tighter text-white">{b}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TAB: ENVÍO */}
      {tab === 'correo' && (
        <section className="py-24 px-8 bg-[#1b1c1c]">
          <div className="max-w-5xl mx-auto">
            <div className="mb-16">
              <div className="flex items-center gap-4 text-[#b1c5ff] font-mono text-xs tracking-widest uppercase mb-4">
                <span className="w-8 h-px bg-[#b1c5ff]"></span>Servicio Postal · Toda España
              </div>
              <h2 style={{fontFamily:'Space Grotesk,sans-serif'}} className="text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
                Envío<br/><span className="text-[#b1c5ff]">Postal</span>
              </h2>
              <p className="text-[#8d909f] font-mono text-xs uppercase tracking-widest mt-4">Enviamos desde cualquier punto de España · Diagnóstico gratis · Garantía 6 meses</p>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-14">
              {[
                { n: '01', icon: '💬', title: 'Consulta', sub: 'Precio orientativo' },
                { n: '02', icon: '📦', title: 'Envía', sub: 'Si aceptas' },
                { n: '03', icon: '🔧', title: 'Diagnóstico', sub: 'Gratis al recibirlo' },
                { n: '04', icon: '✅', title: 'Confirmas', sub: 'O te lo devolvemos' },
                { n: '05', icon: '🚚', title: 'Devolvemos', sub: 'Envío gratis' },
              ].map(s => (
                <div key={s.n} className="bg-[#131313] border border-[#434653] rounded-sm p-5 text-center">
                  <div className="font-mono text-[#b1c5ff] text-xs tracking-[0.3em] uppercase mb-2">[{s.n}]</div>
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <p style={{fontFamily:'Space Grotesk,sans-serif'}} className="font-bold text-white text-xs uppercase tracking-wider">{s.title}</p>
                  <p className="text-[#8d909f] text-xs font-mono mt-1">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Conditions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
              <div className="bg-[#131313] border border-green-500/30 rounded-sm p-6">
                <div className="font-mono text-green-400 text-xs tracking-[0.3em] uppercase mb-3">[ACEPTAS]</div>
                <ul className="text-sm text-[#c3c6d6] font-mono space-y-1 uppercase tracking-widest text-xs">
                  <li>✅ Diagnóstico gratuito</li>
                  <li>✅ Envío de vuelta incluido</li>
                  <li>✅ Garantía 6 meses</li>
                </ul>
              </div>
              <div className="bg-[#131313] border border-[#fa5c1c]/30 rounded-sm p-6">
                <div className="font-mono text-[#fa5c1c] text-xs tracking-[0.3em] uppercase mb-3">[NO ACEPTAS]</div>
                <ul className="text-sm text-[#c3c6d6] font-mono space-y-1 uppercase tracking-widest text-xs">
                  <li>⚠️ Solo pagas el envío de vuelta</li>
                  <li>✅ Móvil devuelto sin modificar</li>
                  <li>✅ Sin coste adicional</li>
                </ul>
              </div>
            </div>

            {/* Form */}
            {ticketId ? (
              <div className="bg-[#131313] border border-green-500/30 rounded-sm p-10 text-center max-w-lg mx-auto">
                <CheckCircle className="text-green-400 mx-auto mb-4" size={40} />
                <div className="font-mono text-green-400 text-xs tracking-[0.3em] uppercase mb-4">[SOLICITUD REGISTRADA]</div>
                <p className="text-[#8d909f] font-mono text-xs uppercase tracking-widest mb-3">Tu número de ticket:</p>
                <div className="bg-[#1b1c1c] border border-[#b1c5ff]/30 rounded-sm px-8 py-4 inline-block mb-6">
                  <span style={{fontFamily:'Space Grotesk,sans-serif'}} className="text-3xl font-black text-[#b1c5ff] tracking-widest">{ticketId}</span>
                </div>
                <p className="text-xs text-[#8d909f] font-mono uppercase tracking-widest mb-6">Usa este código en la pestaña VER ESTADO</p>
                <div className="bg-[#1b1c1c] border border-[#434653] rounded-sm p-4 text-left text-xs font-mono uppercase tracking-widest">
                  <p className="text-[#b1c5ff] mb-2">📮 Dirección de envío:</p>
                  <p className="text-[#8d909f]">Galaxia Phone — MovilNova<br/>Rúa Ramón González, 54<br/>36400 O Porriño, Pontevedra</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="bg-[#131313] border border-[#434653] rounded-sm p-8 max-w-2xl mx-auto space-y-5">
                <div className="font-mono text-[#b1c5ff] text-xs tracking-[0.3em] uppercase mb-2">// Formulario de solicitud</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div><label className={labelCls}>Nombre *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} placeholder="Tu nombre" /></div>
                  <div><label className={labelCls}>Teléfono *</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={inputCls} placeholder="+34 600 000 000" /></div>
                </div>
                <div><label className={labelCls}>Email</label><input value={form.email} onChange={e => setForm({...form, email: e.target.value})} type="email" className={inputCls} placeholder="para recibir actualizaciones" /></div>
                <div><label className={labelCls}>Modelo *</label><input value={form.model} onChange={e => setForm({...form, model: e.target.value})} className={inputCls} placeholder="iPhone 14 Pro, Samsung S23..." /></div>
                <div><label className={labelCls}>Descripción del problema *</label><textarea value={form.problem} onChange={e => setForm({...form, problem: e.target.value})} rows={3} className={inputCls + ' resize-none'} placeholder="Describe el problema con detalle..." /></div>
                <div>
                  <label className={labelCls}>Contraseña del dispositivo</label>
                  <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} className={inputCls} placeholder="Necesaria para el diagnóstico" />
                  <p className="text-[10px] text-[#8d909f] font-mono uppercase tracking-widest mt-1">🔒 Se elimina tras la reparación</p>
                </div>
                {formError && <p className="text-red-400 text-xs font-mono">{formError}</p>}
                <button type="submit" disabled={submitting} style={{fontFamily:'Space Grotesk,sans-serif'}} className="w-full py-4 bg-[#0051c3] text-white font-bold uppercase tracking-widest text-sm rounded-sm flex items-center justify-center gap-2 hover:bg-[#b1c5ff] hover:text-[#002c71] transition-colors disabled:opacity-50">
                  {submitting ? 'Enviando...' : <><Send size={16} /> Enviar Solicitud</>}
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      {/* TAB: ESTADO */}
      {tab === 'estado' && (
        <section className="relative py-24 px-8 bg-[#001947] overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage:'radial-gradient(#b1c5ff 1px, transparent 1px)', backgroundSize:'40px 40px'}}></div>
          <div className="max-w-3xl mx-auto relative z-10 text-center">
            <div className="inline-flex items-center gap-3 px-4 py-1 rounded-full bg-[#0051c3]/30 border border-[#b1c5ff]/20 text-[#b1c5ff] text-xs font-mono uppercase tracking-[0.2em] mb-10">
              <span className="w-2 h-2 rounded-full bg-[#b1c5ff] animate-pulse"></span>Portal de Diagnóstico en Vivo
            </div>
            <h2 style={{fontFamily:'Space Grotesk,sans-serif'}} className="text-3xl sm:text-5xl md:text-6xl font-black text-white uppercase tracking-tight mb-8">
              Monitor de<br/>Reparación
            </h2>
            <form onSubmit={handleTrack} className="bg-[#131313]/80 backdrop-blur-2xl p-2 rounded-sm border border-white/10 shadow-2xl flex flex-col md:flex-row items-stretch gap-2 max-w-2xl mx-auto mb-12">
              <div className="flex-1 flex items-center px-6 py-4 gap-4">
                <Search size={18} className="text-[#b1c5ff] shrink-0" />
                <input value={orderId} onChange={e => setOrderId(e.target.value)} className="bg-transparent border-none w-full text-white placeholder-[#8d909f] font-mono focus:outline-none uppercase tracking-widest text-sm" placeholder="INTRODUCE TU NÚMERO DE TICKET..." />
              </div>
              <button type="submit" disabled={tracking} style={{fontFamily:'Space Grotesk,sans-serif'}} className="bg-[#0051c3] text-white px-8 py-4 font-bold uppercase tracking-widest text-sm hover:bg-[#b1c5ff] hover:text-[#002c71] transition-colors disabled:opacity-50">
                {tracking ? '...' : 'Ver Estado'}
              </button>
            </form>

            {trackResult === null && (
              <div className="bg-[#131313]/80 border border-[#434653] rounded-sm p-8 text-center">
                <p className="text-[#8d909f] font-mono text-xs uppercase tracking-widest mb-3">No encontrado</p>
                <p className="text-sm text-[#c3c6d6]">¿Dudas? <a href="https://wa.me/34603936978" className="text-[#b1c5ff] underline">+34 603 93 69 78</a></p>
              </div>
            )}

            {trackResult && (
              <div className="bg-[#131313]/80 border border-[#b1c5ff]/30 rounded-sm p-8 text-left">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="font-mono text-[#b1c5ff] text-xs tracking-[0.3em] uppercase mb-1">Ticket</div>
                    <p style={{fontFamily:'Space Grotesk,sans-serif'}} className="text-2xl font-black text-white uppercase">#{trackResult.id}</p>
                  </div>
                  <span className="px-4 py-2 bg-[#0051c3]/30 text-[#b1c5ff] text-xs font-mono uppercase tracking-widest border border-[#0051c3]/30">
                    {trackResult.status}
                  </span>
                </div>
                <div className="space-y-3 font-mono text-xs uppercase tracking-widest">
                  <div className="flex justify-between border-b border-[#434653] pb-3">
                    <span className="text-[#8d909f]">Dispositivo</span>
                    <span className="text-white">{trackResult.device}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-[#8d909f]">Problema</span>
                    <span className="text-white">{trackResult.issue}</span>
                  </div>
                </div>
              </div>
            )}

            {trackResult === undefined && (
              <div className="mt-12 flex justify-center gap-8">
                {[
                  { icon: '🔧', label: 'En Diagnóstico' },
                  { icon: '📦', label: 'Piezas en Camino' },
                  { icon: '✅', label: 'Listo para Recoger' },
                ].map(s => (
                  <div key={s.label} className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-sm bg-[#1b1c1c] border border-[#434653] flex items-center justify-center text-xl">
                      {s.icon}
                    </div>
                    <span className="text-[10px] font-mono text-[#8d909f] uppercase tracking-widest">{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </section>
      )}

      {/* REVIEWS */}
      <section className="py-20 px-8 bg-[#131313]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <div className="flex items-center gap-4 text-[#b1c5ff] font-mono text-xs tracking-widest uppercase mb-4">
              <span className="w-8 h-px bg-[#b1c5ff]"></span>Verificado por Google
            </div>
            <div className="flex items-center gap-4">
              <h2 style={{fontFamily:'Space Grotesk,sans-serif'}} className="text-4xl font-black text-white uppercase tracking-tighter">Opiniones</h2>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 text-xl">★★★★★</span>
                <span style={{fontFamily:'Space Grotesk,sans-serif'}} className="text-white font-bold">4.8</span>
                <span className="text-[#8d909f] text-xs font-mono">· +109 reviews</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map((r, i) => (
              <div key={i} className="bg-[#1b1c1c] border border-[#434653] rounded-sm p-6 hover:border-[#b1c5ff]/30 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-sm bg-[#0051c3] flex items-center justify-center text-white font-bold text-sm shrink-0" style={{fontFamily:'Space Grotesk,sans-serif'}}>{r.name.charAt(0)}</div>
                  <div>
                    <p className="font-bold text-white text-xs uppercase tracking-widest" style={{fontFamily:'Space Grotesk,sans-serif'}}>{r.name}</p>
                    <p className="text-[#8d909f] text-xs font-mono">{r.city}</p>
                  </div>
                </div>
                <p className="text-yellow-400 text-sm mb-3">{'★'.repeat(r.stars)}</p>
                <p className="text-[#c3c6d6] text-sm leading-relaxed">"{r.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1b1c1c] py-12 px-8 border-t border-[#434653] text-center">
        <p className="text-xs font-mono text-[#8d909f] uppercase tracking-widest">© 2026 MOVILNOVA · GALAXIA PHONE — Reparación profesional de móviles en Galicia</p>
      </footer>

      {/* WhatsApp FAB */}
      <a href="https://wa.me/34603936978?text=Hola%2C%20necesito%20reparaci%C3%B3n" target="_blank" rel="noopener noreferrer"
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#25D366] shadow-2xl rounded-sm flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all z-40">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
    </div>
  );
};

export default RepairServices;
