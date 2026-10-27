/*
 * Nosotros · Service worker
 * -------------------------------------------------------------
 * Guarda en el dispositivo el armazón de la aplicación para que
 * funcione sin conexión. Los recuerdos (fotos, videos, textos)
 * no pasan por aquí: viven en IndexedDB.
 *
 * Sube VERSION cada vez que publiques cambios para renovar la caché.
 */
var VERSION = 'nosotros-v1';

var LOCALES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icono.svg',
  './css/estilos.css',
  './js/fechas.js',
  './js/db.js',
  './js/confeti.js',
  './js/app.js'
];

/* Hojas y scripts externos: sin ellos la app pierde el diseño. */
var EXTERNOS = [
  'cdn.tailwindcss.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

self.addEventListener('install', function (evento) {
  evento.waitUntil(
    caches.open(VERSION).then(function (cache) {
      return cache.addAll(LOCALES);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (evento) {
  evento.waitUntil(
    caches.keys().then(function (claves) {
      return Promise.all(claves.map(function (clave) {
        return clave === VERSION ? null : caches.delete(clave);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

function esExterno(url) {
  for (var i = 0; i < EXTERNOS.length; i++) {
    if (url.indexOf(EXTERNOS[i]) !== -1) return true;
  }
  return false;
}

self.addEventListener('fetch', function (evento) {
  var peticion = evento.request;
  if (peticion.method !== 'GET') return;

  var url = peticion.url;

  /* Primero la copia guardada y, si hay red, se refresca en segundo plano. */
  if (url.indexOf('http') === 0 && esExterno(url)) {
    evento.respondWith(
      caches.open(VERSION).then(function (cache) {
        return cache.match(peticion).then(function (guardada) {
          var red = fetch(peticion).then(function (respuesta) {
            if (respuesta && respuesta.ok) cache.put(peticion, respuesta.clone());
            return respuesta;
          }).catch(function () {
            return guardada || Response.error();
          });
          return guardada || red;
        });
      })
    );
    return;
  }

  /* Solo se cachea lo propio: las fotos de IndexedDB no son peticiones. */
  if (new URL(url).origin !== self.location.origin) return;

  evento.respondWith(
    caches.open(VERSION).then(function (cache) {
      return cache.match(peticion, { ignoreSearch: true }).then(function (guardada) {
        var red = fetch(peticion).then(function (respuesta) {
          if (respuesta && respuesta.ok) cache.put(peticion, respuesta.clone());
          return respuesta;
        }).catch(function () {
          return guardada || Response.error();
        });
        return guardada || red;
      });
    })
  );
});
