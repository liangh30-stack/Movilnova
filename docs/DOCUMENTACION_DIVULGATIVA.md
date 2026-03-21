# MovilNova - Plataforma Inteligente para Tiendas de Reparación de Móviles

## Introducción

MovilNova es una plataforma digital todo-en-uno diseñada para tiendas de reparación y accesorios de teléfonos móviles. Combina una tienda online de accesorios, un sistema de gestión de reparaciones, un panel de administración completo y herramientas de inteligencia artificial, todo accesible desde cualquier dispositivo con conexión a internet.

La plataforma está disponible como aplicación web progresiva (PWA), lo que significa que los usuarios pueden instalarla en su teléfono como si fuera una app nativa, recibir notificaciones y usarla incluso sin conexión.

---

## Qué problema resuelve

Las tiendas de reparación de móviles suelen depender de múltiples herramientas desconectadas: una hoja de cálculo para el inventario, WhatsApp para comunicarse con clientes, una web genérica para vender accesorios, y papel para anotar las reparaciones. Esto genera:

- **Pérdida de tiempo** gestionando datos en diferentes sitios
- **Errores humanos** al calcular precios, impuestos o stock manualmente
- **Falta de visibilidad** para los clientes sobre el estado de sus reparaciones
- **Dificultad para vender online** sin conocimientos técnicos avanzados
- **Imposibilidad de analizar** qué productos se venden más o qué servicios son más rentables

MovilNova unifica todo esto en una sola plataforma profesional, moderna y fácil de usar.

---

## Principales características

### Para los clientes

- **Tienda online de accesorios**: Catálogo con filtros por marca, modelo, categoría y precio. Imágenes de alta calidad, variantes de color, y sistema de valoraciones con estrellas.
- **Carrito de compra inteligente**: Guarda los productos aunque el cliente cierre el navegador. Si inicia sesión, el carrito se sincroniza entre dispositivos. Los productos del carrito se mantienen durante 30 días.
- **Lista de favoritos**: Guardar productos para comprar después. Se fusionan automáticamente al iniciar sesión desde otro dispositivo.
- **Pago seguro con Stripe**: Tarjeta de crédito/débito, Google Pay y Apple Pay. Los precios se validan en el servidor para evitar manipulaciones.
- **Compra como invitado**: No es obligatorio registrarse para comprar. Solo se necesita email, nombre y dirección de envío.
- **Códigos promocionales y ofertas**: Descuentos por porcentaje o importe fijo, ofertas "compra 3 y paga 2", regalos con compra, y más.
- **Envío gratuito**: A partir de un importe configurable (por defecto 30 €), el envío es gratis.
- **Seguimiento de reparaciones**: Cualquier cliente puede consultar el estado de su reparación introduciendo su número de referencia, sin necesidad de llamar.
- **Cuenta personal**: Registro con email o cuenta de Google. Gestión de direcciones de envío, historial de pedidos, perfil y favoritos.
- **Notificaciones automáticas**: Emails HTML profesionales con el detalle del pedido (productos, precios, estado) cada vez que cambia el estado. También notificaciones push en el navegador/móvil.
- **Multiidioma**: Disponible en español, inglés, francés, alemán y chino. El idioma se detecta automáticamente según el navegador.
- **Modo oscuro**: Interfaz adaptable para uso cómodo de noche.
- **Páginas legales**: Política de privacidad, términos y condiciones, aviso legal y política de cookies, todo accesible desde el footer.

### Para los administradores

- **Panel de administración completo**: Acceso protegido por PIN para empleados con diferentes roles (admin, superadmin, trabajador).
- **Gestión de productos**: Crear, editar y eliminar productos. Subir múltiples imágenes. Gestión de stock con historial de cambios.
- **Gestión de pedidos**: Ver todos los pedidos, actualizar estados (pendiente, procesando, pagado, enviado, entregado, cancelado), añadir números de seguimiento.
- **Gestión de clientes**: Consultar perfiles, gestionar roles, y procesar solicitudes de eliminación de cuenta.
- **Analíticas de ventas**: Gráficos de ingresos, productos más vendidos, tendencias y métricas clave del negocio.
- **Configuración de la tienda**: Ajustar IVA, costes de envío, umbral de envío gratuito, modo mantenimiento, banners promocionales.
- **Códigos promocionales**: Crear y gestionar descuentos con límites de uso, fecha de caducidad y compra mínima.
- **Ofertas especiales**: Configurar promociones tipo "compra X paga Y", regalos automáticos y packs.
- **Registro de auditoría**: Historial completo de todas las acciones realizadas por los empleados.
- **Diagnóstico con IA**: Herramienta de inteligencia artificial (Gemini) para ayudar a diagnosticar problemas de dispositivos.
- **Gestión de disputas**: Los contracargos (chargebacks) de Stripe se registran automáticamente en el historial del pedido para revisión manual.
- **Modo mantenimiento**: Permite desactivar temporalmente la tienda para clientes manteniendo el acceso admin.
- **Banners promocionales**: Activar y personalizar banners en la cabecera de la tienda.
- **Gestión de marcas y modelos**: Catálogo configurable de marcas (Apple, Samsung, Xiaomi, Huawei, Oppo, Google) con sus modelos compatibles.
- **Carrusel de inicio**: Banner rotativo configurable en la página principal.

---

## Ejemplos de uso

### Ejemplo 1: Un cliente compra una funda

1. El cliente entra en movilnova.es desde su móvil
2. Filtra por su marca (Samsung) y modelo (Galaxy S24)
3. Elige una funda, selecciona el color y la añade al carrito
4. Aplica un código de descuento del 10%
5. Completa el pago con Google Pay
6. Recibe confirmación por email y notificación push cuando el pedido se envía

### Ejemplo 2: Seguimiento de una reparación

1. Un cliente deja su iPhone para reparar la pantalla
2. El técnico registra la reparación en el panel y le da un código (ej: WX-1234)
3. El cliente entra en movilnova.es/reparaciones y escribe su código
4. Ve el progreso en tiempo real: "En diagnóstico" → "Reparando" → "Listo para recoger"
5. Recibe una notificación push cuando la reparación está lista

### Ejemplo 3: Gestión diaria del administrador

1. El encargado abre el panel de admin e introduce su PIN
2. Revisa los pedidos nuevos del día y los marca como "procesando"
3. Consulta las analíticas para ver qué productos se vendieron más esta semana
4. Crea un código promocional "VERANO15" con un 15% de descuento
5. Activa un banner en la tienda anunciando la promoción

---

## Beneficios para el usuario

### Para el dueño del negocio
- **Reducción de costes**: No necesita contratar desarrollo de tienda online por separado
- **Profesionalidad**: Web moderna y rápida que genera confianza en los clientes
- **Control total**: Gestiona productos, pedidos, empleados y configuración desde un solo lugar
- **Trazabilidad**: Historial completo de ventas, cambios de inventario y acciones de empleados
- **Escalabilidad**: Funciona igual con 10 o con 10.000 productos

### Para los clientes
- **Comodidad**: Comprar accesorios y consultar reparaciones desde casa, a cualquier hora
- **Transparencia**: Precios claros con IVA incluido, seguimiento en tiempo real
- **Seguridad**: Pagos procesados por Stripe, datos protegidos, cumplimiento RGPD
- **Accesibilidad**: Funciona en cualquier dispositivo y navegador, con modo oscuro y múltiples idiomas
- **Instalable**: Se puede instalar como app en el teléfono sin pasar por la App Store

### Para los empleados
- **Facilidad de uso**: Interfaz intuitiva con PIN de acceso rápido
- **Menos errores**: Cálculos automáticos de impuestos, descuentos y stock
- **Herramientas IA**: Diagnóstico asistido por inteligencia artificial para reparaciones
- **Información en tiempo real**: Pedidos, inventario y estadísticas siempre actualizados

---

## Disponibilidad

MovilNova está desplegada en **movilnova.es** y funciona en todos los navegadores modernos (Chrome, Safari, Firefox, Edge) tanto en ordenador como en móvil. Al ser una PWA, se puede instalar directamente desde el navegador sin necesidad de tiendas de aplicaciones.

### Marcas compatibles

El catálogo incluye compatibilidad con las principales marcas del mercado:

- **Apple**: iPhone 15 a iPhone 7 (28 modelos)
- **Samsung**: Galaxy S24 a Galaxy A (21 modelos)
- **Xiaomi**: Xiaomi 14, Redmi Note, POCO (14 modelos)
- **Huawei**: P60, Mate, Nova (10 modelos)
- **Oppo**: Reno, Find X (9 modelos)
- **Google**: Pixel 8 a Pixel 6 (7 modelos)

Las marcas y modelos son completamente configurables desde el panel de administración.

---

## Privacidad y seguridad

- Cumplimiento del **Reglamento General de Protección de Datos (RGPD)**
- Los clientes pueden solicitar la eliminación de su cuenta (se ejecuta en 30 días con posibilidad de cancelación)
- Los pagos son procesados por **Stripe**, certificado PCI DSS nivel 1
- Las contraseñas nunca se almacenan en texto plano (gestionadas por Firebase Authentication)
- Los datos sensibles nunca se envían sin cifrar (HTTPS obligatorio)
- Banner de consentimiento de cookies conforme a la legislación europea
