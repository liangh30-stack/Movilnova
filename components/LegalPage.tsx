import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Shield, FileText, Scale, Cookie, ExternalLink, RotateCcw } from 'lucide-react';
import { COMPANY } from '../config/company';

interface LegalPageProps {
  page: 'privacy' | 'terms' | 'legal' | 'cookies' | 'returns';
  onBack: () => void;
  onNavigate: (page: 'privacy' | 'terms' | 'legal' | 'cookies' | 'returns') => void;
}

const LegalPage: React.FC<LegalPageProps> = ({ page, onBack, onNavigate }) => {
  const { t } = useTranslation();

  const tabs: { key: LegalPageProps['page']; icon: React.ReactNode; label: string }[] = [
    { key: 'privacy', icon: <Shield size={16} />, label: t('legalNavPrivacy', 'Privacidad') },
    { key: 'terms', icon: <FileText size={16} />, label: t('legalNavTerms', 'Condiciones') },
    { key: 'legal', icon: <Scale size={16} />, label: t('legalNavLegal', 'Aviso Legal') },
    { key: 'cookies', icon: <Cookie size={16} />, label: t('legalNavCookies', 'Cookies') },
    { key: 'returns', icon: <RotateCcw size={16} />, label: t('legalNavReturns', 'Devoluciones') },
  ];

  return (
    <div className="min-h-screen bg-brand-light">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-brand-muted hover:text-brand-primary transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          {t('legalBack', 'Volver')}
        </button>

        {/* Tab navigation */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-brand-border pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onNavigate(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-colors ${
                page === tab.key
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-brand-muted hover:text-brand-dark hover:bg-brand-light'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-sm p-6 md:p-10">
          {page === 'privacy' && <PrivacyContent />}
          {page === 'terms' && <TermsContent />}
          {page === 'legal' && <LegalNoticeContent />}
          {page === 'cookies' && <CookiePolicyContent />}
          {page === 'returns' && <ReturnPolicyContent />}
        </div>

        {/* Footer with last updated */}
        <p className="text-center text-xs text-brand-muted mt-8">
          {t('legalLastUpdated', 'Ultima actualizacion')}: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

/* ==================== PRIVACY POLICY ==================== */
const PrivacyContent: React.FC = () => {
  const { t } = useTranslation();

  return (
    <article className="space-y-8">
      <header>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
            <Shield size={20} className="text-brand-primary" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-brand-dark">
            {t('legalPrivacyTitle', 'Politica de Privacidad')}
          </h1>
        </div>
        <p className="text-sm text-brand-muted leading-relaxed">
          {t('legalPrivacyIntro', 'En cumplimiento del Reglamento General de Proteccion de Datos (RGPD) y la Ley Organica 3/2018, de 5 de diciembre, de Proteccion de Datos Personales y garantia de los derechos digitales (LOPDGDD), le informamos sobre el tratamiento de sus datos personales.')}
        </p>
      </header>

      {/* 1. Data Controller */}
      <Section title={t('legalPrivacyControllerTitle', '1. Responsable del Tratamiento')}>
        <div className="bg-brand-light rounded-lg p-4 space-y-1 text-sm">
          <p><span className="font-medium text-brand-dark">{t('legalPrivacyCompany', 'Empresa')}:</span> <span className="text-brand-muted">{COMPANY.name}</span></p>
          <p><span className="font-medium text-brand-dark">NIF:</span> <span className="text-brand-muted">{COMPANY.nif}</span></p>
          <p><span className="font-medium text-brand-dark">{t('legalPrivacyAddress', 'Direccion')}:</span> <span className="text-brand-muted">{COMPANY.address}</span></p>
          <p><span className="font-medium text-brand-dark">{t('legalPrivacyEmail', 'Email')}:</span> <span className="text-brand-muted">{COMPANY.email}</span></p>
        </div>
      </Section>

      {/* 2. Data we collect */}
      <Section title={t('legalPrivacyDataTitle', '2. Datos que Recopilamos')}>
        <p className="text-sm text-brand-muted mb-3">
          {t('legalPrivacyDataIntro', 'Recopilamos los siguientes datos personales:')}
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-sm text-brand-muted">
          <li>{t('legalPrivacyDataName', 'Nombre y apellidos')}</li>
          <li>{t('legalPrivacyDataEmail', 'Correo electronico')}</li>
          <li>{t('legalPrivacyDataPhone', 'Telefono')}</li>
          <li>{t('legalPrivacyDataAddress', 'Direccion postal (para pedidos)')}</li>
          <li>{t('legalPrivacyDataAccount', 'Datos de cuenta (Firebase Auth)')}</li>
          <li>{t('legalPrivacyDataAnalytics', 'Datos de analitica (Sentry)')}</li>
          <li>{t('legalPrivacyDataCookies', 'Cookies')}</li>
        </ul>
      </Section>

      {/* 3. Legal basis */}
      <Section title={t('legalPrivacyBasisTitle', '3. Base Legal del Tratamiento')}>
        <ul className="list-disc list-inside space-y-1.5 text-sm text-brand-muted">
          <li><span className="font-medium text-brand-dark">{t('legalPrivacyBasisConsent', 'Consentimiento')}:</span> {t('legalPrivacyBasisConsentDesc', 'Para el envio de comunicaciones comerciales y cookies no esenciales.')}</li>
          <li><span className="font-medium text-brand-dark">{t('legalPrivacyBasisContract', 'Ejecucion de contrato')}:</span> {t('legalPrivacyBasisContractDesc', 'Para la gestion de pedidos y prestacion de servicios de reparacion.')}</li>
          <li><span className="font-medium text-brand-dark">{t('legalPrivacyBasisLegitimate', 'Interes legitimo')}:</span> {t('legalPrivacyBasisLegitimateDesc', 'Para la mejora de nuestros servicios y prevencion de fraude.')}</li>
        </ul>
      </Section>

      {/* 4. Data recipients */}
      <Section title={t('legalPrivacyRecipientsTitle', '4. Destinatarios de los Datos')}>
        <p className="text-sm text-brand-muted mb-3">
          {t('legalPrivacyRecipientsIntro', 'Sus datos pueden ser comunicados a los siguientes terceros:')}
        </p>
        <div className="space-y-2">
          <RecipientRow
            name="Firebase (Google LLC)"
            purpose={t('legalPrivacyRecipientFirebase', 'Alojamiento, autenticacion y base de datos')}
          />
          <RecipientRow
            name="Sentry (Functional Software Inc.)"
            purpose={t('legalPrivacyRecipientSentry', 'Monitorizacion de errores y rendimiento')}
          />
          <RecipientRow
            name="Stripe"
            purpose={t('legalPrivacyRecipientPayment', 'Procesamiento de pagos')}
          />
        </div>
      </Section>

      {/* 5. Data retention */}
      <Section title={t('legalPrivacyRetentionTitle', '5. Plazos de Conservacion')}>
        <ul className="list-disc list-inside space-y-1.5 text-sm text-brand-muted">
          <li>{t('legalPrivacyRetentionOrders', 'Pedidos: 5 anos (obligacion fiscal)')}</li>
          <li>{t('legalPrivacyRetentionAccount', 'Cuenta de usuario: hasta su eliminacion')}</li>
          <li>{t('legalPrivacyRetentionAnalytics', 'Datos de analitica: 12 meses')}</li>
        </ul>
      </Section>

      {/* 6. User rights */}
      <Section title={t('legalPrivacyRightsTitle', '6. Derechos del Usuario')}>
        <p className="text-sm text-brand-muted mb-3">
          {t('legalPrivacyRightsIntro', 'Usted tiene derecho a:')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <RightBadge label={t('legalPrivacyRightAccess', 'Acceso')} />
          <RightBadge label={t('legalPrivacyRightRectification', 'Rectificacion')} />
          <RightBadge label={t('legalPrivacyRightErasure', 'Supresion (Derecho al olvido)')} />
          <RightBadge label={t('legalPrivacyRightRestriction', 'Limitacion del tratamiento')} />
          <RightBadge label={t('legalPrivacyRightPortability', 'Portabilidad')} />
          <RightBadge label={t('legalPrivacyRightObjection', 'Oposicion')} />
        </div>
      </Section>

      {/* 7. DPO contact */}
      <Section title={t('legalPrivacyDPOTitle', '7. Delegado de Proteccion de Datos')}>
        <p className="text-sm text-brand-muted">
          {t('legalPrivacyDPODesc', 'Puede contactar con nuestro Delegado de Proteccion de Datos en:')} <span className="font-medium text-brand-primary">{COMPANY.dpoEmail}</span>
        </p>
      </Section>

      {/* 8. AEPD */}
      <Section title={t('legalPrivacyAEPDTitle', '8. Derecho a Reclamar')}>
        <p className="text-sm text-brand-muted">
          {t('legalPrivacyAEPDDesc', 'Si considera que el tratamiento de sus datos no se ajusta a la normativa, puede presentar una reclamacion ante la Agencia Espanola de Proteccion de Datos (AEPD) en')} <span className="text-brand-primary font-medium">www.aepd.es</span>
        </p>
      </Section>
    </article>
  );
};

/* ==================== TERMS OF SERVICE ==================== */
const TermsContent: React.FC = () => {
  const { t } = useTranslation();

  return (
    <article className="space-y-8">
      <header>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
            <FileText size={20} className="text-brand-primary" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-brand-dark">
            {t('legalTermsTitle', 'Condiciones Generales de Contratacion')}
          </h1>
        </div>
        <p className="text-sm text-brand-muted leading-relaxed">
          {t('legalTermsIntro', 'Las presentes condiciones generales regulan la relacion comercial entre el usuario y la empresa a traves de este sitio web.')}
        </p>
      </header>

      {/* 1. Company identity */}
      <Section title={t('legalTermsIdentityTitle', '1. Identidad de la Empresa')}>
        <div className="bg-brand-light rounded-lg p-4 space-y-1 text-sm">
          <p><span className="font-medium text-brand-dark">{t('legalTermsCompany', 'Razon Social')}:</span> <span className="text-brand-muted">{COMPANY.name}</span></p>
          <p><span className="font-medium text-brand-dark">NIF:</span> <span className="text-brand-muted">{COMPANY.nif}</span></p>
          <p><span className="font-medium text-brand-dark">{t('legalTermsAddress', 'Domicilio social')}:</span> <span className="text-brand-muted">{COMPANY.address}</span></p>
          <p><span className="font-medium text-brand-dark">{t('legalTermsRegistry', 'Registro Mercantil')}:</span> <span className="text-brand-muted">{COMPANY.registry}</span></p>
        </div>
      </Section>

      {/* 2. Products and prices */}
      <Section title={t('legalTermsPricesTitle', '2. Productos y Precios')}>
        <ul className="list-disc list-inside space-y-1.5 text-sm text-brand-muted">
          <li>{t('legalTermsPricesIVA', 'Todos los precios incluyen IVA')}</li>
          <li>{t('legalTermsPricesCurrency', 'La moneda de referencia es el Euro (EUR)')}</li>
          <li>{t('legalTermsPricesChange', 'Los precios pueden variar sin previo aviso, pero los pedidos confirmados mantienen el precio del momento de la compra')}</li>
        </ul>
      </Section>

      {/* 3. Order process */}
      <Section title={t('legalTermsOrderTitle', '3. Proceso de Compra')}>
        <div className="flex flex-col sm:flex-row gap-2">
          <StepBadge step="1" label={t('legalTermsOrderStep1', 'Carrito')} />
          <StepBadge step="2" label={t('legalTermsOrderStep2', 'Datos de envio')} />
          <StepBadge step="3" label={t('legalTermsOrderStep3', 'Pago')} />
          <StepBadge step="4" label={t('legalTermsOrderStep4', 'Confirmacion')} />
        </div>
      </Section>

      {/* 4. Payment methods */}
      <Section title={t('legalTermsPaymentTitle', '4. Metodos de Pago')}>
        <p className="text-sm text-brand-muted">
          {t('legalTermsPaymentDesc', 'Aceptamos los siguientes metodos de pago:')}
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-sm text-brand-muted mt-2">
          <li>{t('legalTermsPaymentStripe', 'Tarjeta de credito/debito (via Stripe)')}</li>
        </ul>
      </Section>

      {/* 5. Shipping */}
      <Section title={t('legalTermsShippingTitle', '5. Envio y Entrega')}>
        <ul className="list-disc list-inside space-y-1.5 text-sm text-brand-muted">
          <li>{t('legalTermsShippingArea', 'Envios a Espana peninsular')}</li>
          <li>{t('legalTermsShippingTime', 'Plazo estimado de entrega: 2-5 dias laborables')}</li>
          <li>{t('legalTermsShippingFree', 'Envio gratuito para pedidos superiores a 25 EUR')}</li>
        </ul>
      </Section>

      {/* 6. Right of withdrawal */}
      <Section title={t('legalTermsWithdrawalTitle', '6. Derecho de Desistimiento')}>
        <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-lg p-4">
          <p className="text-sm text-brand-dark font-medium mb-2">
            {t('legalTermsWithdrawalPeriod', 'Dispone de 14 dias naturales desde la recepcion del producto para ejercer su derecho de desistimiento sin necesidad de justificacion.')}
          </p>
          <p className="text-sm text-brand-muted">
            {t('legalTermsWithdrawalConditions', 'El producto debe devolverse en su estado original, sin usar y con el embalaje completo. Los costes de devolucion corren a cargo del consumidor, salvo que el producto sea defectuoso.')}
          </p>
        </div>
      </Section>

      {/* 7. Warranty */}
      <Section title={t('legalTermsWarrantyTitle', '7. Garantia Legal')}>
        <p className="text-sm text-brand-muted">
          {t('legalTermsWarrantyDesc', 'Todos los productos destinados a consumidores disponen de una garantia legal de 2 anos conforme a la normativa europea. Durante los primeros 12 meses, se presume que cualquier defecto ya existia en el momento de la entrega.')}
        </p>
      </Section>

      {/* 8. Returns */}
      <Section title={t('legalTermsReturnsTitle', '8. Proceso de Devolucion')}>
        <ol className="list-decimal list-inside space-y-1.5 text-sm text-brand-muted">
          <li>{t('legalTermsReturnsStep1', 'Contacte con nosotros por email indicando el numero de pedido')}</li>
          <li>{t('legalTermsReturnsStep2', 'Le enviaremos una etiqueta de devolucion')}</li>
          <li>{t('legalTermsReturnsStep3', 'Envie el producto en su embalaje original')}</li>
          <li>{t('legalTermsReturnsStep4', 'El reembolso se procesara en un plazo de 14 dias desde la recepcion')}</li>
        </ol>
      </Section>

      {/* 9. Limitation of liability */}
      <Section title={t('legalTermsLiabilityTitle', '9. Limitacion de Responsabilidad')}>
        <p className="text-sm text-brand-muted">
          {t('legalTermsLiabilityDesc', 'La empresa no sera responsable de danos indirectos, incidentales o consecuentes derivados del uso de los productos o servicios, salvo en los casos de dolo o negligencia grave. La responsabilidad maxima se limita al importe del pedido.')}
        </p>
      </Section>

      {/* 10. Applicable law */}
      <Section title={t('legalTermsLawTitle', '10. Legislacion Aplicable')}>
        <p className="text-sm text-brand-muted">
          {t('legalTermsLawDesc', 'Las presentes condiciones se rigen por la legislacion espanola. Para cualquier controversia, las partes se someten a los juzgados y tribunales de')} <span className="font-medium text-brand-dark">{COMPANY.city}</span>.
        </p>
      </Section>
    </article>
  );
};

/* ==================== LEGAL NOTICE (AVISO LEGAL) ==================== */
const LegalNoticeContent: React.FC = () => {
  const { t } = useTranslation();

  return (
    <article className="space-y-8">
      <header>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
            <Scale size={20} className="text-brand-primary" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-brand-dark">
            {t('legalNoticeTitle', 'Aviso Legal')}
          </h1>
        </div>
        <p className="text-sm text-brand-muted leading-relaxed">
          {t('legalNoticeIntro', 'En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Informacion y de Comercio Electronico (LSSI-CE), se facilitan los siguientes datos de identificacion del titular de este sitio web.')}
        </p>
      </header>

      {/* Company info */}
      <Section title={t('legalNoticeCompanyTitle', '1. Datos Identificativos')}>
        <div className="bg-brand-light rounded-lg p-4 space-y-1 text-sm">
          <p><span className="font-medium text-brand-dark">{t('legalNoticeCompany', 'Empresa')}:</span> <span className="text-brand-muted">{COMPANY.name}</span></p>
          <p><span className="font-medium text-brand-dark">NIF:</span> <span className="text-brand-muted">{COMPANY.nif}</span></p>
          <p><span className="font-medium text-brand-dark">{t('legalNoticeAddress', 'Domicilio')}:</span> <span className="text-brand-muted">{COMPANY.address}</span></p>
          <p><span className="font-medium text-brand-dark">{t('legalNoticePhone', 'Telefono')}:</span> <span className="text-brand-muted">{COMPANY.phone}</span></p>
          <p><span className="font-medium text-brand-dark">{t('legalNoticeEmail', 'Email')}:</span> <span className="text-brand-muted">{COMPANY.email}</span></p>
          <p><span className="font-medium text-brand-dark">{t('legalNoticeRegistry', 'Registro Mercantil')}:</span> <span className="text-brand-muted">{COMPANY.registry}</span></p>
        </div>
      </Section>

      {/* Hosting */}
      <Section title={t('legalNoticeHostingTitle', '2. Alojamiento Web')}>
        <div className="bg-brand-light rounded-lg p-4 space-y-1 text-sm">
          <p><span className="font-medium text-brand-dark">{t('legalNoticeHostingProvider', 'Proveedor')}:</span> <span className="text-brand-muted">Firebase (Google Cloud)</span></p>
          <p><span className="font-medium text-brand-dark">{t('legalNoticeHostingLocation', 'Ubicacion de servidores')}:</span> <span className="text-brand-muted">{t('legalNoticeHostingEU', 'Union Europea')}</span></p>
        </div>
      </Section>

      {/* Intellectual property */}
      <Section title={t('legalNoticeIPTitle', '3. Propiedad Intelectual')}>
        <p className="text-sm text-brand-muted">
          {t('legalNoticeIPDesc', 'Todos los contenidos del sitio web (textos, imagenes, logotipos, codigo fuente, diseno grafico, marcas) son propiedad de la empresa o se utilizan con licencia. Queda prohibida su reproduccion, distribucion, comunicacion publica o transformacion sin autorizacion expresa.')}
        </p>
      </Section>

      {/* Disclaimer */}
      <Section title={t('legalNoticeDisclaimerTitle', '4. Exencion de Responsabilidad')}>
        <ul className="list-disc list-inside space-y-1.5 text-sm text-brand-muted">
          <li>{t('legalNoticeDisclaimerAvailability', 'La empresa no garantiza la disponibilidad permanente del sitio web y no sera responsable de interrupciones temporales del servicio.')}</li>
          <li>{t('legalNoticeDisclaimerAccuracy', 'La informacion contenida en este sitio web es de caracter general y puede contener errores tipograficos involuntarios.')}</li>
          <li>{t('legalNoticeDisclaimerLinks', 'La empresa no se responsabiliza del contenido de sitios web de terceros enlazados desde esta pagina.')}</li>
        </ul>
      </Section>
    </article>
  );
};

/* ==================== COOKIE POLICY ==================== */
const CookiePolicyContent: React.FC = () => {
  const { t } = useTranslation();

  return (
    <article className="space-y-8">
      <header>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
            <Cookie size={20} className="text-brand-primary" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-brand-dark">
            {t('legalCookieTitle', 'Politica de Cookies')}
          </h1>
        </div>
        <p className="text-sm text-brand-muted leading-relaxed">
          {t('legalCookieIntro', 'Esta Politica de Cookies explica que son las cookies, como las utilizamos y como puede gestionarlas. Esta politica cumple con la normativa espanola (LSSI-CE) y europea (RGPD).')}
        </p>
      </header>

      {/* What are cookies */}
      <Section title={t('legalCookieWhatTitle', '1. Que son las Cookies')}>
        <p className="text-sm text-brand-muted">
          {t('legalCookieWhatDesc', 'Las cookies son pequenos archivos de texto que se almacenan en su dispositivo cuando visita un sitio web. Se utilizan para recordar sus preferencias, analizar el uso del sitio y mejorar su experiencia de navegacion.')}
        </p>
      </Section>

      {/* Types of cookies */}
      <Section title={t('legalCookieTypesTitle', '2. Tipos de Cookies que Utilizamos')}>
        <div className="space-y-4">
          {/* Essential */}
          <div className="border border-brand-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <h4 className="text-sm font-semibold text-brand-dark">{t('legalCookieEssentialTitle', 'Cookies Esenciales')}</h4>
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full ml-auto">{t('legalCookieNoConsent', 'Sin consentimiento')}</span>
            </div>
            <p className="text-sm text-brand-muted mb-2">
              {t('legalCookieEssentialDesc', 'Necesarias para el funcionamiento basico del sitio. Incluyen sesion, autenticacion (Firebase Auth) y cache de PWA.')}
            </p>
          </div>

          {/* Analytics */}
          <div className="border border-brand-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <h4 className="text-sm font-semibold text-brand-dark">{t('legalCookieAnalyticsTitle', 'Cookies de Analisis')}</h4>
              <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full ml-auto">{t('legalCookieNeedsConsent', 'Requiere consentimiento')}</span>
            </div>
            <p className="text-sm text-brand-muted mb-2">
              {t('legalCookieAnalyticsDesc', 'Sentry para monitorizacion de rendimiento con un muestreo del 10%. Nos ayuda a detectar errores y mejorar la experiencia.')}
            </p>
          </div>

          {/* Functional */}
          <div className="border border-brand-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <h4 className="text-sm font-semibold text-brand-dark">{t('legalCookieFunctionalTitle', 'Cookies Funcionales')}</h4>
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full ml-auto">{t('legalCookieNoConsent', 'Sin consentimiento')}</span>
            </div>
            <p className="text-sm text-brand-muted mb-2">
              {t('legalCookieFunctionalDesc', 'Preferencia de idioma (i18next). Permiten recordar su seleccion de idioma entre sesiones.')}
            </p>
          </div>
        </div>
      </Section>

      {/* How to manage */}
      <Section title={t('legalCookieManageTitle', '3. Como Gestionar las Cookies')}>
        <p className="text-sm text-brand-muted">
          {t('legalCookieManageDesc', 'Puede configurar sus preferencias de cookies a traves del banner de cookies que aparece al visitar el sitio. Tambien puede modificar la configuracion de su navegador para bloquear o eliminar cookies.')}
        </p>
      </Section>

      {/* Third-party cookies */}
      <Section title={t('legalCookieThirdPartyTitle', '4. Cookies de Terceros')}>
        <ul className="list-disc list-inside space-y-1.5 text-sm text-brand-muted">
          <li><span className="font-medium text-brand-dark">Firebase (Google):</span> {t('legalCookieThirdFirebase', 'Autenticacion y almacenamiento')}</li>
          <li><span className="font-medium text-brand-dark">Sentry:</span> {t('legalCookieThirdSentry', 'Monitorizacion de errores')}</li>
        </ul>
      </Section>

      {/* Cookie details table */}
      <Section title={t('legalCookieTableTitle', '5. Detalle de Cookies')}>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-brand-light">
                <th className="text-left px-3 py-2 font-semibold text-brand-dark border-b border-brand-border">{t('legalCookieTableName', 'Nombre')}</th>
                <th className="text-left px-3 py-2 font-semibold text-brand-dark border-b border-brand-border">{t('legalCookieTableProvider', 'Proveedor')}</th>
                <th className="text-left px-3 py-2 font-semibold text-brand-dark border-b border-brand-border">{t('legalCookieTablePurpose', 'Finalidad')}</th>
                <th className="text-left px-3 py-2 font-semibold text-brand-dark border-b border-brand-border">{t('legalCookieTableDuration', 'Duracion')}</th>
                <th className="text-left px-3 py-2 font-semibold text-brand-dark border-b border-brand-border">{t('legalCookieTableType', 'Tipo')}</th>
              </tr>
            </thead>
            <tbody className="text-brand-muted">
              <tr className="border-b border-brand-border/50">
                <td className="px-3 py-2 font-medium">firebase:authUser</td>
                <td className="px-3 py-2">Firebase</td>
                <td className="px-3 py-2">{t('legalCookieTableAuth', 'Autenticacion')}</td>
                <td className="px-3 py-2">{t('legalCookieTableSession', 'Sesion')}</td>
                <td className="px-3 py-2">{t('legalCookieTableEssential', 'Esencial')}</td>
              </tr>
              <tr className="border-b border-brand-border/50">
                <td className="px-3 py-2 font-medium">i18nextLng</td>
                <td className="px-3 py-2">i18next</td>
                <td className="px-3 py-2">{t('legalCookieTableLang', 'Idioma')}</td>
                <td className="px-3 py-2">{t('legalCookieTablePersistent', 'Persistente')}</td>
                <td className="px-3 py-2">{t('legalCookieTableFunctional', 'Funcional')}</td>
              </tr>
              <tr className="border-b border-brand-border/50">
                <td className="px-3 py-2 font-medium">cookie_consent</td>
                <td className="px-3 py-2">MovilNova</td>
                <td className="px-3 py-2">{t('legalCookieTableConsent', 'Preferencia de cookies')}</td>
                <td className="px-3 py-2">12 {t('legalCookieTableMonths', 'meses')}</td>
                <td className="px-3 py-2">{t('legalCookieTableEssential', 'Esencial')}</td>
              </tr>
              <tr className="border-b border-brand-border/50">
                <td className="px-3 py-2 font-medium">sentry-*</td>
                <td className="px-3 py-2">Sentry</td>
                <td className="px-3 py-2">{t('legalCookieTablePerformance', 'Rendimiento')}</td>
                <td className="px-3 py-2">12 {t('legalCookieTableMonths', 'meses')}</td>
                <td className="px-3 py-2">{t('legalCookieTableAnalytics', 'Analisis')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* How to disable */}
      <Section title={t('legalCookieDisableTitle', '6. Como Desactivar las Cookies')}>
        <p className="text-sm text-brand-muted mb-3">
          {t('legalCookieDisableDesc', 'Puede desactivar las cookies desde la configuracion de su navegador. A continuacion le indicamos como hacerlo en los principales navegadores:')}
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-sm text-brand-muted">
          <li>Chrome: {t('legalCookieDisableChrome', 'Configuracion > Privacidad y seguridad > Cookies')}</li>
          <li>Firefox: {t('legalCookieDisableFirefox', 'Opciones > Privacidad y seguridad')}</li>
          <li>Safari: {t('legalCookieDisableSafari', 'Preferencias > Privacidad')}</li>
          <li>Edge: {t('legalCookieDisableEdge', 'Configuracion > Cookies y permisos del sitio')}</li>
        </ul>
      </Section>
    </article>
  );
};

/* ==================== RETURN POLICY ==================== */
const ReturnPolicyContent: React.FC = () => {
  const { t } = useTranslation();

  return (
    <article className="space-y-8">
      <header>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
            <RotateCcw size={20} className="text-brand-primary" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-brand-dark">
            {t('legalReturnsTitle', 'Politica de Devolucion')}
          </h1>
        </div>
        <p className="text-sm text-brand-muted leading-relaxed">
          {t('legalReturnsIntro', 'En cumplimiento del Real Decreto Legislativo 1/2007, de 16 de noviembre, por el que se aprueba el texto refundido de la Ley General para la Defensa de los Consumidores y Usuarios, le informamos sobre sus derechos en materia de devoluciones.')}
        </p>
      </header>

      {/* 1. Right of withdrawal */}
      <Section title={t('legalReturnsWithdrawalTitle', '1. Derecho de Desistimiento')}>
        <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-lg p-4 space-y-2">
          <p className="text-sm text-brand-dark font-medium">
            {t('legalReturnsWithdrawalPeriod', 'Dispone de un plazo de 14 dias naturales desde la recepcion del producto para ejercer su derecho de desistimiento, sin necesidad de justificacion alguna.')}
          </p>
          <p className="text-sm text-brand-muted">
            {t('legalReturnsWithdrawalHow', 'Para ejercer este derecho, debe notificarnos su decision mediante una declaracion clara (por ejemplo, un correo electronico) a la direccion:')} <span className="font-medium text-brand-primary">{COMPANY.email}</span>
          </p>
        </div>
      </Section>

      {/* 2. Conditions */}
      <Section title={t('legalReturnsConditionsTitle', '2. Condiciones de Devolucion')}>
        <ul className="list-disc list-inside space-y-1.5 text-sm text-brand-muted">
          <li>{t('legalReturnsCondition1', 'El producto debe encontrarse en su estado original, sin uso y con todos los embalajes y etiquetas intactos.')}</li>
          <li>{t('legalReturnsCondition2', 'No se aceptaran devoluciones de productos que hayan sido desprecintados por razones de higiene (por ejemplo, protectores de pantalla ya aplicados).')}</li>
          <li>{t('legalReturnsCondition3', 'Los productos personalizados o hechos a medida no admiten devolucion salvo defecto de fabricacion.')}</li>
          <li>{t('legalReturnsCondition4', 'Los accesorios incluidos (manuales, cables, adaptadores) deben devolverse junto con el producto.')}</li>
        </ul>
      </Section>

      {/* 3. Process */}
      <Section title={t('legalReturnsProcessTitle', '3. Proceso de Devolucion')}>
        <div className="flex flex-col gap-2">
          <StepBadge step="1" label={t('legalReturnsStep1', 'Contacte con nosotros por email indicando su numero de pedido y motivo de la devolucion.')} />
          <StepBadge step="2" label={t('legalReturnsStep2', 'Recibira confirmacion e instrucciones de envio en un plazo maximo de 48 horas laborables.')} />
          <StepBadge step="3" label={t('legalReturnsStep3', 'Envie el producto correctamente embalado a la direccion que le indiquemos.')} />
          <StepBadge step="4" label={t('legalReturnsStep4', 'Una vez recibido y verificado el producto, procederemos al reembolso.')} />
        </div>
      </Section>

      {/* 4. Refund */}
      <Section title={t('legalReturnsRefundTitle', '4. Plazos y Forma de Reembolso')}>
        <ul className="list-disc list-inside space-y-1.5 text-sm text-brand-muted">
          <li>{t('legalReturnsRefund1', 'El reembolso se realizara en un plazo maximo de 14 dias naturales desde la recepcion del producto devuelto.')}</li>
          <li>{t('legalReturnsRefund2', 'Se utilizara el mismo metodo de pago empleado en la compra original (Stripe).')}</li>
          <li>{t('legalReturnsRefund3', 'El importe reembolsado incluira el precio del producto. Los gastos de envio originales solo se reembolsaran si la devolucion se debe a un error nuestro o a un producto defectuoso.')}</li>
        </ul>
      </Section>

      {/* 5. Shipping costs */}
      <Section title={t('legalReturnsShippingTitle', '5. Gastos de Devolucion')}>
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-sm text-brand-dark font-medium mb-2">
            {t('legalReturnsShippingCost', 'Los costes de devolucion corren a cargo del consumidor, salvo en los siguientes casos:')}
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-brand-muted">
            <li>{t('legalReturnsShippingException1', 'Producto defectuoso o danado a su llegada.')}</li>
            <li>{t('legalReturnsShippingException2', 'Producto distinto al solicitado.')}</li>
            <li>{t('legalReturnsShippingException3', 'Error imputable a la empresa.')}</li>
          </ul>
        </div>
      </Section>

      {/* 6. Defective products */}
      <Section title={t('legalReturnsDefectiveTitle', '6. Productos Defectuosos o Danados')}>
        <p className="text-sm text-brand-muted mb-3">
          {t('legalReturnsDefectiveDesc', 'Si recibe un producto defectuoso o danado durante el transporte:')}
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-sm text-brand-muted">
          <li>{t('legalReturnsDefective1', 'Notifiquelo en un plazo maximo de 48 horas desde la recepcion.')}</li>
          <li>{t('legalReturnsDefective2', 'Adjunte fotografias del producto y del embalaje.')}</li>
          <li>{t('legalReturnsDefective3', 'Le ofreceremos sustitucion del producto o reembolso integro, a su eleccion.')}</li>
          <li>{t('legalReturnsDefective4', 'Los gastos de envio de la devolucion seran asumidos por nosotros.')}</li>
        </ul>
      </Section>

      {/* 7. Legal warranty */}
      <Section title={t('legalReturnsWarrantyTitle', '7. Garantia Legal')}>
        <p className="text-sm text-brand-muted">
          {t('legalReturnsWarrantyDesc', 'Todos los productos destinados a consumidores gozan de una garantia legal de 3 anos conforme al Real Decreto-ley 7/2021. Durante los primeros 2 anos, se presume que cualquier falta de conformidad ya existia en el momento de la entrega, salvo prueba en contrario.')}
        </p>
      </Section>

      {/* 8. Contact */}
      <Section title={t('legalReturnsContactTitle', '8. Contacto')}>
        <div className="bg-brand-light rounded-lg p-4 space-y-1 text-sm">
          <p><span className="font-medium text-brand-dark">{t('legalReturnsContactEmail', 'Email')}:</span> <span className="text-brand-primary">{COMPANY.email}</span></p>
          <p><span className="font-medium text-brand-dark">{t('legalReturnsContactPhone', 'Telefono')}:</span> <span className="text-brand-muted">{COMPANY.phone}</span></p>
          <p><span className="font-medium text-brand-dark">{t('legalReturnsContactAddress', 'Direccion')}:</span> <span className="text-brand-muted">{COMPANY.address}</span></p>
        </div>
      </Section>
    </article>
  );
};

/* ==================== SHARED UI COMPONENTS ==================== */

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    <h2 className="text-base md:text-lg font-bold text-brand-dark mb-3">{title}</h2>
    {children}
  </section>
);

const RecipientRow: React.FC<{ name: string; purpose: string }> = ({ name, purpose }) => (
  <div className="flex items-start gap-3 p-3 bg-brand-light rounded-lg">
    <ExternalLink size={14} className="text-brand-primary mt-0.5 flex-shrink-0" />
    <div>
      <p className="text-sm font-medium text-brand-dark">{name}</p>
      <p className="text-xs text-brand-muted">{purpose}</p>
    </div>
  </div>
);

const RightBadge: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-2 p-2 bg-brand-light rounded-lg">
    <Shield size={14} className="text-brand-primary flex-shrink-0" />
    <span className="text-sm text-brand-dark">{label}</span>
  </div>
);

const StepBadge: React.FC<{ step: string; label: string }> = ({ step, label }) => (
  <div className="flex items-center gap-2 px-3 py-2 bg-brand-primary/5 border border-brand-primary/20 rounded-lg flex-1">
    <span className="w-6 h-6 rounded-full bg-brand-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{step}</span>
    <span className="text-sm text-brand-dark font-medium">{label}</span>
  </div>
);

export default LegalPage;
