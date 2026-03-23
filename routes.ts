export const ROUTES = {
  HOME: '/',
  CATALOG: '/productos',
  PRODUCT: '/producto/:id',
  REPAIR_LOOKUP: '/reparaciones',

  // Local landing pages
  LOCAL_PORRINO: '/tienda/porrino',
  LOCAL_BAIONA: '/tienda/baiona',
  LOCAL_LALIN: '/tienda/lalin',

  ADMIN: '/admin',
  CUSTOMER_ACCOUNT: '/miperfil',
  CHECKOUT: '/pagar',
  LEGAL_PRIVACY: '/privacidad',
  LEGAL_TERMS: '/condiciones',
  LEGAL_NOTICE: '/aviso-legal',
  LEGAL_COOKIES: '/cookies',
  LEGAL_RETURNS: '/devoluciones',
} as const;

export const productPath = (id: string | number) => `/producto/${id}`;
