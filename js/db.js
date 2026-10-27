/**
 * Nosotros · Capa de almacenamiento (IndexedDB)
 * -------------------------------------------------------------
 * Dos almacenes:
 *   medios    -> { id, titulo, descripcion, categoria, tipo, tamano,
 *                 ancho, alto, duracion, creado, fecha, favorito,
 *                 hash, miniatura(Blob) }
 *   archivos  -> { id, blob }  (la foto o el video original)
 *
 * Las miniaturas viven junto a los metadatos para que la galería
 * pinte cientos de recuerdos sin abrir los archivos originales.
 * Los textos cortos (fechas, cartas, deseos) se guardan en
 * localStorage desde app.js.
 */
(function (global) {
  'use strict';

  var NOMBRE_BASE = 'pareja';
  var VERSION = 1;
  var base = null;

  function abrir() {
    if (base) return Promise.resolve(base);

    return new Promise(function (resolve, reject) {
      if (!('indexedDB' in global)) {
        reject(new Error('Este navegador no soporta IndexedDB'));
        return;
      }

      var solicitud = indexedDB.open(NOMBRE_BASE, VERSION);

      solicitud.onupgradeneeded = function (evento) {
        var db = evento.target.result;
        if (!db.objectStoreNames.contains('medios')) {
          var medios = db.createObjectStore('medios', { keyPath: 'id' });
          medios.createIndex('creado', 'creado');
        }
        if (!db.objectStoreNames.contains('archivos')) {
          db.createObjectStore('archivos', { keyPath: 'id' });
        }
      };

      solicitud.onsuccess = function () {
        base = solicitud.result;
        base.onversionchange = function () {
          base.close();
          base = null;
        };
        resolve(base);
      };

      solicitud.onerror = function () {
        reject(solicitud.error || new Error('No se pudo abrir el álbum en este dispositivo'));
      };

      solicitud.onblocked = function () {
        reject(new Error('El álbum está abierto en otra pestaña'));
      };
    });
  }

  /**
   * Ejecuta una tarea dentro de una transacción y resuelve al completarla.
   * La tarea deja su resultado en `caja.valor`.
   */
  function ejecutar(almacenes, modo, tarea) {
    return abrir().then(function (db) {
      return new Promise(function (resolve, reject) {
        var caja = { valor: null };
        var transaccion;

        try {
          transaccion = db.transaction(almacenes, modo);
        } catch (error) {
          reject(error);
          return;
        }

        transaccion.oncomplete = function () {
          resolve(caja.valor);
        };
        transaccion.onerror = function () {
          reject(transaccion.error || new Error('No se pudo guardar el cambio'));
        };
        transaccion.onabort = function () {
          reject(transaccion.error || new Error('La operación se canceló'));
        };

        try {
          tarea(transaccion, caja);
        } catch (error) {
          try { transaccion.abort(); } catch (ignorado) { /* ya terminó */ }
          reject(error);
        }
      });
    });
  }

  /** Guarda metadatos y, si llega, el archivo original. */
  function guardar(registro, blob) {
    return ejecutar(['medios', 'archivos'], 'readwrite', function (transaccion) {
      transaccion.objectStore('medios').put(registro);
      if (blob) {
        transaccion.objectStore('archivos').put({ id: registro.id, blob: blob });
      }
    }).then(function () {
      return registro;
    });
  }

  /** Todos los metadatos, de los más recientes a los más antiguos. */
  function listar() {
    return ejecutar(['medios'], 'readonly', function (transaccion, caja) {
      var peticion = transaccion.objectStore('medios').getAll();
      peticion.onsuccess = function () {
        var lista = peticion.result || [];
        lista.sort(function (a, b) {
          return String(b.creado).localeCompare(String(a.creado));
        });
        caja.valor = lista;
      };
    });
  }

  /** Devuelve el Blob original de un recuerdo. */
  function leerArchivo(id) {
    return ejecutar(['archivos'], 'readonly', function (transaccion, caja) {
      var peticion = transaccion.objectStore('archivos').get(id);
      peticion.onsuccess = function () {
        caja.valor = peticion.result ? peticion.result.blob : null;
      };
    });
  }

  /**
   * Actualiza campos de un recuerdo sin pisar cambios concurrentes:
   * lee y escribe dentro de la misma transacción.
   */
  function actualizar(id, cambios) {
    return ejecutar(['medios'], 'readwrite', function (transaccion, caja) {
      var almacen = transaccion.objectStore('medios');
      var peticion = almacen.get(id);
      peticion.onsuccess = function () {
        var registro = peticion.result;
        if (!registro) return;
        for (var clave in cambios) {
          if (Object.prototype.hasOwnProperty.call(cambios, clave)) {
            registro[clave] = cambios[clave];
          }
        }
        almacen.put(registro);
        caja.valor = registro;
      };
    });
  }

  /** Borra metadatos y archivo en una sola transacción. */
  function eliminar(id) {
    return ejecutar(['medios', 'archivos'], 'readwrite', function (transaccion) {
      transaccion.objectStore('medios').delete(id);
      transaccion.objectStore('archivos').delete(id);
    });
  }

  /** Vacía el álbum completo. */
  function limpiar() {
    return ejecutar(['medios', 'archivos'], 'readwrite', function (transaccion) {
      transaccion.objectStore('medios').clear();
      transaccion.objectStore('archivos').clear();
    });
  }

  /** Uso aproximado del almacenamiento del navegador. */
  function estimar() {
    if (!global.navigator || !navigator.storage || !navigator.storage.estimate) {
      return Promise.resolve(null);
    }
    return navigator.storage.estimate().then(function (uso) {
      return {
        usado: uso.usage || 0,
        disponible: uso.quota || 0,
        porcentaje: uso.quota ? Math.min(100, (uso.usage / uso.quota) * 100) : 0
      };
    }).catch(function () {
      return null;
    });
  }

  global.ParejaDB = {
    abrir: abrir,
    guardar: guardar,
    listar: listar,
    leerArchivo: leerArchivo,
    actualizar: actualizar,
    eliminar: eliminar,
    limpiar: limpiar,
    estimar: estimar
  };
})(window);
