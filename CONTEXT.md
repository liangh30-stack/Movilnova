# Contexto del Proyecto MovilNova

## Visión General del Proyecto

**Nombre del Proyecto**: MovilNova
**Tipo**: Sistema de Gestión SaaS para Talleres de Reparación
**Estado**: En Desarrollo

## Stack Tecnológico

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 18.x | Framework UI |
| TypeScript | 5.x | Seguridad de Tipos |
| Vite | 5.x | Herramienta de Build |
| Tailwind CSS | 3.x | Framework de Estilos |

### Servicios Backend
| Servicio | Propósito |
|----------|-----------|
| Firebase Auth | Autenticación de Usuarios |
| Firestore | Base de Datos |
| Gemini API | Funcionalidad IA |

### Herramientas de Desarrollo
- ESLint + Prettier (Estándares de código)
- Git (Control de versiones)

---

## Estructura del Proyecto

```
/movilnova
├── components/           # Componentes React
│   ├── AIAssistant.tsx      # Asistente de chat IA
│   ├── AdminLogin.tsx       # Login de administrador
│   ├── AttendancePanel.tsx  # Panel de asistencia
│   ├── CustomCaseCreator.tsx # Creador de carcasas personalizadas
│   ├── Dashboard.tsx        # Dashboard de gestión (incluye portal de empleados)
│   ├── Hero3D.tsx           # Componente Hero
│   ├── KanbanBoard.tsx      # Tablero Kanban
│   ├── ProductManager.tsx   # Gestión de productos
│   ├── RepairForm.tsx       # Formulario de reparación
│   ├── RepairLookup.tsx     # Consulta de reparaciones
│   ├── Storefront.tsx       # Página de tienda para clientes
│   └── SyncSettings.tsx     # Configuración de sincronización
│
├── services/             # Capa de servicios
│   ├── authService.ts       # Servicio de autenticación
│   ├── firebase.ts          # Configuración Firebase
│   ├── geminiService.ts     # API Gemini
│   └── productService.ts    # Servicio de productos
│
├── App.tsx               # Punto de entrada principal de la aplicación
├── types.ts              # Definiciones de tipos globales
├── constants.ts          # Configuración de constantes
├── index.tsx             # Archivo de entrada
├── index.html            # Plantilla HTML
├── vite.config.ts        # Configuración Vite
├── tsconfig.json         # Configuración TypeScript
└── package.json          # Gestión de dependencias
```

---

## Módulos de Funcionalidad Principal

### 1. Portal del Cliente (Storefront)
- Reserva de reparaciones
- Consulta de órdenes
- Navegación de productos

### 2. Portal de Empleados (Dashboard)
- Tablero Kanban de tareas
- Procesamiento de órdenes de trabajo
- Control de asistencia

### 3. Panel de Administración (Dashboard)
- Estadísticas de datos
- Gestión de usuarios
- Gestión de inventario
- Gestión de empleados

### 4. Funcionalidad IA (AIAssistant)
- Diagnóstico inteligente
- Q&A de servicio al cliente
- Sugerencias de órdenes de trabajo

---

## Restricciones de Diseño

### Debe Cumplirse
- Modo estricto de TypeScript (`strict: true`)
- Principio de responsabilidad única de componentes
- Prioridad a clases nativas de Tailwind
- Reglas de seguridad de Firebase

### Prohibiciones
- Usar tipo `any`
- Estilos inline (excepto valores dinámicos)
- Almacenar información sensible en el cliente
- Promise rejection sin manejar

---

## Convenciones de Nomenclatura

### Nomenclatura de Archivos
- Componentes: `PascalCase.tsx` (ej., `RepairForm.tsx`)
- Servicios: `camelCase.ts` (ej., `authService.ts`)
- Tipos: `camelCase.ts` o inline

### Nomenclatura de Variables
- Componentes: `PascalCase`
- Funciones: `camelCase`
- Constantes: `UPPER_SNAKE_CASE`
- Tipos/Interfaces: `PascalCase`

### Nomenclatura de Clases CSS
- Usar clases nativas de Tailwind
- Clases personalizadas usar kebab-case

---

## Variables de Entorno

```env
# .env.local
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
VITE_GEMINI_API_KEY=xxx
```

**Nota**: Todas las variables de entorno deben comenzar con `VITE_` para ser accesibles en el cliente.

---

## Flujo de Trabajo Git

### Estrategia de Ramas
- `main`: Entorno de producción
- `develop`: Entorno de desarrollo
- `feature/*`: Nuevas funcionalidades
- `fix/*`: Corrección de bugs

### Convención de Commits
```
<type>(<scope>): <description>

type: feat | fix | docs | style | refactor | test | chore
scope: nombre del componente o módulo
```

Ejemplos:
```
feat(RepairForm): agregar carga de imágenes
fix(auth): manejar expiración de token
```

---

## Comandos de Tareas Comunes

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Vista previa del build
npm run preview

# Verificación de tipos
npx tsc --noEmit

# Lint
npm run lint
```

---

## Limitaciones Conocidas

1. **Sin SSR**: Actualmente usa renderizado puro del lado del cliente
2. **Sin Tests**: Aún no se ha configurado framework de testing
3. **Sin CI/CD**: Despliegue manual
4. **Sin Internacionalización**: Solo soporta inglés/chino hardcodeado

---

## Mejoras Pendientes

- [ ] Agregar tests unitarios (Vitest)
- [ ] Configurar CI/CD (GitHub Actions)
- [ ] Agregar seguimiento de errores (Sentry)
- [ ] Soporte de internacionalización (i18next)
- [ ] Soporte PWA

---

## Documentación Relacionada

- [AGENTS.md](./AGENTS.md) - Definición de Agentes
- [PRODUCT.md](./PRODUCT.md) - Posicionamiento del Producto
- [README.md](./README.md) - Descripción del Proyecto
