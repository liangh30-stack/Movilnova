# Tokens de Diseño MovilNova

Especificaciones del sistema de diseño para uso unificado entre diseñadores UI e ingenieros.

---

## Colores (Colors)

| Token | Valor | Propósito |
|-------|-------|-----------|
| `brand.primary` | `#1e3a5f` | Color principal, confianza, profesional |
| `brand.accent` | `#f97316` | Color de énfasis, CTA, destacados |
| `brand.dark` | `#0f172a` | Fondo oscuro, títulos |
| `brand.light` | `#f8fafc` | Fondo claro |
| `brand.pink` | `#f97316` | Alias compatible, igual a accent |
| `brand.teal` | `#1e3a5f` | Alias compatible, igual a primary |

### Colores Semánticos
- Éxito: `green-500` / `#22c55e`
- Advertencia: `yellow-500` / `#eab308`
- Error: `red-500` / `#ef4444`
- Información: `blue-500` / `#3b82f6`

---

## Tipografía (Typography)

| Token | Valor | Propósito |
|-------|-------|-----------|
| `font-sans` | Poppins, sans-serif | Fuente global predeterminada |
| Título H1 | `text-4xl md:text-6xl font-black` | Título principal Hero |
| Título H2 | `text-2xl md:text-4xl font-bold` | Título de sección |
| Título H3 | `text-xl font-semibold` | Título de tarjeta |
| Cuerpo de texto | `text-base` | Texto por defecto |
| Texto pequeño | `text-sm` | Información auxiliar |

---

## Espaciado (Spacing)

| Token | Valor | Propósito |
|-------|-------|-----------|
| Padding del contenedor | `px-4` / `md:px-6` | Margen de página |
| Espaciado entre bloques | `gap-6` / `gap-8` | Espaciado entre componentes |
| Padding interno de tarjeta | `p-6` | Contenido de tarjeta |
| Padding de botón | `px-6 py-3` / `px-8 py-4` | Tamaño de botón |

---

## Bordes Redondeados (Border Radius)

| Token | Valor | Propósito |
|-------|-------|-----------|
| Pequeño | `rounded-lg` (8px) | Botones, campos de entrada |
| Mediano | `rounded-xl` (12px) | Tarjetas |
| Grande | `rounded-2xl` (16px) | Tarjetas grandes, modales |
| Círculo completo | `rounded-full` | Insignias, avatares |

---

## Sombras (Shadows)

| Token | Propósito |
|-------|-----------|
| `shadow-lg` | Tarjetas flotantes |
| `shadow-xl` | Modales, menús desplegables |
| `shadow-2xl` | Hero, áreas de énfasis |
| `shadow-brand-accent/25` | Brillo de botón CTA |

---

## Puntos de Quiebre Responsivos (Breakpoints)

| Punto de quiebre | Ancho | Propósito |
|------------------|-------|-----------|
| móvil | < 640px | Teléfonos |
| tablet | 640px - 1024px | Tabletas |
| escritorio | > 1024px | Escritorio |

Prefijos Tailwind: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px)

---

## Movimiento (Motion)

| Token | Valor | Propósito |
|-------|-------|-----------|
| Transición | `transition-all duration-200` | Interacción predeterminada |
| Suavizado | `ease-out` | Aparecer, expandir |
| Hover | `hover:scale-105` / `hover:-translate-y-1` | Flotación de tarjetas |

---

## Normas de Uso

1. **Priorizar clases de Tailwind**, evitar CSS personalizado
2. **Colores** usar `brand-*` o colores semánticos de Tailwind
3. **Espaciado** usar múltiplos de 4 (4, 8, 12, 16, 24, 32)
4. **Mantener consistencia**: Los nuevos componentes deben seguir los patrones de estilo de Storefront y Hero3D existentes
