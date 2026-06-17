#!/usr/bin/env node

/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║         Angular + BDS Migration CLI · macOS             ║
 * ║  Angular 16→20  ·  BDS módulos→standalone  ·  ng cmds  ║
 * ╚══════════════════════════════════════════════════════════╝
 */

const path     = require('path');
const fs       = require('fs');
const { execSync, spawnSync } = require('child_process');
const readline = require('readline');

// ─── COLORES ────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  cyan:   '\x1b[36m',
  white:  '\x1b[37m',
  bgBlue: '\x1b[44m',
};
const ok    = (s) => `${C.green}✔${C.reset} ${s}`;
const warn  = (s) => `${C.yellow}⚠${C.reset}  ${s}`;
const err   = (s) => `${C.red}✖${C.reset}  ${s}`;
const info  = (s) => `${C.cyan}ℹ${C.reset}  ${s}`;
const step  = (s) => `\n${C.bold}${C.blue}▶${C.reset} ${C.bold}${s}${C.reset}`;
const title = (s) => `\n${C.bold}${C.bgBlue}${C.white}  ${s}  ${C.reset}\n`;
const dim   = (s) => `${C.dim}${s}${C.reset}`;

// ─── BDS MAPPINGS ───────────────────────────────────────────
const BDS_MAP = {
  BcCircleLoadingModule:  { pkg: 'bc-circle-loading',  standalone: ['BcCircleLoadingComponent'] },
  BcSearchModule:         { pkg: 'bc-search',           standalone: ['BcSearchComponent','BcSearchLeftComponent','BcSearchAdvancedComponent','BcSearchAdvancedItemComponent','BcSearchResultFilterComponent','BcSearchButtonComponent','BcSearchContentItemsComponent'] },
  BcInputModule:          { pkg: 'bc-input',            standalone: ['BcInputDirective','BcFormFieldComponent'] },
  BcFormFieldModule:      { pkg: 'bc-input',            standalone: ['BcFormFieldComponent','BcInputDirective'] },
  BcButtonModule:         { pkg: 'bc-button',           standalone: ['BcButtonDirective'] },
  BcTableModule:          { pkg: 'bc-table',            standalone: ['BcTableDirective','BcCellDirective','BcTableContainerComponent','BcTableContentComponent','BcTableHeaderComponent','BcTableFooterComponent','BcTableDropdownComponent'] },
  BcPaginatorV2Module:    { pkg: 'bc-paginator-v2',     standalone: ['BcPaginatorV2Component'] },
  BcPaginatorModule:      { pkg: 'bc-paginator',        standalone: ['BcPaginatorComponent'] },
  BcIconModule:           { pkg: 'bc-icon',             standalone: ['BcIconComponent'] },
  BcModalModule:          { pkg: 'bc-modal',            standalone: ['BcModalComponent'] },
  BcBreadcrumbModule:     { pkg: 'bc-breadcrumb',       standalone: ['BcBreadcrumbComponent'] },
  BcShortcutModule:       { pkg: 'bc-shortcut',         standalone: ['BcShortcutGroupComponent','BcShortcutComponent'] },
  BcStepperModule:        { pkg: 'bc-stepper',          standalone: ['BcStepperComponent'] },
  BcAlertModule:          { pkg: 'bc-alert',            standalone: ['BcAlertComponent'] },
  BcPictogramModule:      { pkg: 'bc-pictogram',        standalone: ['BcPictogramComponent'] },
  BcTooltipModule:        { pkg: 'bc-tooltip',          standalone: ['BcTooltipDirective'] },
  BcAccordionModule:      { pkg: 'bc-accordion',        standalone: ['BcAccordionComponent','BcAccordionItemComponent'] },
  BcTabsModule:           { pkg: 'bc-tabs',             standalone: ['BcTabsComponent','BcTabComponent'] },
  BcRadioModule:          { pkg: 'bc-radio',            standalone: ['BcRadioComponent'] },
  BcCheckboxModule:       { pkg: 'bc-checkbox',         standalone: ['BcCheckboxComponent'] },
  BcSelectModule:         { pkg: 'bc-select',           standalone: ['BcSelectComponent'] },
  BcCardModule:           { pkg: 'bc-card',             standalone: ['BcCardComponent'] },
  BcTagModule:            { pkg: 'bc-tag',              standalone: ['BcTagComponent'] },
  BcChipModule:           { pkg: 'bc-chip',             standalone: ['BcChipComponent'] },
  BcBadgeModule:          { pkg: 'bc-badge',            standalone: ['BcBadgeComponent'] },
  BcProgressModule:       { pkg: 'bc-progress',         standalone: ['BcProgressComponent'] },
  BcToggleModule:         { pkg: 'bc-toggle',           standalone: ['BcToggleComponent'] },
  BcUploadModule:         { pkg: 'bc-upload',           standalone: ['BcUploadComponent'] },
  BcDatepickerModule:     { pkg: 'bc-datepicker',       standalone: ['BcDatepickerComponent'] },
  BcSliderModule:         { pkg: 'bc-slider',           standalone: ['BcSliderComponent'] },
  BcNotificationModule:   { pkg: 'bc-notification',     standalone: ['BcNotificationComponent'] },
  BcSpinnerModule:        { pkg: 'bc-spinner',          standalone: ['BcSpinnerComponent'] },
  BcDropdownModule:       { pkg: 'bc-dropdown',         standalone: ['BcDropdownComponent'] },
  BcMenuModule:           { pkg: 'bc-menu',             standalone: ['BcMenuComponent'] },
  BcStepperV2Module:      { pkg: 'bc-stepper-v2',       standalone: ['BcStepperV2Component'] },
  BcAlertDialogModule:    { pkg: 'bc-alert-dialog',     standalone: ['BcAlertDialogComponent'] },
};

const HTML_TAG_MAP = {
  'bc-circle-loading':'BcCircleLoadingModule','bc-search':'BcSearchModule',
  'bc-search-left':'BcSearchModule','bc-search-advanced':'BcSearchModule',
  'bc-table-container':'BcTableModule','bc-table-content':'BcTableModule',
  'bc-table-header':'BcTableModule','bc-table-footer':'BcTableModule',
  'bc-table-dropdown':'BcTableModule','bc-paginator-v2':'BcPaginatorV2Module',
  'bc-paginator':'BcPaginatorModule','bc-modal':'BcModalModule',
  'bc-breadcrumb':'BcBreadcrumbModule','bc-pictogram':'BcPictogramModule',
  'bc-shortcut':'BcShortcutModule','bc-shortcut-group':'BcShortcutModule',
  'bc-accordion':'BcAccordionModule','bc-tabs':'BcTabsModule',
  'bc-radio':'BcRadioModule','bc-checkbox':'BcCheckboxModule',
  'bc-select':'BcSelectModule','bc-card':'BcCardModule','bc-tag':'BcTagModule',
  'bc-chip':'BcChipModule','bc-badge':'BcBadgeModule','bc-progress':'BcProgressModule',
  'bc-toggle':'BcToggleModule','bc-upload':'BcUploadModule',
  'bc-datepicker':'BcDatepickerModule','bc-slider':'BcSliderModule',
  'bc-notification':'BcNotificationModule','bc-spinner':'BcSpinnerModule',
  'bc-icon':'BcIconModule','bc-form-field':'BcInputModule',
  'bc-dropdown':'BcDropdownModule','bc-menu':'BcMenuModule',
};

const ATTR_MAP = {
  'bc-input':      { module:'BcInputModule',  standalone:'BcInputDirective',     pkg:'bc-input' },
  'bc-cell':       { module:'BcTableModule',  standalone:'BcCellDirective',      pkg:'bc-table' },
  'bc-table':      { module:'BcTableModule',  standalone:'BcTableDirective',     pkg:'bc-table' },
  'bc-button':     { module:'BcButtonModule', standalone:'BcButtonDirective',    pkg:'bc-button' },
  'bc-input-file': { module:'BcUploadModule', standalone:'BcInputFileDirective', pkg:'bc-upload' },
};

// ─── ESTADO GLOBAL ──────────────────────────────────────────
let projectPath = '';
let logLines    = [];
const SESSION_START = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

// ─── UTILIDADES ─────────────────────────────────────────────
function log(msg) {
  const clean = msg.replace(/\x1b\[[0-9;]*m/g, '');
  logLines.push(clean);
}

function saveLog() {
  const logDir  = path.join(projectPath, 'migration-logs');
  const logFile = path.join(logDir, `migration-${SESSION_START}.log`);
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  fs.writeFileSync(logFile, logLines.join('\n'), 'utf-8');
  return logFile;
}

function print(msg = '') {
  console.log(msg);
  log(msg);
}

function runCmd(cmd, opts = {}) {
  print(dim(`  $ ${cmd}`));
  const result = spawnSync(cmd, { shell: true, cwd: projectPath, stdio: 'inherit', ...opts });
  if (result.status !== 0 && !opts.ignoreError) {
    print(err(`Falló: ${cmd}`));
    return false;
  }
  return true;
}

function runCmdCapture(cmd) {
  try {
    return execSync(cmd, { cwd: projectPath, encoding: 'utf-8', stdio: ['pipe','pipe','pipe'] }).trim();
  } catch {
    return '';
  }
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

function separator() {
  print(`${C.dim}${'─'.repeat(60)}${C.reset}`);
}

// ─── DETECCIÓN DE PROYECTO ──────────────────────────────────
function detectProject(p) {
  const pkgPath = path.join(p, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;

  const pkg  = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  // Versión Angular
  const angularCore = deps['@angular/core'] || '';
  const angularVer  = parseInt((angularCore.match(/\d+/) || [0])[0]);

  // Versión BDS
  const bdsRaw = deps['@bancolombia/design-system-web'] || '';
  const bdsVer  = parseInt((bdsRaw.match(/\d+/) || [0])[0]);

  // Versión Angular CLI
  const cliRaw = deps['@angular/cli'] || '';
  const cliVer  = parseInt((cliRaw.match(/\d+/) || [0])[0]);

  return { pkg, deps, angularVer, bdsVer, cliVer, angularCore, bdsRaw };
}

function detectStandaloneStatus() {
  // Busca componentes con standalone: true
  const tsFiles = getAllFiles(path.join(projectPath, 'src'), '.ts');
  let standaloneCount = 0, moduleCount = 0;

  for (const f of tsFiles) {
    const content = fs.readFileSync(f, 'utf-8');
    if (/standalone\s*:\s*true/.test(content))  standaloneCount++;
    if (/@NgModule\s*\(/.test(content))          moduleCount++;
  }

  return { standaloneCount, moduleCount };
}

function detectControlFlow() {
  const htmlFiles = getAllFiles(path.join(projectPath, 'src'), '.html');
  let newSyntax = 0, oldSyntax = 0;

  for (const f of htmlFiles) {
    const content = fs.readFileSync(f, 'utf-8');
    if (/@if\s*\(|@for\s*\(|@switch\s*\(/.test(content)) newSyntax++;
    if (/\*ngIf|\*ngFor|ngSwitch/.test(content))          oldSyntax++;
  }

  return { newSyntax, oldSyntax };
}

function detectBdsModules() {
  const tsFiles   = getAllFiles(path.join(projectPath, 'src'), '.ts');
  const htmlFiles = getAllFiles(path.join(projectPath, 'src'), '.html');
  const found = new Set();

  for (const f of tsFiles) {
    const content = fs.readFileSync(f, 'utf-8');
    for (const mod of Object.keys(BDS_MAP)) {
      if (new RegExp(`\\b${mod}\\b`).test(content)) found.add(mod);
    }
  }
  for (const f of htmlFiles) {
    const content = fs.readFileSync(f, 'utf-8');
    for (const [tag, mod] of Object.entries(HTML_TAG_MAP)) {
      if (new RegExp(`<${tag.replace(/-/g, '\\-')}[\\s>/]`).test(content)) found.add(mod);
    }
  }

  return [...found];
}

function getAllFiles(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  const result = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory() && item.name !== 'node_modules' && item.name !== '.git') {
      result.push(...getAllFiles(full, ext));
    } else if (item.isFile() && item.name.endsWith(ext)) {
      result.push(full);
    }
  }
  return result;
}

function checkGit() {
  const status = runCmdCapture('git status --porcelain');
  return { clean: status === '', status };
}

function checkNgCli() {
  const v = runCmdCapture('ng version --skip-confirmation 2>/dev/null | grep "Angular CLI"');
  return v.length > 0;
}

// ─── DIAGNÓSTICO ────────────────────────────────────────────
async function runDiagnostic(info) {
  print(title('DIAGNÓSTICO DEL PROYECTO'));

  // Angular
  if (info.angularVer) {
    const badge = info.angularVer >= 20 ? ok(`Angular ${info.angularVer} (última)`) :
                  info.angularVer >= 17 ? warn(`Angular ${info.angularVer} (actualizable a 20)`) :
                  err(`Angular ${info.angularVer} (requiere migración)`);
    print(`  ${badge}`);
  } else {
    print(`  ${err('No se detectó @angular/core')}`);
  }

  // BDS
  if (info.bdsVer) {
    const bdsBadge = info.bdsVer >= 16 ? ok(`BDS v${info.bdsVer} (standalone compatible)`) :
                     warn(`BDS v${info.bdsVer} → migrar a standalone`);
    print(`  ${bdsBadge}`);
  } else {
    print(`  ${dim('BDS: no detectado')}`);
  }

  // Standalone
  const sa = detectStandaloneStatus();
  if (sa.standaloneCount > 0 && sa.moduleCount === 0) {
    print(`  ${ok(`Standalone: ${sa.standaloneCount} componentes (100% standalone)`)}`);
  } else if (sa.standaloneCount > 0) {
    print(`  ${warn(`Standalone: ${sa.standaloneCount} standalone, ${sa.moduleCount} NgModules (mixto)`)}`);
  } else {
    print(`  ${err(`Standalone: 0 — todos usan NgModule`)}`);
  }

  // Control Flow
  const cf = detectControlFlow();
  if (cf.newSyntax > 0 && cf.oldSyntax === 0) {
    print(`  ${ok('Control Flow: nuevo (@if/@for) — completamente migrado')}`);
  } else if (cf.newSyntax > 0) {
    print(`  ${warn(`Control Flow: mixto (${cf.newSyntax} nuevo, ${cf.oldSyntax} con *ngIf/*ngFor)`)}`);
  } else if (cf.oldSyntax > 0) {
    print(`  ${err(`Control Flow: ${cf.oldSyntax} templates con sintaxis antigua (*ngIf, *ngFor)`)}`);
  } else {
    print(`  ${dim('Control Flow: no se detectaron directivas estructurales')}`);
  }

  // BDS modules pendientes
  const bdsModules = detectBdsModules();
  if (bdsModules.length > 0) {
    print(`  ${warn(`BDS módulos pendientes de migrar: ${bdsModules.length}`)}`);
    bdsModules.forEach(m => print(`    ${dim('·')} ${m}`));
  } else {
    print(`  ${ok('BDS imports: no se detectaron módulos legacy')}`);
  }

  // Git
  const git = checkGit();
  if (git.clean) {
    print(`  ${ok('Git: repositorio limpio')}`);
  } else {
    print(`  ${warn('Git: hay cambios sin commitear')}`);
    print(dim(git.status.split('\n').slice(0,5).map(l=>`    ${l}`).join('\n')));
  }

  // Angular CLI
  if (checkNgCli()) {
    print(`  ${ok('Angular CLI: disponible globalmente')}`);
  } else {
    print(`  ${err('Angular CLI: no encontrado — instala con: npm i -g @angular/cli')}`);
  }

  // Node modules
  if (fs.existsSync(path.join(projectPath, 'node_modules'))) {
    print(`  ${ok('node_modules: instaladas')}`);
  } else {
    print(`  ${warn('node_modules: no instaladas — se instalará antes de migrar')}`);
  }

  separator();
  print(`  ${dim(`Proyecto: ${projectPath}`)}`);
}

// ─── MIGRACIÓN ANGULAR ──────────────────────────────────────
async function migrateAngular(info) {
  print(title('MIGRACIÓN ANGULAR'));

  if (!info.angularVer) {
    print(err('No se detectó versión de Angular.')); return;
  }

  const current = info.angularVer;
  const target  = 20;

  if (current >= target) {
    print(ok(`Ya estás en Angular ${current}. Nada que migrar.`)); return;
  }

  print(info(`Versión actual: Angular ${current}  →  Objetivo: Angular ${target}`));
  print(warn('Se migrará versión por versión con commit en cada paso.\n'));

  // Verificar git limpio
  const git = checkGit();
  if (!git.clean) {
    print(err('El repositorio tiene cambios sin commitear.'));
    const ans = await prompt(`  ¿Hacer commit automático antes de continuar? (s/n): `);
    if (ans.toLowerCase() !== 's') {
      print(warn('Operación cancelada. Haz commit o stash y vuelve a intentarlo.')); return;
    }
    runCmd('git add .');
    runCmd('git commit -m "chore: commit previo a migración Angular"');
  }

  // Node modules
  if (!fs.existsSync(path.join(projectPath, 'node_modules'))) {
    print(step('Instalando dependencias...'));
    if (!runCmd('npm install --legacy-peer-deps')) return;
  }

  // Confirmar
  const confirm = await prompt(`  ¿Iniciar migración Angular ${current} → ${target}? (s/n): `);
  if (confirm.toLowerCase() !== 's') { print(warn('Cancelado.')); return; }

  // Modo dry-run
  const dry = await prompt(`  ¿Ejecutar en modo dry-run primero (solo muestra sin aplicar)? (s/n): `);
  const dryFlag = dry.toLowerCase() === 's' ? '--dry-run' : '';

  let ver = current;
  while (ver < target) {
    const next = ver + 1;
    print(step(`Migrando Angular ${ver} → ${next}...`));

    const ok1 = runCmd(`ng update @angular/core@${next} @angular/cli@${next} --force ${dryFlag}`);
    if (!ok1) {
      print(err(`Falló la migración a Angular ${next}. Revisa los errores y vuelve a intentar.`));
      return;
    }

    if (!dryFlag) {
      runCmd('npm install --legacy-peer-deps');
      runCmd('git add .');
      runCmd(`git commit -m "chore: upgrade to Angular ${next}"`);
      print(ok(`Angular ${next} — commit realizado ✓`));
    }

    ver = next;
  }

  if (!dryFlag) {
    print('\n' + ok(`Migración Angular completada: ${current} → ${target} 🚀`));
  } else {
    print('\n' + info('Dry-run completado. Ejecuta de nuevo sin dry-run para aplicar los cambios.'));
  }
}

// ─── MIGRACIÓN BDS ──────────────────────────────────────────
function migrateTsFile(filePath, htmlPath) {
  const ts   = fs.readFileSync(filePath, 'utf-8');
  const html = htmlPath && fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf-8') : '';

  const detected = new Set();

  // Detectar en TS
  for (const name of Object.keys(BDS_MAP)) {
    if (new RegExp(`\\b${name}\\b`).test(ts)) detected.add(name);
  }

  // Detectar en HTML
  if (html) {
    for (const [tag, mod] of Object.entries(HTML_TAG_MAP)) {
      if (new RegExp(`<${tag.replace(/-/g,'\\-')}[\\s>/]`).test(html)) detected.add(mod);
    }
    for (const [attr, info] of Object.entries(ATTR_MAP)) {
      if (new RegExp(`\\b${attr.replace(/-/g,'\\-')}\\b`).test(html)) detected.add(info.module);
    }
  }

  if (!detected.size) return null;

  // Construir grupos pkg → standalones
  const groups = {};
  for (const name of detected) {
    const info = BDS_MAP[name];
    if (!info) continue;
    if (!groups[info.pkg]) groups[info.pkg] = new Set();
    info.standalone.forEach(s => groups[info.pkg].add(s));
  }

  let result = ts;

  // Eliminar imports viejos
  for (const name of detected) {
    result = result.replace(
      new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*['"][^'"]+['"];?\\r?\\n?`, 'g'),
      ''
    );
  }

  // Nuevas líneas import
  const newLines = Object.entries(groups)
    .map(([pkg, names]) => `import { ${[...names].join(', ')} } from '@bancolombia/design-system-web/${pkg}';`)
    .join('\n');

  const firstImport = result.search(/^import /m);
  result = firstImport >= 0
    ? result.substring(0, firstImport) + newLines + '\n' + result.substring(firstImport)
    : newLines + '\n' + result;

  // Reemplazar bloque imports: [...]
  result = result.replace(/imports:\s*\[([^\]]*)\]/s, (_, inner) => {
    let cleaned = inner;
    for (const name of detected) {
      cleaned = cleaned.replace(new RegExp(`\\b${name}\\b,?\\s*`, 'g'), '');
    }
    const existing = cleaned.split(',').map(s => s.trim()).filter(s => s && !BDS_MAP[s]);
    const allNew   = [...new Set(Object.values(groups).flatMap(s => [...s]))];
    const combined = [...new Set([...allNew, ...existing])];
    const fmt = combined.length > 3
      ? '\n        ' + combined.join(',\n        ') + ',\n    '
      : combined.join(', ');
    return `imports: [${fmt}]`;
  });

  result = result.replace(/\n{3,}/g, '\n\n');

  return { result, detected: [...detected] };
}

async function migrateBDS(info) {
  print(title('MIGRACIÓN BDS (módulos → standalone)'));

  const bdsModules = detectBdsModules();
  if (bdsModules.length === 0) {
    print(ok('No se detectaron módulos BDS legacy. Nada que migrar.')); return;
  }

  print(info(`Módulos BDS detectados: ${bdsModules.length}`));
  bdsModules.forEach(m => print(`    ${dim('·')} ${m}`));

  print(warn(`\n  Se procesarán automáticamente TODOS los archivos .ts del proyecto.`));
  print(dim(`  Se empareja cada .ts con su .html del mismo directorio si existe.\n`));

  const dryRun = await prompt('  ¿Ejecutar en modo dry-run (solo muestra cambios sin guardar)? (s/n): ');
  const isDry  = dryRun.toLowerCase() === 's';

  const confirm = await prompt(`  ¿${isDry ? 'Mostrar' : 'Aplicar'} migración BDS? (s/n): `);
  if (confirm.toLowerCase() !== 's') { print(warn('Cancelado.')); return; }

  const tsFiles = getAllFiles(path.join(projectPath, 'src'), '.ts');
  let changed = 0, skipped = 0;

  for (const tsFile of tsFiles) {
    const dir      = path.dirname(tsFile);
    const base     = path.basename(tsFile, '.ts');
    const htmlFile = path.join(dir, base + '.html');

    const migResult = migrateTsFile(tsFile, htmlFile);
    if (!migResult) { skipped++; continue; }

    const rel = path.relative(projectPath, tsFile);
    print(`\n  ${C.cyan}→${C.reset} ${rel}`);
    migResult.detected.forEach(m => print(`    ${C.dim}· ${m} → standalone${C.reset}`));

    if (!isDry) {
      fs.writeFileSync(tsFile, migResult.result, 'utf-8');
      print(`    ${ok('guardado')}`);
    } else {
      print(`    ${dim('[dry-run: no se guardó]')}`);
    }

    changed++;
  }

  separator();
  print(ok(`BDS: ${changed} archivos ${isDry ? 'analizados' : 'migrados'}, ${skipped} sin cambios.`));

  if (!isDry && changed > 0) {
    const doCommit = await prompt('\n  ¿Hacer commit de los cambios BDS? (s/n): ');
    if (doCommit.toLowerCase() === 's') {
      runCmd('git add .');
      runCmd('git commit -m "chore: migrate BDS modules to standalone imports"');
    }
  }
}

// ─── STANDALONE MIGRATION ───────────────────────────────────
async function migrateStandalone() {
  print(title('MIGRACIÓN A STANDALONE'));
  print(warn('Este comando puede cambiar significativamente la arquitectura del proyecto.'));
  print(info('Ejecuta: ng generate @angular/core:standalone\n'));

  const sa = detectStandaloneStatus();
  print(`  Componentes standalone actuales : ${sa.standaloneCount}`);
  print(`  NgModules actuales              : ${sa.moduleCount}\n`);

  if (sa.moduleCount === 0) {
    print(ok('El proyecto ya es completamente standalone.')); return;
  }

  const git = checkGit();
  if (!git.clean) {
    print(err('Hay cambios sin commitear. Haz commit primero para poder revertir si algo falla.'));
    return;
  }

  print(`${C.yellow}Opciones de migración:${C.reset}`);
  print(`  1) convert-to-standalone  — convierte componentes/pipes/directivas`);
  print(`  2) prune-ng-modules       — elimina NgModules vacíos tras la conversión`);
  print(`  3) standalone-bootstrap   — migra bootstrapModule a bootstrapApplication\n`);

  const mode = await prompt('  ¿Qué paso ejecutar? (1/2/3 o "todos"): ');

  const steps = {
    '1': 'convert-to-standalone',
    '2': 'prune-ng-modules',
    '3': 'standalone-bootstrap',
  };

  const toRun = mode === 'todos'
    ? Object.values(steps)
    : [steps[mode]].filter(Boolean);

  if (!toRun.length) { print(warn('Opción inválida.')); return; }

  const confirm = await prompt(`  ¿Aplicar: ${toRun.join(', ')}? (s/n): `);
  if (confirm.toLowerCase() !== 's') { print(warn('Cancelado.')); return; }

  for (const s of toRun) {
    print(step(`Ejecutando: ng generate @angular/core:standalone --migration=${s}`));
    const ok1 = runCmd(`ng generate @angular/core:standalone --migration=${s}`);
    if (!ok1) { print(err(`Falló en el paso: ${s}`)); return; }

    runCmd('git add .');
    runCmd(`git commit -m "chore: standalone migration - ${s}"`);
    print(ok(`${s} — commit realizado ✓`));
  }

  print('\n' + ok('Migración standalone completada 🚀'));
}

// ─── CONTROL FLOW MIGRATION ─────────────────────────────────
async function migrateControlFlow() {
  print(title('MIGRACIÓN CONTROL FLOW'));
  print(info('Ejecuta: ng g @angular/core:control-flow'));
  print(warn('Transforma *ngIf/*ngFor/ngSwitch a @if/@for/@switch en los templates.\n'));

  const cf = detectControlFlow();
  print(`  Templates con sintaxis nueva (@if/@for) : ${cf.newSyntax}`);
  print(`  Templates con sintaxis antigua (*ngIf)   : ${cf.oldSyntax}\n`);

  if (cf.oldSyntax === 0) {
    print(ok('Todos los templates ya usan la nueva sintaxis de control flow.')); return;
  }

  const git = checkGit();
  if (!git.clean) {
    print(err('Hay cambios sin commitear. Haz commit primero.')); return;
  }

  print(warn(`Se modificarán ${cf.oldSyntax} templates. Se recomienda revisión manual después.\n`));

  const dryRun = await prompt('  ¿Dry-run primero? (s/n): ');
  if (dryRun.toLowerCase() === 's') {
    runCmd('ng g @angular/core:control-flow --interactive false');
    print(info('\nDry-run completado. Ejecuta de nuevo sin dry-run para aplicar.'));
    return;
  }

  const confirm = await prompt('  ¿Aplicar migración de control flow? (s/n): ');
  if (confirm.toLowerCase() !== 's') { print(warn('Cancelado.')); return; }

  const ok1 = runCmd('ng g @angular/core:control-flow --interactive false');
  if (!ok1) { print(err('Falló la migración de control flow.')); return; }

  runCmd('git add .');
  runCmd('git commit -m "chore: migrate to Angular control flow syntax"');
  print('\n' + ok('Migración control flow completada ✓'));
}

// ─── MIGRACIÓN COMPLETA ─────────────────────────────────────
async function runFullMigration(info) {
  print(title('MIGRACIÓN COMPLETA'));
  print(warn('Ejecutará en orden: Angular → BDS → Standalone → Control Flow\n'));

  const confirm = await prompt('  ¿Confirmar migración completa? (s/n): ');
  if (confirm.toLowerCase() !== 's') { print(warn('Cancelado.')); return; }

  await migrateAngular(info);
  await migrateBDS(info);
  await migrateStandalone();
  await migrateControlFlow();

  print('\n' + ok('Migración completa finalizada 🎉'));
  print(info('Próximos pasos:'));
  print(dim('  1. Ejecutar npm test'));
  print(dim('  2. Ejecutar npm run build'));
  print(dim('  3. Revisar templates migrados manualmente'));
  print(dim('  4. Actualizar otras librerías externas (@bancolombia/*)'));
}

// ─── MENÚ PRINCIPAL ─────────────────────────────────────────
async function showMenu(info) {
  const angVer = info.angularVer || '?';
  const bdVer  = info.bdsVer  || '?';

  print(`\n${C.bold}${C.cyan}Proyecto:${C.reset} ${projectPath}`);
  print(`${C.bold}${C.cyan}Angular: ${C.reset}${angVer}   ${C.bold}${C.cyan}BDS: ${C.reset}${bdVer}\n`);

  print(`${C.bold}  ¿Qué deseas hacer?${C.reset}\n`);
  print(`  ${C.cyan}1${C.reset}  Diagnóstico completo del proyecto`);
  print(`  ${C.cyan}2${C.reset}  Migrar Angular ${angVer} → 20`);
  print(`  ${C.cyan}3${C.reset}  Migrar BDS (módulos → standalone)`);
  print(`  ${C.cyan}4${C.reset}  Migrar a Standalone (ng core:standalone)`);
  print(`  ${C.cyan}5${C.reset}  Migrar Control Flow (@if/@for)`);
  print(`  ${C.cyan}6${C.reset}  Migración completa (todo en orden)`);
  print(`  ${C.cyan}7${C.reset}  Cambiar proyecto`);
  print(`  ${C.red}0${C.reset}  Salir\n`);

  const choice = await prompt(`  → `);
  return choice.trim();
}

// ─── ENTRADA PRINCIPAL ──────────────────────────────────────
async function main() {
  console.clear();
  print(title('Angular + BDS Migration CLI · macOS'));

  // Solicitar path
  while (true) {
    const input = await prompt(`${C.bold}Ingresa el path completo del proyecto Angular:${C.reset}\n→ `);
    const resolved = input.startsWith('~')
      ? path.join(process.env.HOME, input.slice(1))
      : path.resolve(input);

    if (!fs.existsSync(resolved)) {
      print(err(`No existe el directorio: ${resolved}`)); continue;
    }

    const detected = detectProject(resolved);
    if (!detected) {
      print(err(`No se encontró package.json en: ${resolved}`)); continue;
    }

    if (!detected.angularVer) {
      print(warn(`No se detectó @angular/core en ${resolved}. ¿Seguro que es un proyecto Angular?`));
      const cont = await prompt('¿Continuar de todas formas? (s/n): ');
      if (cont.toLowerCase() !== 's') continue;
    }

    projectPath = resolved;
    process.chdir(projectPath);

    print(ok(`Proyecto cargado: Angular ${detected.angularVer || '?'} · BDS v${detected.bdsVer || '?'}\n`));

    // Loop de menú
    while (true) {
      const choice = await showMenu(detected);

      switch (choice) {
        case '1': await runDiagnostic(detected); break;
        case '2': await migrateAngular(detected); break;
        case '3': await migrateBDS(detected); break;
        case '4': await migrateStandalone(); break;
        case '5': await migrateControlFlow(); break;
        case '6': await runFullMigration(detected); break;
        case '7':
          const logFile = saveLog();
          print(ok(`Log guardado en: ${logFile}`));
          return main();
        case '0':
          const lf = saveLog();
          print(ok(`Log guardado en: ${lf}`));
          print('\nHasta pronto 👋\n');
          process.exit(0);
        default:
          print(warn('Opción inválida. Elige entre 0 y 7.'));
      }

      await prompt('\n  Presiona Enter para volver al menú...');
    }
  }
}

main().catch(e => {
  console.error(err(`Error inesperado: ${e.message}`));
  process.exit(1);
});
