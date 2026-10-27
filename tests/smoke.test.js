/**
 * Nosotros · Pruebas de humo (sin dependencias)
 * -------------------------------------------------------------
 * Se ejecutan con:  node tests/smoke.test.js
 *
 * Revisan:
 *   1. Los cálculos de fechas y el contador.
 *   2. Que cada id usado por app.js exista en index.html.
 *   3. Que no haya ids repetidos ni archivos declarados ausentes.
 *   4. Que el manifest sea un JSON válido y completo.
 */
'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');

var F = require('../js/fechas.js');

var raiz = path.join(__dirname, '..');
var html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
var app = fs.readFileSync(path.join(raiz, 'js', 'app.js'), 'utf8');

var pruebas = 0;

function probar(nombre, fn) {
  fn();
  pruebas++;
  console.log('  ok  ' + nombre);
}

/* ------------------------- 1. Utilidades de fechas ------------------------- */

probar('parsearISO acepta fechas válidas y rechaza las imposibles', function () {
  var fecha = F.parsearISO('2021-03-12');
  assert.strictEqual(fecha.getFullYear(), 2021);
  assert.strictEqual(fecha.getMonth(), 2);
  assert.strictEqual(fecha.getDate(), 12);
  assert.strictEqual(F.parsearISO('2021-02-30'), null);
  assert.strictEqual(F.parsearISO('12/03/2021'), null);
  assert.strictEqual(F.parsearISO(''), null);
});

probar('aISO devuelve el formato del input date', function () {
  assert.strictEqual(F.aISO(new Date(2024, 0, 5)), '2024-01-05');
});

probar('descomponer reparte días, horas, minutos y segundos', function () {
  var partes = F.descomponer(((3 * 24 + 5) * 3600 + 42 * 60 + 9) * 1000);
  assert.strictEqual(partes.dias, 3);
  assert.strictEqual(partes.horas, 5);
  assert.strictEqual(partes.minutos, 42);
  assert.strictEqual(partes.segundos, 9);
});

probar('descomponer nunca devuelve valores negativos', function () {
  var partes = F.descomponer(-5000);
  assert.strictEqual(partes.dias, 0);
  assert.strictEqual(partes.totalSegundos, 0);
});

probar('proximaOcurrencia traslada el aniversario al próximo año', function () {
  var hoy = new Date(2026, 9, 26);
  var proxima = F.proximaOcurrencia('2020-03-12', true, hoy);
  assert.strictEqual(proxima.getFullYear(), 2027);
  assert.strictEqual(proxima.getMonth(), 2);
  assert.strictEqual(proxima.getDate(), 12);
});

probar('proximaOcurrencia mantiene la fecha de hoy como hoy', function () {
  var hoy = new Date(2026, 9, 26);
  var proxima = F.proximaOcurrencia('2019-10-26', true, hoy);
  assert.strictEqual(F.diasHasta(proxima, hoy), 0);
});

probar('una fecha no anual conserva su año original', function () {
  var hoy = new Date(2026, 9, 26);
  var proxima = F.proximaOcurrencia('2015-12-31', false, hoy);
  assert.strictEqual(proxima.getFullYear(), 2015);
  assert.strictEqual(F.diasHasta(proxima, hoy), -3952);
});

probar('diasHasta cuenta los días entre dos fechas', function () {
  assert.strictEqual(F.diasHasta(new Date(2026, 9, 30), new Date(2026, 9, 26)), 4);
  assert.strictEqual(F.diasHasta(new Date(2026, 9, 26), new Date(2026, 9, 26)), 0);
  assert.strictEqual(F.diasHasta(new Date(2026, 9, 20), new Date(2026, 9, 26)), -6);
});

probar('aniosEntre y aniosDesde calculan los años cumplidos', function () {
  assert.strictEqual(F.aniosEntre('2020-03-12', new Date(2027, 2, 12)), 7);
  assert.strictEqual(F.aniosDesde('2020-03-12', new Date(2026, 2, 11)), 5);
  assert.strictEqual(F.aniosDesde('2020-03-12', new Date(2026, 2, 12)), 6);
});

probar('formatearFecha usa el español y los formatos pedidos', function () {
  assert.strictEqual(F.formatearFecha('2021-03-12'), '12 de marzo de 2021');
  assert.strictEqual(F.formatearFecha('2021-03-12', 'corto'), '12 mar 2021');
  assert.strictEqual(F.formatearFecha('2021-03-12', 'dia-mes'), '12 de marzo');
  assert.strictEqual(F.formatearFecha('invalida'), '');
});

probar('textoCuenta describe hoy, mañana y el pasado', function () {
  assert.strictEqual(F.textoCuenta(0), '¡Es hoy!');
  assert.strictEqual(F.textoCuenta(1), 'Mañana');
  assert.strictEqual(F.textoCuenta(12), 'Faltan 12 días');
  assert.strictEqual(F.textoCuenta(-1), 'Fue ayer');
  assert.strictEqual(F.textoCuenta(-8), 'Hace 8 días');
});

probar('dosDigitos rellena con cero', function () {
  assert.strictEqual(F.dosDigitos(7), '07');
  assert.strictEqual(F.dosDigitos(42), '42');
});

/* ------------------------ 2. Integridad de la interfaz ------------------------ */

function idsDelHtml() {
  var encontrados = [];
  var patron = /id="([^"]+)"/g;
  var coincidencia;
  while ((coincidencia = patron.exec(html))) {
    encontrados.push(coincidencia[1]);
  }
  return encontrados;
}

function idsUsados() {
  var usados = [];
  var patron = /\$\(\s*'([^']+)'\s*\)/g;
  var coincidencia;
  while ((coincidencia = patron.exec(app))) {
    if (usados.indexOf(coincidencia[1]) === -1) usados.push(coincidencia[1]);
  }
  return usados;
}

probar('todos los ids que usa app.js existen en index.html', function () {
  var existentes = idsDelHtml();
  var ausentes = idsUsados().filter(function (id) {
    return existentes.indexOf(id) === -1;
  });
  assert.deepStrictEqual(ausentes, []);
});

probar('index.html no tiene ids repetidos', function () {
  var existentes = idsDelHtml();
  var repetidos = existentes.filter(function (id, indice) {
    return existentes.indexOf(id) !== indice;
  });
  assert.deepStrictEqual(repetidos, []);
});

probar('los botones data-cerrar apuntan a modales existentes', function () {
  var destinos = [];
  var patron = /data-cerrar="([^"]+)"/g;
  var coincidencia;
  while ((coincidencia = patron.exec(html))) {
    destinos.push(coincidencia[1]);
  }
  var existentes = idsDelHtml();
  destinos.forEach(function (destino) {
    assert.ok(existentes.indexOf(destino) !== -1, 'Falta el modal ' + destino);
  });
});

probar('index.html carga los cuatro scripts en orden', function () {
  var orden = ['js/fechas.js', 'js/db.js', 'js/confeti.js', 'js/app.js'];
  var posiciones = orden.map(function (archivo) {
    var posicion = html.indexOf('src="' + archivo + '"');
    assert.ok(posicion !== -1, 'No se declara ' + archivo);
    assert.ok(fs.existsSync(path.join(raiz, archivo)), 'No existe ' + archivo);
    return posicion;
  });
  for (var i = 1; i < posiciones.length; i++) {
    assert.ok(posiciones[i] > posiciones[i - 1], 'Orden de scripts incorrecto');
  }
});

probar('las etiquetas for apuntan a campos existentes', function () {
  var existentes = idsDelHtml();
  var patron = /for="([^"]+)"/g;
  var coincidencia;
  while ((coincidencia = patron.exec(html))) {
    assert.ok(existentes.indexOf(coincidencia[1]) !== -1, 'Falta el campo ' + coincidencia[1]);
  }
});

probar('existen las hojas de estilo y el manifiesto', function () {
  assert.ok(fs.existsSync(path.join(raiz, 'css', 'estilos.css')));
  assert.ok(html.indexOf('css/estilos.css') !== -1);
  assert.ok(fs.existsSync(path.join(raiz, 'manifest.webmanifest')));
  assert.ok(html.indexOf('manifest.webmanifest') !== -1);
});

probar('el service worker existe, cachea los archivos y se registra', function () {
  var ruta = path.join(raiz, 'sw.js');
  assert.ok(fs.existsSync(ruta), 'Falta sw.js');

  var sw = fs.readFileSync(ruta, 'utf8');
  assert.ok(sw.indexOf("addEventListener('install'") !== -1, 'Falta el evento install');
  assert.ok(sw.indexOf("addEventListener('fetch'") !== -1, 'Falta el evento fetch');
  assert.ok(app.indexOf("register('sw.js')") !== -1, 'app.js no registra el service worker');

  var patron = /'\.\/([^']*)'/g;
  var coincidencia;
  var revisados = 0;
  while ((coincidencia = patron.exec(sw))) {
    if (!coincidencia[1]) continue;
    assert.ok(
      fs.existsSync(path.join(raiz, coincidencia[1])),
      'La caché menciona ' + coincidencia[1] + ' y no existe'
    );
    revisados++;
  }
  assert.ok(revisados >= 8, 'La lista de la caché parece incompleta');
});

/* --------------------------- 3. Manifest de la PWA --------------------------- */

probar('el manifest es válido y declara lo mínimo de una PWA', function () {
  var crudo = fs.readFileSync(path.join(raiz, 'manifest.webmanifest'), 'utf8');
  var manifest = JSON.parse(crudo);

  assert.strictEqual(manifest.lang, 'es');
  assert.ok(manifest.name.length > 3);
  assert.ok(manifest.short_name.length > 0);
  assert.strictEqual(manifest.display, 'standalone');
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0);
  manifest.icons.forEach(function (icono) {
    assert.ok(fs.existsSync(path.join(raiz, icono.src)), 'Falta el icono ' + icono.src);
  });
});

probar('el HTML declara viewport, tema y color-scheme coherentes', function () {
  assert.ok(html.indexOf('name="viewport"') !== -1);
  assert.ok(html.indexOf('name="theme-color"') !== -1);
  assert.ok(html.indexOf('pareja.tema') !== -1);
});

/* ----------------------- 4. Contenedor Android (APK) ----------------------- */

probar('el proyecto Android empaqueta la web y abre un origen seguro', function () {
  var carpeta = path.join(raiz, 'android');
  if (!fs.existsSync(carpeta)) return; // la web también se usa sin APK

  var gradle = fs.readFileSync(path.join(carpeta, 'app', 'build.gradle'), 'utf8');
  assert.ok(gradle.indexOf("namespace 'pe.nosotros.album'") !== -1, 'Cambió el paquete de la app');
  assert.ok(fs.existsSync(path.join(carpeta, 'gradlew')), 'Falta gradlew dentro de android/');
  assert.ok(fs.existsSync(path.join(carpeta, 'gradlew.bat')), 'Falta gradlew.bat dentro de android/');
  assert.ok(fs.existsSync(path.join(carpeta, 'gradle', 'wrapper', 'gradle-wrapper.properties')), 'Falta la configuración del wrapper');
  ['index.html', 'manifest.webmanifest', 'icono.svg', 'sw.js', 'css/**', 'js/**'].forEach(function (entrada) {
    assert.ok(gradle.indexOf("include '" + entrada + "'") !== -1, 'No se copia ' + entrada);
  });

  var java = fs.readFileSync(path.join(carpeta, 'app', 'src', 'main', 'java', 'pe', 'nosotros', 'album', 'MainActivity.java'), 'utf8');
  assert.ok(java.indexOf('appassets.androidplatform.net') !== -1, 'El origen debe ser https para que IndexedDB funcione');
  assert.ok(java.indexOf('onShowFileChooser') !== -1, 'Falta el selector de archivos del sistema');
  assert.ok(java.indexOf('guardarArchivo') !== -1, 'Falta el puente para guardar en Descargas');

  var manifest = fs.readFileSync(path.join(carpeta, 'app', 'src', 'main', 'AndroidManifest.xml'), 'utf8');
  assert.ok(manifest.indexOf('@style/Theme.Nosotros') !== -1, 'Falta el tema de la app');
});

console.log('\n' + pruebas + ' pruebas superadas.');
