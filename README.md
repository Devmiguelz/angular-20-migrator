# Angular + BDS Migration CLI

Herramienta interactiva para migrar proyectos Angular y microfront en macOS. Sin dependencias externas — solo Node.js.

## Uso

```bash
node migrador.js
```

Ingresa el path completo del proyecto cuando lo pida (soporta `~`):

```
→ /Users/mazambrano/proyectos/mi-widget
```

---

## Menú

```
1   Diagnóstico completo
2   Migrar Angular X → 20
3   Migrar BDS (módulos → standalone)
4   Migrar a Standalone
5   Migrar Control Flow (@if/@for)
6   Migración completa (todo en orden)
7   Cambiar proyecto
8   Eliminar @bancolombia/core-utils-widgets-web
9   Reestructura de carpetas (patrón registered-accounts)
10  Migrar Microfront (NgModule → standalone + Angular 20)
11  Convertir standalone: false → standalone: true
0   Salir
```

---

## Descripción de cada opción

### 1 — Diagnóstico
Muestra el estado completo del proyecto sin modificar nada:
- Versión de Angular y BDS instaladas
- Cuántos componentes son standalone vs NgModule
- Cuántos templates usan `*ngIf`/`*ngFor` vs `@if`/`@for`
- Módulos BDS legacy detectados
- Estado de Git (limpio / cambios pendientes)
- Angular CLI disponible / node_modules instalados

### 2 — Migrar Angular X → 20
Sube la versión de Angular paso a paso (ej: 16→17→18→19→20).
- Verifica que Git esté limpio antes de empezar
- Hace commit automático en cada versión migrada
- Opción dry-run disponible

### 3 — Migrar BDS (módulos → standalone)
Escanea todos los `.ts` y reemplaza automáticamente módulos BDS legacy (`BcTableModule`, etc.) por sus equivalentes standalone (`BcTableDirective`, etc.).
- Empareja cada `.ts` con su `.html` para detectar por tag HTML
- Cubre los 35+ módulos del mapping BDS 14/15 → 16
- Opción dry-run disponible

### 4 — Migrar a Standalone
Ejecuta `ng generate @angular/core:standalone` con tres sub-pasos:
1. `convert-to-standalone`
2. `prune-ng-modules`
3. `standalone-bootstrap`

### 5 — Migrar Control Flow
Ejecuta `ng g @angular/core:control-flow` para transformar `*ngIf`/`*ngFor` a `@if`/`@for` en templates.

### 6 — Migración completa
Ejecuta 2 → 3 → 4 → 5 en orden con confirmación previa.

### 8 — Eliminar @bancolombia/core-utils-widgets-web
Elimina la dependencia y reemplaza cada uso siguiendo el patrón de `registered-accounts-widget`:

| Symbol (core-utils) | Reemplazo |
|---|---|
| `IWidgetConfigurationModel` | Interface local `ICoreWidgetConfig` generada en el archivo |
| `IInfrastructureMappingModel` | `{ gateway: any; implementation: any }[]` |
| `IBaseUsecase<T>` | Se elimina el `implements` — TypeScript lo infiere |
| `BaseService` (gateway) | `abstract class` sin herencia |
| `HTTP_METHODS` | Strings literales `'GET'`, `'POST'`, `'PUT'`, `'DELETE'` |
| `@Identifier('Name')` | Decorator eliminado |
| `IEndpointsModel` + `@Inject` | `inject(TOKEN)` con tipo propio |
| `baseRequest(...)` | `HttpClient.get/post/put/delete` con `HttpHeaders` |
| `IBaseMapper<T>` | Interface local `IMapper<T>` |

- Elimina la entrada de `package.json`
- **No hace commit**
- Opción dry-run disponible

### 9 — Reestructura de carpetas
Migra la estructura plana al patrón `registered-accounts-widget`:

```
# Antes
projects/<widget>/src/lib/
  domain/
  infraestructure/
  ui/
  mocks/
  utils/

# Después
projects/<widget>/src/lib/
  features/
    <nombre-feature>/
      application/
        domain/
        infrastructure/   ← corrige el typo
        ui/
      testing/
        mock/
```

- Los archivos raíz (`*.config.ts`, `*.routes.ts`, `*.tokens.ts`) no se mueven
- Recalcula todos los imports relativos
- Actualiza `public-api.ts`
- **No hace commit**
- Dry-run muestra el plan completo antes de aplicar

### 10 — Migrar Microfront (NgModule → standalone + Angular 20)

Migra un microfront single-spa de la arquitectura NgModule (Angular 16) a standalone (Angular 20), siguiendo el patrón de `mf-registered-accounts` y `mf-associate-transactions-and-channels`.

**Detecta automáticamente desde el proyecto:**
- El widget instalado (`@bancolombia/...-widget-web`)
- El `forRoot({...})` con todos los endpoints y operationIds
- El componente `bc-*` wrapper
- La ruta principal y las `WIDGET_ROUTES`
- El template selector de single-spa (`<mf-nombre />`)

**Lo que genera/modifica:**

| Archivo | Acción |
|---|---|
| `src/app/app.ts` | Generado nuevo — componente raíz standalone con `RouterOutlet` |
| `src/app/app.config.ts` | Generado nuevo — `ApplicationConfig` con `importProvidersFrom...Widget(config)` |
| `src/app/app.routes.ts` | Generado nuevo — `Routes[]` con la ruta y `WIDGET_ROUTES` del widget |
| `src/main.single-spa.ts` | Reemplazado — `bootstrapApplication(App, appConfig)` |
| `src/app/bc-*.component.ts` | Reemplazado — componente standalone que importa el `WidgetComponent` |
| `src/app/app.module.ts` | **Eliminado** |
| `src/app/app-routing.module.ts` | **Eliminado** |
| `tsconfig.json` | Actualizado — `moduleResolution: bundler`, `references`, sin flags obsoletos |
| `jest.config.js` | Actualizado — agrega `testEnvironment: "jsdom"` |
| `package.json` | Actualizado — `single-spa-angular@9.2.0`, `@angular-builders/custom-webpack@20.0.0`, `zone.js@0.16.1`, `jest-preset-angular@16.1.2`, elimina `core-utils-widgets-web` |

**Flujo de ejecución:**
1. Detecta si el proyecto es un MF (busca `main.single-spa.ts` y `single-spa-angular`)
2. Pregunta si también ejecutar `ng update` (migración Angular, opcional)
3. Genera los 3 archivos nuevos (`app.ts`, `app.config.ts`, `app.routes.ts`)
4. Reemplaza `main.single-spa.ts` y el componente `bc-*`
5. Elimina `app.module.ts` y `app-routing.module.ts`
6. Actualiza `tsconfig.json`, `jest.config.js` y `package.json`

**No hace commit.**

**Revisión manual después de ejecutar:**
- Verificar el nombre del componente standalone exportado por el widget (debe coincidir con el import generado en `bc-*.ts`)
- Ajustar tipos en `app.config.ts` si el widget usa una interface de config específica
- Migrar módulos adicionales como `BcIllustrationModule.forRoot()` (marcados con `// TODO` en el archivo generado)
- Ejecutar `npm install --legacy-peer-deps` tras la actualización de dependencias
- Ejecutar `npm run build` y `npm test`

### 11 — Convertir standalone: false → standalone: true

Cuando `ng generate @angular/core:standalone` no logra convertir los componentes completamente (los deja con `standalone: false` en vez de `standalone: true`), esta opción lo hace directamente en el código:

- **`standalone: false` → `standalone: true`** — reemplaza en todos los `.ts` del proyecto
- **Sin propiedad standalone** — la agrega justo después del `selector:` en el `@Component`
- Omite `.spec.ts` y `.module.ts` (no son componentes)
- Dry-run disponible para previsualizar sin guardar
- **No hace commit**

**Orden recomendado cuando `ng generate` falla:**

1. Opción `2` — Migrar Angular 16 → 20
2. Opción `11` — Convertir `standalone: false` → `standalone: true`
3. Opción `3` — Migrar BDS (rellena `imports: []` con BDS y componentes internos)
4. Opción `8` — Eliminar core-utils
5. Opción `5` — Control Flow
6. Opción `9` — Reestructura de carpetas

---

## Requisitos

- Node.js 14+
- Angular CLI global: `npm install -g @angular/cli`
- Git instalado

---

## Logs

Cada sesión genera un log en `<proyecto>/migration-logs/migration-<fecha>.log`.

---

## Proyectos de referencia

### Widgets (projects/)
| Proyecto | Angular | BDS | core-utils | Estructura |
|---|---|---|---|---|
| `manage-massive-campaigns-widget` | 16 | 13 | tiene | plana |
| `alerts-and-notifications-log-widget` | 16 | 13 | tiene | plana |
| `registered-accounts-widget` | 20 | 16 | **sin ella** | features/ |
| `associate-transactions-and-channels-widget` | 20 | 16 | **sin ella** | features/ |

### Microfront (mf-*)
| Proyecto | Angular | single-spa | Patrón | Estado |
|---|---|---|---|---|
| `mf-manage-massive-campaigns` | 16 | 9.1.2 | NgModule | **migrar** |
| `mf-alerts-and-notifications-log` | 16 | 8.1.0 | NgModule | **migrar** |
| `mf-registered-accounts` | 20 | 9.2.0 | standalone | referencia ✓ |
| `mf-associate-transactions-and-channels` | 20 | 9.2.0 | standalone | referencia ✓ |