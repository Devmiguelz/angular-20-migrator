# Angular + BDS Migration CLI

Herramienta interactiva para migrar proyectos Angular en macOS. Sin dependencias externas — solo Node.js.

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
1  Diagnóstico completo
2  Migrar Angular X → 20
3  Migrar BDS (módulos → standalone)
4  Migrar a Standalone
5  Migrar Control Flow (@if/@for)
6  Migración completa (todo en orden)
7  Cambiar proyecto
8  Eliminar @bancolombia/core-utils-widgets-web
9  Reestructura de carpetas (patrón registered-accounts)
0  Salir
```

---

## Descripción de cada opción

### 1 — Diagnóstico
Muestra el estado completo del proyecto antes de tocar nada:
- Versión de Angular y BDS instaladas
- Cuántos componentes son standalone vs NgModule
- Cuántos templates usan `*ngIf`/`*ngFor` vs `@if`/`@for`
- Módulos BDS legacy detectados
- Estado de Git (limpio / cambios pendientes)
- Angular CLI disponible / node_modules instalados

### 2 — Migrar Angular X → 20
Sube la versión de Angular paso a paso (ej: 16→17→18→19→20).
- Verifica que Git esté limpio antes de empezar
- Hace commit automático en cada versión
- Opción dry-run para previsualizar sin aplicar

### 3 — Migrar BDS (módulos → standalone)
Escanea todos los `.ts` del proyecto y reemplaza automáticamente los módulos legacy de BDS (`BcTableModule`, `BcButtonModule`, etc.) por sus equivalentes standalone (`BcTableDirective`, `BcButtonDirective`, etc.).
- Empareja cada `.ts` con su `.html` para detectar componentes por tag
- Procesa los 35+ módulos del mapping de BDS 14/15 → 16
- Opción dry-run disponible

### 4 — Migrar a Standalone
Ejecuta `ng generate @angular/core:standalone` con tres sub-pasos seleccionables:
1. `convert-to-standalone` — convierte componentes/pipes/directivas
2. `prune-ng-modules` — elimina NgModules vacíos
3. `standalone-bootstrap` — migra bootstrapModule → bootstrapApplication

### 5 — Migrar Control Flow
Ejecuta `ng g @angular/core:control-flow` para transformar `*ngIf`/`*ngFor`/`ngSwitch` a `@if`/`@for`/`@switch` en los templates.

### 6 — Migración completa
Ejecuta las opciones 2 → 3 → 4 → 5 en orden con confirmación previa.

### 8 — Eliminar @bancolombia/core-utils-widgets-web
Elimina la dependencia y reemplaza cada uso siguiendo el patrón de `registered-accounts-widget`:

| Symbol (core-utils) | Reemplazo |
|---|---|
| `IWidgetConfigurationModel` | Interface local `ICoreWidgetConfig` generada en el archivo |
| `IInfrastructureMappingModel` | `{ gateway: any; implementation: any }[]` |
| `IBaseUsecase<T>` | Se elimina el `implements` — TypeScript infiere la forma |
| `BaseService` (en gateway) | `abstract class` sin herencia |
| `HTTP_METHODS` | Strings literales `'GET'`, `'POST'`, `'PUT'`, `'DELETE'` |
| `@Identifier('Name')` | Decorator eliminado |
| `IEndpointsModel` + `@Inject` | `inject(TOKEN)` con tipo propio |
| `baseRequest(...)` | `HttpClient.get/post/put/delete` directos con `HttpHeaders` |
| `IBaseMapper<T>` | Interface local `IMapper<T>` generada en el archivo |

- Elimina la entrada de `package.json` automáticamente
- **No hace commit**
- Opción dry-run disponible
- Muestra advertencia de revisión manual para los `baseRequest` complejos

### 9 — Reestructura de carpetas
Migra la estructura plana al patrón de `registered-accounts-widget`:

**Antes:**
```
projects/<widget>/src/lib/
  domain/
  infraestructure/   ← typo original
  ui/
  mocks/
  utils/
```

**Después:**
```
projects/<widget>/src/lib/
  features/
    <nombre-feature>/
      application/
        domain/
        infrastructure/   ← corregido
        ui/
      testing/
        mock/
```

- Los archivos raíz (`*.config.ts`, `*.routes.ts`, `*.tokens.ts`, `injection.constants.ts`) **no se mueven**
- Recalcula automáticamente todos los imports relativos entre archivos
- Actualiza `public-api.ts`
- Limpia las carpetas vacías que quedan tras el movimiento
- **No hace commit**
- Dry-run obligatorio antes de aplicar — muestra exactamente qué se mueve

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

| Proyecto | Angular | BDS | core-utils | Estructura |
|---|---|---|---|---|
| `manage-massive-campaigns-widget` | 16 | 13 | ✗ usar | plana |
| `alerts-and-notifications-log-widget` | 16 | 13 | ✗ usar | plana |
| `registered-accounts-widget` | 20 | 16 | ✓ sin ella | features/ |
| `associate-transactions-and-channels-widget` | — | — | referencia | mixta |