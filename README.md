# Angular + BDS Migration CLI

Herramienta interactiva para migrar proyectos Angular en macOS.

## Qué hace

- **Diagnóstico** — detecta versión de Angular, BDS, si usa standalone, control flow, estado de Git
- **Migra Angular** — versión por versión (16→17→18→19→20) con commit automático en cada paso
- **Migra BDS** — convierte módulos legacy (`BcTableModule`, etc.) a imports standalone automáticamente en todos los `.ts`
- **Migra Standalone** — ejecuta `ng generate @angular/core:standalone`
- **Migra Control Flow** — ejecuta `ng g @angular/core:control-flow` (*ngIf → @if, etc.)
- **Migración completa** — todo en orden recomendado
- **Logs automáticos** — guarda log por sesión en `migration-logs/`
- **Dry-run** — en Angular y BDS puedes ver qué cambiaría sin aplicar nada

## Requisitos

- Node.js 14+
- Angular CLI global: `npm install -g @angular/cli`
- Git instalado

## Uso

```bash
node migrador.js
```

Ingresa el path completo del proyecto cuando lo pida:

```
→ /Users/mazambrano/proyectos/mi-widget
```

## Menú

```
1  Diagnóstico completo
2  Migrar Angular X → 20
3  Migrar BDS (módulos → standalone)
4  Migrar a Standalone
5  Migrar Control Flow (@if/@for)
6  Migración completa
7  Cambiar proyecto
0  Salir
```

## Notas

- El script NO modifica nada sin confirmación previa
- Siempre verifica que Git esté limpio antes de operaciones destructivas
- Los logs quedan en `<proyecto>/migration-logs/migration-<fecha>.log`
