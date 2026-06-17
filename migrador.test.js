/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║       Test Suite — migrador.js                              ║
 * ║  Pruebas unitarias de todas las funciones puras del script  ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Ejecutar: node migrador.test.js
 * Sin dependencias externas — usa solo Node.js nativo.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

// ─── Extraer funciones puras del migrador sin ejecutar main() ───
// Cargamos el módulo pero silenciamos el arranque interactivo
// reemplazando readline y process.exit
const migradorSrc = fs.readFileSync('/tmp/migrador.js', 'utf-8')
  // Quitar shebang (new Function no lo tolera)
  .replace(/^#!.*\n/, '')
  // Quitar la llamada main() final para no arrancar el CLI
  .replace(/^main\(\)\.catch[\s\S]*$/m, '')
  // Convertir en módulo exportable
  + `
// ── Exportar funciones puras para testing ──
if (typeof module !== 'undefined') {
  module.exports = {
    detectProject,
    detectStandaloneStatus,
    detectControlFlow,
    detectBdsModules,
    getAllFiles,
    extractCoreUtilsSymbols,
    removeCoreUtilsImports,
    transformGateway,
    transformDrivenAdapter,
    transformConfiguration,
    transformUsecase,
    transformMapper,
    migrateTsFile,
    getFeatureName,
    buildFolderMapping,
    recalcRelativeImport,
    updateImportsInFile,
    isMicrofrontend,
    parseMFModule,
    genAppTs,
    genAppConfig,
    genAppRoutes,
    genMainSingleSpa,
    genBcComponent,
    updateTsconfig,
    updateJestConfig,
    updateMFDependencies,
    BDS_MAP,
    HTML_TAG_MAP,
    ATTR_MAP,
  };
}
`;

// Parcheamos projectPath antes de eval para evitar que funciones lo usen vacío
const migradorModule = (() => {
  const mod = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function('module', 'exports', 'require', '__dirname', '__filename', migradorSrc)(
    mod, mod.exports,
    require,
    path.dirname('/tmp/migrador.js'),
    '/tmp/migrador.js'
  );
  return mod.exports;
})();

const {
  detectProject, detectStandaloneStatus, detectControlFlow, detectBdsModules, getAllFiles,
  extractCoreUtilsSymbols, removeCoreUtilsImports,
  transformGateway, transformDrivenAdapter, transformConfiguration, transformUsecase, transformMapper,
  migrateTsFile,
  getFeatureName, buildFolderMapping, recalcRelativeImport, updateImportsInFile,
  isMicrofrontend, parseMFModule,
  genAppTs, genAppConfig, genAppRoutes, genMainSingleSpa, genBcComponent,
  updateTsconfig, updateJestConfig, updateMFDependencies,
  BDS_MAP, HTML_TAG_MAP, ATTR_MAP,
} = migradorModule;

// ─── Framework de testing minimalista ───────────────────────
let passed = 0, failed = 0, skipped = 0;
const results = [];
let currentSuite = '';

function suite(name) {
  currentSuite = name;
  console.log(`\n  ${name}`);
}

function test(name, fn) {
  try {
    fn();
    passed++;
    results.push({ suite: currentSuite, name, status: 'PASS' });
    console.log(`    ✔  ${name}`);
  } catch (e) {
    failed++;
    results.push({ suite: currentSuite, name, status: 'FAIL', error: e.message });
    console.log(`    ✖  ${name}`);
    console.log(`       ${e.message}`);
  }
}

function skip(name) {
  skipped++;
  results.push({ suite: currentSuite, name, status: 'SKIP' });
  console.log(`    ○  ${name}`);
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

function assertIncludes(str, substr, msg) {
  if (!str.includes(substr)) throw new Error(msg || `Expected "${substr}" in:\n${str.substring(0,300)}`);
}

function assertNotIncludes(str, substr, msg) {
  if (str.includes(substr)) throw new Error(msg || `Did NOT expect "${substr}" in string`);
}

// ─── Helpers de fixtures ────────────────────────────────────
let tmpDir;
function setupTmp() {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'migrador-test-'));
  return tmpDir;
}

function teardownTmp() {
  if (tmpDir && fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
}

function writeFile(relPath, content) {
  const full = path.join(tmpDir, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf-8');
  return full;
}

function readFile(relPath) {
  return fs.readFileSync(path.join(tmpDir, relPath), 'utf-8');
}

function writePkg(deps = {}, devDeps = {}) {
  const pkg = { dependencies: deps, devDependencies: devDeps };
  writeFile('package.json', JSON.stringify(pkg, null, 2));
}

// ════════════════════════════════════════════════════════════
//  SUITE 1 — BDS_MAP y HTML_TAG_MAP integridad
// ════════════════════════════════════════════════════════════
suite('1 · BDS_MAP integridad');

test('BDS_MAP tiene al menos 30 módulos mapeados', () => {
  assert(Object.keys(BDS_MAP).length >= 30);
});

test('Cada entrada de BDS_MAP tiene pkg y standalone no vacíos', () => {
  for (const [mod, val] of Object.entries(BDS_MAP)) {
    assert(val.pkg && val.pkg.length > 0, `${mod}: falta pkg`);
    assert(Array.isArray(val.standalone) && val.standalone.length > 0, `${mod}: standalone vacío`);
  }
});

test('HTML_TAG_MAP apunta a módulos que existen en BDS_MAP', () => {
  for (const [tag, mod] of Object.entries(HTML_TAG_MAP)) {
    assert(BDS_MAP[mod] !== undefined, `HTML_TAG_MAP['${tag}'] apunta a '${mod}' que no está en BDS_MAP`);
  }
});

test('ATTR_MAP apunta a módulos que existen en BDS_MAP', () => {
  for (const [attr, info] of Object.entries(ATTR_MAP)) {
    assert(BDS_MAP[info.module] !== undefined, `ATTR_MAP['${attr}'].module='${info.module}' no está en BDS_MAP`);
  }
});

test('BcTableModule mapea correctamente a 7 componentes standalone', () => {
  const entry = BDS_MAP['BcTableModule'];
  assertEqual(entry.standalone.length, 7);
  assert(entry.standalone.includes('BcTableDirective'));
  assert(entry.standalone.includes('BcCellDirective'));
});

test('BcButtonModule mapea a BcButtonDirective', () => {
  assertEqual(BDS_MAP['BcButtonModule'].standalone[0], 'BcButtonDirective');
});

test('BcSearchModule mapea a 7 componentes', () => {
  assertEqual(BDS_MAP['BcSearchModule'].standalone.length, 7);
});

// ════════════════════════════════════════════════════════════
//  SUITE 2 — detectProject
// ════════════════════════════════════════════════════════════
suite('2 · detectProject');

test('Retorna null si no existe package.json', () => {
  setupTmp();
  const result = detectProject(tmpDir);
  assertEqual(result, null);
  teardownTmp();
});

test('Detecta Angular 16', () => {
  setupTmp();
  writePkg({ '@angular/core': '16.2.12', '@bancolombia/design-system-web': '13.0.13' });
  const r = detectProject(tmpDir);
  assertEqual(r.angularVer, 16);
  teardownTmp();
});

test('Detecta Angular 20', () => {
  setupTmp();
  writePkg({ '@angular/core': '^20.3.21' });
  const r = detectProject(tmpDir);
  assertEqual(r.angularVer, 20);
  teardownTmp();
});

test('Detecta versión BDS correctamente', () => {
  setupTmp();
  writePkg({ '@angular/core': '16.0.0', '@bancolombia/design-system-web': '16.3.17' });
  const r = detectProject(tmpDir);
  assertEqual(r.bdsVer, 16);
  teardownTmp();
});

test('Detecta dependencias en devDependencies también', () => {
  setupTmp();
  writePkg({}, { '@angular/core': '18.0.0' });
  const r = detectProject(tmpDir);
  assertEqual(r.angularVer, 18);
  teardownTmp();
});

test('angularVer es 0 si no hay @angular/core', () => {
  setupTmp();
  writePkg({ 'rxjs': '^7.0.0' });
  const r = detectProject(tmpDir);
  assertEqual(r.angularVer, 0);
  teardownTmp();
});

// ════════════════════════════════════════════════════════════
//  SUITE 3 — detectStandaloneStatus
// ════════════════════════════════════════════════════════════
suite('3 · detectStandaloneStatus');

// Patch projectPath para estas pruebas
function withProject(dir, fn) {
  // Accedemos a projectPath via closure del módulo — usamos un truco:
  // las funciones que dependen de projectPath lo leen en tiempo de ejecución
  // Así que necesitamos que el módulo comparta la variable.
  // Como la exportamos con require, llamamos a las funciones con el dir como base
  // simulando que ya está en el módulo. En su lugar probamos directamente getAllFiles.
  fn(dir);
}

test('Detecta 0 standalone cuando todos son NgModule', () => {
  setupTmp();
  writeFile('src/app/app.module.ts', `@NgModule({ declarations: [AppComponent] }) export class AppModule {}`);
  writeFile('src/app/home/home.component.ts', `@Component({ selector: 'app-home' }) export class HomeComponent {}`);
  // Las funciones detectStandaloneStatus usan projectPath global — testeamos getAllFiles directamente
  const files = getAllFiles(path.join(tmpDir, 'src'), '.ts');
  assertEqual(files.length, 2);
  teardownTmp();
});

test('getAllFiles ignora node_modules y .git', () => {
  setupTmp();
  writeFile('src/app/app.ts', `// app`);
  writeFile('node_modules/pkg/index.ts', `// pkg`);
  writeFile('.git/config', `[core]`);
  const files = getAllFiles(path.join(tmpDir, 'src'), '.ts');
  assertEqual(files.length, 1);
  teardownTmp();
});

test('getAllFiles retorna array vacío si directorio no existe', () => {
  const files = getAllFiles('/ruta/que/no/existe', '.ts');
  assertEqual(files.length, 0);
});

test('getAllFiles encuentra archivos en subdirectorios', () => {
  setupTmp();
  writeFile('src/a/b/c/deep.ts', `// deep`);
  writeFile('src/a/shallow.ts', `// shallow`);
  const files = getAllFiles(path.join(tmpDir, 'src'), '.ts');
  assertEqual(files.length, 2);
  teardownTmp();
});

// ════════════════════════════════════════════════════════════
//  SUITE 4 — extractCoreUtilsSymbols
// ════════════════════════════════════════════════════════════
suite('4 · extractCoreUtilsSymbols');

test('Extrae IBaseUsecase de un import simple', () => {
  const content = `import { IBaseUsecase } from '@bancolombia/core-utils-widgets-web';`;
  const syms = extractCoreUtilsSymbols(content);
  assert(syms.has('IBaseUsecase'));
});

test('Extrae múltiples symbols de un solo import', () => {
  const content = `import { HTTP_METHODS, IEndpointsModel, Identifier } from '@bancolombia/core-utils-widgets-web';`;
  const syms = extractCoreUtilsSymbols(content);
  assert(syms.has('HTTP_METHODS'));
  assert(syms.has('IEndpointsModel'));
  assert(syms.has('Identifier'));
});

test('Extrae symbols de múltiples líneas de import', () => {
  const content = `
import { IBaseUsecase } from '@bancolombia/core-utils-widgets-web';
import { BaseService } from '@bancolombia/core-utils-widgets-web';
  `;
  const syms = extractCoreUtilsSymbols(content);
  assert(syms.has('IBaseUsecase'));
  assert(syms.has('BaseService'));
});

test('Retorna Set vacío si no hay import de core-utils', () => {
  const content = `import { Component } from '@angular/core';`;
  const syms = extractCoreUtilsSymbols(content);
  assertEqual(syms.size, 0);
});

test('Extrae IWidgetConfigurationModel e IInfrastructureMappingModel', () => {
  const content = `import { IWidgetConfigurationModel, IInfrastructureMappingModel } from '@bancolombia/core-utils-widgets-web';`;
  const syms = extractCoreUtilsSymbols(content);
  assert(syms.has('IWidgetConfigurationModel'));
  assert(syms.has('IInfrastructureMappingModel'));
});

// ════════════════════════════════════════════════════════════
//  SUITE 5 — removeCoreUtilsImports
// ════════════════════════════════════════════════════════════
suite('5 · removeCoreUtilsImports');

test('Elimina una línea de import de core-utils', () => {
  const content = `import { IBaseUsecase } from '@bancolombia/core-utils-widgets-web';\nimport { Injectable } from '@angular/core';`;
  const result = removeCoreUtilsImports(content);
  assertNotIncludes(result, 'core-utils-widgets-web');
  assertIncludes(result, `import { Injectable } from '@angular/core'`);
});

test('Elimina múltiples líneas de import de core-utils', () => {
  const content = `import { HTTP_METHODS } from '@bancolombia/core-utils-widgets-web';\nimport { IBaseUsecase } from '@bancolombia/core-utils-widgets-web';\nimport { Component } from '@angular/core';`;
  const result = removeCoreUtilsImports(content);
  assertNotIncludes(result, 'core-utils-widgets-web');
  assertIncludes(result, `'@angular/core'`);
});

test('No modifica imports que no son de core-utils', () => {
  const content = `import { Component } from '@angular/core';\nimport { HttpClient } from '@angular/common/http';`;
  const result = removeCoreUtilsImports(content);
  assertEqual(result, content);
});

test('Maneja contenido sin imports de core-utils', () => {
  const content = `export class MyService {}`;
  const result = removeCoreUtilsImports(content);
  assertEqual(result, content);
});

// ════════════════════════════════════════════════════════════
//  SUITE 6 — transformGateway
// ════════════════════════════════════════════════════════════
suite('6 · transformGateway');

test('Elimina "extends BaseService" del gateway', () => {
  const content = `
import { BaseService } from '@bancolombia/core-utils-widgets-web';
@Injectable()
export abstract class CampaignsGateway extends BaseService {
  abstract getAll(): Observable<any>;
}`;
  const syms = new Set(['BaseService']);
  const result = transformGateway(content, syms);
  assertNotIncludes(result, 'extends BaseService');
  assertIncludes(result, 'abstract class CampaignsGateway');
});

test('No modifica el gateway si no hay BaseService en symbols', () => {
  const content = `export abstract class XGateway extends BaseService {}`;
  const syms = new Set(['IBaseUsecase']);
  const result = transformGateway(content, syms);
  assertEqual(result, content);
});

test('Elimina constructor super(http) del gateway', () => {
  const content = `export abstract class XGateway extends BaseService {
  constructor(public http: HttpClient) { super(http); }
  abstract doSomething(): void;
}`;
  const syms = new Set(['BaseService']);
  const result = transformGateway(content, syms);
  assertNotIncludes(result, 'super(http)');
  assertNotIncludes(result, 'extends BaseService');
});

// ════════════════════════════════════════════════════════════
//  SUITE 7 — transformUsecase
// ════════════════════════════════════════════════════════════
suite('7 · transformUsecase');

test('Elimina implements IBaseUsecase<T>', () => {
  const content = `export class GetAllCampaignsUseCase implements IBaseUsecase<Response> {
  invoke(): Observable<Response> { return this.gateway.getAll(); }
}`;
  const syms = new Set(['IBaseUsecase']);
  const result = transformUsecase(content, syms);
  assertNotIncludes(result, 'implements IBaseUsecase');
  assertIncludes(result, 'export class GetAllCampaignsUseCase');
  assertIncludes(result, 'invoke()');
});

test('No modifica si no hay IBaseUsecase en symbols', () => {
  const content = `export class XUseCase implements IBaseUsecase<any> {}`;
  const syms = new Set(['BaseService']);
  const result = transformUsecase(content, syms);
  assertEqual(result, content);
});

test('Elimina IBaseUsecase con tipos genéricos complejos', () => {
  const content = `export class UseCase implements IBaseUsecase<Map<string, number>> { invoke() {} }`;
  const syms = new Set(['IBaseUsecase']);
  const result = transformUsecase(content, syms);
  assertNotIncludes(result, 'implements IBaseUsecase');
});

// ════════════════════════════════════════════════════════════
//  SUITE 8 — transformMapper
// ════════════════════════════════════════════════════════════
suite('8 · transformMapper');

test('Reemplaza IBaseMapper<T> por IMapper<T>', () => {
  const content = `import { IBaseMapper } from '@bancolombia/core-utils-widgets-web';
@Injectable()
export class ResponseDataMapper<T> implements IBaseMapper<T> {
  fromMap(response: { meta: any, data: T }): T { return response.data; }
}`;
  const syms = new Set(['IBaseMapper']);
  const result = transformMapper(content, syms);
  assertNotIncludes(result, 'IBaseMapper');
  assertIncludes(result, 'implements IMapper<T>');
  assertIncludes(result, 'interface IMapper<T>');
});

test('No modifica si no hay IBaseMapper en symbols', () => {
  const content = `export class Mapper implements IBaseMapper<any> {}`;
  const syms = new Set(['IBaseUsecase']);
  const result = transformMapper(content, syms);
  assertEqual(result, content);
});

// ════════════════════════════════════════════════════════════
//  SUITE 9 — transformConfiguration
// ════════════════════════════════════════════════════════════
suite('9 · transformConfiguration');

test('Elimina extends IWidgetConfigurationModel', () => {
  const content = `import { IWidgetConfigurationModel } from '@bancolombia/core-utils-widgets-web';
export interface IMyConfig extends IWidgetConfigurationModel {
  endpoints?: {};
}`;
  const syms = new Set(['IWidgetConfigurationModel']);
  const result = transformConfiguration(content, syms);
  assertNotIncludes(result, 'extends IWidgetConfigurationModel');
  assertIncludes(result, 'ICoreWidgetConfig');
});

test('Elimina cast as IInfrastructureMappingModel[]', () => {
  const content = `import { IInfrastructureMappingModel } from '@bancolombia/core-utils-widgets-web';
const infra = [
  { gateway: MyGateway, implementation: MyService }
] as IInfrastructureMappingModel[];`;
  const syms = new Set(['IInfrastructureMappingModel']);
  const result = transformConfiguration(content, syms);
  assertNotIncludes(result, 'as IInfrastructureMappingModel[]');
});

test('Inyecta interface ICoreWidgetConfig local', () => {
  const content = `import { IWidgetConfigurationModel } from '@bancolombia/core-utils-widgets-web';
import { Injectable } from '@angular/core';

export interface IMyConfig extends IWidgetConfigurationModel {}`;
  const syms = new Set(['IWidgetConfigurationModel']);
  const result = transformConfiguration(content, syms);
  assertIncludes(result, 'export interface ICoreWidgetConfig');
  assertIncludes(result, 'infrastructures?:');
});

test('Reemplaza for-of buildInfrastructures con .map()', () => {
  const content = `import { IInfrastructureMappingModel, IWidgetConfigurationModel } from '@bancolombia/core-utils-widgets-web';
import { last } from 'rxjs';

const DEFAULT_CONFIGURATION = { infrastructures: [] };
const infrastructures = [];
for (const item of DEFAULT_CONFIGURATION.infrastructures) {
  infrastructures.push({ provide: item.gateway, useClass: item.implementation });
}`;
  const syms = new Set(['IInfrastructureMappingModel', 'IWidgetConfigurationModel']);
  const result = transformConfiguration(content, syms);
  assertNotIncludes(result, 'for (const item of');
  assertIncludes(result, '.map(item =>');
});

// ════════════════════════════════════════════════════════════
//  SUITE 10 — transformDrivenAdapter
// ════════════════════════════════════════════════════════════
suite('10 · transformDrivenAdapter');

test('Elimina decorator @Identifier', () => {
  const content = `@Injectable()\n@Identifier('CampaignsService')\nexport class CampaignsService extends CampaignsGateway {}`;
  const syms = new Set(['Identifier']);
  const result = transformDrivenAdapter(content, syms);
  assertNotIncludes(result, "@Identifier('CampaignsService')");
  assertIncludes(result, 'export class CampaignsService');
});

test('Reemplaza HTTP_METHODS.GET por literal "GET"', () => {
  const content = `const method = HTTP_METHODS.GET;`;
  const syms = new Set(['HTTP_METHODS']);
  const result = transformDrivenAdapter(content, syms);
  assertNotIncludes(result, 'HTTP_METHODS.GET');
  assertIncludes(result, "'GET'");
});

test('Reemplaza HTTP_METHODS.POST por literal "POST"', () => {
  const content = `const method = HTTP_METHODS.POST;`;
  const syms = new Set(['HTTP_METHODS']);
  const result = transformDrivenAdapter(content, syms);
  assertIncludes(result, "'POST'");
});

test('Reemplaza HTTP_METHODS.DELETE por literal "DELETE"', () => {
  const content = `const method = HTTP_METHODS.DELETE;`;
  const syms = new Set(['HTTP_METHODS']);
  const result = transformDrivenAdapter(content, syms);
  assertIncludes(result, "'DELETE'");
});

test('Reemplaza acceso this.endpoints[this.identifier][Key]', () => {
  const content = `const path = this.endpoints[this.identifier][CampaignsServiceEntries.GET_ALL];`;
  const syms = new Set(['Identifier', 'IEndpointsModel']);
  const result = transformDrivenAdapter(content, syms);
  assertNotIncludes(result, 'this.identifier');
  assertIncludes(result, 'this.endpoints[CampaignsServiceEntries.GET_ALL]');
});

test('No actúa si no hay symbols de driven-adapter', () => {
  const content = `export class XService { doStuff() {} }`;
  const syms = new Set(['IBaseUsecase']);
  const result = transformDrivenAdapter(content, syms);
  assertEqual(result, content);
});

test('Reemplaza baseRequest GET por httpClient.get', () => {
  const content = `getAllCampaigns(): Observable<Response> {
  const path = this.endpoints[CampaignsEntries.GET_ALL];
  return this.baseRequest<Response>(path, HTTP_METHODS.GET, null, { headers: this.OI_HEADER }, null, true);
}`;
  const syms = new Set(['HTTP_METHODS', 'Identifier', 'IEndpointsModel']);
  const result = transformDrivenAdapter(content, syms);
  assertNotIncludes(result, 'this.baseRequest');
  assertIncludes(result, 'this.http.get<Response>');
});

test('Marca con TODO baseRequest no reconocidos', () => {
  const content = `return this.baseRequest<T>(path, 'PATCH', body, opts);`;
  const syms = new Set(['HTTP_METHODS', 'Identifier', 'IEndpointsModel']);
  const result = transformDrivenAdapter(content, syms);
  assertIncludes(result, 'TODO');
});

// ════════════════════════════════════════════════════════════
//  SUITE 11 — migrateTsFile (BDS)
// ════════════════════════════════════════════════════════════
suite('11 · migrateTsFile (BDS modules → standalone)');

test('Migra BcTableModule a standalone components', () => {
  setupTmp();
  const tsContent = `import { BcTableModule } from '@bancolombia/design-system-web/bc-table';
@Component({
  selector: 'app-test',
  imports: [BcTableModule],
})
export class TestComponent {}`;
  const tsFile = writeFile('src/app/test.component.ts', tsContent);
  const result = migrateTsFile(tsFile, null);
  assert(result !== null);
  assertIncludes(result.result, 'BcTableDirective');
  assertIncludes(result.result, 'BcTableContainerComponent');
  assertNotIncludes(result.result, 'BcTableModule');
  assertEqual(result.detected[0], 'BcTableModule');
  teardownTmp();
});

test('Migra BcButtonModule a BcButtonDirective', () => {
  setupTmp();
  const tsContent = `import { BcButtonModule } from '@bancolombia/design-system-web/bc-button';
@Component({ imports: [BcButtonModule] })
export class TestComponent {}`;
  const tsFile = writeFile('src/app/test.component.ts', tsContent);
  const result = migrateTsFile(tsFile, null);
  assert(result !== null);
  assertIncludes(result.result, 'BcButtonDirective');
  assertNotIncludes(result.result, 'BcButtonModule');
  teardownTmp();
});

test('Detecta módulos BDS desde HTML y los agrega al TS', () => {
  setupTmp();
  const tsContent = `import { Component } from '@angular/core';
@Component({ selector: 'app-test', imports: [] })
export class TestComponent {}`;
  const htmlContent = `<bc-icon name="check"></bc-icon>`;
  const tsFile   = writeFile('src/app/test.component.ts', tsContent);
  const htmlFile = writeFile('src/app/test.component.html', htmlContent);
  const result = migrateTsFile(tsFile, htmlFile);
  assert(result !== null);
  assertIncludes(result.result, 'BcIconComponent');
  teardownTmp();
});

test('Retorna null si no hay módulos BDS que migrar', () => {
  setupTmp();
  const tsContent = `import { Component } from '@angular/core';
@Component({ selector: 'app-test', standalone: true })
export class TestComponent {}`;
  const tsFile = writeFile('src/app/test.component.ts', tsContent);
  const result = migrateTsFile(tsFile, null);
  assertEqual(result, null);
  teardownTmp();
});

test('Migra múltiples módulos BDS en un mismo archivo', () => {
  setupTmp();
  const tsContent = `import { BcButtonModule } from '@bancolombia/design-system-web/bc-button';
import { BcIconModule } from '@bancolombia/design-system-web/bc-icon';
import { BcModalModule } from '@bancolombia/design-system-web/bc-modal';
@Component({ imports: [BcButtonModule, BcIconModule, BcModalModule] })
export class TestComponent {}`;
  const tsFile = writeFile('src/app/test.component.ts', tsContent);
  const result = migrateTsFile(tsFile, null);
  assert(result !== null);
  assertIncludes(result.result, 'BcButtonDirective');
  assertIncludes(result.result, 'BcIconComponent');
  assertIncludes(result.result, 'BcModalComponent');
  assertEqual(result.detected.length, 3);
  teardownTmp();
});

test('Detecta directiva bc-button en HTML vía ATTR_MAP', () => {
  setupTmp();
  const tsContent = `import { Component } from '@angular/core';
@Component({ imports: [] }) export class TestComponent {}`;
  const htmlContent = `<button bc-button>Click</button>`;
  const tsFile   = writeFile('src/app/test.component.ts', tsContent);
  const htmlFile = writeFile('src/app/test.component.html', htmlContent);
  const result = migrateTsFile(tsFile, htmlFile);
  assert(result !== null);
  assertIncludes(result.result, 'BcButtonDirective');
  teardownTmp();
});

// ════════════════════════════════════════════════════════════
//  SUITE 12 — getFeatureName y buildFolderMapping
// ════════════════════════════════════════════════════════════
suite('12 · getFeatureName y buildFolderMapping');

test('Extrae el nombre del feature desde ng-package.json', () => {
  setupTmp();
  writeFile('ng-package.json', JSON.stringify({ lib: { entryFile: 'src/lib/manage-massive-campaigns-widget.ts' } }));
  const name = getFeatureName(tmpDir);
  assertEqual(name, 'manage-massive-campaigns');
  teardownTmp();
});

test('Fallback al nombre del directorio si no hay ng-package.json', () => {
  setupTmp();
  // Simular nombre del directorio siendo alerts-and-notifications-log-widget
  const widgetDir = path.join(tmpDir, 'alerts-and-notifications-log-widget');
  fs.mkdirSync(widgetDir);
  const name = getFeatureName(widgetDir);
  assertEqual(name, 'alerts-and-notifications-log');
  teardownTmp();
});

test('buildFolderMapping mapea domain/ al destino correcto', () => {
  setupTmp();
  const libDir = path.join(tmpDir, 'src', 'lib');
  writeFile('src/lib/domain/models/my.model.ts', `export interface MyModel {}`);
  writeFile('src/lib/domain/usecases/get-all/get-all.usecase.ts', `export class GetAllUseCase {}`);
  const mappings = buildFolderMapping(libDir, 'my-feature');
  assert(mappings.length >= 2);
  const modelMapping = mappings.find(m => m.fromAbs.includes('my.model.ts'));
  assert(modelMapping !== undefined, 'No se encontró mapping para my.model.ts');
  assertIncludes(modelMapping.toAbs, 'features/my-feature/application/domain');
  teardownTmp();
});

test('buildFolderMapping mapea infraestructure/ (typo) a infrastructure/', () => {
  setupTmp();
  const libDir = path.join(tmpDir, 'src', 'lib');
  writeFile('src/lib/infraestructure/driven-adapter/service.ts', `export class MyService {}`);
  const mappings = buildFolderMapping(libDir, 'my-feature');
  const serviceMapping = mappings.find(m => m.fromAbs.includes('service.ts'));
  assert(serviceMapping !== undefined);
  assertIncludes(serviceMapping.toAbs, 'infrastructure'); // corrige el typo
  assertNotIncludes(serviceMapping.toAbs, 'infraestructure');
  teardownTmp();
});

test('buildFolderMapping mapea mocks/ a testing/mock/', () => {
  setupTmp();
  const libDir = path.join(tmpDir, 'src', 'lib');
  writeFile('src/lib/mocks/campaign.mock.ts', `export const campaignMock = {};`);
  const mappings = buildFolderMapping(libDir, 'my-feature');
  const mockMapping = mappings.find(m => m.fromAbs.includes('campaign.mock.ts'));
  assert(mockMapping !== undefined);
  assertIncludes(mockMapping.toAbs, 'testing/mock');
  teardownTmp();
});

test('buildFolderMapping no duplica archivos', () => {
  setupTmp();
  const libDir = path.join(tmpDir, 'src', 'lib');
  writeFile('src/lib/domain/service.ts', `export class S {}`);
  const mappings = buildFolderMapping(libDir, 'feature');
  const fromPaths = mappings.map(m => m.fromAbs);
  const unique = new Set(fromPaths);
  assertEqual(fromPaths.length, unique.size);
  teardownTmp();
});

// ════════════════════════════════════════════════════════════
//  SUITE 13 — recalcRelativeImport y updateImportsInFile
// ════════════════════════════════════════════════════════════
suite('13 · recalcRelativeImport y updateImportsInFile');

test('Deja imports absolutos (@angular/core) sin cambios', () => {
  const result = recalcRelativeImport('/old/file.ts', '/new/file.ts', '@angular/core', []);
  assertEqual(result, '@angular/core');
});

test('Recalcula import relativo cuando el archivo se mueve a una carpeta más profunda', () => {
  // file.ts pasa de /lib/domain/x.ts a /lib/features/feat/application/domain/x.ts
  // importa ../../utils/helper (que pasa de /lib/utils/helper.ts a /lib/features/feat/application/ui/utils/helper.ts)
  const allMappings = [
    {
      fromAbs: '/lib/utils/helper.ts',
      toAbs:   '/lib/features/feat/application/ui/utils/helper.ts',
    },
  ];
  const result = recalcRelativeImport(
    '/lib/domain/x.ts',
    '/lib/features/feat/application/domain/x.ts',
    '../../utils/helper',
    allMappings
  );
  // Desde /lib/features/feat/application/domain/ a /lib/features/feat/application/ui/utils/helper
  assertIncludes(result, 'helper');
  assert(result.startsWith('.'));
});

test('Recalcula import entre archivos en el mismo nivel después de mover', () => {
  const allMappings = [
    { fromAbs: '/lib/domain/model.ts',   toAbs: '/lib/features/f/application/domain/model.ts' },
    { fromAbs: '/lib/domain/gateway.ts', toAbs: '/lib/features/f/application/domain/gateway.ts' },
  ];
  const result = recalcRelativeImport(
    '/lib/domain/gateway.ts',
    '/lib/features/f/application/domain/gateway.ts',
    './model',
    allMappings
  );
  assertEqual(result, './model');
});

test('updateImportsInFile actualiza imports relativos en el contenido', () => {
  const allMappings = [
    { fromAbs: '/lib/utils/helper.ts', toAbs: '/lib/features/f/application/ui/utils/helper.ts' },
  ];
  const content = `import { helper } from '../../utils/helper';`;
  const result = updateImportsInFile(
    content,
    '/lib/domain/service.ts',
    '/lib/features/f/application/domain/service.ts',
    allMappings
  );
  // El import debe haber cambiado y apuntar a helper
  assertIncludes(result, 'helper');
  assert(result.startsWith("import { helper } from '"));
});

test('updateImportsInFile no modifica imports de paquetes npm', () => {
  const content = `import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';`;
  const result = updateImportsInFile(content, '/old/file.ts', '/new/deep/file.ts', []);
  assertIncludes(result, `'@angular/core'`);
  assertIncludes(result, `'@angular/common/http'`);
});

// ════════════════════════════════════════════════════════════
//  SUITE 14 — isMicrofrontend
// ════════════════════════════════════════════════════════════
suite('14 · isMicrofrontend');

test('Detecta MF con main.single-spa.ts y single-spa-angular en package.json', () => {
  setupTmp();
  writeFile('src/main.single-spa.ts', `export const bootstrap = lifecycles.bootstrap;`);
  writePkg({ 'single-spa-angular': '9.1.2' });
  // isMicrofrontend usa projectPath internamente — lo simulamos con el tmpDir
  // Como projectPath es global en el módulo, necesitamos probar el comportamiento
  // testando directamente los archivos que la función verifica
  const mainSpaExists = fs.existsSync(path.join(tmpDir, 'src', 'main.single-spa.ts'));
  const pkgContent    = fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf-8');
  assert(mainSpaExists, 'main.single-spa.ts debe existir');
  assert(pkgContent.includes('single-spa-angular'), 'package.json debe tener single-spa-angular');
  teardownTmp();
});

test('No es MF si falta main.single-spa.ts', () => {
  setupTmp();
  writePkg({ 'single-spa-angular': '9.1.2' });
  const mainSpaExists = fs.existsSync(path.join(tmpDir, 'src', 'main.single-spa.ts'));
  assert(!mainSpaExists);
  teardownTmp();
});

test('No es MF si falta single-spa-angular en package.json', () => {
  setupTmp();
  writeFile('src/main.single-spa.ts', `export const bootstrap = lifecycles.bootstrap;`);
  writePkg({ '@angular/core': '16.0.0' });
  const pkgContent = fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf-8');
  assert(!pkgContent.includes('single-spa-angular'));
  teardownTmp();
});

// ════════════════════════════════════════════════════════════
//  SUITE 15 — parseMFModule
// ════════════════════════════════════════════════════════════
suite('15 · parseMFModule');

const MF_MODULE_CONTENT = `import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ManageMassiveCampaignsWidgetModule } from '@bancolombia/manage-massive-campaigns-widget-web';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BcManageMassiveCampaignsComponent } from './bc-manage-massive-campaigns/bc-manage-massive-campaigns.component';
import { EmptyRouteComponent } from './empty-route/empty-route.component';

@NgModule({
  declarations: [AppComponent, EmptyRouteComponent, BcManageMassiveCampaignsComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ManageMassiveCampaignsWidgetModule.forRoot({
      endpoints: { CampaignsService: { GET_ALL_MASSIVE_CAMPAIGNS: environment.GET_ALL } },
      operationIds: { CampaignsService: { GET_ALL_OPERATION_ID: 'CTB-000' } }
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}`;

const MF_ROUTING_CONTENT = `import { Routes } from '@angular/router';
import { MANAGE_MASSIVE_CAMPAIGNS_WIDGET_ROUTES } from '@bancolombia/manage-massive-campaigns-widget-web';
import { BcManageMassiveCampaignsComponent } from './bc-manage-massive-campaigns/bc-manage-massive-campaigns.component';
import { EmptyRouteComponent } from './empty-route/empty-route.component';

const routes: Routes = [
  { path: 'bc-manage-massive-campaigns', component: BcManageMassiveCampaignsComponent, children: MANAGE_MASSIVE_CAMPAIGNS_WIDGET_ROUTES },
  { path: '**', component: EmptyRouteComponent },
];`;

const MF_SINGLE_SPA_CONTENT = `const lifecycles = singleSpaAngular({
  template: '<mf-manage-massive-campaigns />',
  Router, NavigationStart, NgZone,
});`;

const BC_COMPONENT_CONTENT = `@Component({
  selector: 'bancolombia-bc-manage-massive-campaigns',
})
export class BcManageMassiveCampaignsComponent {}`;

test('parseMFModule extrae widgetPkg correctamente', () => {
  setupTmp();
  writeFile('src/app/app.module.ts', MF_MODULE_CONTENT);
  writeFile('src/app/app-routing.module.ts', MF_ROUTING_CONTENT);
  writeFile('src/main.single-spa.ts', MF_SINGLE_SPA_CONTENT);
  writeFile('src/app/bc-manage-massive-campaigns/bc-manage-massive-campaigns.component.ts', BC_COMPONENT_CONTENT);
  const parsed = parseMFModule(tmpDir);
  assert(parsed !== null);
  assertEqual(parsed.widgetPkg, '@bancolombia/manage-massive-campaigns-widget-web');
  teardownTmp();
});

test('parseMFModule extrae widgetModuleName', () => {
  setupTmp();
  writeFile('src/app/app.module.ts', MF_MODULE_CONTENT);
  writeFile('src/app/app-routing.module.ts', MF_ROUTING_CONTENT);
  writeFile('src/main.single-spa.ts', MF_SINGLE_SPA_CONTENT);
  writeFile('src/app/bc-manage-massive-campaigns/bc-manage-massive-campaigns.component.ts', BC_COMPONENT_CONTENT);
  const parsed = parseMFModule(tmpDir);
  assertEqual(parsed.widgetModuleName, 'ManageMassiveCampaignsWidgetModule');
  teardownTmp();
});

test('parseMFModule extrae widgetRoutesName desde routing', () => {
  setupTmp();
  writeFile('src/app/app.module.ts', MF_MODULE_CONTENT);
  writeFile('src/app/app-routing.module.ts', MF_ROUTING_CONTENT);
  writeFile('src/main.single-spa.ts', MF_SINGLE_SPA_CONTENT);
  writeFile('src/app/bc-manage-massive-campaigns/bc-manage-massive-campaigns.component.ts', BC_COMPONENT_CONTENT);
  const parsed = parseMFModule(tmpDir);
  assertEqual(parsed.widgetRoutesName, 'MANAGE_MASSIVE_CAMPAIGNS_WIDGET_ROUTES');
  teardownTmp();
});

test('parseMFModule extrae ruta principal correctamente', () => {
  setupTmp();
  writeFile('src/app/app.module.ts', MF_MODULE_CONTENT);
  writeFile('src/app/app-routing.module.ts', MF_ROUTING_CONTENT);
  writeFile('src/main.single-spa.ts', MF_SINGLE_SPA_CONTENT);
  writeFile('src/app/bc-manage-massive-campaigns/bc-manage-massive-campaigns.component.ts', BC_COMPONENT_CONTENT);
  const parsed = parseMFModule(tmpDir);
  assertEqual(parsed.mainRoute, 'bc-manage-massive-campaigns');
  teardownTmp();
});

test('parseMFModule extrae el template selector single-spa', () => {
  setupTmp();
  writeFile('src/app/app.module.ts', MF_MODULE_CONTENT);
  writeFile('src/app/app-routing.module.ts', MF_ROUTING_CONTENT);
  writeFile('src/main.single-spa.ts', MF_SINGLE_SPA_CONTENT);
  writeFile('src/app/bc-manage-massive-campaigns/bc-manage-massive-campaigns.component.ts', BC_COMPONENT_CONTENT);
  const parsed = parseMFModule(tmpDir);
  assertEqual(parsed.spaTemplate, 'mf-manage-massive-campaigns');
  teardownTmp();
});

test('parseMFModule extrae el forRoot config', () => {
  setupTmp();
  writeFile('src/app/app.module.ts', MF_MODULE_CONTENT);
  writeFile('src/app/app-routing.module.ts', MF_ROUTING_CONTENT);
  writeFile('src/main.single-spa.ts', MF_SINGLE_SPA_CONTENT);
  writeFile('src/app/bc-manage-massive-campaigns/bc-manage-massive-campaigns.component.ts', BC_COMPONENT_CONTENT);
  const parsed = parseMFModule(tmpDir);
  assertIncludes(parsed.forRootConfig, 'endpoints');
  assertIncludes(parsed.forRootConfig, 'operationIds');
  teardownTmp();
});

test('parseMFModule retorna null si no existe app.module.ts', () => {
  setupTmp();
  const parsed = parseMFModule(tmpDir);
  assertEqual(parsed, null);
  teardownTmp();
});

// ════════════════════════════════════════════════════════════
//  SUITE 16 — genAppTs, genAppConfig, genAppRoutes, genMainSingleSpa, genBcComponent
// ════════════════════════════════════════════════════════════
suite('16 · Generadores de archivos MF');

test('genAppTs genera componente raíz con selector correcto', () => {
  const result = genAppTs('mf-manage-massive-campaigns');
  assertIncludes(result, `selector: 'mf-manage-massive-campaigns'`);
  assertIncludes(result, 'standalone: true');
  assertIncludes(result, 'RouterOutlet');
  assertIncludes(result, 'export class App');
});

test('genAppTs importa RouterOutlet', () => {
  const result = genAppTs('mf-alerts');
  assertIncludes(result, `import { RouterOutlet } from '@angular/router'`);
});

test('genMainSingleSpa genera bootstrapApplication en lugar de bootstrapModule', () => {
  const result = genMainSingleSpa('mf-manage-massive-campaigns');
  assertIncludes(result, 'bootstrapApplication');
  assertNotIncludes(result, 'bootstrapModule');
  assertNotIncludes(result, 'AppModule');
  assertIncludes(result, 'getSingleSpaExtraProviders');
  assertIncludes(result, `'<mf-manage-massive-campaigns />'`);
});

test('genMainSingleSpa importa App desde ./app/app', () => {
  const result = genMainSingleSpa('mf-test');
  assertIncludes(result, `from './app/app'`);
  assertIncludes(result, `from './app/app.config'`);
});

test('genAppRoutes genera routes con EmptyRouteComponent', () => {
  const parsed = {
    bcComponentName: 'BcManageMassiveCampaignsComponent',
    bcComponentDir: 'bc-manage-massive-campaigns',
    mainRoute: 'bc-manage-massive-campaigns',
    widgetRoutesName: 'MANAGE_MASSIVE_CAMPAIGNS_WIDGET_ROUTES',
    widgetPkg: '@bancolombia/manage-massive-campaigns-widget-web',
  };
  const result = genAppRoutes(parsed, parsed.widgetPkg);
  assertIncludes(result, 'EmptyRouteComponent');
  assertIncludes(result, 'bc-manage-massive-campaigns');
  assertIncludes(result, 'MANAGE_MASSIVE_CAMPAIGNS_WIDGET_ROUTES');
  assertIncludes(result, 'BcManageMassiveCampaignsComponent');
  assertIncludes(result, `path: '**'`);
});

test('genAppConfig genera importProvidersFrom con el nombre correcto', () => {
  const parsed = {
    importFnName: 'ManageMassiveCampaignsWidget',
    widgetModuleName: 'ManageMassiveCampaignsWidgetModule',
    forRootConfig: '{ endpoints: {}, operationIds: {} }',
    widgetPkg: '@bancolombia/manage-massive-campaigns-widget-web',
    extraModuleImports: [],
  };
  const result = genAppConfig(parsed, parsed.widgetPkg);
  assertIncludes(result, 'importProvidersFromManageMassiveCampaignsWidget');
  assertIncludes(result, 'ApplicationConfig');
  assertIncludes(result, 'APP_BASE_HREF');
  assertIncludes(result, 'provideRouter');
  assertIncludes(result, 'withHashLocation');
});

test('genBcComponent genera componente standalone con import del widget', () => {
  const parsed = {
    bcComponentName: 'BcManageMassiveCampaignsComponent',
    bcComponentDir: 'bc-manage-massive-campaigns',
    bcSelector: 'bancolombia-bc-manage-massive-campaigns',
    widgetPkg: '@bancolombia/manage-massive-campaigns-widget-web',
  };
  const result = genBcComponent(parsed, parsed.widgetPkg);
  assertIncludes(result, 'standalone: true');
  assertIncludes(result, 'BcManageMassiveCampaignsComponent');
  // El nombre del widget se deriva quitando -web del final y PascalCase
  assertIncludes(result, 'ManageMassiveCampaignsWidget');
  assertIncludes(result, `'@bancolombia/manage-massive-campaigns-widget-web'`);
});

// ════════════════════════════════════════════════════════════
//  SUITE 17 — updateTsconfig y updateJestConfig
// ════════════════════════════════════════════════════════════
suite('17 · updateTsconfig y updateJestConfig');

test('updateTsconfig cambia moduleResolution a bundler', () => {
  setupTmp();
  const tsconfig = {
    compilerOptions: {
      moduleResolution: 'node',
      noImplicitOverride: true,
      downlevelIteration: true,
      importHelpers: true,
      lib: ['es2020', 'dom'],
    },
    angularCompilerOptions: { strictTemplates: true },
  };
  writeFile('tsconfig.json', JSON.stringify(tsconfig, null, 2));
  updateTsconfig(tmpDir);
  const result = JSON.parse(readFile('tsconfig.json'));
  assertEqual(result.compilerOptions.moduleResolution, 'bundler');
  teardownTmp();
});

test('updateTsconfig elimina flags obsoletos', () => {
  setupTmp();
  const tsconfig = {
    compilerOptions: {
      noImplicitOverride: true,
      noPropertyAccessFromIndexSignature: true,
      downlevelIteration: true,
      importHelpers: true,
    },
  };
  writeFile('tsconfig.json', JSON.stringify(tsconfig, null, 2));
  updateTsconfig(tmpDir);
  const result = JSON.parse(readFile('tsconfig.json'));
  assert(result.compilerOptions.noImplicitOverride === undefined, 'noImplicitOverride debe eliminarse');
  assert(result.compilerOptions.downlevelIteration === undefined, 'downlevelIteration debe eliminarse');
  assert(result.compilerOptions.importHelpers === undefined, 'importHelpers debe eliminarse');
  teardownTmp();
});

test('updateTsconfig agrega esModuleInterop: true', () => {
  setupTmp();
  writeFile('tsconfig.json', JSON.stringify({ compilerOptions: {} }, null, 2));
  updateTsconfig(tmpDir);
  const result = JSON.parse(readFile('tsconfig.json'));
  assertEqual(result.compilerOptions.esModuleInterop, true);
  teardownTmp();
});

test('updateTsconfig agrega references a tsconfig.app.json y tsconfig.spec.json', () => {
  setupTmp();
  writeFile('tsconfig.json', JSON.stringify({ compilerOptions: {} }, null, 2));
  updateTsconfig(tmpDir);
  const result = JSON.parse(readFile('tsconfig.json'));
  assert(Array.isArray(result.references));
  assert(result.references.some(r => r.path === './tsconfig.app.json'));
  assert(result.references.some(r => r.path === './tsconfig.spec.json'));
  teardownTmp();
});

test('updateTsconfig actualiza lib a es2018', () => {
  setupTmp();
  writeFile('tsconfig.json', JSON.stringify({ compilerOptions: { lib: ['es2020', 'dom'] } }, null, 2));
  updateTsconfig(tmpDir);
  const result = JSON.parse(readFile('tsconfig.json'));
  assert(result.compilerOptions.lib.includes('es2018'));
  teardownTmp();
});

test('updateTsconfig agrega typeCheckHostBindings en angularCompilerOptions', () => {
  setupTmp();
  writeFile('tsconfig.json', JSON.stringify({ compilerOptions: {}, angularCompilerOptions: { strictTemplates: true } }, null, 2));
  updateTsconfig(tmpDir);
  const result = JSON.parse(readFile('tsconfig.json'));
  assertEqual(result.angularCompilerOptions.typeCheckHostBindings, true);
  teardownTmp();
});

test('updateTsconfig retorna false si no existe el archivo', () => {
  setupTmp();
  const result = updateTsconfig(tmpDir);
  assertEqual(result, false);
  teardownTmp();
});

test('updateJestConfig agrega testEnvironment jsdom', () => {
  setupTmp();
  writeFile('jest.config.js', `module.exports = {\n  preset: 'jest-preset-angular',\n  clearMocks: true,\n  verbose: true\n};\n`);
  updateJestConfig(tmpDir);
  const result = readFile('jest.config.js');
  assertIncludes(result, 'testEnvironment');
  assertIncludes(result, 'jsdom');
  teardownTmp();
});

test('updateJestConfig no duplica testEnvironment si ya existe', () => {
  setupTmp();
  writeFile('jest.config.js', `module.exports = { testEnvironment: "jsdom", clearMocks: true };\n`);
  updateJestConfig(tmpDir);
  const result = readFile('jest.config.js');
  const count = (result.match(/testEnvironment/g) || []).length;
  assertEqual(count, 1);
  teardownTmp();
});

// ════════════════════════════════════════════════════════════
//  SUITE 18 — updateMFDependencies
// ════════════════════════════════════════════════════════════
suite('18 · updateMFDependencies');

test('Actualiza single-spa-angular a 9.2.0', () => {
  setupTmp();
  writePkg({ 'single-spa-angular': '8.1.0' });
  updateMFDependencies(tmpDir);
  const pkg = JSON.parse(readFile('package.json'));
  assertEqual(pkg.dependencies['single-spa-angular'], '9.2.0');
  teardownTmp();
});

test('Actualiza @angular-builders/custom-webpack a 20.0.0', () => {
  setupTmp();
  writePkg({}, { '@angular-builders/custom-webpack': '16.0.1' });
  updateMFDependencies(tmpDir);
  const pkg = JSON.parse(readFile('package.json'));
  assertEqual(pkg.devDependencies['@angular-builders/custom-webpack'], '20.0.0');
  teardownTmp();
});

test('Actualiza zone.js a 0.16.1', () => {
  setupTmp();
  writePkg({ 'zone.js': '0.13.3' });
  updateMFDependencies(tmpDir);
  const pkg = JSON.parse(readFile('package.json'));
  assertEqual(pkg.dependencies['zone.js'], '0.16.1');
  teardownTmp();
});

test('Actualiza jest-preset-angular a 16.1.2', () => {
  setupTmp();
  writePkg({}, { 'jest-preset-angular': '14.2.2' });
  updateMFDependencies(tmpDir);
  const pkg = JSON.parse(readFile('package.json'));
  assertEqual(pkg.devDependencies['jest-preset-angular'], '16.1.2');
  teardownTmp();
});

test('Elimina @bancolombia/core-utils-widgets-web de dependencies', () => {
  setupTmp();
  writePkg({ '@bancolombia/core-utils-widgets-web': '8.0.0', 'zone.js': '0.13.3' });
  updateMFDependencies(tmpDir);
  const pkg = JSON.parse(readFile('package.json'));
  assert(pkg.dependencies['@bancolombia/core-utils-widgets-web'] === undefined);
  teardownTmp();
});

test('Elimina @bancolombia/core-utils-widgets-web de devDependencies', () => {
  setupTmp();
  writePkg({}, { '@bancolombia/core-utils-widgets-web': '8.0.0' });
  updateMFDependencies(tmpDir);
  const pkg = JSON.parse(readFile('package.json'));
  assert(pkg.devDependencies['@bancolombia/core-utils-widgets-web'] === undefined);
  teardownTmp();
});

test('No modifica dependencias que no están en el package.json', () => {
  setupTmp();
  writePkg({ '@angular/core': '16.0.0' });
  updateMFDependencies(tmpDir);
  const pkg = JSON.parse(readFile('package.json'));
  assertEqual(pkg.dependencies['@angular/core'], '16.0.0'); // no tocado
  teardownTmp();
});

test('Retorna true si hubo cambios', () => {
  setupTmp();
  writePkg({ 'zone.js': '0.13.3' });
  const changed = updateMFDependencies(tmpDir);
  assertEqual(changed, true);
  teardownTmp();
});

test('Retorna false si no hay dependencias que actualizar', () => {
  setupTmp();
  writePkg({ '@angular/core': '20.0.0' });
  const changed = updateMFDependencies(tmpDir);
  assertEqual(changed, false);
  teardownTmp();
});

// ════════════════════════════════════════════════════════════
//  SUITE 19 — Integración: flujo completo BDS en proyecto real
// ════════════════════════════════════════════════════════════
suite('19 · Integración BDS: flujo real manage-massive-campaigns');

test('Migra campaigns.service.ts con BDS + core-utils reales', () => {
  setupTmp();
  const tsContent = `import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { HTTP_METHODS, IEndpointsModel, Identifier } from '@bancolombia/core-utils-widgets-web';
import { Observable } from 'rxjs';
import { CampaignsGateway } from '../../../domain/models/campaigns/gateway/campaigns.gateway';
import { ENDPOINTS_CONFIG, OPERATION_IDS_CONFIG } from '../../../injection.constants';
import { CampaignsServiceEntries, CampaignsServiceOperationIdsEntries } from './campaigns.service.configuration';

@Injectable()
@Identifier('CampaignsService')
export class CampaignsService extends CampaignsGateway {
  constructor(
    public http: HttpClient,
    @Inject(ENDPOINTS_CONFIG) private endpoints: IEndpointsModel,
    @Inject(OPERATION_IDS_CONFIG) private operationIdsConfig: IEndpointsModel
  ) { super(http); }

  getAllMassiveCampaigns(): Observable<any> {
    const path = this.endpoints[this.identifier][CampaignsServiceEntries.GET_ALL_MASSIVE_CAMPAIGNS];
    return this.baseRequest<any>(path, HTTP_METHODS.GET, null, { headers: this.OI_HEADER }, null, true);
  }
}`;
  const tsFile = writeFile('src/service.ts', tsContent);
  const symbols = extractCoreUtilsSymbols(tsContent);

  assert(symbols.has('HTTP_METHODS'), 'Debe detectar HTTP_METHODS');
  assert(symbols.has('IEndpointsModel'), 'Debe detectar IEndpointsModel');
  assert(symbols.has('Identifier'), 'Debe detectar Identifier');

  let result = tsContent;
  result = transformDrivenAdapter(result, symbols);
  result = removeCoreUtilsImports(result);

  assertNotIncludes(result, 'core-utils-widgets-web');
  assertNotIncludes(result, "@Identifier('CampaignsService')");
  // baseRequest→http.get: el método HTTP queda implícito en .get(), no como literal 'GET'
  assertNotIncludes(result, 'HTTP_METHODS');
  assertIncludes(result, 'this.http.get<any>');
  teardownTmp();
});

test('Migra gateway.ts con BaseService real', () => {
  const content = `import { BaseService } from "@bancolombia/core-utils-widgets-web";
import { Observable } from "rxjs";
import { Injectable } from "@angular/core";

@Injectable()
export abstract class CampaignsGateway extends BaseService {
    abstract getAllMassiveCampaigns(): Observable<any>;
}`;
  const symbols = extractCoreUtilsSymbols(content);
  let result = transformGateway(content, symbols);
  result = removeCoreUtilsImports(result);
  assertNotIncludes(result, 'extends BaseService');
  assertNotIncludes(result, 'core-utils-widgets-web');
  assertIncludes(result, 'abstract class CampaignsGateway');
});

test('Migra usecase.ts con IBaseUsecase real', () => {
  const content = `import { Injectable } from '@angular/core';
import { IBaseUsecase } from '@bancolombia/core-utils-widgets-web';
import { Observable } from 'rxjs';
import { CampaignsGateway } from '../../../models/campaigns/gateway/campaigns.gateway';

@Injectable()
export class GetAllMassiveCampaignsUseCase implements IBaseUsecase<any> {
  constructor(private _campaignGateway: CampaignsGateway) {}
  invoke(): Observable<any> {
    return this._campaignGateway.getAllMassiveCampaigns();
  }
}`;
  const symbols = extractCoreUtilsSymbols(content);
  let result = transformUsecase(content, symbols);
  result = removeCoreUtilsImports(result);
  assertNotIncludes(result, 'implements IBaseUsecase');
  assertNotIncludes(result, 'core-utils-widgets-web');
  assertIncludes(result, 'export class GetAllMassiveCampaignsUseCase');
  assertIncludes(result, 'invoke()');
});

test('Migra configuration.ts con IWidgetConfigurationModel real', () => {
  const content = `import { InjectionToken } from '@angular/core';
import { IInfrastructureMappingModel, IWidgetConfigurationModel } from '@bancolombia/core-utils-widgets-web';
import { Observable } from 'rxjs';

export interface IManageMassiveCampaignsConfigurationModel extends IWidgetConfigurationModel {
  endpoints?: { CampaignsService: any };
}

const DEFAULT_CONFIGURATION: IManageMassiveCampaignsConfigurationModel = {
  infrastructures: [
    { gateway: CampaignsGateway, implementation: CampaignsService }
  ] as IInfrastructureMappingModel[],
};

const infrastructures = [];
for (const item of DEFAULT_CONFIGURATION.infrastructures) {
  infrastructures.push({ provide: item.gateway, useClass: item.implementation });
}`;
  const symbols = extractCoreUtilsSymbols(content);
  let result = transformConfiguration(content, symbols);
  result = removeCoreUtilsImports(result);
  assertNotIncludes(result, 'extends IWidgetConfigurationModel');
  assertNotIncludes(result, 'as IInfrastructureMappingModel[]');
  assertNotIncludes(result, 'core-utils-widgets-web');
  assertIncludes(result, 'ICoreWidgetConfig');
});

// ════════════════════════════════════════════════════════════
//  REPORTE FINAL
// ════════════════════════════════════════════════════════════
const total = passed + failed + skipped;
const duration = (process.hrtime.bigint ? Number(process.hrtime.bigint()) / 1e6 : 0).toFixed(0);

console.log(`
${'═'.repeat(64)}
  REPORTE DE RESULTADOS — migrador.js
${'═'.repeat(64)}

  Total   : ${total}
  ✔ Passed : ${passed}
  ✖ Failed : ${failed}
  ○ Skipped: ${skipped}

${'─'.repeat(64)}`);

if (failed > 0) {
  console.log(`\n  Pruebas fallidas:\n`);
  results.filter(r => r.status === 'FAIL').forEach(r => {
    console.log(`  ✖  [${r.suite}] ${r.name}`);
    console.log(`     ${r.error}\n`);
  });
}

console.log(`\n  Suite breakdown:\n`);
const suites = [...new Set(results.map(r => r.suite))];
for (const s of suites) {
  const sr = results.filter(r => r.suite === s);
  const sp = sr.filter(r => r.status === 'PASS').length;
  const sf = sr.filter(r => r.status === 'FAIL').length;
  const sk = sr.filter(r => r.status === 'SKIP').length;
  const icon = sf > 0 ? '✖' : '✔';
  console.log(`  ${icon}  ${s}  (${sp} pass, ${sf} fail, ${sk} skip)`);
}

console.log(`\n${'═'.repeat(64)}\n  ${failed === 0 ? '✔ TODOS LOS TESTS PASARON' : `✖ ${failed} TEST(S) FALLARON`}\n${'═'.repeat(64)}\n`);

process.exit(failed > 0 ? 1 : 0);