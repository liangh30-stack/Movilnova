import React, { useEffect, useRef, useState } from 'react';

/**
 * LabelPrinter — Herramienta interna para imprimir etiquetas de accesorios
 * (logo de marca + modelo) en la impresora térmica de 80 mm.
 * Etiqueta: 80 mm de ancho x 40 mm de alto.
 *
 * Es un componente autónomo: estilos propios (prefijo .lp-) e impresión en un
 * iframe aislado, de modo que NUNCA afecta a la tienda ni al flujo de pago.
 */

interface Brand {
  id: string;
  label: string;
  slug?: string;
  plain?: boolean;
}

type Size = 's' | 'm' | 'l';

const BRANDS: Brand[] = [
  { id: 'apple', label: 'Apple', slug: 'apple' },
  { id: 'samsung', label: 'Samsung', slug: 'samsung' },
  { id: 'xiaomi', label: 'Xiaomi', slug: 'xiaomi' },
  { id: 'redmi', label: 'Redmi', slug: 'xiaomi' },
  { id: 'oppo', label: 'OPPO', slug: 'oppo' },
  { id: 'huawei', label: 'Huawei', slug: 'huawei' },
  { id: 'honor', label: 'Honor', slug: 'honor' },
  { id: 'vivo', label: 'vivo', slug: 'vivo' },
  { id: 'realme', label: 'realme', slug: 'realme' },
  { id: 'oneplus', label: 'OnePlus', slug: 'oneplus' },
  { id: 'motorola', label: 'Motorola', slug: 'motorola' },
  { id: 'google', label: 'Google Pixel', slug: 'google' },
  { id: 'nothing', label: 'Nothing', slug: 'nothing' },
  { id: 'none', label: 'Sin logo (texto)', plain: true },
];

const BY_ID: Record<string, Brand> = Object.fromEntries(BRANDS.map((b) => [b.id, b]));
const LS_KEY = 'movilnova_label_logos_v1';
const LS_H: Record<Size, number> = { s: 9, m: 13, l: 18 };
const FS_PT: Record<Size, number> = { s: 18, m: 24, l: 30 };

const esc = (s: string): string =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

const LP_CSS = `
.lp-root{font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#1f2430;padding:20px;max-width:1000px;margin:0 auto}
.lp-h{font-size:20px;font-weight:700;margin:0 0 4px}
.lp-sub{color:#6b7280;font-size:13px;margin:0 0 18px;line-height:1.5}
.lp-grid{display:grid;grid-template-columns:1fr 340px;gap:20px}
@media(max-width:820px){.lp-grid{grid-template-columns:1fr}}
.lp-card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:16px}
.lp-card h3{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin:0 0 10px}
.lp-brands{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px}
.lp-bbtn{position:relative;height:58px;border:1px solid #e5e7eb;border-radius:10px;background:#fafafa;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:6px;overflow:hidden;transition:.15s}
.lp-bbtn:hover{border-color:#3a6cf0}
.lp-bbtn.active{border-color:#3a6cf0;box-shadow:0 0 0 2px rgba(58,108,240,.25)}
.lp-bbtn img{max-height:30px;max-width:74px;object-fit:contain}
.lp-bbtn .lp-ph{font-size:11px;color:#6b7280;text-align:center;line-height:1.2}
.lp-bbtn .lp-dot{position:absolute;top:5px;right:6px;width:7px;height:7px;border-radius:50%;background:#16a34a;display:none}
.lp-bbtn.has-custom .lp-dot{display:block}
.lp-upload{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px;padding:10px;border:1px dashed #d1d5db;border-radius:10px}
.lp-upload .nm{font-size:12px;color:#6b7280;flex:1;min-width:120px}
.lp-field{display:block;margin:12px 0 5px;font-size:13px;color:#374151}
.lp-input{width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:9px;padding:10px;font-size:14px}
.lp-input:focus{outline:none;border-color:#3a6cf0}
.lp-row{display:flex;gap:12px;flex-wrap:wrap;margin-top:12px;align-items:flex-end}
.lp-seg{display:inline-flex;border:1px solid #d1d5db;border-radius:9px;overflow:hidden}
.lp-seg button{border:0;background:#fff;color:#6b7280;padding:8px 12px;cursor:pointer;font-size:13px}
.lp-seg button.active{background:#3a6cf0;color:#fff}
.lp-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:0;border-radius:10px;cursor:pointer;font-weight:600;font-size:14px;padding:11px 14px}
.lp-btn.primary{background:#3a6cf0;color:#fff;width:100%;margin-top:16px}
.lp-btn.primary:disabled{background:#9db4f3;cursor:not-allowed}
.lp-btn.ghost{background:#f3f4f6;color:#374151;border:1px solid #e5e7eb}
.lp-hint{font-size:12px;color:#6b7280;margin-top:12px;line-height:1.55}
.lp-preview{display:flex;flex-direction:column;align-items:center;gap:10px}
.lp-rule{font-size:11px;color:#9ca3af}
.lp-shell{background:#fff;border-radius:4px;box-shadow:0 6px 22px rgba(0,0,0,.18)}
.lp-label{width:80mm;height:40mm;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2.5mm 3mm;color:#000;background:#fff;overflow:hidden}
.lp-label img{display:block;max-width:72mm;object-fit:contain}
.lp-label.ls-s img{height:9mm}.lp-label.ls-m img{height:13mm}.lp-label.ls-l img{height:18mm}
.lp-label .m{font-weight:800;line-height:1.05;margin-top:1.4mm;word-break:break-word}
.lp-label.fs-s .m{font-size:18pt}.lp-label.fs-m .m{font-size:24pt}.lp-label.fs-l .m{font-size:30pt}
.lp-label .s{font-weight:600;margin-top:.6mm;font-size:11pt}
.lp-ph{color:#9ca3af;font-size:11px;font-weight:600}
`;

interface LogoImgProps {
  cands: string[];
  label: string;
  onResolved?: (src: string | null) => void;
}

const LogoImg: React.FC<LogoImgProps> = ({ cands, label, onResolved }) => {
  const [i, setI] = useState(0);
  const key = cands.join('|');
  useEffect(() => {
    setI(0);
  }, [key]);

  if (i >= cands.length) {
    return <span className="lp-ph">{label}</span>;
  }
  const src = cands[i];
  return (
    <img
      src={src}
      alt={label}
      onLoad={() => onResolved && onResolved(src)}
      onError={() => {
        if (i + 1 >= cands.length && onResolved) onResolved(null);
        setI(i + 1);
      }}
    />
  );
};

const LabelPrinter: React.FC = () => {
  const [brand, setBrand] = useState<string | null>(null);
  const [model, setModel] = useState('');
  const [sub, setSub] = useState('');
  const [fs, setFs] = useState<Size>('m');
  const [ls, setLs] = useState<Size>('m');
  const [logos, setLogos] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    } catch {
      return {};
    }
  });
  const [resolvedLogo, setResolvedLogo] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const saveLogos = (next: Record<string, string>) => {
    setLogos(next);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch {
      /* almacenamiento no disponible */
    }
  };

  const candidates = (b: Brand): string[] => {
    const c: string[] = [];
    if (logos[b.id]) c.push(logos[b.id]);
    c.push(`/logos/${b.id}.png`, `/logos/${b.id}.svg`);
    if (b.slug) c.push(`https://cdn.simpleicons.org/${b.slug}/000000`);
    return c;
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f || !brand) return;
    const r = new FileReader();
    r.onload = () => {
      if (typeof r.result === 'string') saveLogos({ ...logos, [brand]: r.result });
    };
    r.readAsDataURL(f);
    e.target.value = '';
  };

  const resetLogo = () => {
    if (!brand) return;
    const next = { ...logos };
    delete next[brand];
    saveLogos(next);
  };

  const handlePrint = () => {
    if (!brand) return;
    const b = BY_ID[brand];
    const logoSrc = b.plain ? '' : resolvedLogo || '';
    const doc =
      `<!DOCTYPE html><html><head><meta charset="utf-8"><style>` +
      `@page{size:80mm 40mm;margin:0}html,body{margin:0;padding:0}` +
      `.lbl{width:80mm;height:40mm;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2.5mm 3mm;font-family:Arial,Helvetica,sans-serif;color:#000}` +
      `.lbl img{display:block;max-width:72mm;object-fit:contain;height:${LS_H[ls]}mm}` +
      `.lbl .m{font-weight:800;line-height:1.05;margin-top:1.4mm;word-break:break-word;font-size:${FS_PT[fs]}pt}` +
      `.lbl .s{font-weight:600;margin-top:.6mm;font-size:11pt}` +
      `</style></head><body><div class="lbl">` +
      `${logoSrc ? `<img src="${esc(logoSrc)}">` : ''}` +
      `${model ? `<div class="m">${esc(model)}</div>` : ''}` +
      `${sub ? `<div class="s">${esc(sub)}</div>` : ''}` +
      `</div></body></html>`;

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(iframe);
    const win = iframe.contentWindow;
    if (!win) {
      document.body.removeChild(iframe);
      return;
    }
    win.document.open();
    win.document.write(doc);
    win.document.close();

    const cleanup = () => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    };
    const finish = () => {
      win.focus();
      win.print();
      window.setTimeout(cleanup, 1000);
    };
    const imgs = Array.from(win.document.images);
    if (imgs.length === 0) {
      window.setTimeout(finish, 60);
      return;
    }
    let left = imgs.length;
    const tick = () => {
      left -= 1;
      if (left <= 0) window.setTimeout(finish, 80);
    };
    imgs.forEach((im) => {
      if (im.complete) tick();
      else {
        im.onload = tick;
        im.onerror = tick;
      }
    });
  };

  const selected = brand ? BY_ID[brand] : null;
  const sizes: Size[] = ['s', 'm', 'l'];
  const sizeLabel: Record<Size, string> = { s: 'Pequeño', m: 'Medio', l: 'Grande' };

  return (
    <div className="lp-root">
      <style>{LP_CSS}</style>

      <h2 className="lp-h">🏷️ Etiquetas de accesorios</h2>
      <p className="lp-sub">
        Elige la marca, escribe el modelo y pulsa imprimir. Pensado para la impresora térmica de 80 mm
        (etiqueta de 80 × 40 mm). En el diálogo de impresión: márgenes «Ninguno», papel 80 mm / rollo, escala 100 %.
      </p>

      <div className="lp-grid">
        {/* Panel de control */}
        <div className="lp-card">
          <h3>1 · Marca</h3>
          <div className="lp-brands">
            {BRANDS.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`lp-bbtn${brand === b.id ? ' active' : ''}${logos[b.id] ? ' has-custom' : ''}`}
                onClick={() => {
                  setBrand(b.id);
                  setResolvedLogo(null);
                }}
                title={b.label}
              >
                <span className="lp-dot" />
                {b.plain ? (
                  <span className="lp-ph">Sin logo<br />(texto)</span>
                ) : (
                  <LogoImg cands={candidates(b)} label={b.label} />
                )}
              </button>
            ))}
          </div>

          {selected && !selected.plain && (
            <div className="lp-upload">
              <span className="nm">
                {logos[selected.id] ? 'Logo personalizado · ' : ''}
                Logo de {selected.label} (PNG/SVG, negro y fondo transparente)
              </span>
              <input ref={fileRef} type="file" accept="image/*,.svg" style={{ display: 'none' }} onChange={onUpload} />
              <button type="button" className="lp-btn ghost" onClick={() => fileRef.current?.click()}>
                Subir / cambiar
              </button>
              {logos[selected.id] && (
                <button type="button" className="lp-btn ghost" onClick={resetLogo}>
                  Restablecer
                </button>
              )}
            </div>
          )}

          <h3 style={{ marginTop: 20 }}>2 · Datos</h3>
          <label className="lp-field" htmlFor="lp-model">
            Modelo (texto grande)
          </label>
          <input
            id="lp-model"
            className="lp-input"
            type="text"
            value={model}
            placeholder="Ej.: Galaxy S26 Ultra / 17 Pro Max"
            onChange={(e) => setModel(e.target.value)}
          />
          <label className="lp-field" htmlFor="lp-sub">
            Subtítulo (opcional — Ej.: Funda, Cristal templado)
          </label>
          <input
            id="lp-sub"
            className="lp-input"
            type="text"
            value={sub}
            placeholder="Opcional"
            onChange={(e) => setSub(e.target.value)}
          />

          <div className="lp-row">
            <div>
              <label className="lp-field" style={{ marginTop: 0 }}>
                Tamaño del texto
              </label>
              <div className="lp-seg">
                {sizes.map((s) => (
                  <button key={s} type="button" className={fs === s ? 'active' : ''} onClick={() => setFs(s)}>
                    {sizeLabel[s]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="lp-field" style={{ marginTop: 0 }}>
                Tamaño del logo
              </label>
              <div className="lp-seg">
                {sizes.map((s) => (
                  <button key={s} type="button" className={ls === s ? 'active' : ''} onClick={() => setLs(s)}>
                    {sizeLabel[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button type="button" className="lp-btn primary" onClick={handlePrint} disabled={!brand}>
            🖨️ Imprimir etiqueta
          </button>

          <p className="lp-hint">
            Los logos se cargan automáticamente. Si alguno no aparece o quieres usar el oficial, pulsa
            «Subir / cambiar» y se guarda en este equipo. Para que sea igual en las 3 tiendas, sube los
            logos a <code>/public/logos/</code> con el nombre de la marca (apple.png, samsung.png, …).
          </p>
        </div>

        {/* Vista previa */}
        <div className="lp-card">
          <h3>Vista previa</h3>
          <div className="lp-preview">
            <span className="lp-rule">80 mm (ancho) x 40 mm (alto)</span>
            <div className="lp-shell">
              <div className={`lp-label fs-${fs} ls-${ls}`}>
                {!selected ? (
                  <span className="lp-ph">← Elige una marca</span>
                ) : (
                  <>
                    {!selected.plain && (
                      <LogoImg
                        cands={candidates(selected)}
                        label={`Sube el logo de ${selected.label}`}
                        onResolved={setResolvedLogo}
                      />
                    )}
                    {model && <div className="m">{model}</div>}
                    {sub && <div className="s">{sub}</div>}
                  </>
                )}
              </div>
            </div>
            <span className="lp-rule">{selected ? selected.label : 'Sin marca seleccionada'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelPrinter;
