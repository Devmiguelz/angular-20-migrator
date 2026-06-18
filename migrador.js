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
async function runDiagnostic(projectInfo) {
  print(title('DIAGNÓSTICO DEL PROYECTO'));

  // Angular
  if (projectInfo.angularVer) {
    const badge = projectInfo.angularVer >= 20 ? ok(`Angular ${projectInfo.angularVer} (última)`) :
                  projectInfo.angularVer >= 17 ? warn(`Angular ${projectInfo.angularVer} (actualizable a 20)`) :
                  err(`Angular ${projectInfo.angularVer} (requiere migración)`);
    print(`  ${badge}`);
  } else {
    print(`  ${err('No se detectó @angular/core')}`);
  }

  // BDS
  if (projectInfo.bdsVer) {
    const bdsBadge = projectInfo.bdsVer >= 16 ? ok(`BDS v${projectInfo.bdsVer} (standalone compatible)`) :
                     warn(`BDS v${projectInfo.bdsVer} → migrar a standalone`);
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
async function migrateAngular(projectInfo) {
  print(title('MIGRACIÓN ANGULAR'));

  if (!projectInfo.angularVer) {
    print(err('No se detectó versión de Angular.')); return;
  }

  const current = projectInfo.angularVer;
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
/**
 * BDS_MAP extendido — cubre módulos adicionales encontrados en los proyectos reales.
 * Incluye tanto los Módulos legacy (BcXxxModule) como sus equivalentes standalone.
 * También mapea componentes standalone que ya se importan directamente (para detectar
 * faltantes desde HTML).
 */
const BDS_STANDALONE_MAP = {
  // Tag HTML → { pkg, standalones[] }
  // Generado desde BDS_MAP + HTML_TAG_MAP + casos reales del proyecto
  'bc-circle-loading':     { pkg: 'bc-circle-loading',  standalones: ['BcCircleLoadingComponent'] },
  'bc-search':             { pkg: 'bc-search',           standalones: ['BcSearchComponent','BcSearchLeftComponent','BcSearchAdvancedComponent','BcSearchAdvancedItemComponent','BcSearchResultFilterComponent','BcSearchButtonComponent','BcSearchContentItemsComponent'] },
  'bc-search-left':        { pkg: 'bc-search',           standalones: ['BcSearchComponent','BcSearchLeftComponent'] },
  'bc-search-advanced':    { pkg: 'bc-search',           standalones: ['BcSearchAdvancedComponent','BcSearchAdvancedItemComponent'] },
  'bc-form-field':         { pkg: 'bc-input',            standalones: ['BcFormFieldComponent','BcInputDirective'] },
  'bc-button':             { pkg: 'bc-button',           standalones: ['BcButtonDirective'] },
  'bc-table-container':    { pkg: 'bc-table',            standalones: ['BcTableDirective','BcCellDirective','BcTableContainerComponent','BcTableContentComponent','BcTableHeaderComponent','BcTableFooterComponent','BcTableDropdownComponent'] },
  'bc-table-content':      { pkg: 'bc-table',            standalones: ['BcTableDirective','BcCellDirective','BcTableContainerComponent','BcTableContentComponent','BcTableHeaderComponent','BcTableFooterComponent','BcTableDropdownComponent'] },
  'bc-table-header':       { pkg: 'bc-table',            standalones: ['BcTableDirective','BcCellDirective','BcTableContainerComponent','BcTableContentComponent','BcTableHeaderComponent','BcTableFooterComponent','BcTableDropdownComponent'] },
  'bc-table-footer':       { pkg: 'bc-table',            standalones: ['BcTableDirective','BcTableFooterComponent'] },
  'bc-table-dropdown':     { pkg: 'bc-table',            standalones: ['BcTableDropdownComponent'] },
  'bc-paginator-v2':       { pkg: 'bc-paginator-v2',     standalones: ['BcPaginatorV2Component'] },
  'bc-paginator':          { pkg: 'bc-paginator',        standalones: ['BcPaginatorComponent'] },
  'bc-icon':               { pkg: 'bc-icon',             standalones: ['BcIconComponent'] },
  'bc-modal':              { pkg: 'bc-modal',            standalones: ['BcModalComponent'] },
  'bc-breadcrumb':         { pkg: 'bc-breadcrumb',       standalones: ['BcBreadcrumbComponent'] },
  'bc-shortcut':           { pkg: 'bc-shortcut',         standalones: ['BcShortcutGroupComponent','BcShortcutComponent'] },
  'bc-shortcut-group':     { pkg: 'bc-shortcut',         standalones: ['BcShortcutGroupComponent','BcShortcutComponent'] },
  'bc-stepper':            { pkg: 'bc-stepper',          standalones: ['BcStepperComponent'] },
  'bc-alert':              { pkg: 'bc-alert',            standalones: ['BcAlertComponent'] },
  'bc-inline-alert':       { pkg: 'bc-inline-alert',     standalones: ['BcInlineAlertComponent'] },
  'bc-pictogram':          { pkg: 'bc-pictogram',        standalones: ['BcPictogramComponent'] },
  'bc-tooltip':            { pkg: 'bc-tooltip',          standalones: ['BcTooltipDirective'] },
  'bc-accordion':          { pkg: 'bc-accordion',        standalones: ['BcAccordionComponent','BcAccordionItemComponent'] },
  'bc-accordion-item':     { pkg: 'bc-accordion',        standalones: ['BcAccordionItemComponent'] },
  'bc-tabs':               { pkg: 'bc-tabs',             standalones: ['BcTabsComponent','BcTabComponent'] },
  'bc-tab':                { pkg: 'bc-tabs',             standalones: ['BcTabComponent'] },
  'bc-radio':              { pkg: 'bc-radio',            standalones: ['BcRadioComponent'] },
  'bc-checkbox':           { pkg: 'bc-checkbox',         standalones: ['BcCheckboxComponent'] },
  'bc-select':             { pkg: 'bc-select',           standalones: ['BcSelectComponent'] },
  'bc-card':               { pkg: 'bc-card',             standalones: ['BcCardComponent'] },
  'bc-tag':                { pkg: 'bc-tag',              standalones: ['BcTagComponent'] },
  'bc-chip':               { pkg: 'bc-chip',             standalones: ['BcChipComponent'] },
  'bc-badge':              { pkg: 'bc-badge',            standalones: ['BcBadgeComponent'] },
  'bc-progress':           { pkg: 'bc-progress',         standalones: ['BcProgressComponent'] },
  'bc-toggle':             { pkg: 'bc-toggle',           standalones: ['BcToggleComponent'] },
  'bc-upload':             { pkg: 'bc-upload',           standalones: ['BcUploadComponent'] },
  'bc-datepicker':         { pkg: 'bc-datepicker',       standalones: ['BcDatepickerComponent'] },
  'bc-slider':             { pkg: 'bc-slider',           standalones: ['BcSliderComponent'] },
  'bc-notification':       { pkg: 'bc-notification',     standalones: ['BcNotificationComponent'] },
  'bc-spinner':            { pkg: 'bc-spinner',          standalones: ['BcSpinnerComponent'] },
  'bc-dropdown':           { pkg: 'bc-dropdown',         standalones: ['BcDropdownComponent'] },
  'bc-menu':               { pkg: 'bc-menu',             standalones: ['BcMenuComponent'] },
  'bc-status':             { pkg: 'bc-status',           standalones: ['BcStatusComponent'] },
  'bc-loader':             { pkg: 'bc-loader',           standalones: ['BcLoaderComponent'] },
  'bc-input-date':         { pkg: 'bc-input-date',       standalones: ['BcInputDateComponent'] },
  'bc-input-file':         { pkg: 'bc-input-file',       standalones: ['BcInputFileComponent'] },
  'bc-input-select':       { pkg: 'bc-input-select',     standalones: ['BcInputSelectComponent'] },
  'bc-stepper-v2':         { pkg: 'bc-stepper-v2',       standalones: ['BcStepperV2Component'] },
  'bc-alert-dialog':       { pkg: 'bc-alert-dialog',     standalones: ['BcAlertDialogComponent'] },
};

// Directivas de atributo BDS
const BDS_ATTR_STANDALONE = {
  'bc-input':      { pkg: 'bc-input',   standalones: ['BcInputDirective','BcFormFieldComponent'] },
  'bc-cell':       { pkg: 'bc-table',   standalones: ['BcCellDirective'] },
  'bc-table':      { pkg: 'bc-table',   standalones: ['BcTableDirective'] },
  'bc-button':     { pkg: 'bc-button',  standalones: ['BcButtonDirective'] },
  'bc-input-file': { pkg: 'bc-upload',  standalones: ['BcInputFileDirective'] },
  'bc-link':       { pkg: 'bc-button',  standalones: ['BcButtonDirective'] },
};

// Módulos BDS legacy → standalones (para limpiar imports de módulos viejos)
const BDS_MODULE_TO_STANDALONE = {
  BcCircleLoadingModule:  { pkg: 'bc-circle-loading',  standalones: ['BcCircleLoadingComponent'] },
  BcSearchModule:         { pkg: 'bc-search',           standalones: ['BcSearchComponent','BcSearchLeftComponent','BcSearchAdvancedComponent','BcSearchAdvancedItemComponent','BcSearchResultFilterComponent','BcSearchButtonComponent','BcSearchContentItemsComponent'] },
  BcInputModule:          { pkg: 'bc-input',            standalones: ['BcInputDirective','BcFormFieldComponent'] },
  BcFormFieldModule:      { pkg: 'bc-input',            standalones: ['BcFormFieldComponent','BcInputDirective'] },
  BcButtonModule:         { pkg: 'bc-button',           standalones: ['BcButtonDirective'] },
  BcTableModule:          { pkg: 'bc-table',            standalones: ['BcTableDirective','BcCellDirective','BcTableContainerComponent','BcTableContentComponent','BcTableHeaderComponent','BcTableFooterComponent','BcTableDropdownComponent'] },
  BcPaginatorV2Module:    { pkg: 'bc-paginator-v2',     standalones: ['BcPaginatorV2Component'] },
  BcPaginatorModule:      { pkg: 'bc-paginator',        standalones: ['BcPaginatorComponent'] },
  BcIconModule:           { pkg: 'bc-icon',             standalones: ['BcIconComponent'] },
  BcModalModule:          { pkg: 'bc-modal',            standalones: ['BcModalComponent'] },
  BcBreadcrumbModule:     { pkg: 'bc-breadcrumb',       standalones: ['BcBreadcrumbComponent'] },
  BcShortcutModule:       { pkg: 'bc-shortcut',         standalones: ['BcShortcutGroupComponent','BcShortcutComponent'] },
  BcStepperModule:        { pkg: 'bc-stepper',          standalones: ['BcStepperComponent'] },
  BcAlertModule:          { pkg: 'bc-alert',            standalones: ['BcAlertComponent'] },
  BcInlineAlertModule:    { pkg: 'bc-inline-alert',     standalones: ['BcInlineAlertComponent'] },
  BcPictogramModule:      { pkg: 'bc-pictogram',        standalones: ['BcPictogramComponent'] },
  BcTooltipModule:        { pkg: 'bc-tooltip',          standalones: ['BcTooltipDirective'] },
  BcAccordionModule:      { pkg: 'bc-accordion',        standalones: ['BcAccordionComponent','BcAccordionItemComponent'] },
  BcTabsModule:           { pkg: 'bc-tabs',             standalones: ['BcTabsComponent','BcTabComponent'] },
  BcRadioModule:          { pkg: 'bc-radio',            standalones: ['BcRadioComponent'] },
  BcCheckboxModule:       { pkg: 'bc-checkbox',         standalones: ['BcCheckboxComponent'] },
  BcSelectModule:         { pkg: 'bc-select',           standalones: ['BcSelectComponent'] },
  BcCardModule:           { pkg: 'bc-card',             standalones: ['BcCardComponent'] },
  BcTagModule:            { pkg: 'bc-tag',              standalones: ['BcTagComponent'] },
  BcChipModule:           { pkg: 'bc-chip',             standalones: ['BcChipComponent'] },
  BcBadgeModule:          { pkg: 'bc-badge',            standalones: ['BcBadgeComponent'] },
  BcProgressModule:       { pkg: 'bc-progress',         standalones: ['BcProgressComponent'] },
  BcToggleModule:         { pkg: 'bc-toggle',           standalones: ['BcToggleComponent'] },
  BcUploadModule:         { pkg: 'bc-upload',           standalones: ['BcUploadComponent'] },
  BcDatepickerModule:     { pkg: 'bc-datepicker',       standalones: ['BcDatepickerComponent'] },
  BcInputDateModule:      { pkg: 'bc-input-date',       standalones: ['BcInputDateComponent'] },
  BcInputFileModule:      { pkg: 'bc-input-file',       standalones: ['BcInputFileComponent'] },
  BcInputSelectModule:    { pkg: 'bc-input-select',     standalones: ['BcInputSelectComponent'] },
  BcSliderModule:         { pkg: 'bc-slider',           standalones: ['BcSliderComponent'] },
  BcNotificationModule:   { pkg: 'bc-notification',     standalones: ['BcNotificationComponent'] },
  BcSpinnerModule:        { pkg: 'bc-spinner',          standalones: ['BcSpinnerComponent'] },
  BcDropdownModule:       { pkg: 'bc-dropdown',         standalones: ['BcDropdownComponent'] },
  BcMenuModule:           { pkg: 'bc-menu',             standalones: ['BcMenuComponent'] },
  BcLoaderModule:         { pkg: 'bc-loader',           standalones: ['BcLoaderComponent'] },
  BcStatusModule:         { pkg: 'bc-status',           standalones: ['BcStatusComponent'] },
  BcStepperV2Module:      { pkg: 'bc-stepper-v2',       standalones: ['BcStepperV2Component'] },
  BcAlertDialogModule:    { pkg: 'bc-alert-dialog',     standalones: ['BcAlertDialogComponent'] },
  BcServicesModule:       { pkg: 'bc-services',         standalones: ['BcDialogService'] },
};

/**
 * Construye un índice de TODOS los componentes internos del proyecto.
 * selector → { className, filePath }
 * Escanea todos los .ts buscando selector: 'bc-*' o selector: 'app-*'
 */
function buildProjectSelectorIndex(srcRoots) {
  // index de selectores de componentes/directivas: 'bc-foo' → { className, filePath }
  const selectorIndex = {};
  // index de pipes por nombre: 'myPipe' → { className, filePath }
  const pipeIndex = {};

  for (const root of srcRoots) {
    const files = getAllFiles(root, '.ts').filter(f => !f.endsWith('.spec.ts'));
    for (const f of files) {
      try {
        const content = fs.readFileSync(f, 'utf-8');
        const classMatch = content.match(/export\s+class\s+(\w+)/);
        if (!classMatch) continue;
        const className = classMatch[1];

        // Componentes y Directivas — indexar por selector
        const selectorMatch = content.match(/selector\s*:\s*['"]([^'"]+)['"]/);
        if (selectorMatch) {
          selectorIndex[selectorMatch[1]] = { className, filePath: f };
        }

        // Pipes — indexar por nombre del pipe
        const pipeNameMatch = content.match(/@Pipe\s*\([^)]*name\s*:\s*['"]([^'"]+)['"]/);
        if (pipeNameMatch) {
          pipeIndex[pipeNameMatch[1]] = { className, filePath: f };
        }
      } catch {}
    }
  }
  return { selectorIndex, pipeIndex };
}

/**
 * Dado un archivo .ts y su .html, determina:
 * 1. Qué componentes BDS standalone necesita (desde HTML tags)
 * 2. Qué componentes BDS legacy (Módulos) tiene que reemplazar
 * 3. Qué componentes internos del proyecto necesita importar
 * Y retorna el archivo .ts actualizado.
 */
function migrateTsFile(filePath, htmlPath, projectIndex) {
  if (!projectIndex) projectIndex = {};
  const projectSelectorIndex = projectIndex.selectorIndex || projectIndex; // compat
  const projectPipeIndex     = projectIndex.pipeIndex     || {};
  const ts   = fs.readFileSync(filePath, 'utf-8');
  const html = htmlPath && fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf-8') : '';

  // ── 1. Recolectar standalones BDS necesarios desde HTML ──────────────
  const bdsNeeded = new Map(); // pkg → Set<standalone>

  const addBdsStandalone = (pkg, standalones) => {
    if (!bdsNeeded.has(pkg)) bdsNeeded.set(pkg, new Set());
    standalones.forEach(s => bdsNeeded.get(pkg).add(s));
  };

  if (html) {
    for (const [tag, entry] of Object.entries(BDS_STANDALONE_MAP)) {
      if (new RegExp('<' + tag.replace(/-/g,'\\-') + '[\\s>/]').test(html)) {
        addBdsStandalone(entry.pkg, entry.standalones);
      }
    }
    for (const [attr, entry] of Object.entries(BDS_ATTR_STANDALONE)) {
      if (new RegExp('\\b' + attr.replace(/-/g,'\\-') + '[=\\s>/"\'`]').test(html)) {
        addBdsStandalone(entry.pkg, entry.standalones);
      }
    }
  }

  // ── 2. Detectar módulos BDS legacy en el TS ───────────────────────────
  const legacyModulesFound = new Set();
  for (const [modName, entry] of Object.entries(BDS_MODULE_TO_STANDALONE)) {
    if (new RegExp('\\b' + modName + '\\b').test(ts)) {
      legacyModulesFound.add(modName);
      addBdsStandalone(entry.pkg, entry.standalones);
    }
  }

  // ── 3. Extraer lo que YA está en imports: [...] del @Component ─────────
  // Importante: chequeamos el bloque imports:[] del decorador, NO todo el TS
  // (un símbolo puede estar en el import statement pero NO en imports:[])
  const existingInImportsBlock = new Set();
  const importsBlockMatch = ts.match(/imports\s*:\s*\[([^\]]*)\]/s);
  if (importsBlockMatch) {
    importsBlockMatch[1].split(',').map(s => s.trim()).filter(Boolean)
      .forEach(s => existingInImportsBlock.add(s));
  }

  // ── 4. Determinar qué BDS standalones hay que agregar ─────────────────
  // También detectar los que están en import{} statements del TS pero NO en imports:[]
  const bdsToAdd = new Map();
  for (const [pkg, standalones] of bdsNeeded) {
    const missing = [...standalones].filter(s => !existingInImportsBlock.has(s));
    if (missing.length > 0) bdsToAdd.set(pkg, new Set(missing));
  }

  // ── 5. Detectar módulos/directivas Angular que están en TS pero faltan en imports[] ─
  // SOLO los que genuinamente van en imports[] de un componente standalone.
  // NO incluir: servicios (Router, ActivatedRoute), clases de formulario (FormBuilder,
  // Validators), decoradores, interfaces, etc.
  const ANGULAR_IMPORTABLE = {
    // @angular/common — módulos y directivas/pipes que van en imports[]
    'CommonModule':         '@angular/common',
    'NgIf':                 '@angular/common',
    'NgFor':                '@angular/common',
    'NgForOf':              '@angular/common',
    'NgClass':              '@angular/common',
    'NgStyle':              '@angular/common',
    'NgSwitch':             '@angular/common',
    'NgSwitchCase':         '@angular/common',
    'NgSwitchDefault':      '@angular/common',
    'NgTemplateOutlet':     '@angular/common',
    'AsyncPipe':            '@angular/common',
    'DatePipe':             '@angular/common',
    'DecimalPipe':          '@angular/common',
    'CurrencyPipe':         '@angular/common',
    'UpperCasePipe':        '@angular/common',
    'LowerCasePipe':        '@angular/common',
    'JsonPipe':             '@angular/common',
    'SlicePipe':            '@angular/common',
    'PercentPipe':          '@angular/common',
    'TitleCasePipe':        '@angular/common',
    'KeyValuePipe':         '@angular/common',
    // @angular/forms — módulos que van en imports[]
    'FormsModule':          '@angular/forms',
    'ReactiveFormsModule':  '@angular/forms',
    // @angular/router — directivas que van en imports[]
    'RouterModule':         '@angular/router',
    'RouterLink':           '@angular/router',
    'RouterLinkActive':     '@angular/router',
    'RouterOutlet':         '@angular/router',
  };
  const angularToAdd = [];
  for (const [symbol, pkg] of Object.entries(ANGULAR_IMPORTABLE)) {
    if (existingInImportsBlock.has(symbol)) continue;
    // El símbolo debe estar en un import statement del TS apuntando al paquete correcto
    const re = new RegExp("import\\s*(?:type\\s*)?\\{[^}]*\\b" + symbol + "\\b[^}]*\\}\\s*from\\s*['\"']" + pkg.replace(/\//g,'\\/') + "['\"']");
    if (re.test(ts)) {
      angularToAdd.push(symbol);
    }
  }

  // ── 6. Detectar componentes internos desde HTML (tags) ──────────────
  const internalToAdd = [];

  if (html && Object.keys(projectSelectorIndex).length > 0) {
    const tagRe = /<(bc-[a-z0-9-]+|app-[a-z0-9-]+)[\s>/]/g;
    let tagMatch;
    const seenSelectors = new Set();
    while ((tagMatch = tagRe.exec(html)) !== null) {
      const tag = tagMatch[1];
      if (BDS_STANDALONE_MAP[tag]) continue;
      if (seenSelectors.has(tag)) continue;
      seenSelectors.add(tag);
      const entry = projectSelectorIndex[tag];
      if (!entry) continue;
      if (existingInImportsBlock.has(entry.className)) continue;
      const rel = path.relative(path.dirname(filePath), entry.filePath)
        .replace(/\.ts$/, '').replace(/\\/g, '/');
      const relPath = rel.startsWith('.') ? rel : './' + rel;
      internalToAdd.push({ className: entry.className, importPath: relPath, selector: tag });
    }
  }

  // ── 7. Detectar pipes del proyecto usados en HTML (| pipeName) ────────
  const pipesToAdd = [];

  if (html && Object.keys(projectPipeIndex).length > 0) {
    // Buscar todos los pipes usados en templates: {{ value | pipeName }} o *ngIf="x | pipeName"
    const pipeRe = /\|\s*([a-zA-Z][a-zA-Z0-9_]*)/g;
    let pipeMatch;
    const seenPipes = new Set();
    while ((pipeMatch = pipeRe.exec(html)) !== null) {
      const pipeName = pipeMatch[1];
      if (seenPipes.has(pipeName)) continue;
      seenPipes.add(pipeName);
      const entry = projectPipeIndex[pipeName];
      if (!entry) continue;
      if (existingInImportsBlock.has(entry.className)) continue;
      const rel = path.relative(path.dirname(filePath), entry.filePath)
        .replace(/\.ts$/, '').replace(/\\/g, '/');
      const relPath = rel.startsWith('.') ? rel : './' + rel;
      pipesToAdd.push({ className: entry.className, importPath: relPath, pipeName });
    }
  }

  // ── 8. Detectar BDS que están en TS (import stmt) pero NO en imports[] ─
  // Cubre: ViewChild, inject(), dialog.open(BcAlertComponent), etc. sin tag HTML
  // Estrategia: buscar TODOS los standalones BDS en el import statement del TS
  const bdsFromTs = [];
  const seenBdsFromTs = new Set();
  // Mapa completo de símbolo BDS → pkg
  const ALL_BDS_STANDALONES = {};
  for (const entry of Object.values(BDS_MODULE_TO_STANDALONE)) {
    for (const s of entry.standalones) {
      ALL_BDS_STANDALONES[s] = entry.pkg;
    }
  }
  // BDS standalone extra no cubiertos por módulos
  ALL_BDS_STANDALONES['BcDialogService'] = 'bc-services';

  for (const [standalone, pkg] of Object.entries(ALL_BDS_STANDALONES)) {
    if (existingInImportsBlock.has(standalone)) continue;
    if (seenBdsFromTs.has(standalone)) continue;
    // ¿Está en el import statement del TS?
    const importRe = new RegExp("import\\s*(?:type\\s*)?\\{[^}]*\\b" + standalone + "\\b[^}]*\\}\\s*from\\s*['\"']@bancolombia");
    if (!importRe.test(ts)) continue;
    // ¿Ya lo cubre bdsToAdd (detectado desde HTML)?
    const alreadyInBdsToAdd = [...bdsToAdd.values()].some(s => s.has(standalone));
    if (alreadyInBdsToAdd) continue;
    seenBdsFromTs.add(standalone);
    bdsFromTs.push({ standalone, pkg });
  }

  // ── 5. Nada que hacer ────────────────────────────────────────────────
  if (legacyModulesFound.size === 0 && bdsToAdd.size === 0 && internalToAdd.length === 0 && angularToAdd.length === 0 && pipesToAdd.length === 0 && bdsFromTs.length === 0) return null;

  let result = ts;

  // ── 6. Eliminar imports de módulos BDS legacy ─────────────────────────
  for (const modName of legacyModulesFound) {
    result = result.replace(
      new RegExp('import\\s*\\{[^}]*\\b' + modName + '\\b[^}]*\\}\\s*from\\s*[\'"][^\'"]+[\'"];?\\r?\\n?', 'g'),
      ''
    );
  }

  // ── 7. Agregar imports BDS standalone faltantes ───────────────────────
  if (bdsToAdd.size > 0) {
    const newBdsLines = [...bdsToAdd.entries()]
      .map(([pkg, names]) => "import { " + [...names].join(', ') + " } from '@bancolombia/design-system-web/" + pkg + "';")
      .join('\n');
    const firstImport = result.search(/^import /m);
    result = firstImport >= 0
      ? result.substring(0, firstImport) + newBdsLines + '\n' + result.substring(firstImport)
      : newBdsLines + '\n' + result;
  }

  // ── 8. Agregar imports de componentes internos, pipes y BDS desde TS ──
  const allNewImportLines = [];
  if (internalToAdd.length > 0) {
    internalToAdd.forEach(e => allNewImportLines.push("import { " + e.className + " } from '" + e.importPath + "';"));
  }
  if (pipesToAdd.length > 0) {
    pipesToAdd.forEach(e => allNewImportLines.push("import { " + e.className + " } from '" + e.importPath + "';"));
  }
  // bdsFromTs: agrupar por pkg y agregar imports si no existen ya
  const bdsFromTsByPkg = {};
  for (const { standalone, pkg } of bdsFromTs) {
    if (!bdsFromTsByPkg[pkg]) bdsFromTsByPkg[pkg] = new Set();
    bdsFromTsByPkg[pkg].add(standalone);
  }
  for (const [pkg, names] of Object.entries(bdsFromTsByPkg)) {
    const existing = new RegExp("from '@bancolombia/design-system-web/" + pkg + "'").test(result);
    if (!existing) {
      allNewImportLines.push("import { " + [...names].join(', ') + " } from '@bancolombia/design-system-web/" + pkg + "';");
    }
  }
  if (allNewImportLines.length > 0) {
    const newLines = allNewImportLines.join('\n');
    const firstImport = result.search(/^import /m);
    result = firstImport >= 0
      ? result.substring(0, firstImport) + newLines + '\n' + result.substring(firstImport)
      : newLines + '\n' + result;
  }

  // ── 9. Actualizar o CREAR bloque imports: [...] dentro de @Component ──
  const allBdsNew      = [...new Set([...bdsToAdd.values()].flatMap(s => [...s]))];
  const allInternalNew = internalToAdd.map(e => e.className);

  const hasImportsBlock = /imports\s*:\s*\[/s.test(result);

  if (hasImportsBlock) {
    result = result.replace(/imports\s*:\s*\[([^\]]*)\]/s, (_, inner) => {
      let cleaned = inner;
      for (const modName of legacyModulesFound) {
        cleaned = cleaned.replace(
          new RegExp('\\b' + modName + '\\s*\\.forRoot\\s*\\((?:[^)(]|\\([^)]*\\))*\\)\\s*,?\\s*', 'gs'), ''
        );
        cleaned = cleaned.replace(new RegExp('\\b' + modName + '\\b,?\\s*', 'g'), '');
      }
      const existingNames = cleaned.split(',').map(s => s.trim()).filter(s =>
        s && !BDS_MODULE_TO_STANDALONE[s.replace(/\.forRoot\(.*\)/s, '').trim()]
      );
      const combined = [...new Set([...existingNames, ...allBdsNew, ...allInternalNew, ...angularToAdd, ...pipesToAdd.map(p=>p.className), ...bdsFromTs.map(b=>b.standalone)])].filter(Boolean);
      const fmt = combined.length > 3
        ? '\n        ' + combined.join(',\n        ') + ',\n    '
        : combined.join(', ');
      return 'imports: [' + fmt + ']';
    });
  } else {
    // NO existe imports: [] — crearlo dentro del @Component({})
    const combined = [...new Set([...allBdsNew, ...allInternalNew, ...angularToAdd, ...pipesToAdd.map(p=>p.className), ...bdsFromTs.map(b=>b.standalone)])].filter(Boolean);
    if (combined.length > 0) {
      const fmt = combined.length > 3
        ? '\n        ' + combined.join(',\n        ') + ',\n    '
        : ' ' + combined.join(', ') + ' ';
      const importsBlock = '\n    imports: [' + fmt + '],';
      if (/standalone\s*:\s*true/.test(result)) {
        // Insertar justo después de standalone: true,
        result = result.replace(
          /(standalone\s*:\s*true),?/,
          '$1,' + importsBlock
        );
      } else {
        // Insertar antes del cierre }) del decorador @Component
        result = result.replace(
          /(@Component\s*\(\s*\{)([\s\S]*?)(\n\s*\}\s*\))/,
          (_, open, body, close) => open + body.trimEnd() + importsBlock + close
        );
      }
    }
  }

  result = result.replace(/\n{3,}/g, '\n\n');

  return {
    result,
    legacyModules: [...legacyModulesFound],
    bdsAdded: [...bdsToAdd.entries()].map(([pkg, s]) => [...s].join(', ') + ' (' + pkg + ')'),
    internalAdded: internalToAdd.map(e => e.className + ' \u2190 ' + e.selector),
    angularAdded: angularToAdd,
    pipesAdded: pipesToAdd.map(p => p.className + ' \u2190 |' + p.pipeName),
    bdsFromTsAdded: bdsFromTs.map(b => b.standalone + ' (' + b.pkg + ')'),
  };
}

async function migrateBDS(projectInfo) {
  print(title('MIGRACIÓN BDS (módulos → standalone)'));

  print(info('Indexando componentes del proyecto...'));
  const srcRoots = [
    path.join(projectPath, 'src'),
    path.join(projectPath, 'projects'),
  ].filter(d => fs.existsSync(d));

  const projectIndex = buildProjectSelectorIndex(srcRoots);
  const projectSelectorIndex = projectIndex.selectorIndex;
  const projectPipeIndex     = projectIndex.pipeIndex;
  print(info('Componentes internos indexados: ' + Object.keys(projectSelectorIndex).length));
  print(info('Pipes del proyecto indexados   : ' + Object.keys(projectPipeIndex).length));

  const tsFiles = [
    ...getAllFiles(path.join(projectPath, 'src'), '.ts'),
    ...getAllFiles(path.join(projectPath, 'projects'), '.ts'),
  ].filter(f => !f.endsWith('.spec.ts') && !f.endsWith('.module.ts'));

  let filesWithLegacy = 0, filesWithMissingBds = 0, filesWithMissingInternal = 0;
  for (const tsFile of tsFiles) {
    const dir = path.dirname(tsFile);
    const base = path.basename(tsFile, '.ts');
    const htmlFile = path.join(dir, base + '.html');
    const r = migrateTsFile(tsFile, fs.existsSync(htmlFile) ? htmlFile : null, projectIndex);
    if (!r) continue;
    if (r.legacyModules.length > 0)                    filesWithLegacy++;
    if (r.bdsAdded.length > 0)                         filesWithMissingBds++;
    if (r.internalAdded.length > 0)                    filesWithMissingInternal++;
    if (r.angularAdded && r.angularAdded.length > 0)   filesWithMissingInternal++;
  }

  if (filesWithLegacy === 0 && filesWithMissingBds === 0 && filesWithMissingInternal === 0) {
    print(ok('Todos los componentes BDS e internos ya están importados correctamente.'));
    return;
  }

  print('');
  if (filesWithLegacy > 0)          print(warn('  Módulos BDS legacy a reemplazar : ' + filesWithLegacy + ' archivo(s)'));
  if (filesWithMissingBds > 0)      print(warn('  Standalones BDS faltantes       : ' + filesWithMissingBds + ' archivo(s)'));
  if (filesWithMissingInternal > 0) print(warn('  Componentes internos faltantes  : ' + filesWithMissingInternal + ' archivo(s)'));
  print('');

  const dryRun = await prompt('  ¿Ejecutar en modo dry-run (solo muestra cambios sin guardar)? (s/n): ');
  const isDry  = dryRun.toLowerCase() === 's';

  const confirm = await prompt('  ¿' + (isDry ? 'Mostrar' : 'Aplicar') + ' migración BDS? (s/n): ');
  if (confirm.toLowerCase() !== 's') { print(warn('Cancelado.')); return; }

  let changed = 0, skipped = 0;

  for (const tsFile of tsFiles) {
    const dir      = path.dirname(tsFile);
    const base     = path.basename(tsFile, '.ts');
    const htmlFile = path.join(dir, base + '.html');

    const migResult = migrateTsFile(
      tsFile,
      fs.existsSync(htmlFile) ? htmlFile : null,
      projectIndex
    );
    if (!migResult) { skipped++; continue; }

    const rel = path.relative(projectPath, tsFile);
    print('\n  ' + C.cyan + '\u2192' + C.reset + ' ' + rel);
    if (migResult.legacyModules.length)  migResult.legacyModules.forEach(m => print('    ' + dim('✖ módulo legacy eliminado: ' + m)));
    if (migResult.bdsAdded.length)       migResult.bdsAdded.forEach(s  => print('    ' + ok('BDS standalone agregado: ' + s)));
    if (migResult.internalAdded.length)  migResult.internalAdded.forEach(s => print('    ' + ok('Componente interno agregado: ' + s)));
    if (migResult.angularAdded && migResult.angularAdded.length)   migResult.angularAdded.forEach(s  => print('    ' + ok('Angular agregado: ' + s)));
    if (migResult.pipesAdded && migResult.pipesAdded.length)       migResult.pipesAdded.forEach(s    => print('    ' + ok('Pipe propio agregado: ' + s)));
    if (migResult.bdsFromTsAdded && migResult.bdsFromTsAdded.length) migResult.bdsFromTsAdded.forEach(s => print('    ' + ok('BDS desde TS: ' + s)));

    if (!isDry) {
      fs.writeFileSync(tsFile, migResult.result, 'utf-8');
      print('    ' + ok('guardado'));
    } else {
      print('    ' + dim('[dry-run: no se guardó]'));
    }
    changed++;
  }

  separator();
  print(ok('BDS: ' + changed + ' archivos ' + (isDry ? 'analizados' : 'migrados') + ', ' + skipped + ' sin cambios.'));
}



// ─── CONVERTIR standalone: false → standalone: true ────────────
async function convertStandaloneFlag() {
  print(title('CONVERTIR standalone: false → standalone: true'));
  print(info('Reemplaza standalone: false por standalone: true en todos los componentes,'));
  print(info('y agrega standalone: true donde no existe el decorador todavía.\n'));

  const srcRoots = [
    path.join(projectPath, 'src'),
    path.join(projectPath, 'projects'),
  ].filter(d => fs.existsSync(d));

  const tsFiles = srcRoots.flatMap(r => getAllFiles(r, '.ts'))
    .filter(f => !f.endsWith('.spec.ts') && !f.endsWith('.module.ts'));

  // Pre-análisis
  const withFalse    = [];
  const withoutFlag  = [];

  for (const f of tsFiles) {
    const content = fs.readFileSync(f, 'utf-8');
    if (!/\@Component\s*\(|\@Pipe\s*\(|\@Directive\s*\(/.test(content)) continue;
    if (/standalone\s*:\s*false/.test(content)) withFalse.push(f);
    else if (!/standalone\s*:\s*true/.test(content)) withoutFlag.push(f);
  }

  if (withFalse.length === 0 && withoutFlag.length === 0) {
    print(ok('Todos los componentes ya tienen standalone: true. Nada que hacer.'));
    return;
  }

  print(warn(`  Con standalone: false (a cambiar)     : ${withFalse.length} archivo(s)`));
  print(warn(`  Sin propiedad standalone (a agregar)  : ${withoutFlag.length} archivo(s)\n`));

  const dryRun = await prompt('  ¿Ejecutar en modo dry-run (solo muestra sin guardar)? (s/n): ');
  const isDry  = dryRun.toLowerCase() === 's';

  const confirm = await prompt(`  ¿${isDry ? 'Analizar' : 'Aplicar'} cambios? (s/n): `);
  if (confirm.toLowerCase() !== 's') { print(warn('Cancelado.')); return; }

  let changed = 0;

  // 1. Cambiar standalone: false → standalone: true
  for (const f of withFalse) {
    const original = fs.readFileSync(f, 'utf-8');
    const result   = original.replace(/\bstandalone\s*:\s*false\b/g, 'standalone: true');
    const rel      = path.relative(projectPath, f);
    print(`  ${C.green}✔${C.reset}  standalone: false → true   ${C.dim}${rel}${C.reset}`);
    if (!isDry) { fs.writeFileSync(f, result, 'utf-8'); }
    changed++;
  }

  // 2. Agregar standalone: true donde @Component no lo tiene
  for (const f of withoutFlag) {
    const original = fs.readFileSync(f, 'utf-8');
    // Insertar standalone: true justo después de la primera propiedad del @Component
    // Busca selector: '...' o templateUrl: '...' y agrega standalone: true después
    const result = original.replace(
      /(@Component\s*\(\s*\{)([\s\S]*?)(selector\s*:\s*['"][^'"]+['"])/,
      (_, open, before, selectorLine) =>
        `${open}${before}${selectorLine},\n    standalone: true`
    );
    if (result === original) continue; // no se pudo insertar
    const rel = path.relative(projectPath, f);
    print(`  ${C.green}✔${C.reset}  standalone: true agregado   ${C.dim}${rel}${C.reset}`);
    if (!isDry) { fs.writeFileSync(f, result, 'utf-8'); }
    changed++;
  }

  separator();
  print(ok(`${changed} archivos ${isDry ? 'analizados' : 'actualizados'}.`));
  if (!isDry) {
    print(info('Siguiente paso recomendado: ejecuta la opción 3 (Migrar BDS) para rellenar los imports: []'));
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
    print(step(`Ejecutando: ng generate @angular/core:standalone --mode=${s}`));
    const ok1 = runCmd(`ng generate @angular/core:standalone --mode=${s}`);
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

// ─── ELIMINAR CORE-UTILS-WIDGETS-WEB ────────────────────────
/**
 * Reemplaza todos los usos de @bancolombia/core-utils-widgets-web siguiendo
 * el patrón de registered-accounts-widget (que ya NO usa la librería):
 *
 *  IWidgetConfigurationModel  → interface local ICoreWidgetConfig
 *  IInfrastructureMappingModel → ClassProvider[] de Angular (provide/useClass)
 *  IBaseUsecase<T>            → se elimina el implements, queda solo el método invoke()
 *  BaseService (gateway)      → abstract class sin herencia, sin constructor extra
 *  HTTP_METHODS               → strings literales 'GET','POST','PUT','DELETE','PATCH'
 *  Identifier('Name')         → decorator eliminado; acceso a endpoints por tipo directo
 *  IEndpointsModel / @Inject  → inject(TOKEN) con tipo propio tipado
 *  baseRequest(...)           → HttpClient.get/post/put/delete directos con HttpHeaders
 *  IBaseMapper<T>             → interface local IMapper<T> con fromMap()
 */

// Interfaces locales que se inyectan en cada archivo que las necesita
const LOCAL_WIDGET_CONFIG_INTERFACE = `
export interface ICoreWidgetConfig {
  infrastructures?: import('@angular/core').ClassProvider[];
  endpoints?: Record<string, Record<string, string>>;
  operationIds?: Record<string, Record<string, string>>;
  labels?: Record<string, unknown>;
}
`.trim();

const LOCAL_MAPPER_INTERFACE = `
export interface IMapper<T> {
  fromMap(response: { meta: unknown; data: T }): T;
}
`.trim();

/** Extrae qué symbols importa de core-utils en una línea de import */
function extractCoreUtilsSymbols(content) {
  const symbols = new Set();
  const re = /import\s*\{([^}]+)\}\s*from\s*['"]@bancolombia\/core-utils-widgets-web['"]/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    m[1].split(',').map(s => s.trim()).filter(Boolean).forEach(s => symbols.add(s));
  }
  return symbols;
}

/** Elimina todas las líneas de import de core-utils */
function removeCoreUtilsImports(content) {
  // Usa [\s\S]*? en lugar de [^}]+ para manejar llaves anidadas
  // (ocurre cuando transformConfiguration reemplaza nombres dentro del bloque import)
  return content.replace(
    /import\s*\{[\s\S]*?\}\s*from\s*['"]@bancolombia\/core-utils-widgets-web['"];?\r?\n?/g,
    ''
  );
}

/**
 * Transforma un gateway que extiende BaseService a abstract class pura.
 * Antes: export abstract class XGateway extends BaseService { ... }
 * Después: export abstract class XGateway { ... }
 * También elimina el constructor super(http) si existe.
 */
function transformGateway(content, symbols) {
  if (!symbols.has('BaseService')) return content;
  let r = content;
  // Quitar "extends BaseService"
  r = r.replace(/\bextends\s+BaseService\b/g, '');
  // Quitar constructor que sólo llama super(http)
  r = r.replace(/constructor\s*\(\s*(?:public\s+)?(?:http(?:Client)?:\s*HttpClient)?\s*\)\s*\{\s*super\s*\([^)]*\)\s*;?\s*\}/g, '');
  // Quitar importación de HttpClient si ya no se usa (se evaluará al final)
  return r;
}

/**
 * Transforma un driven-adapter que extiende un gateway con BaseService.
 * Reemplaza baseRequest() por llamadas HttpClient directas.
 * Quita @Identifier, quita this.identifier, quita IEndpointsModel/@Inject.
 */
function transformDrivenAdapter(content, symbols) {
  if (!symbols.has('HTTP_METHODS') && !symbols.has('Identifier') && !symbols.has('IEndpointsModel')) {
    return content;
  }
  let r = content;

  // ── 1. Detectar nombre del servicio desde @Identifier('ServiceName') ──────
  const identifierMatch = r.match(/@Identifier\s*\(\s*['"]([^'"]+)['"]\s*\)/);
  const serviceName = identifierMatch ? identifierMatch[1] : null;

  // ── 2. Detectar variables inyectadas en el constructor ───────────────────
  const endpointsVarMatch = r.match(/@Inject\(ENDPOINTS_CONFIG\)\s*private\s+(\w+)/);
  const opsVarMatch       = r.match(/@Inject\(OPERATION_IDS_CONFIG\)\s*private\s+(\w+)/);
  const httpVarMatch      = r.match(/public\s+(http(?:Client)?):\s*HttpClient/);
  const endpointsVar      = endpointsVarMatch ? endpointsVarMatch[1] : 'endpoints';
  const opsVar            = opsVarMatch       ? opsVarMatch[1]       : 'operationIdsConfig';
  const httpVar           = httpVarMatch      ? httpVarMatch[1]      : 'http';

  // ── 3. Extraer mapa OI_varname → OperationId entry ANTES de eliminarlas ──
  // Patrón: private OI_XXX = { OperationId: this.opsVar[this.identifier][Entry.KEY] }
  const oiMap = {}; // 'OI_GET_ALL' → 'CampaignsServiceOperationIdsEntries.GET_ALL_OPERATION_ID'
  const oiRe = /private\s+OI_(\w+)\s*=\s*\{[^}]*OperationId\s*:\s*this\.\w+\[this\.identifier\]\[([^\]]+)\][^}]*\}/g;
  let oiMatch;
  while ((oiMatch = oiRe.exec(r)) !== null) {
    oiMap['OI_' + oiMatch[1]] = oiMatch[2].trim();
  }

  // ── 4. Quitar @Identifier decorator ──────────────────────────────────────
  r = r.replace(/@Identifier\s*\(\s*['"][^'"]+['"]\s*\)\s*\n?/g, '');

  // ── 5. Reemplazar constructor completo por campos inject() ───────────────
  r = r.replace(
    /constructor\s*\(\s*[\s\S]*?super\s*\([^)]*\)\s*;?\s*\}/gs,
    [
      `private readonly ${httpVar} = inject(HttpClient);`,
      `  private readonly ${endpointsVar} = inject(ENDPOINTS_CONFIG);`,
      `  private readonly ${opsVar} = inject(OPERATION_IDS_CONFIG);`,
    ].join('\n')
  );

  // ── 6. Eliminar propiedades OI_* de clase ────────────────────────────────
  r = r.replace(/\s*private\s+OI_\w+\s*=\s*\{[^}]*\};\s*/g, '\n');

  // ── 7. Reemplazar acceso a endpoints/operationIds con serviceName ─────────
  if (serviceName) {
    r = r.replace(
      new RegExp('this\\.' + endpointsVar + '\\[this\\.identifier\\]\\[([^\\]]+)\\]', 'g'),
      `this.${endpointsVar}.${serviceName}[$1]`
    );
    r = r.replace(
      new RegExp('this\\.' + opsVar + '\\[this\\.identifier\\]\\[([^\\]]+)\\]', 'g'),
      `this.${opsVar}.${serviceName}[$1]`
    );
    r = r.replace(/this\.operationIds(?:Config)?\[this\.identifier\]\[([^\]]+)\]/g,
      `this.${opsVar}.${serviceName}[$1]`);
    // Acceso directo a endpoints sin identifier (después de ya haber resuelto)
    r = r.replace(
      new RegExp('this\\.' + endpointsVar + '\\[([A-Z][A-Za-z]+Entries\\.[A-Z_]+)\\]', 'g'),
      `this.${endpointsVar}.${serviceName}[$1]`
    );
  } else {
    r = r.replace(/this\.endpoints\[this\.identifier\]\[([^\]]+)\]/g, `this.${endpointsVar}[$1]`);
    r = r.replace(/this\.operationIds(?:Config)?\[this\.identifier\]\[([^\]]+)\]/g, `this.${opsVar}[$1]`);
  }

  // ── 8. Reemplazar baseRequest → HttpClient methods ───────────────────────
  // El patrón del archivo REAL:
  // const path = this.endpoints.X[Entry.GET_ALL];
  // return this.baseRequest<T>(path, HTTP_METHODS.GET, null, { headers: this.OI_GET_ALL }, null, true);
  //
  // Objetivo:
  // const headers = new HttpHeaders().set('OperationId', this.operationIdsConfig.X.GET_ALL_OPERATION_ID);
  // const path = this.endpoints.X.GET_ALL;
  // return this.http.get<T>(path, { headers });

  const METHOD_MAP = {
    'HTTP_METHODS.GET': 'get', 'HTTP_METHODS.POST': 'post',
    'HTTP_METHODS.PUT': 'put', 'HTTP_METHODS.DELETE': 'delete', 'HTTP_METHODS.PATCH': 'patch',
    "'GET'": 'get', "'POST'": 'post', "'PUT'": 'put', "'DELETE'": 'delete', "'PATCH'": 'patch',
    '"GET"': 'get', '"POST"': 'post', '"PUT"': 'put', '"DELETE"': 'delete', '"PATCH"': 'patch',
  };

  // Regex que captura baseRequest con opts en una línea o multilinea
  const baseReqRe = /this\.baseRequest<([^>]+)>\(\s*([\s\S]+?),\s*(HTTP_METHODS\.\w+|'[A-Z]+'|"[A-Z]+"),\s*(?:null|undefined),\s*\{([\s\S]*?)\}\s*,\s*(?:null|undefined),\s*true\s*\)/g;

  // Reemplazar baseRequest con contexto completo (incluyendo "return" anterior)
  // Patrón: return this.baseRequest<T>(path, METHOD, null, {opts}, null, true);
  // Con posible "const path = ..." antes
  r = r.replace(
    /return\s+this\.baseRequest<([^>]+)>\(\s*([\s\S]+?),\s*(HTTP_METHODS\.\w+|'[A-Z]+'|"[A-Z]+"),\s*(?:null|undefined),\s*\{([\s\S]*?)\}\s*,\s*(?:null|undefined),\s*true\s*\)/g,
    (match, T, pathExpr, methodRaw, opts) => {
      const method   = METHOD_MAP[methodRaw.trim()] || 'request';
      const path_    = pathExpr.trim();

      const bodyMatch    = opts.match(/\bbody\s*:\s*([^,\n}]+)/);
      const headersMatch = opts.match(/headers\s*:\s*(this\.OI_\w+|\{[^}]+\})/);
      const paramsMatch  = opts.match(/params\s*:\s*(\{[\s\S]+?\})/);

      const rawHeaders = headersMatch ? headersMatch[1].trim() : null;
      const params     = paramsMatch  ? paramsMatch[1].trim()  : null;
      const body       = bodyMatch    ? bodyMatch[1].trim()     : null;

      // Resolver headersExpr
      let headersExpr = '';
      if (rawHeaders) {
        if (rawHeaders.startsWith('this.OI_')) {
          const oiKey  = rawHeaders.replace('this.', '');
          const entry  = oiMap[oiKey];
          if (entry && serviceName) {
            const entryVal = entry.includes('.') ? entry.split('.').pop() : entry;
            headersExpr = `new HttpHeaders().set('OperationId', this.${opsVar}.${serviceName}.${entryVal})`;
          } else if (entry) {
            headersExpr = `new HttpHeaders().set('OperationId', this.${opsVar}[${entry}])`;
          } else {
            headersExpr = `new HttpHeaders()/* TODO: OperationId para ${oiKey} */`;
          }
        } else if (rawHeaders.startsWith('{')) {
          headersExpr = `new HttpHeaders(${rawHeaders})`;
        } else {
          headersExpr = rawHeaders;
        }
      }

      const optsArr = [
        headersExpr ? 'headers'            : null,
        params      ? `params: ${params}`  : null,
      ].filter(Boolean);

      const headersLine  = headersExpr ? `const headers = ${headersExpr};\n        ` : '';

      if (method === 'get' || method === 'delete') {
        const callOpts = optsArr.length ? `, { ${optsArr.join(', ')} }` : '';
        return `${headersLine}return this.${httpVar}.${method}<${T}>(${path_}${callOpts})`;
      } else {
        const bodyVal  = body || 'body';
        const callOpts = optsArr.length ? `, { ${optsArr.join(', ')} }` : '';
        return `${headersLine}return this.${httpVar}.${method}<${T}>(${path_}, ${bodyVal}${callOpts})`;
      }
    }
  );

  // Fallback: baseRequest residual
  r = r.replace(/this\.baseRequest</g, `/* TODO: reemplazar baseRequest */ this.${httpVar}.request<`);

  // ── 9. Limpiar HTTP_METHODS residuales ───────────────────────────────────
  r = r.replace(/HTTP_METHODS\.(\w+)/g, (_, m) => `'${m}'`);

  // ── 10. Actualizar import de @angular/core: añadir inject ────────────────
  if (/inject\(/.test(r)) {
    const coreRe  = /import\s*\{([^}]+)\}\s*from\s*['"]@angular\/core['"]/;
    const coreM   = r.match(coreRe);
    if (coreM) {
      const parts = coreM[1].split(',').map(s => s.trim()).filter(Boolean);
      if (!parts.includes('inject')) {
        // Poner inject delante, quitar Inject (con mayúscula, que era para @Inject)
        const filtered = parts.filter(p => p !== 'Inject');
        if (!filtered.includes('inject')) filtered.unshift('inject');
        r = r.replace(coreRe, `import { ${filtered.join(', ')} } from '@angular/core'`);
      }
    } else {
      r = `import { inject, Injectable } from '@angular/core';\n` + r;
    }
  }

  // ── 11. Actualizar import de @angular/common/http: añadir HttpHeaders ────
  if (/HttpHeaders/.test(r)) {
    const httpRe = /import\s*\{([^}]+)\}\s*from\s*['"]@angular\/common\/http['"]/;
    const httpM  = r.match(httpRe);
    if (httpM) {
      const parts = httpM[1].split(',').map(s => s.trim()).filter(Boolean);
      if (!parts.includes('HttpHeaders')) {
        parts.push('HttpHeaders');
        r = r.replace(httpRe, `import { ${parts.join(', ')} } from '@angular/common/http'`);
      }
    } else {
      r = `import { HttpClient, HttpHeaders } from '@angular/common/http';\n` + r;
    }
  }

  // ── 12. Agregar import de @angular/core si @Injectable() no tiene import ──
  if (/@Injectable\(\)/.test(r) && !/from\s*['"]@angular\/core['"]/.test(r)) {
    r = `import { Injectable } from '@angular/core';\n` + r;
  }

  // ── 13. Limpiar líneas vacías múltiples ──────────────────────────────────
  r = r.replace(/\n{3,}/g, '\n\n');

  return r;
}


function transformUsecase(content, symbols) {
  if (!symbols.has('IBaseUsecase')) return content;
  let r = content;

  // Eliminar implements IBaseUsecase<T>
  r = r.replace(/\s*implements\s+IBaseUsecase<[^>]+>/g, '');

  // Si @Injectable() existe pero no hay import de @angular/core, agregarlo
  if (/@Injectable\(\)/.test(r) && !/from\s*['"]@angular\/core['"]/.test(r)) {
    r = `import { Injectable } from '@angular/core';\n` + r;
  }

  return r;
}


function transformMapper(content, symbols) {
  if (!symbols.has('IBaseMapper')) return content;
  let r = content;
  r = r.replace(/\bimplements\s+IBaseMapper<([^>]+)>/g, 'implements IMapper<$1>');
  r = r.replace(/\bIBaseMapper\b/g, 'IMapper');
  // Agregar interface local
  const localIface = `\nexport interface IMapper<T> { fromMap(response: { meta: unknown; data: T }): T; }\n`;
  r = localIface + r;
  return r;
}


/**
 * Transforma la configuration.ts que usa IWidgetConfigurationModel e IInfrastructureMappingModel.
 */
function transformConfiguration(content, symbols) {
  if (!symbols.has('IWidgetConfigurationModel') && !symbols.has('IInfrastructureMappingModel')) {
    return content;
  }
  let r = content;

  // Eliminar "extends IWidgetConfigurationModel"
  r = r.replace(/\bextends\s+IWidgetConfigurationModel\b/g, '');

  // Quitar "as IInfrastructureMappingModel[]"
  r = r.replace(/\s*as\s+IInfrastructureMappingModel\[\]/g, '');

  // Reemplazar for-of que construye infrastructures[] por .map()
  r = r.replace(
    /const infrastructures\s*=\s*\[\s*\];\s*for\s*\(const item of DEFAULT_CONFIGURATION\.infrastructures[^)]*\)\s*\{[\s\S]*?infrastructures\.push\(\{[\s\S]*?provide:\s*item\.gateway,\s*useClass:\s*item\.implementation[\s\S]*?\}\s*\);\s*\}/g,
    `const infrastructures = (DEFAULT_CONFIGURATION.infrastructures || []).map(item => ({\n  provide: item.gateway,\n  useClass: item.implementation,\n}));`
  );

  // Reemplazar los nombres de las interfaces
  r = r.replace(/\bIWidgetConfigurationModel\b/g, 'ICoreWidgetConfig');
  r = r.replace(/\bIInfrastructureMappingModel\b/g, '{ gateway: any; implementation: any }');

  // Inyectar interface local después del último import
  const localInterface = `\n// ─── Interface local (reemplaza IWidgetConfigurationModel de core-utils) ───\nexport interface ICoreWidgetConfig {\n  infrastructures?: { gateway: any; implementation: any }[];\n  endpoints?: Record<string, Record<string, string>>;\n  operationIds?: Record<string, Record<string, string>>;\n  labels?: Record<string, unknown>;\n}\n`;
  const lastImportIdx = r.lastIndexOf('\nimport ');
  const afterLastImport = r.indexOf('\n', lastImportIdx + 1);
  if (lastImportIdx >= 0 && afterLastImport >= 0) {
    r = r.slice(0, afterLastImport + 1) + localInterface + r.slice(afterLastImport + 1);
  }

  return r;
}

async function removeCoreUtils() {
  print(title('ELIMINAR @bancolombia/core-utils-widgets-web'));

  // Verificar que existe en el proyecto
  const pkgPath = path.join(projectPath, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const hasDep = !!(
    (pkg.dependencies || {})['@bancolombia/core-utils-widgets-web'] ||
    (pkg.devDependencies || {})['@bancolombia/core-utils-widgets-web']
  );

  if (!hasDep) {
    print(ok('@bancolombia/core-utils-widgets-web NO está en package.json. Nada que hacer.'));
    // Igual buscamos imports residuales en el código
  }

  // Escanear archivos
  const tsFiles = getAllFiles(path.join(projectPath, 'src'), '.ts')
    .concat(getAllFiles(path.join(projectPath, 'projects'), '.ts'));

  const affected = tsFiles.filter(f => {
    try { return fs.readFileSync(f, 'utf-8').includes('@bancolombia/core-utils-widgets-web'); }
    catch { return false; }
  });

  if (affected.length === 0 && !hasDep) {
    print(ok('No se encontraron referencias a core-utils-widgets-web. Proyecto limpio.')); return;
  }

  print(info(`Archivos con referencias a core-utils: ${affected.length}`));
  affected.forEach(f => print(`  ${C.dim}· ${path.relative(projectPath, f)}${C.reset}`));

  const dryRun = await prompt('\n  ¿Ejecutar en modo dry-run (solo muestra cambios sin guardar)? (s/n): ');
  const isDry  = dryRun.toLowerCase() === 's';

  const confirm = await prompt(`  ¿${isDry ? 'Analizar' : 'Aplicar'} eliminación de core-utils? (s/n): `);
  if (confirm.toLowerCase() !== 's') { print(warn('Cancelado.')); return; }

  let changed = 0;
  const report = [];

  for (const filePath of affected) {
    const original = fs.readFileSync(filePath, 'utf-8');
    const symbols  = extractCoreUtilsSymbols(original);
    const rel      = path.relative(projectPath, filePath);

    print(`\n  ${C.cyan}→${C.reset} ${rel}`);
    print(`    Symbols: ${[...symbols].join(', ')}`);

    let result = original;

    // Aplicar transformaciones según los symbols detectados
    // Eliminar la línea de import de core-utils PRIMERO
    // (evita que los reemplazos de nombres dentro del bloque import rompan el regex de remoción)
    result = removeCoreUtilsImports(result);

    // Aplicar transformaciones según los symbols detectados
    result = transformGateway(result, symbols);
    result = transformDrivenAdapter(result, symbols);
    result = transformConfiguration(result, symbols);
    result = transformUsecase(result, symbols);
    result = transformMapper(result, symbols);

    // Limpiar líneas en blanco triples
    result = result.replace(/\n{3,}/g, '\n\n');

    const linesChanged = original.split('\n').length - result.split('\n').length;
    report.push({ rel, symbols: [...symbols], linesChanged });

    if (!isDry) {
      fs.writeFileSync(filePath, result, 'utf-8');
      print(`    ${ok('guardado')}`);
    } else {
      print(`    ${dim('[dry-run: no se guardó]')}`);
    }
    changed++;
  }

  // Actualizar package.json
  if (!isDry && hasDep) {
    print(step('Eliminando de package.json...'));
    if (pkg.dependencies) delete pkg.dependencies['@bancolombia/core-utils-widgets-web'];
    if (pkg.devDependencies) delete pkg.devDependencies['@bancolombia/core-utils-widgets-web'];
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
    print(ok('Eliminado de package.json'));
    print(info('Ejecuta: npm install --legacy-peer-deps  para sincronizar node_modules'));
  }

  separator();
  print(ok(`core-utils: ${changed} archivos ${isDry ? 'analizados' : 'transformados'}.`));

  if (!isDry) {
    print(warn('\nRevisión manual recomendada:'));
    print(dim('  · Verifica que los driven-adapters compilen (especialmente los baseRequest reemplazados)'));
    print(dim('  · Ajusta el acceso a endpoints si usaba this.identifier (marcado con TODO)'));
    print(dim('  · Ejecuta npm run build para verificar'));
  }
}

// ─── REESTRUCTURA DE CARPETAS ────────────────────────────────
/**
 * Migra la estructura de carpetas al patrón de registered-accounts-widget:
 *
 * Estructura ORIGEN (antigua):
 *   projects/<widget>/src/lib/
 *     domain/models/...
 *     domain/usecases/...
 *     infraestructure/driven-adapter/...   ← typo "infraestructure" incluido
 *     infrastructure/driven-adpaters/...   ← otro typo posible
 *     ui/pages/...
 *     ui/view-models/...
 *     mocks/...
 *     utils/...
 *
 * Estructura DESTINO (patrón registered-accounts):
 *   projects/<widget>/src/lib/
 *     features/
 *       <feature-name>/
 *         application/
 *           domain/
 *           infrastructure/   ← nombre correcto
 *           ui/
 *         testing/
 *           mock/
 *
 * Los archivos raíz (configuration.ts, routes.ts, tokens.ts, .ts principal)
 * se quedan en src/lib/ sin moverse.
 */

function getFeatureName(widgetDir) {
  // Deriva el nombre del feature del nombre de la librería en ng-package.json o del directorio
  const ngPkg = path.join(widgetDir, 'ng-package.json');
  if (fs.existsSync(ngPkg)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(ngPkg, 'utf-8'));
      if (pkg.lib && pkg.lib.entryFile) {
        // e.g. src/lib/manage-massive-campaigns-widget.ts → manage-massive-campaigns
        const base = path.basename(pkg.lib.entryFile, '.ts').replace(/-widget$/, '');
        return base;
      }
    } catch {}
  }
  return path.basename(widgetDir).replace(/-widget$/, '');
}

function buildFolderMapping(libDir, featureName) {
  /**
   * Retorna un array de { from: absolutePath, to: absolutePath }
   * para cada archivo que debe moverse.
   * Los archivos raíz (*.config.ts, *.routes.ts, *.tokens.ts, *.ts, injection.constants.ts)
   * quedan en libDir y no se mueven.
   */
  const ROOT_FILES_RE = /\.(config|routes|tokens|module|constants)\.ts$|^[^/]+\.ts$/;
  const appBase = path.join(libDir, 'features', featureName, 'application');
  const testBase = path.join(libDir, 'features', featureName, 'testing');

  const DIR_MAP = [
    // domain
    { from: path.join(libDir, 'domain'),         to: path.join(appBase, 'domain') },
    // infraestructure (typo original) → infrastructure
    { from: path.join(libDir, 'infraestructure'), to: path.join(appBase, 'infrastructure') },
    // infrastructure (typo alternativo driven-adpaters)
    { from: path.join(libDir, 'infrastructure'),  to: path.join(appBase, 'infrastructure') },
    // ui
    { from: path.join(libDir, 'ui'),              to: path.join(appBase, 'ui') },
    // mocks → testing/mock
    { from: path.join(libDir, 'mocks'),           to: path.join(testBase, 'mock') },
    // utils → application/ui/utils (o infrastructure/utils según contenido; va a ui/utils por defecto)
    { from: path.join(libDir, 'utils'),           to: path.join(appBase, 'ui', 'utils') },
  ];

  const mappings = []; // { fromAbs, toAbs }

  for (const { from, to } of DIR_MAP) {
    if (!fs.existsSync(from)) continue;
    const files = getAllFiles(from, '.ts').concat(
      getAllFiles(from, '.html'),
      getAllFiles(from, '.scss'),
      getAllFiles(from, '.spec.ts'),
    );
    for (const f of files) {
      const rel    = path.relative(from, f);
      const toAbs  = path.join(to, rel);
      mappings.push({ fromAbs: f, toAbs });
    }
  }

  // Deduplicar por fromAbs
  const seen = new Set();
  return mappings.filter(m => {
    if (seen.has(m.fromAbs)) return false;
    seen.add(m.fromAbs);
    return true;
  });
}

/**
 * Recalcula un import relativo desde newFilePath hacia targetAbs.
 * Si el import NO era relativo (empieza con @), lo deja igual.
 */
function recalcRelativeImport(oldFilePath, newFilePath, importStr, allMappings) {
  if (!importStr.startsWith('.')) return importStr; // absoluto, no tocar

  // Resolver la ruta absoluta que apunta el import original
  const oldDir     = path.dirname(oldFilePath);
  const targetAbs  = path.resolve(oldDir, importStr);

  // ¿Se movió ese archivo también?
  const mapping    = allMappings.find(m => m.fromAbs === targetAbs || m.fromAbs === targetAbs + '.ts');
  const finalTarget = mapping ? mapping.toAbs.replace(/\.ts$/, '') : targetAbs;

  // Calcular nuevo relativo desde newFilePath
  const newDir     = path.dirname(newFilePath);
  let newRel       = path.relative(newDir, finalTarget).replace(/\\/g, '/');
  if (!newRel.startsWith('.')) newRel = './' + newRel;
  return newRel;
}

/**
 * Actualiza los imports dentro de un archivo .ts después de moverlo.
 */
function updateImportsInFile(content, oldFilePath, newFilePath, allMappings) {
  return content.replace(
    /from\s*['"]([^'"]+)['"]/g,
    (match, importPath) => {
      const newPath = recalcRelativeImport(oldFilePath, newFilePath, importPath, allMappings);
      return `from '${newPath}'`;
    }
  );
}

async function restructureFolders() {
  print(title('REESTRUCTURA DE CARPETAS'));
  print(info('Migra al patrón: features/<nombre>/application/{domain,infrastructure,ui}/'));
  print(warn('Solo mueve los archivos de projects/<widget>/src/lib/ — los archivos raíz quedan igual.\n'));

  // Encontrar directorios de widget dentro de projects/
  const projectsDir = path.join(projectPath, 'projects');
  if (!fs.existsSync(projectsDir)) {
    print(err('No existe la carpeta projects/ en este proyecto.')); return;
  }

  const widgetDirs = fs.readdirSync(projectsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => path.join(projectsDir, d.name));

  if (widgetDirs.length === 0) {
    print(err('No se encontraron subdirectorios en projects/.')); return;
  }

  // Seleccionar widget si hay más de uno
  let widgetDir = widgetDirs[0];
  if (widgetDirs.length > 1) {
    print('  Widgets encontrados:');
    widgetDirs.forEach((d, i) => print(`  ${C.cyan}${i + 1}${C.reset}  ${path.basename(d)}`));
    const sel = await prompt('  Elige número: ');
    const idx = parseInt(sel) - 1;
    if (isNaN(idx) || idx < 0 || idx >= widgetDirs.length) {
      print(warn('Selección inválida.')); return;
    }
    widgetDir = widgetDirs[idx];
  }

  const libDir     = path.join(widgetDir, 'src', 'lib');
  const featureName = getFeatureName(widgetDir);

  print(info(`Widget   : ${path.basename(widgetDir)}`));
  print(info(`Feature  : ${featureName}`));
  print(info(`Lib dir  : ${libDir}\n`));

  if (!fs.existsSync(libDir)) {
    print(err(`No existe: ${libDir}`)); return;
  }

  // ¿Ya está migrado?
  const featuresDir = path.join(libDir, 'features');
  if (fs.existsSync(featuresDir)) {
    print(warn('La carpeta features/ ya existe. ¿Puede que ya esté migrado o parcialmente migrado.'));
    const cont = await prompt('  ¿Continuar de todas formas? (s/n): ');
    if (cont.toLowerCase() !== 's') { print(warn('Cancelado.')); return; }
  }

  const mappings = buildFolderMapping(libDir, featureName);

  if (mappings.length === 0) {
    print(warn('No se encontraron archivos para mover. Revisa que la estructura sea la esperada.')); return;
  }

  // Mostrar resumen
  print(`  Archivos a mover: ${C.bold}${mappings.length}${C.reset}\n`);
  const MAX_SHOW = 30;
  mappings.slice(0, MAX_SHOW).forEach(m => {
    const from = path.relative(libDir, m.fromAbs);
    const to   = path.relative(libDir, m.toAbs);
    print(`  ${C.dim}${from}${C.reset}`);
    print(`    ${C.green}→${C.reset} ${to}`);
  });
  if (mappings.length > MAX_SHOW) {
    print(dim(`  ... y ${mappings.length - MAX_SHOW} archivos más`));
  }

  print('');
  const dryRun = await prompt('  ¿Ejecutar en modo dry-run (solo muestra sin mover)? (s/n): ');
  const isDry  = dryRun.toLowerCase() === 's';

  if (isDry) {
    print(info('\nDry-run: ningún archivo fue movido.'));
    print(info('Ejecuta de nuevo sin dry-run para aplicar.'));
    return;
  }

  const confirm = await prompt('  ¿Confirmar reestructura de carpetas? (s/n): ');
  if (confirm.toLowerCase() !== 's') { print(warn('Cancelado.')); return; }

  // Mover archivos
  let moved = 0, failed = 0;

  for (const { fromAbs, toAbs } of mappings) {
    try {
      // Leer contenido y actualizar imports
      const original = fs.readFileSync(fromAbs, 'utf-8');
      const updated  = fromAbs.endsWith('.ts')
        ? updateImportsInFile(original, fromAbs, toAbs, mappings)
        : original;

      // Crear directorio destino si no existe
      fs.mkdirSync(path.dirname(toAbs), { recursive: true });

      // Escribir en destino
      fs.writeFileSync(toAbs, updated, 'utf-8');

      // Eliminar origen
      fs.unlinkSync(fromAbs);

      moved++;
    } catch (e) {
      print(err(`  Error moviendo ${path.relative(libDir, fromAbs)}: ${e.message}`));
      failed++;
    }
  }

  // Limpiar directorios vacíos que quedaron
  const oldDirs = ['domain', 'infraestructure', 'infrastructure', 'ui', 'mocks', 'utils'];
  for (const d of oldDirs) {
    const dirPath = path.join(libDir, d);
    if (fs.existsSync(dirPath)) {
      try {
        // Solo elimina si está vacío (rmdir falla si no lo está)
        fs.rmdirSync(dirPath, { recursive: true });
        print(dim(`  Carpeta eliminada: ${d}/`));
      } catch {}
    }
  }

  // Actualizar public-api.ts si existe
  const publicApi = path.join(widgetDir, 'src', 'public-api.ts');
  if (fs.existsSync(publicApi)) {
    print(step('Actualizando public-api.ts...'));
    const content = fs.readFileSync(publicApi, 'utf-8');
    // Re-calcular exports relativos que apuntaban a las rutas viejas
    const updated = content.replace(
      /export\s*\*\s*from\s*['"]([^'"]+)['"]/g,
      (match, importPath) => {
        const newPath = recalcRelativeImport(publicApi, publicApi, importPath, mappings);
        return `export * from '${newPath}'`;
      }
    );
    fs.writeFileSync(publicApi, updated, 'utf-8');
    print(ok('public-api.ts actualizado'));
  }

  separator();
  print(ok(`Reestructura completada: ${moved} archivos movidos${failed > 0 ? `, ${failed} errores` : ''}.`));
  print(warn('\nPróximos pasos recomendados:'));
  print(dim('  1. Ejecuta npm run build para verificar que compila'));
  print(dim('  2. Revisa los imports en archivos que NO estaban en src/lib/ (ej: src/app/*)'));
  print(dim('  3. Actualiza tsconfig paths si tienes aliases definidos'));
}

// ─── MIGRACIÓN COMPLETA ─────────────────────────────────────
async function runFullMigration(projectInfo) {
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

// ─── MIGRACIÓN MICROFRONT ────────────────────────────────────
/**
 * Detecta si el proyecto es un microfront (single-spa) buscando main.single-spa.ts
 * y la dependencia single-spa-angular en package.json.
 */
function isMicrofrontend(projPath) {
  const mainSpa = path.join(projPath, 'src', 'main.single-spa.ts');
  const pkg     = path.join(projPath, 'package.json');
  if (!fs.existsSync(mainSpa) || !fs.existsSync(pkg)) return false;
  const content = fs.readFileSync(pkg, 'utf-8');
  return content.includes('single-spa-angular');
}

/**
 * Analiza el app.module.ts y extrae:
 *  - el nombre del WidgetModule y su forRoot() con todos los parámetros
 *  - el nombre del componente bc-* (wrapper del widget)
 *  - la ruta principal del routing
 *  - las rutas de los WIDGET_ROUTES exportadas
 */
function parseMFModule(projPath) {
  const modulePath = path.join(projPath, 'src', 'app', 'app.module.ts');
  const routingPath = path.join(projPath, 'src', 'app', 'app-routing.module.ts');

  if (!fs.existsSync(modulePath)) return null;

  const moduleContent  = fs.readFileSync(modulePath, 'utf-8');
  const routingContent = fs.existsSync(routingPath) ? fs.readFileSync(routingPath, 'utf-8') : '';

  // Detectar el widget package (@bancolombia/...-widget-web)
  const widgetPkgMatch = moduleContent.match(/from\s*['"](@bancolombia\/[^'"]+widget-web)['"]/);
  const widgetPkg      = widgetPkgMatch ? widgetPkgMatch[1] : null;

  // Detectar el WidgetModule (nombre del import)
  const widgetModuleMatch = moduleContent.match(/import\s*\{([^}]+)\}\s*from\s*['"]@bancolombia\/[^'"]+widget-web['"]/);
  const widgetModuleRaw   = widgetModuleMatch ? widgetModuleMatch[1].trim() : '';
  // Puede haber varios exports; el Module suele terminar en WidgetModule o Module
  const widgetModuleName  = widgetModuleRaw.split(',').map(s => s.trim()).find(s => s.endsWith('Module') || s.endsWith('WidgetModule')) || widgetModuleRaw.split(',')[0].trim();

  // Detectar la función importProviders o el nombre esperado (convención: importProvidersFrom<Name>Widget)
  // Buscar el nombre del widget para construir el nombre de función
  const importFnName = widgetModuleName
    ? widgetModuleName.replace(/Module$/, '').replace(/Widget$/, '') + 'Widget'
    : null;

  // Detectar el bloque .forRoot({...}) — capturar todo el objeto de configuración
  const forRootMatch = moduleContent.match(/\.forRoot\(\s*(\{[\s\S]*?\})\s*\)/);
  const forRootConfig = forRootMatch ? forRootMatch[1] : '{}';

  // Detectar componente bc-* wrapper
  const bcComponentMatch = moduleContent.match(/import\s*\{([^}]+)\}\s*from\s*['"]\.\/(bc-[^/'"]+)\/[^'"]+['"]/);
  const bcComponentName  = bcComponentMatch ? bcComponentMatch[1].trim() : null;
  const bcComponentDir   = bcComponentMatch ? bcComponentMatch[2].trim() : null;

  // Detectar nombre del selector del componente bc-* (en el component.ts)
  let bcSelector = null;
  if (bcComponentDir) {
    const bcFiles = fs.readdirSync(path.join(projPath, 'src', 'app', bcComponentDir)).filter(f => f.endsWith('.component.ts') || f.endsWith('.ts'));
    for (const f of bcFiles) {
      const c = fs.readFileSync(path.join(projPath, 'src', 'app', bcComponentDir, f), 'utf-8');
      const m = c.match(/selector\s*:\s*['"]([^'"]+)['"]/);
      if (m) { bcSelector = m[1]; break; }
    }
  }

  // Detectar la ruta principal del routing (primer path no **)
  const mainRouteMatch = routingContent.match(/path\s*:\s*['"]([^'"*]+)['"]/);
  const mainRoute = mainRouteMatch ? mainRouteMatch[1] : 'bc-widget';

  // Detectar la constante WIDGET_ROUTES importada
  const widgetRoutesMatch = routingContent.match(/import\s*\{([^}]*ROUTES[^}]*)\}\s*from\s*['"]@bancolombia/);
  const widgetRoutesName  = widgetRoutesMatch
    ? widgetRoutesMatch[1].split(',').map(s => s.trim()).find(s => s.includes('ROUTES')) || null
    : null;

  // Detectar el template selector del main.single-spa.ts
  const mainSpaContent = fs.readFileSync(path.join(projPath, 'src', 'main.single-spa.ts'), 'utf-8');
  const templateMatch  = mainSpaContent.match(/template\s*:\s*['"]<([^>'"]+?)\s*\/>['"]/);
  const spaTemplate    = templateMatch ? templateMatch[1].trim() : 'mf-widget';

  // Detectar si hay imports adicionales en app.module (BcIllustrationModule etc.)
  const extraModuleImports = [];
  const extraImportRe = /import\s*\{([^}]+)\}\s*from\s*['"](@bancolombia\/design-system-web\/[^'"]+)['"]/g;
  let em;
  while ((em = extraImportRe.exec(moduleContent)) !== null) {
    extraModuleImports.push({ symbols: em[1].trim(), pkg: em[2] });
  }

  return {
    widgetPkg,
    widgetModuleName,
    widgetRoutesName,
    importFnName,
    forRootConfig,
    bcComponentName,
    bcComponentDir,
    bcSelector,
    mainRoute,
    spaTemplate,
    extraModuleImports,
  };
}

/**
 * Genera el contenido de app.ts (componente raíz standalone).
 */
function genAppTs(spaTemplate) {
  return `import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: '${spaTemplate}',
  standalone: true,
  template: \` <router-outlet></router-outlet>\`,
  imports: [RouterOutlet],
})
export class App {
  protected readonly title = signal('${spaTemplate}');
}
`;
}

/**
 * Genera app.config.ts basándose en el forRoot() del módulo original.
 * Construye la llamada importProvidersFrom<Widget>() con la misma config.
 */
function genAppConfig(parsed, widgetPkg) {
  const { importFnName, widgetModuleName, forRootConfig, widgetPkg: pkg, extraModuleImports } = parsed;

  // Nombre de la interface de configuración: I<Name>ConfigurationModel
  const baseName = (importFnName || widgetModuleName || 'Widget').replace(/Widget$/, '');
  const ifaceName = `I${baseName}ConfigurationModel`;
  const fnName    = `importProvidersFrom${baseName}Widget`;

  // Extras BDS (forRoot como provideXxx o imports adicionales)
  const extraProviders = extraModuleImports.map(e => {
    // Intentamos convertir BcIllustrationModule.forRoot({path:...}) a proveedor standalone
    return `  // TODO: migrar ${e.symbols} de ${e.pkg} a proveedor standalone si aplica`;
  }).join('\n');

  return `import { APP_BASE_HREF } from '@angular/common';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation, withHashLocation } from '@angular/router';
import { ${fnName}, ${ifaceName} } from '${pkg || widgetPkg}';
import { routes } from './app.routes';
import { environment } from '../environments/environment';

const WIDGET_CONFIG: ${ifaceName} = ${forRootConfig};

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: APP_BASE_HREF, useValue: '/' },
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withHashLocation(), withEnabledBlockingInitialNavigation()),
    ...${fnName}(WIDGET_CONFIG),
${extraProviders ? extraProviders + '\n' : ''}  ],
};
`;
}

/**
 * Genera app.routes.ts basándose en las rutas del AppRoutingModule original.
 */
function genAppRoutes(parsed, widgetPkg) {
  const { bcComponentName, bcComponentDir, mainRoute, widgetRoutesName, widgetPkg: pkg } = parsed;

  const routesImport = widgetRoutesName
    ? `import { ${widgetRoutesName} } from '${pkg || widgetPkg}';`
    : '// TODO: importar WIDGET_ROUTES desde el widget';

  const childrenBlock = widgetRoutesName
    ? `    children: ${widgetRoutesName},`
    : `    // children: WIDGET_ROUTES,`;

  const componentFile = bcComponentDir ? `./${bcComponentDir}/${bcComponentDir}` : './bc-widget/bc-widget';
  const componentName = bcComponentName || 'BcWidgetComponent';

  return `import { Routes } from '@angular/router';
${routesImport}
import { ${componentName} } from '${componentFile}';
import { EmptyRouteComponent } from './empty-route/empty-route.component';

export const routes: Routes = [
  {
    path: '${mainRoute}',
    component: ${componentName},
${childrenBlock}
  },
  {
    path: '**',
    component: EmptyRouteComponent,
  },
];
`;
}

/**
 * Genera main.single-spa.ts standalone.
 */
function genMainSingleSpa(spaTemplate) {
  return `import { NgZone } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { NavigationStart, Router } from '@angular/router';
import { getSingleSpaExtraProviders, singleSpaAngular } from 'single-spa-angular';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { singleSpaPropsSubject } from './single-spa/single-spa-props';

const lifecycles = singleSpaAngular({
  bootstrapFunction: singleSpaProps => {
    singleSpaPropsSubject.next(singleSpaProps);
    return bootstrapApplication(App, {
      ...appConfig,
      providers: [...(appConfig.providers ?? []), ...getSingleSpaExtraProviders()],
    });
  },
  template: '<${spaTemplate} />',
  Router,
  NavigationStart,
  NgZone,
});

export const bootstrap = lifecycles.bootstrap;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;
`;
}

/**
 * Genera el componente bc-* como standalone que importa el WidgetComponent.
 */
function genBcComponent(parsed, widgetPkg) {
  const { bcComponentName, bcComponentDir, bcSelector, widgetPkg: pkg } = parsed;
  // El widget standalone suele exportar un componente con el nombre base
  // Por convención: ManageMassiveCampaignsWidget, AlertsAndNotificationsLogWidget, etc.
  const widgetComponentName = (pkg || widgetPkg || '')
    .split('/').pop()                          // alerts-and-notifications-log-widget-web
    .replace(/-web$/, '')                      // alerts-and-notifications-log-widget
    .split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(''); // AlertsAndNotificationsLogWidget

  const templateFile = bcComponentDir
    ? `./${bcComponentDir.split('/').pop()}.html`
    : './bc-widget.html';

  const selector = bcSelector || 'bc-widget';

  return `import { Component } from '@angular/core';
import { ${widgetComponentName} } from '${pkg || widgetPkg}';

@Component({
  selector: '${selector}',
  standalone: true,
  imports: [${widgetComponentName}],
  templateUrl: '${templateFile}',
})
export class ${bcComponentName || 'BcWidgetComponent'} {}
`;
}

/**
 * Actualiza tsconfig.json al patrón Angular 20:
 * - moduleResolution: bundler
 * - esModuleInterop: true
 * - quita noImplicitOverride, noPropertyAccessFromIndexSignature, downlevelIteration, importHelpers
 * - agrega referencias a tsconfig.app.json y tsconfig.spec.json
 * - actualiza lib a es2018
 * - agrega typeCheckHostBindings en angularCompilerOptions
 */
function updateTsconfig(projPath) {
  const tsPath = path.join(projPath, 'tsconfig.json');
  if (!fs.existsSync(tsPath)) return false;

  const ts = JSON.parse(fs.readFileSync(tsPath, 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, ''));

  // CompilerOptions
  const co = ts.compilerOptions || {};
  co.moduleResolution = 'bundler';
  co.esModuleInterop  = true;
  co.lib              = ['es2018', 'dom'];
  delete co.noImplicitOverride;
  delete co.noPropertyAccessFromIndexSignature;
  delete co.downlevelIteration;
  delete co.importHelpers;
  delete co.strict; // Angular 20 lo maneja por tsconfig.app.json

  ts.compilerOptions = co;

  // AngularCompilerOptions
  ts.angularCompilerOptions = ts.angularCompilerOptions || {};
  ts.angularCompilerOptions.typeCheckHostBindings = true;

  // References
  ts.files = [];
  ts.references = [
    { path: './tsconfig.app.json' },
    { path: './tsconfig.spec.json' },
  ];

  fs.writeFileSync(tsPath, JSON.stringify(ts, null, 2) + '\n', 'utf-8');
  return true;
}

/**
 * Actualiza jest.config.js añadiendo testEnvironment: "jsdom".
 */
function updateJestConfig(projPath) {
  const jestPath = path.join(projPath, 'jest.config.js');
  if (!fs.existsSync(jestPath)) return false;
  let content = fs.readFileSync(jestPath, 'utf-8');
  if (content.includes('testEnvironment')) return true; // ya tiene
  content = content.replace(
    /clearMocks\s*:\s*true,/,
    'clearMocks: true,\n  testEnvironment: "jsdom",'
  );
  fs.writeFileSync(jestPath, content, 'utf-8');
  return true;
}

/**
 * Actualiza las dependencias MF en package.json a las versiones de Angular 20.
 */
function updateMFDependencies(projPath) {
  const pkgPath = path.join(projPath, 'package.json');
  const pkg     = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

  const UPDATES = {
    'single-spa-angular':              '9.2.0',
    '@angular-builders/custom-webpack': '20.0.0',
    'zone.js':                         '0.16.1',
    'jest-preset-angular':             '16.1.2',
  };

  let changed = false;
  for (const [dep, ver] of Object.entries(UPDATES)) {
    if (pkg.dependencies && pkg.dependencies[dep] !== undefined) {
      pkg.dependencies[dep] = ver; changed = true;
    }
    if (pkg.devDependencies && pkg.devDependencies[dep] !== undefined) {
      pkg.devDependencies[dep] = ver; changed = true;
    }
  }

  // Eliminar core-utils del package.json (no se usa en el MF)
  if (pkg.dependencies?.['@bancolombia/core-utils-widgets-web']) {
    delete pkg.dependencies['@bancolombia/core-utils-widgets-web'];
    changed = true;
  }
  if (pkg.devDependencies?.['@bancolombia/core-utils-widgets-web']) {
    delete pkg.devDependencies['@bancolombia/core-utils-widgets-web'];
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
  }
  return changed;
}

async function migrateMicrofrontend() {
  print(title('MIGRACIÓN MICROFRONT (single-spa → Angular 20 standalone)'));

  // Verificar que es un MF
  if (!isMicrofrontend(projectPath)) {
    print(err('Este proyecto no parece ser un microfront (no se encontró src/main.single-spa.ts o single-spa-angular en package.json).'));
    return;
  }

  // Verificar que usa NgModule (si ya está migrado, no hacer nada)
  const mainSpaContent = fs.readFileSync(path.join(projectPath, 'src', 'main.single-spa.ts'), 'utf-8');
  if (mainSpaContent.includes('bootstrapApplication')) {
    print(ok('main.single-spa.ts ya usa bootstrapApplication — el MF parece estar migrado a standalone.'));
    return;
  }

  print(info('Microfront detectado con NgModule. Se migrará a standalone.\n'));

  // Parsear el módulo actual
  const parsed = parseMFModule(projectPath);
  if (!parsed) {
    print(err('No se encontró app.module.ts. ¿El MF ya fue migrado manualmente?'));
    return;
  }

  print(info(`Widget detectado : ${parsed.widgetPkg || 'desconocido'}`));
  print(info(`Módulo actual    : ${parsed.widgetModuleName || 'desconocido'}`));
  print(info(`Componente bc-*  : ${parsed.bcComponentName || 'desconocido'} (${parsed.bcComponentDir})`));
  print(info(`Ruta principal   : ${parsed.mainRoute}`));
  print(info(`Template SPA     : <${parsed.spaTemplate} />`));
  if (parsed.widgetRoutesName) print(info(`Widget routes    : ${parsed.widgetRoutesName}`));
  if (parsed.extraModuleImports.length) {
    print(warn(`Imports adicionales detectados (revisión manual):`));
    parsed.extraModuleImports.forEach(e => print(dim(`  · ${e.symbols} from ${e.pkg}`)));
  }

  print('');
  print(`${C.bold}  Pasos que se ejecutarán:${C.reset}`);
  print(`  ${C.cyan}1${C.reset}  Migrar Angular ${parsed.angularVer || '?'} → 20 (ng update paso a paso)`);
  print(`  ${C.cyan}2${C.reset}  Generar app.ts, app.config.ts, app.routes.ts`);
  print(`  ${C.cyan}3${C.reset}  Actualizar main.single-spa.ts a bootstrapApplication`);
  print(`  ${C.cyan}4${C.reset}  Convertir componente bc-* a standalone`);
  print(`  ${C.cyan}5${C.reset}  Eliminar app.module.ts y app-routing.module.ts`);
  print(`  ${C.cyan}6${C.reset}  Actualizar tsconfig.json`);
  print(`  ${C.cyan}7${C.reset}  Actualizar jest.config.js`);
  print(`  ${C.cyan}8${C.reset}  Actualizar dependencias (single-spa-angular, custom-webpack, zone.js, jest-preset-angular)`);
  print(`  ${C.cyan}9${C.reset}  Eliminar core-utils-widgets-web de package.json`);
  print('');

  const runAngularUpdate = await prompt('  ¿Ejecutar migración Angular primero (ng update 16→20)? (s/n): ');
  const doAngularUpdate  = runAngularUpdate.toLowerCase() === 's';

  const confirm = await prompt('  ¿Confirmar transformación del MF? (s/n): ');
  if (confirm.toLowerCase() !== 's') { print(warn('Cancelado.')); return; }

  // ── Paso 1: migración Angular (opcional, usa la función existente) ──
  if (doAngularUpdate) {
    const pkgInfo = detectProject(projectPath);
    await migrateAngular(pkgInfo);
  }

  // ── Paso 2: Generar nuevos archivos ──
  print(step('Generando archivos standalone...'));

  const appDir = path.join(projectPath, 'src', 'app');

  // app.ts
  const appTsContent = genAppTs(parsed.spaTemplate);
  fs.writeFileSync(path.join(appDir, 'app.ts'), appTsContent, 'utf-8');
  print(ok('src/app/app.ts'));

  // app.config.ts
  const appConfigContent = genAppConfig(parsed, parsed.widgetPkg);
  fs.writeFileSync(path.join(appDir, 'app.config.ts'), appConfigContent, 'utf-8');
  print(ok('src/app/app.config.ts'));

  // app.routes.ts
  const appRoutesContent = genAppRoutes(parsed, parsed.widgetPkg);
  fs.writeFileSync(path.join(appDir, 'app.routes.ts'), appRoutesContent, 'utf-8');
  print(ok('src/app/app.routes.ts'));

  // ── Paso 3: Actualizar main.single-spa.ts ──
  print(step('Actualizando main.single-spa.ts...'));
  const newMainSpa = genMainSingleSpa(parsed.spaTemplate);
  fs.writeFileSync(path.join(projectPath, 'src', 'main.single-spa.ts'), newMainSpa, 'utf-8');
  print(ok('src/main.single-spa.ts'));

  // ── Paso 4: Convertir componente bc-* a standalone ──
  if (parsed.bcComponentDir) {
    print(step(`Actualizando componente ${parsed.bcComponentDir}...`));
    const bcDir     = path.join(appDir, parsed.bcComponentDir);
    const bcFiles   = fs.existsSync(bcDir) ? fs.readdirSync(bcDir) : [];
    const bcTsFile  = bcFiles.find(f => f.endsWith('.component.ts') || (f.endsWith('.ts') && !f.endsWith('.spec.ts')));

    if (bcTsFile) {
      const newBcContent = genBcComponent(parsed, parsed.widgetPkg);
      fs.writeFileSync(path.join(bcDir, bcTsFile), newBcContent, 'utf-8');
      print(ok(`src/app/${parsed.bcComponentDir}/${bcTsFile}`));
    } else {
      print(warn(`No se encontró archivo .ts en ${parsed.bcComponentDir} — actualiza manualmente`));
    }
  }

  // ── Paso 5: Eliminar app.module.ts y app-routing.module.ts ──
  print(step('Eliminando archivos NgModule...'));
  const filesToDelete = [
    path.join(appDir, 'app.module.ts'),
    path.join(appDir, 'app-routing.module.ts'),
  ];
  for (const f of filesToDelete) {
    if (fs.existsSync(f)) {
      fs.unlinkSync(f);
      print(ok(`Eliminado: ${path.relative(projectPath, f)}`));
    }
  }

  // ── Paso 6: Actualizar tsconfig.json ──
  print(step('Actualizando tsconfig.json...'));
  if (updateTsconfig(projectPath)) {
    print(ok('tsconfig.json actualizado'));
  } else {
    print(warn('tsconfig.json no encontrado'));
  }

  // ── Paso 7: Actualizar jest.config.js ──
  print(step('Actualizando jest.config.js...'));
  if (updateJestConfig(projectPath)) {
    print(ok('jest.config.js actualizado'));
  } else {
    print(warn('jest.config.js no encontrado'));
  }

  // ── Paso 8 y 9: Actualizar dependencias y eliminar core-utils ──
  print(step('Actualizando package.json (dependencias MF + eliminar core-utils)...'));
  if (updateMFDependencies(projectPath)) {
    print(ok('package.json actualizado'));
    print(info('Ejecuta: npm install --legacy-peer-deps  para sincronizar node_modules'));
  }

  separator();
  print(ok('Transformación del MF completada 🚀\n'));
  print(`${C.bold}Revisión manual necesaria:${C.reset}`);
  print(dim('  1. Verifica app.config.ts — el objeto WIDGET_CONFIG puede necesitar ajuste de tipos'));
  print(dim(`  2. Verifica el nombre del componente standalone exportado por el widget`));
  print(dim(`     (debe coincidir con el import en el bc-*.ts generado)`));
  if (parsed.extraModuleImports.length) {
    print(dim('  3. Migra los imports adicionales del módulo (BcIllustrationModule, etc.)'));
    parsed.extraModuleImports.forEach(e => print(dim(`     · ${e.symbols} desde ${e.pkg}`)));
  }
  print(dim('  4. Ejecuta: npm run build'));
  print(dim('  5. Ejecuta: npm test'));
  print(dim('  6. Revisa polyfills.ts (zone.js actualizado a 0.16.1)'));
}

// ─── MENÚ PRINCIPAL ─────────────────────────────────────────
async function showMenu(projectInfo) {
  const angVer = projectInfo.angularVer || '?';
  const bdVer  = projectInfo.bdsVer  || '?';

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
  print(`  ${C.cyan}8${C.reset}  Eliminar @bancolombia/core-utils-widgets-web`);
  print(`  ${C.cyan}9${C.reset}  Reestructura de carpetas (patrón registered-accounts)`);
  print(`  ${C.cyan}10${C.reset} Migrar Microfront (NgModule → standalone + Angular 20)`);
  print(`  ${C.cyan}11${C.reset} Convertir standalone: false → standalone: true`);
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
        case '8': await removeCoreUtils(); break;
        case '9': await restructureFolders(); break;
        case '10': await migrateMicrofrontend(); break;
        case '11': await convertStandaloneFlag(); break;
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
          print(warn('Opción inválida. Elige entre 0 y 11.'));
      }

      await prompt('\n  Presiona Enter para volver al menú...');
    }
  }
}

main().catch(e => {
  console.error(err(`Error inesperado: ${e.message}`));
  process.exit(1);
});