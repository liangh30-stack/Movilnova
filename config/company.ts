export const COMPANY = {
  brandName: (import.meta.env.VITE_COMPANY_NAME || 'MovilNova S.L.').replace(/\s+S\.L\.?$/, ''),
  name: import.meta.env.VITE_COMPANY_NAME || 'MovilNova S.L.',
  nif: import.meta.env.VITE_COMPANY_NIF || 'B-12345678',
  address: import.meta.env.VITE_COMPANY_ADDRESS || 'C/ Principal 123, 36400 Porriño, Pontevedra',
  email: import.meta.env.VITE_COMPANY_EMAIL || 'info@movilnova.es',
  phone: import.meta.env.VITE_COMPANY_PHONE || '+34 986 123 456',
  dpoEmail: import.meta.env.VITE_COMPANY_DPO_EMAIL || 'info@movilnova.es',
  registry: import.meta.env.VITE_COMPANY_REGISTRY || 'Registro Mercantil de Pontevedra, Tomo XXX, Folio XXX',
  city: import.meta.env.VITE_COMPANY_CITY || 'Pontevedra',
};
