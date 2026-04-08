#!/usr/bin/env node

/**
 * next-to-app.js
 * Converte build Next.js (.next ou out/) em arquivo .app para Protheus fwCallApp
 * Baseado na documentacao oficial:
 * https://tdn.totvs.com.br/display/public/framework/FwCallApp+-+Abrindo+aplicativos+Web+no+Protheus
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rawArgs  = process.argv.slice(2);
const appName  = rawArgs.find(a => !a.startsWith('--')) || 'minha-app';
const getOpt   = (key, def) => { const a = rawArgs.find(a => a.startsWith(`--${key}=`)); return a ? a.split('=').slice(1).join('=') : def; };
const hasFlag  = (key) => rawArgs.includes(`--${key}`);

const nextDir    = getOpt('next-dir', '.next');
const outDirArg  = getOpt('out-dir', 'out');
const apiBaseUrl = getOpt('api-base-url', '/');
const noRedirect = hasFlag('no-redirect');

const appNameLower = appName.toLowerCase();
const workDir  = path.resolve('_app_build_tmp');
const appDir   = path.join(workDir, appNameLower);
const appFile  = path.resolve(`${appNameLower}.app`);

const c = {
  cyan:   s => `\x1b[36m${s}\x1b[0m`,
  green:  s => `\x1b[32m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  red:    s => `\x1b[31m${s}\x1b[0m`,
  bold:   s => `\x1b[1m${s}\x1b[0m`
};
const log  = m => console.log(`${c.cyan('[next-to-app]')} ${m}`);
const ok   = m => console.log(`${c.green('[OK]')} ${m}`);
const warn = m => console.log(`${c.yellow('[!]')} ${m}`);
const fail = m => { console.error(`${c.red('[ERRO]')} ${m}`); process.exit(1); };

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(dest, { recursive: true });
  let count = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) count += copyDir(s, d);
    else { fs.copyFileSync(s, d); count++; }
  }
  return count;
}

function collectFiles(dir, ext) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...collectFiles(full, ext));
    else if (!ext || entry.name.endsWith(ext)) results.push(full);
  }
  return results;
}

/**
 * Requisito #2: <base href="/"> no <head>
 * A fwCallApp ira substituir "/" pelo path real: /app-root/nomeapp/
 */
function ensureBaseHref(html) {
  let result = html.replace(/<base\s+href="[^"]*"\s*\/?>/gi, '');
  if (/<head[\s>]/i.test(result)) {
    result = result.replace(/(<head[^>]*>)/i, '$1\n  <base href="/">');
  } else {
    result = '<base href="/">\n' + result;
  }
  return result;
}

/**
 * CORRECAO CRITICA DE PATHS:
 *
 * Next.js gera paths ABSOLUTOS: href="/_next/static/css/..."
 * Protheus serve o app em:      /app-root/tabelaprojeto/
 *
 * Com <base href="/app-root/tabelaprojeto/"> (atualizado pela fwCallApp):
 *   /_next/...    -> nao funciona (path absoluto ignora base href)
 *   ./_next/...   -> /app-root/tabelaprojeto/_next/  OK!
 *
 * Solucao: trocar /_next/ por ./_next/ em todo HTML
 */
function fixAssetPaths(html) {
  // Replace global: toda ocorrencia de "/_next/" vira "./_next/"
  // Cobre: href=, src=, url(), JSON inline (__NEXT_DATA__), as=, etc.
  // String simples e mais confiavel que regex por atributo.
  return html
    .split('"/_next/').join('"./_next/')   // em atributos HTML e JSON
    .split("'/_next/").join("'./_next/")   // aspas simples
    .split('\\/_next/').join('\\./_next/') // JSON escaped
    .split('url(/_next/').join('url(./_next/'); // CSS inline
}

// --- Banner ---
console.log('');
console.log(c.bold('=================================================='));
console.log(c.bold('  Next.js -> Protheus .app  (fwCallApp)           '));
console.log(c.bold('  Baseado na documentacao oficial TDN TOTVS       '));
console.log(c.bold('=================================================='));
console.log('');
log(`App name   : ${c.bold(appNameLower)}  (minusculas - requisito obrigatorio)`);
log(`Saida      : ${c.bold(appFile)}`);
log(`api_baseUrl: ${apiBaseUrl}`);
if (noRedirect) log('noredirect : SIM (sem pre-carregamento de token)');
console.log('');

const nextPath = path.resolve(nextDir);
const outPath  = path.resolve(outDirArg);
const hasNext  = fs.existsSync(nextPath);
const hasOut   = fs.existsSync(outPath);

if (!hasNext && !hasOut) {
  fail('Nao foi encontrado ".next/" nem "out/". Execute "npm run build" antes.');
}

if (fs.existsSync(workDir)) fs.rmSync(workDir, { recursive: true });
fs.mkdirSync(appDir, { recursive: true });

// --- ETAPA 1: Copiar conteudo estatico ---
log('ETAPA 1 - Copiando arquivos estaticos...');

if (hasOut) {
  const count = copyDir(outPath, appDir);
  ok(`Pasta out/ copiada (${count} arquivos).`);
} else {
  warn('Pasta out/ nao encontrada. Extraindo do .next manualmente...');
  const staticSrc  = path.join(nextPath, 'static');
  const staticDest = path.join(appDir, '_next', 'static');
  if (fs.existsSync(staticSrc)) {
    const count = copyDir(staticSrc, staticDest);
    ok(`_next/static copiado (${count} arquivos).`);
  } else {
    fail(`Pasta ${nextDir}/static nao encontrada.`);
  }
  const serverApp   = path.join(nextPath, 'server', 'app');
  const serverPages = path.join(nextPath, 'server', 'pages');
  const serverRoot  = fs.existsSync(serverApp) ? serverApp : serverPages;
  if (fs.existsSync(serverRoot)) {
    const htmlFiles = collectFiles(serverRoot, '.html');
    for (const htmlFile of htmlFiles) {
      const rel  = path.relative(serverRoot, htmlFile);
      const dest = path.join(appDir, rel.replace(/page\.html$/, 'index.html'));
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(htmlFile, dest);
    }
    ok(`${htmlFiles.length} HTML(s) extraidos do server.`);
  }
  const publicDir = path.resolve('public');
  if (fs.existsSync(publicDir)) { copyDir(publicDir, appDir); ok('Pasta public/ copiada.'); }
}

// --- ETAPA 2: Garante index.html na raiz ---
log('ETAPA 2 - Verificando index.html na raiz...');
const indexPath = path.join(appDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  const allHtmlsNow = collectFiles(appDir, '.html');
  const found = allHtmlsNow.find(f => path.basename(f) === 'index.html') || allHtmlsNow[0];
  if (found) { fs.copyFileSync(found, indexPath); warn(`index.html criado a partir de: ${path.relative(appDir, found)}`); }
  else fail('Nenhum index.html encontrado. Verifique o build.');
}
ok('index.html presente na raiz.');

// --- ETAPA 3: Corrige HTMLs ---
// 3a: Converte /_next/ para ./_next/ (CRITICO para CSS/JS carregarem no Protheus)
// 3b: Injeta <base href="/"> (requisito obrigatorio #2)
log('ETAPA 3 - Corrigindo paths e injetando <base href="/">...');

const allHtmls = collectFiles(appDir, '.html');
let fixedCount = 0;
for (const htmlFile of allHtmls) {
  const original = fs.readFileSync(htmlFile, 'utf-8');
  const hasAbsPath = original.includes('/_next/');
  let fixed = fixAssetPaths(original);  // /_next/ -> ./_next/
  fixed = ensureBaseHref(fixed);         // injeta <base href="/">
  fs.writeFileSync(htmlFile, fixed, 'utf-8');
  if (hasAbsPath) fixedCount++;
}
ok(`${allHtmls.length} HTML(s) processados.`);
if (fixedCount > 0) ok(`${fixedCount} arquivo(s) com /_next/ convertido para ./_next/ (fix de CSS/JS).`);

// --- ETAPA 4: Cria assets/data/appconfig.json ---
log('ETAPA 4 - Criando appconfig.json...');
const assetsDataDir = path.join(appDir, 'assets', 'data');
fs.mkdirSync(assetsDataDir, { recursive: true });
const appConfigPath = path.join(assetsDataDir, 'appconfig.json');
if (fs.existsSync(appConfigPath)) {
  try {
    const existing = JSON.parse(fs.readFileSync(appConfigPath, 'utf-8'));
    if (!existing.api_baseUrl) existing.api_baseUrl = apiBaseUrl;
    fs.writeFileSync(appConfigPath, JSON.stringify(existing, null, 2), 'utf-8');
    ok('appconfig.json existente preservado.');
  } catch {
    fs.writeFileSync(appConfigPath, JSON.stringify({ name: appNameLower, version: '1.0.0', api_baseUrl: apiBaseUrl }, null, 2), 'utf-8');
  }
} else {
  fs.writeFileSync(appConfigPath, JSON.stringify({ name: appNameLower, version: '1.0.0', api_baseUrl: apiBaseUrl }, null, 2), 'utf-8');
  ok('appconfig.json criado em assets/data/.');
}

// --- ETAPA 5: noredirect ---
if (noRedirect) {
  fs.writeFileSync(path.join(appDir, 'noredirect'), '', 'utf-8');
  ok('Arquivo noredirect criado.');
} else {
  log('ETAPA 5 - (noredirect omitido - app usara token Bearer da fwCallApp)');
}

// --- ETAPA 6: CDN check ---
log('ETAPA 6 - Verificando referencias a CDN externo...');
let cdnWarnings = 0;
const cdnPattern = /https?:\/\/(cdn\.|cdnjs\.|unpkg\.|jsdelivr\.net|fonts\.googleapis)/gi;
for (const htmlFile of allHtmls) {
  const content = fs.readFileSync(htmlFile, 'utf-8');
  const matches = content.match(cdnPattern);
  if (matches) { warn(`CDN externo: ${path.relative(appDir, htmlFile)}: ${[...new Set(matches)].join(', ')}`); cdnWarnings++; }
}
if (cdnWarnings === 0) ok('Nenhuma referencia a CDN externo.');
else warn(`${cdnWarnings} arquivo(s) com CDN externo. Requisito #3: baixe-os localmente.`);

// --- ETAPA 7: Empacota como .app ---
log(`ETAPA 7 - Empacotando como ${appNameLower}.app...`);
if (fs.existsSync(appFile)) fs.rmSync(appFile);

let zipOk = false;

try {
  execSync(`cd "${workDir}" && zip -r "${appFile}" "${appNameLower}"`, { stdio: 'pipe' });
  zipOk = true;
} catch (_) {}

if (!zipOk) {
  try {
    const psScript = `Compress-Archive -Path '${appDir}' -DestinationPath '${appFile}' -Force`;
    execSync(`powershell -NoProfile -Command "${psScript}"`, { stdio: 'pipe' });
    zipOk = true;
  } catch (_) {}
}

if (!zipOk) {
  try {
    const pyScript = `import shutil; shutil.make_archive(r'_tmp_app', 'zip', r'${workDir}', r'${appNameLower}')`;
    execSync(`python3 -c "${pyScript}"`, { stdio: 'pipe' });
    fs.renameSync('_tmp_app.zip', appFile);
    zipOk = true;
  } catch (_) {}
}

if (!zipOk) {
  try {
    const pyScript = `import shutil; shutil.make_archive(r'_tmp_app', 'zip', r'${workDir}', r'${appNameLower}')`;
    execSync(`python -c "${pyScript}"`, { stdio: 'pipe' });
    fs.renameSync('_tmp_app.zip', appFile);
    zipOk = true;
  } catch (_) {}
}

if (!zipOk) fail('Nao foi possivel criar o ZIP. Verifique PowerShell (Windows) ou instale zip (Linux/Mac).');

fs.rmSync(workDir, { recursive: true });

const stats  = fs.statSync(appFile);
const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

console.log('');
console.log(c.bold('=================================================='));
console.log(c.green(`CONCLUIDO: ${appNameLower}.app gerado! (${sizeMB} MB)`));
console.log(c.bold('=================================================='));
console.log('');
console.log(c.bold('PROXIMOS PASSOS:'));
console.log('');
console.log('  1. Compile como Resource no TOTVS Developer Studio');
console.log(`     Selecione: ${appNameLower}.app`);
console.log('');
console.log('  2. Chame no AdvPL:');
console.log(`     fwCallApp("${appNameLower}")`);
console.log('');
console.log('  3. appserver.ini:');
console.log('     [General]');
console.log('     App_Environment=<nome-do-ambiente>');
console.log(c.bold('=================================================='));