/**
 * Nosotros · Lógica de la aplicación
 * -------------------------------------------------------------
 * Álbum + diario de pareja. Todo el contenido se queda en el
 * dispositivo: fotos y videos en IndexedDB, textos en localStorage.
 *
 * Módulos: ParejaFechas (cálculos), ParejaDB (IndexedDB),
 * Confeti (efecto) y este archivo (interfaz y estado).
 */
(function (global) {
  'use strict';

  var F = global.ParejaFechas;
  var DB = global.ParejaDB;
  var Confeti = global.Confeti;

  var CLAVES = {
    tema: 'pareja.tema',
    ajustes: 'pareja.ajustes',
    fechas: 'pareja.fechas',
    notas: 'pareja.notas',
    deseos: 'pareja.deseos',
    celebrado: 'pareja.celebrado'
  };

  var AJUSTES_BASE = {
    a: '',
    b: '',
    frase: 'Cada día contigo es mi lugar favorito.',
    inicio: '',
    portadaId: null
  };

  var CATEGORIAS = {
    foto: { etiqueta: 'Foto', icono: 'foto' },
    caricatura: { etiqueta: 'Caricatura', icono: 'risa' },
    viaje: { etiqueta: 'Viaje', icono: 'avion' },
    video: { etiqueta: 'Video', icono: 'play' }
  };

  var TIPOS_FECHA = {
    aniversario: { etiqueta: 'Aniversario', clases: 'bg-amor-100 text-amor-700 dark:bg-amor-950 dark:text-amor-200' },
    cumpleanos: { etiqueta: 'Cumpleaños', clases: 'bg-oro-100 text-oro-700 dark:bg-oro-900/40 dark:text-oro-200' },
    'primera-vez': { etiqueta: 'Primera vez', clases: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200' },
    especial: { etiqueta: 'Día especial', clases: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200' }
  };

  var LIMITE_IMAGEN = 40 * 1024 * 1024;
  var LIMITE_VIDEO = 600 * 1024 * 1024;
  var MAX_MINIATURA = 900;

  var ICONOS = {
    foto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-3 w-3" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"></rect><circle cx="8.5" cy="10" r="1.5"></circle><path d="m4 17 4.5-4.5a2 2 0 0 1 2.8 0L16 17l2-2a1.8 1.8 0 0 1 2.5 0" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" class="h-3 w-3" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.9l10-6.5a1 1 0 0 0 0-1.7l-10-6.6A1 1 0 0 0 8 5.5Z"></path></svg>',
    risa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" class="h-3 w-3" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0" stroke-linecap="round"></path><path d="M9 9.5h.01M15 9.5h.01" stroke-linecap="round" stroke-width="2.6"></path></svg>',
    avion: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" class="h-3 w-3" aria-hidden="true"><path d="M10.5 13.5 3 11V9l7.5 1.5V4.5a1.5 1.5 0 0 1 3 0V10.5L21 9v2l-7.5 2.5V18l3 1.5V21l-4.5-1-4.5 1v-1.5l3-1.5z" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
    corazon: '<svg viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4" aria-hidden="true"><path d="M12 20.3c-.6 0-1.2-.2-1.6-.7-1.7-1.6-4.6-3.9-6-5.7-1.3-1.7-1.7-3.2-1.4-4.6.4-1.5 1.5-2.5 3-2.7 1.5-.2 2.8.4 3.7 1.5.7.9 1.5 2 2.3 3.1.8-1.1 1.6-2.2 2.3-3.1.9-1.1 2.2-1.7 3.7-1.5 1.5.2 2.6 1.2 3 2.7.3 1.4-.1 2.9-1.4 4.6-1.4 1.8-4.3 4.1-6 5.7-.4.5-1 .7-1.6.7Z"></path></svg>',
    fotoGrande: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" class="h-8 w-8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"></rect><circle cx="8.5" cy="10" r="1.6"></circle><path d="m4 17 4.5-4.5a2 2 0 0 1 2.8 0L16 17l2-2a1.8 1.8 0 0 1 2.5 0" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
    playGrande: '<svg viewBox="0 0 24 24" fill="currentColor" class="h-9 w-9" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.9l10-6.5a1 1 0 0 0 0-1.7l-10-6.6A1 1 0 0 0 8 5.5Z"></path></svg>',
    lapiz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-3.5 w-3.5" aria-hidden="true"><path d="m15.5 5.5 3 3L8 19H5v-3z" stroke-linecap="round" stroke-linejoin="round"></path><path d="m13.5 7.5 3 3" stroke-linecap="round"></path></svg>',
    basura: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4" aria-hidden="true"><path d="M4 7h16M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m-8 0 .7 11a2 2 0 0 0 2 1.9h4.6a2 2 0 0 0 2-1.9L17 7" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 7.5v5m0 3.5h.01" stroke-linecap="round"></path></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 11v5m0-8h.01" stroke-linecap="round"></path></svg>',
    estrella: '<svg viewBox="0 0 24 24" fill="currentColor" class="h-3 w-3" aria-hidden="true"><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"></path></svg>'
  };

  /*
   * Los iconos se inyectan como texto HTML. Tailwind Play CDN los detecta al
   * momento, pero mientras tanto dejamos width/height fijos para que nunca
   * aparezcan gigantes ni diminutos.
   */
  (function fijarTamanoIconos() {
    var tamanos = {
      'h-3 w-3': 12,
      'h-3.5 w-3.5': 14,
      'h-4 w-4': 16,
      'h-8 w-8': 32,
      'h-9 w-9': 36
    };

    for (var nombre in ICONOS) {
      if (!Object.prototype.hasOwnProperty.call(ICONOS, nombre)) continue;
      for (var clase in tamanos) {
        if (!Object.prototype.hasOwnProperty.call(tamanos, clase)) continue;
        if (ICONOS[nombre].indexOf('class="' + clase + '"') === -1) continue;
        ICONOS[nombre] = ICONOS[nombre].replace(
          '<svg ',
          '<svg width="' + tamanos[clase] + '" height="' + tamanos[clase] + '" '
        );
      }
    }
  })();

  var ESTADO = {
    medios: [],
    filtro: 'todas',
    visorId: null,
    tokenVisor: 0,
    ajustes: ajustesVacios(),
    fechas: [],
    notas: [],
    deseos: [],
    urlsGaleria: [],
    urlsCarrusel: [],
    urlPortada: null,
    urlVisor: null,
    urlMiniVisor: null,
    cargando: false,
    confirmacion: null,
    primeraVisita: false
  };

  /* ============================ UTILIDADES ============================ */

  function $(id) {
    return document.getElementById(id);
  }

  function crear(etiqueta, clase, texto) {
    var nodo = document.createElement(etiqueta);
    if (clase) nodo.className = clase;
    if (typeof texto === 'string') nodo.textContent = texto;
    return nodo;
  }

  function nuevoId(prefijo) {
    return (prefijo || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function leerJSON(clave, porDefecto) {
    try {
      var crudo = global.localStorage.getItem(clave);
      if (!crudo) return porDefecto;
      return JSON.parse(crudo);
    } catch (error) {
      return porDefecto;
    }
  }

  function guardarJSON(clave, valor) {
    try {
      global.localStorage.setItem(clave, JSON.stringify(valor));
      return true;
    } catch (error) {
      avisar('No se pudo guardar en este navegador (espacio lleno o modo privado).', 'error');
      return false;
    }
  }

  function ajustesVacios() {
    return {
      a: AJUSTES_BASE.a,
      b: AJUSTES_BASE.b,
      frase: AJUSTES_BASE.frase,
      inicio: AJUSTES_BASE.inicio,
      portadaId: AJUSTES_BASE.portadaId
    };
  }

  function buscarMedio(id) {
    for (var i = 0; i < ESTADO.medios.length; i++) {
      if (ESTADO.medios[i].id === id) return ESTADO.medios[i];
    }
    return null;
  }

  function buscarEn(lista, id) {
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].id === id) return lista[i];
    }
    return null;
  }

  function indiceEn(lista, id) {
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].id === id) return i;
    }
    return -1;
  }

  function esVideo(medio) {
    return /^video\//.test(medio && medio.tipo ? medio.tipo : '');
  }

  function formatearPeso(bytes) {
    var valor = Number(bytes) || 0;
    if (valor < 1024) return valor + ' B';
    if (valor < 1048576) return Math.round(valor / 1024) + ' KB';
    if (valor < 1073741824) return (valor / 1048576).toFixed(1).replace('.', ',') + ' MB';
    return (valor / 1073741824).toFixed(2).replace('.', ',') + ' GB';
  }

  function formatearDuracion(segundos) {
    var total = Math.round(Number(segundos) || 0);
    var minutos = Math.floor(total / 60);
    var resto = total % 60;
    return minutos + ':' + F.dosDigitos(resto);
  }

  /**
   * Marca de tiempo ISO -> 'AAAA-MM-DD' en hora local.
   * Cortar la cadena daría la fecha UTC y de noche mostraría el día siguiente.
   */
  function fechaLocal(valor) {
    var texto = String(valor || '').trim();
    if (!texto) return '';
    if (texto.indexOf('T') === -1) return texto.slice(0, 10);

    var fecha = new Date(texto);
    if (isNaN(fecha.getTime())) return texto.slice(0, 10);
    return F.aISO(fecha);
  }

  function textoFecha(medio) {
    if (medio.fecha) return F.formatearFecha(medio.fecha, 'corto');
    return F.formatearFecha(fechaLocal(medio.creado), 'corto');
  }

  function revocar(lista) {
    for (var i = 0; i < lista.length; i++) {
      try { URL.revokeObjectURL(lista[i]); } catch (error) { /* nada */ }
    }
    lista.length = 0;
  }

  function textoPlano(valor, limite) {
    var texto = String(valor || '').replace(/\s+/g, ' ').trim();
    if (limite && texto.length > limite) texto = texto.slice(0, limite);
    return texto;
  }

  /* ============================== AVISOS ============================== */

  function avisar(texto, tipo) {
    var contenedor = $('toasts');
    if (!contenedor) return;

    var variante = tipo || 'info';
    var caja = crear('div', 'toast toast-' + variante);
    var icono = crear('span', 'mt-px shrink-0');
    icono.innerHTML = ICONOS[variante] || ICONOS.info;
    var mensaje = crear('span', 'flex-1', texto);

    caja.appendChild(icono);
    caja.appendChild(mensaje);
    contenedor.appendChild(caja);

    global.setTimeout(function () {
      caja.classList.add('toast-salir');
      global.setTimeout(function () {
        if (caja.parentNode) caja.parentNode.removeChild(caja);
      }, 260);
    }, 3800);
  }

  /* ============================== MODALES ============================== */

  function abrirModal(id) {
    var modal = $(id);
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.setAttribute('data-abierto', 'true');
    document.body.classList.add('overflow-hidden');

    var primerCampo = modal.querySelector('input:not([type="hidden"]), textarea, select');
    if (primerCampo) {
      global.setTimeout(function () {
        try { primerCampo.focus({ preventScroll: true }); } catch (error) { /* nada */ }
      }, 80);
    }
  }

  function cerrarModal(modal) {
    var nodo = typeof modal === 'string' ? $(modal) : modal;
    if (!nodo) return;

    nodo.classList.add('hidden');
    nodo.classList.remove('flex');
    nodo.removeAttribute('data-abierto');

    var visorAbierto = $('visor') && !$('visor').classList.contains('hidden');
    var otrosAbiertos = document.querySelectorAll('.modal[data-abierto="true"]');
    if (!visorAbierto && otrosAbiertos.length === 0) {
      document.body.classList.remove('overflow-hidden');
    }
  }

  function modalSuperior() {
    var visor = $('visor');
    if (visor && !visor.classList.contains('hidden')) return visor;
    var abiertos = document.querySelectorAll('.modal[data-abierto="true"]');
    return abiertos.length ? abiertos[abiertos.length - 1] : null;
  }

  function confirmar(titulo, mensaje, textoAceptar, accion) {
    $('confirmar-titulo').textContent = titulo;
    $('confirmar-mensaje').textContent = mensaje;
    $('confirmar-aceptar').textContent = textoAceptar || 'Eliminar';
    ESTADO.confirmacion = accion;
    abrirModal('confirmar');
  }

  /* ========================== TEMA Y AJUSTES ========================== */

  function guardarTema(tema) {
    try {
      global.localStorage.setItem(CLAVES.tema, tema);
    } catch (error) { /* almacenamiento no disponible */ }
  }

  function actualizarMetaTema() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    meta.setAttribute('content', document.documentElement.classList.contains('dark') ? '#150d12' : '#be123c');
  }

  function alternarTema() {
    var oscuro = document.documentElement.classList.toggle('dark');
    guardarTema(oscuro ? 'oscuro' : 'claro');
    actualizarMetaTema();
  }

  /**
   * El álbum funciona sin conexión gracias al service worker.
   * No se registra al abrir el archivo con file://: ahí no existe.
   */
  function registrarServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol === 'file:') return;

    global.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {
        /* sin conexión no se puede instalar; la app sigue funcionando */
      });
    });
  }

  function cargarAjustes() {
    var guardado = leerJSON(CLAVES.ajustes, null);
    ESTADO.primeraVisita = !guardado;
    var ajustes = ajustesVacios();

    if (guardado && typeof guardado === 'object') {
      if (typeof guardado.a === 'string') ajustes.a = guardado.a;
      if (typeof guardado.b === 'string') ajustes.b = guardado.b;
      if (typeof guardado.frase === 'string') ajustes.frase = guardado.frase;
      if (typeof guardado.inicio === 'string') ajustes.inicio = guardado.inicio;
      if (typeof guardado.portadaId === 'string') ajustes.portadaId = guardado.portadaId;
    }

    ESTADO.ajustes = ajustes;
  }

  function cargarListas() {
    var fechas = leerJSON(CLAVES.fechas, []);
    ESTADO.fechas = (Array.isArray(fechas) ? fechas : []).filter(function (f) {
      return f && f.id && F.parsearISO(f.fecha);
    });

    var notas = leerJSON(CLAVES.notas, []);
    ESTADO.notas = (Array.isArray(notas) ? notas : []).filter(function (n) {
      return n && n.id && typeof n.texto === 'string';
    });

    var deseos = leerJSON(CLAVES.deseos, []);
    ESTADO.deseos = (Array.isArray(deseos) ? deseos : []).filter(function (d) {
      return d && d.id && typeof d.texto === 'string';
    });
  }

  function abrirAjustes() {
    $('ajuste-a').value = ESTADO.ajustes.a;
    $('ajuste-b').value = ESTADO.ajustes.b;
    $('ajuste-frase').value = ESTADO.ajustes.frase || AJUSTES_BASE.frase;
    $('ajuste-inicio').value = ESTADO.ajustes.inicio || '';
    $('ajuste-inicio').max = F.aISO(new Date());
    abrirModal('modal-ajustes');
  }

  function guardarAjustes(evento) {
    evento.preventDefault();

    var a = textoPlano($('ajuste-a').value, 24);
    var b = textoPlano($('ajuste-b').value, 24);
    var frase = textoPlano($('ajuste-frase').value, 140) || AJUSTES_BASE.frase;
    var inicio = $('ajuste-inicio').value;

    if (inicio && !F.parsearISO(inicio)) {
      avisar('La fecha de inicio no es válida.', 'error');
      $('ajuste-inicio').focus();
      return;
    }

    if (inicio) {
      var dias = F.diasHasta(F.parsearISO(inicio));
      if (dias !== null && dias > 0) {
        avisar('La fecha de inicio no puede estar en el futuro.', 'error');
        $('ajuste-inicio').focus();
        return;
      }
    }

    ESTADO.ajustes = {
      a: a,
      b: b,
      frase: frase,
      inicio: inicio,
      portadaId: ESTADO.ajustes.portadaId
    };

    guardarJSON(CLAVES.ajustes, ESTADO.ajustes);
    ESTADO.primeraVisita = false;
    pintarAjustes();
    cerrarModal('modal-ajustes');
    avisar('Su historia quedó actualizada.', 'ok');
  }

  function pintarAjustes() {
    var a = textoPlano(ESTADO.ajustes.a, 24) || 'Tú';
    var b = textoPlano(ESTADO.ajustes.b, 24) || 'Yo';
    $('nombres-pareja').textContent = a + ' & ' + b;
    $('frase-pareja').textContent = ESTADO.ajustes.frase || AJUSTES_BASE.frase;
    pintarContador();
    pintarPortada();
  }

  function pintarPortada() {
    var imagen = $('portada-img');
    if (ESTADO.urlPortada) {
      try { URL.revokeObjectURL(ESTADO.urlPortada); } catch (error) { /* nada */ }
      ESTADO.urlPortada = null;
    }

    var portada = ESTADO.ajustes.portadaId ? buscarMedio(ESTADO.ajustes.portadaId) : null;
    if (!portada || !portada.miniatura) {
      imagen.hidden = true;
      imagen.removeAttribute('src');
      return;
    }

    ESTADO.urlPortada = URL.createObjectURL(portada.miniatura);
    imagen.src = ESTADO.urlPortada;
    imagen.hidden = false;
  }

  /* ========================= CONTADOR EN VIVO ========================= */

  function pintarContador() {
    var dias = $('contador-dias');
    var horas = $('contador-horas');
    var minutos = $('contador-minutos');
    var segundos = $('contador-segundos');
    var nota = $('contador-desde');
    if (!dias || !nota) return;

    var inicio = F.parsearISO(ESTADO.ajustes.inicio);
    if (!inicio) {
      dias.textContent = '0';
      horas.textContent = '00';
      minutos.textContent = '00';
      segundos.textContent = '00';
      nota.textContent = 'Aún no hemos elegido la fecha en que empezó todo. Toca «Editar historia» para ponerla.';
      return;
    }

    var transcurrido = Date.now() - inicio.getTime();
    if (transcurrido < 0) {
      dias.textContent = '0';
      horas.textContent = '00';
      minutos.textContent = '00';
      segundos.textContent = '00';
      nota.textContent = 'El contador empezará el ' + F.formatearFecha(inicio) + '.';
      return;
    }

    var partes = F.descomponer(transcurrido);
    dias.textContent = partes.dias.toLocaleString('es-PE');
    horas.textContent = F.dosDigitos(partes.horas);
    minutos.textContent = F.dosDigitos(partes.minutos);
    segundos.textContent = F.dosDigitos(partes.segundos);

    var anios = F.aniosDesde(ESTADO.ajustes.inicio);
    var texto = 'Desde el ' + F.formatearFecha(inicio);
    if (anios && anios > 0) {
      texto += ' · ' + anios + (anios === 1 ? ' año juntos' : ' años juntos');
    } else if (partes.dias > 0) {
      texto += ' · ' + partes.dias.toLocaleString('es-PE') + (partes.dias === 1 ? ' día juntos' : ' días juntos');
    }
    if (partes.semanas > 0) {
      texto += ' · ' + partes.semanas.toLocaleString('es-PE') + ' semanas';
    }
    nota.textContent = texto;
  }

  function iniciarReloj() {
    pintarContador();
    global.setInterval(pintarContador, 1000);
  }

  /* ============================== GALERÍA ============================== */

  function filtrarMedios() {
    var filtro = ESTADO.filtro;
    return ESTADO.medios.filter(function (medio) {
      if (filtro === 'todas') return true;
      if (filtro === 'video') return esVideo(medio);
      return medio.categoria === filtro;
    });
  }

  function pintarCuentas() {
    $('cuenta-todas').textContent = String(ESTADO.medios.length);
    $('cuenta-caricatura').textContent = String(ESTADO.medios.filter(function (m) { return m.categoria === 'caricatura'; }).length);
    $('cuenta-foto').textContent = String(ESTADO.medios.filter(function (m) { return m.categoria === 'foto'; }).length);
    $('cuenta-viaje').textContent = String(ESTADO.medios.filter(function (m) { return m.categoria === 'viaje'; }).length);
    $('cuenta-video').textContent = String(ESTADO.medios.filter(esVideo).length);
  }

  function crearBadgeCategoria(medio) {
    var info = CATEGORIAS[medio.categoria] || CATEGORIAS.foto;
    var insignia = crear('span', 'insignia');
    var icono = crear('span', 'inline-flex');
    icono.innerHTML = ICONOS[info.icono] || ICONOS.foto;
    var etiqueta = crear('span', '', info.etiqueta);
    insignia.appendChild(icono);
    insignia.appendChild(etiqueta);
    if (esVideo(medio) && medio.duracion) {
      insignia.appendChild(crear('span', 'opacity-70', ' · ' + formatearDuracion(medio.duracion)));
    }
    return insignia;
  }

  function tarjetaMedia(medio) {
    var boton = crear('button', 'tarjeta-media');
    boton.type = 'button';
    boton.setAttribute('data-id', medio.id);
    boton.setAttribute('aria-label', 'Abrir ' + (medio.titulo || 'recuerdo'));

    if (medio.miniatura) {
      var url = URL.createObjectURL(medio.miniatura);
      ESTADO.urlsGaleria.push(url);
      var imagen = crear('img', 'miniatura');
      imagen.src = url;
      imagen.alt = '';
      imagen.loading = 'lazy';
      imagen.decoding = 'async';
      boton.appendChild(imagen);
    } else {
      var hueco = crear('span', 'grid h-full w-full place-items-center bg-gradient-to-br from-amor-100 via-amor-50 to-oro-100 text-amor-600 dark:from-amor-950 dark:via-slate-900 dark:to-slate-900 dark:text-amor-300');
      hueco.innerHTML = esVideo(medio) ? ICONOS.playGrande : ICONOS.fotoGrande;
      boton.appendChild(hueco);
    }

    boton.appendChild(crearBadgeCategoria(medio));

    if (medio.favorito) {
      var corazon = crear('span', 'corazon');
      corazon.innerHTML = ICONOS.corazon;
      corazon.setAttribute('aria-hidden', 'true');
      boton.appendChild(corazon);
    }

    boton.appendChild(crear('span', 'velo'));

    var pie = crear('span', 'absolute inset-x-0 bottom-0 z-10 block p-2.5');
    pie.appendChild(crear('span', 'block truncate text-[13px] font-semibold leading-tight text-white', medio.titulo || 'Sin título'));
    pie.appendChild(crear('span', 'mt-0.5 block text-[10px] text-white/75', textoFecha(medio)));
    boton.appendChild(pie);

    return boton;
  }

  function pintarGaleria() {
    var grid = $('galeria-grid');
    if (!grid) return;

    revocar(ESTADO.urlsGaleria);
    grid.innerHTML = '';
    pintarCuentas();

    var lista = filtrarMedios();
    var hayMedios = ESTADO.medios.length > 0;

    $('galeria-vacia').classList.toggle('hidden', hayMedios);
    $('sin-resultados').classList.toggle('hidden', !(hayMedios && lista.length === 0));
    grid.classList.toggle('hidden', lista.length === 0);

    for (var i = 0; i < lista.length; i++) {
      grid.appendChild(tarjetaMedia(lista[i]));
    }
  }

  function tarjetaFavorita(medio) {
    var boton = crear('button', 'favorito-tarjeta');
    boton.type = 'button';
    boton.setAttribute('data-id', medio.id);
    boton.setAttribute('aria-label', 'Abrir ' + (medio.titulo || 'favorito'));

    var marco = crear('span', 'marco block');
    if (medio.miniatura) {
      var url = URL.createObjectURL(medio.miniatura);
      ESTADO.urlsCarrusel.push(url);
      var imagen = crear('img');
      imagen.src = url;
      imagen.alt = '';
      imagen.loading = 'lazy';
      marco.appendChild(imagen);
    } else {
      var hueco = crear('span', 'grid h-full w-full place-items-center bg-gradient-to-br from-amor-100 to-oro-100 text-amor-600 dark:from-amor-950 dark:to-slate-900 dark:text-amor-300');
      hueco.innerHTML = esVideo(medio) ? ICONOS.playGrande : ICONOS.fotoGrande;
      marco.appendChild(hueco);
    }

    var corazon = crear('span', 'absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-amor-600 shadow');
    corazon.innerHTML = ICONOS.corazon;
    marco.appendChild(corazon);

    if (esVideo(medio)) {
      var play = crear('span', 'absolute inset-0 grid place-items-center text-white/90');
      var circulo = crear('span', 'grid h-11 w-11 place-items-center rounded-full bg-black/45 backdrop-blur');
      circulo.innerHTML = ICONOS.playGrande;
      play.appendChild(circulo);
      marco.appendChild(play);
    }

    boton.appendChild(marco);

    var pie = crear('span', 'block px-3 py-2.5');
    pie.appendChild(crear('span', 'block truncate font-serif text-[15px] text-slate-800 dark:text-slate-100', medio.titulo || 'Sin título'));
    pie.appendChild(crear('span', 'mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400', textoFecha(medio)));
    boton.appendChild(pie);

    return boton;
  }

  function pintarCarrusel() {
    var bloque = $('bloque-carrusel');
    var contenedor = $('carrusel');
    if (!bloque || !contenedor) return;

    revocar(ESTADO.urlsCarrusel);
    contenedor.innerHTML = '';

    var favoritos = ESTADO.medios.filter(function (medio) { return medio.favorito; }).slice(0, 12);
    bloque.classList.toggle('hidden', favoritos.length === 0);

    for (var i = 0; i < favoritos.length; i++) {
      contenedor.appendChild(tarjetaFavorita(favoritos[i]));
    }
  }

  function moverCarrusel(direccion) {
    var contenedor = $('carrusel');
    if (!contenedor) return;
    var paso = Math.max(180, contenedor.clientWidth * 0.8);
    var destino = contenedor.scrollLeft + direccion * paso;

    if (typeof contenedor.scrollTo === 'function') {
      try {
        contenedor.scrollTo({ left: destino, behavior: 'smooth' });
        return;
      } catch (error) {
        /* navegadores antiguos: se usa el salto directo */
      }
    }
    contenedor.scrollLeft = destino;
  }

  function actualizarAlmacenamiento() {
    var texto = $('almacenamiento');
    var barra = $('almacenamiento-barra');
    if (!texto || !barra) return;

    var total = 0;
    for (var i = 0; i < ESTADO.medios.length; i++) {
      total += Number(ESTADO.medios[i].tamano) || 0;
    }

    var cantidad = ESTADO.medios.length;
    texto.textContent = formatearPeso(total) + ' · ' + cantidad + (cantidad === 1 ? ' recuerdo' : ' recuerdos');
    barra.style.width = Math.max(2, Math.min(100, (total / (512 * 1024 * 1024)) * 100)) + '%';

    DB.estimar().then(function (uso) {
      if (!uso) return;
      texto.title = 'El navegador permite usar ' + formatearPeso(uso.disponible) +
        ' y ya se usa un ' + uso.porcentaje.toFixed(1).replace('.', ',') + '%.';
    }).catch(function () { /* dato opcional */ });
  }

  /* ============================== SUBIDAS ============================== */

  function mostrarProgreso(fraccion) {
    var barra = $('progreso-barra');
    if (!barra) return;
    barra.style.width = Math.max(0, Math.min(100, fraccion * 100)) + '%';
  }

  function ocultarProgreso() {
    var barra = $('progreso-barra');
    if (!barra) return;
    barra.style.width = '100%';
    global.setTimeout(function () {
      barra.style.width = '0%';
    }, 420);
  }

  function limpiarTitulo(nombre) {
    var texto = String(nombre || '')
      .replace(/\.[a-z0-9]{2,5}$/i, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!texto) return 'Sin título';
    texto = texto.charAt(0).toUpperCase() + texto.slice(1);
    return texto.slice(0, 90);
  }

  function huella(archivo) {
    var simple = 'simple:' + archivo.name + ':' + archivo.size + ':' + archivo.lastModified;

    if (!global.crypto || !global.crypto.subtle || esArchivoVideo(archivo) || archivo.size > 30 * 1024 * 1024) {
      return Promise.resolve(simple);
    }

    return archivo.arrayBuffer().then(function (buffer) {
      return global.crypto.subtle.digest('SHA-256', buffer);
    }).then(function (resumen) {
      var bytes = new Uint8Array(resumen);
      var salida = '';
      for (var i = 0; i < bytes.length; i++) {
        salida += ('0' + bytes[i].toString(16)).slice(-2);
      }
      return salida;
    }).catch(function () {
      return simple;
    });
  }

  function esArchivoVideo(archivo) {
    return /^video\//.test(archivo && archivo.type ? archivo.type : '');
  }

  function aBlob(lienzo) {
    return new Promise(function (resolve) {
      if (!lienzo.toBlob) {
        resolve(null);
        return;
      }
      lienzo.toBlob(function (blob) {
        if (blob) {
          resolve(blob);
          return;
        }
        lienzo.toBlob(function (otro) {
          resolve(otro || null);
        }, 'image/jpeg', 0.82);
      }, 'image/webp', 0.82);
    });
  }

  function miniaturaImagen(archivo) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(archivo);
      var imagen = new Image();
      var terminado = false;

      var temporizador = global.setTimeout(function () { finalizar(null); }, 20000);

      function finalizar(valor) {
        if (terminado) return;
        terminado = true;
        global.clearTimeout(temporizador);
        try { URL.revokeObjectURL(url); } catch (error) { /* nada */ }
        resolve(valor);
      }

      imagen.onload = function () {
        var ancho = imagen.naturalWidth;
        var alto = imagen.naturalHeight;
        if (!ancho || !alto) {
          finalizar(null);
          return;
        }

        var escala = Math.min(1, MAX_MINIATURA / Math.max(ancho, alto));
        var lienzo = document.createElement('canvas');
        lienzo.width = Math.max(1, Math.round(ancho * escala));
        lienzo.height = Math.max(1, Math.round(alto * escala));

        var contexto = lienzo.getContext('2d');
        contexto.imageSmoothingEnabled = true;
        contexto.imageSmoothingQuality = 'high';
        contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);

        aBlob(lienzo).then(function (blob) {
          finalizar({ miniatura: blob, ancho: ancho, alto: alto, duracion: 0 });
        });
      };

      imagen.onerror = function () { finalizar(null); };
      imagen.src = url;
    });
  }

  function miniaturaVideo(archivo) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(archivo);
      var video = document.createElement('video');
      var terminado = false;
      var capturado = false;
      var duracion = 0;

      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      var temporizador = global.setTimeout(function () { finalizar(null); }, 15000);

      function finalizar(valor) {
        if (terminado) return;
        terminado = true;
        global.clearTimeout(temporizador);
        video.removeAttribute('src');
        try { video.load(); } catch (error) { /* nada */ }
        try { URL.revokeObjectURL(url); } catch (error) { /* nada */ }
        resolve(valor);
      }

      function capturar() {
        if (capturado || terminado) return;
        var ancho = video.videoWidth;
        var alto = video.videoHeight;
        if (!ancho || !alto) return;
        capturado = true;

        var escala = Math.min(1, MAX_MINIATURA / Math.max(ancho, alto));
        var lienzo = document.createElement('canvas');
        lienzo.width = Math.max(1, Math.round(ancho * escala));
        lienzo.height = Math.max(1, Math.round(alto * escala));

        var contexto = lienzo.getContext('2d');
        contexto.drawImage(video, 0, 0, lienzo.width, lienzo.height);

        aBlob(lienzo).then(function (blob) {
          finalizar({ miniatura: blob, ancho: ancho, alto: alto, duracion: duracion });
        });
      }

      video.onloadedmetadata = function () {
        duracion = isFinite(video.duration) ? video.duration : 0;
        var destino = Math.min(Math.max(0.1, duracion * 0.15), 2.5);
        try {
          video.currentTime = destino;
        } catch (error) {
          capturar();
        }
      };

      video.onseeked = capturar;
      video.onloadeddata = function () {
        if (video.readyState >= 2 && video.currentTime < 0.05) capturar();
      };
      video.onerror = function () { finalizar(null); };

      video.src = url;
      video.load();
    });
  }

  function procesarArchivo(archivo) {
    var video = esArchivoVideo(archivo);
    var limite = video ? LIMITE_VIDEO : LIMITE_IMAGEN;

    if (archivo.size > limite) {
      return Promise.reject(new Error('supera el límite de ' + formatearPeso(limite)));
    }

    return huella(archivo).then(function (clave) {
      var repetido = false;
      for (var i = 0; i < ESTADO.medios.length; i++) {
        if (ESTADO.medios[i].hash === clave) {
          repetido = true;
          break;
        }
      }
      if (repetido) throw new Error('ya está en el álbum');

      return (video ? miniaturaVideo(archivo) : miniaturaImagen(archivo)).then(function (datos) {
        var meta = {
          id: nuevoId('m'),
          titulo: limpiarTitulo(archivo.name),
          descripcion: '',
          categoria: video ? 'video' : 'foto',
          tipo: archivo.type || (video ? 'video/mp4' : 'image/jpeg'),
          tamano: archivo.size,
          ancho: datos ? datos.ancho : 0,
          alto: datos ? datos.alto : 0,
          duracion: datos ? datos.duracion : 0,
          creado: new Date().toISOString(),
          fecha: F.aISO(new Date()),
          favorito: false,
          hash: clave,
          miniatura: datos ? datos.miniatura : null
        };
        return { meta: meta, blob: archivo };
      });
    });
  }

  function ordenarMedios() {
    ESTADO.medios.sort(function (a, b) {
      return String(b.creado).localeCompare(String(a.creado));
    });
  }

  function subirArchivos(lista) {
    var archivos = Array.prototype.slice.call(lista || []);
    var validos = archivos.filter(function (archivo) {
      return /^image\//.test(archivo.type) || /^video\//.test(archivo.type);
    });

    if (validos.length < archivos.length) {
      avisar('Algunos archivos no son fotos ni videos y se omitieron.', 'error');
    }
    if (!validos.length) return;

    if (ESTADO.cargando) {
      avisar('Espera a que termine la carga anterior.', 'info');
      return;
    }

    ESTADO.cargando = true;
    var botones = [$('btn-subir'), $('btn-subir-cabecera')];
    botones.forEach(function (boton) {
      if (boton) boton.disabled = true;
    });

    var indice = 0;
    var guardados = 0;

    mostrarProgreso(0.02);

    function siguiente() {
      if (indice >= validos.length) {
        ESTADO.cargando = false;
        botones.forEach(function (boton) {
          if (boton) boton.disabled = false;
        });
        ocultarProgreso();
        if (guardados > 0) {
          ordenarMedios();
          pintarGaleria();
          pintarCarrusel();
          actualizarAlmacenamiento();
          avisar(guardados === 1 ? 'Recuerdo guardado en el álbum.' : guardados + ' recuerdos guardados en el álbum.', 'ok');
          if (guardados > 2) Confeti.lanzar({ cantidad: 70 });
        }
        return;
      }

      var archivo = validos[indice];
      procesarArchivo(archivo).then(function (resultado) {
        return DB.guardar(resultado.meta, resultado.blob);
      }).then(function (meta) {
        ESTADO.medios.unshift(meta);
        guardados++;
      }).catch(function (error) {
        avisar((archivo.name || 'Archivo') + ': ' + (error && error.message ? error.message : 'no se pudo guardar'), 'error');
      }).then(function () {
        indice++;
        mostrarProgreso(indice / validos.length);
        siguiente();
      });
    }

    siguiente();
  }

  function subirPortada(archivo) {
    if (!archivo || !/^image\//.test(archivo.type)) {
      avisar('La portada debe ser una imagen.', 'error');
      return;
    }
    if (archivo.size > LIMITE_IMAGEN) {
      avisar('La imagen supera el límite de ' + formatearPeso(LIMITE_IMAGEN) + '.', 'error');
      return;
    }

    mostrarProgreso(0.1);

    huella(archivo).then(function (clave) {
      var existente = null;
      for (var i = 0; i < ESTADO.medios.length; i++) {
        if (ESTADO.medios[i].hash === clave) {
          existente = ESTADO.medios[i];
          break;
        }
      }

      if (existente) {
        aplicarPortada(existente);
        return null;
      }

      return miniaturaImagen(archivo).then(function (datos) {
        var meta = {
          id: nuevoId('m'),
          titulo: limpiarTitulo(archivo.name),
          descripcion: 'Nuestra portada',
          categoria: 'foto',
          tipo: archivo.type || 'image/jpeg',
          tamano: archivo.size,
          ancho: datos ? datos.ancho : 0,
          alto: datos ? datos.alto : 0,
          duracion: 0,
          creado: new Date().toISOString(),
          fecha: F.aISO(new Date()),
          favorito: false,
          hash: clave,
          miniatura: datos ? datos.miniatura : null
        };
        return DB.guardar(meta, archivo).then(function () {
          ESTADO.medios.unshift(meta);
          ordenarMedios();
          aplicarPortada(meta);
        });
      });
    }).catch(function (error) {
      avisar('No se pudo usar esa imagen: ' + (error && error.message ? error.message : 'error desconocido'), 'error');
    }).then(function () {
      mostrarProgreso(1);
      ocultarProgreso();
    });
  }

  function aplicarPortada(medio) {
    if (!medio) return;
    ESTADO.ajustes.portadaId = medio.id;
    guardarJSON(CLAVES.ajustes, ESTADO.ajustes);
    pintarPortada();
    pintarGaleria();
    pintarCarrusel();
    actualizarAlmacenamiento();
    avisar('Portada actualizada.', 'ok');
  }

  /* ================================ VISOR ================================ */

  function cerrarVisor() {
    var visor = $('visor');
    if (!visor) return;

    visor.classList.add('hidden');
    ESTADO.visorId = null;
    ESTADO.tokenVisor++;

    var video = $('visor-video');
    if (video) {
      try { video.pause(); } catch (error) { /* nada */ }
      video.removeAttribute('src');
      video.removeAttribute('poster');
      try { video.load(); } catch (error) { /* nada */ }
    }

    var imagen = $('visor-imagen');
    if (imagen) {
      imagen.hidden = true;
      imagen.removeAttribute('src');
    }

    if (ESTADO.urlVisor) {
      try { URL.revokeObjectURL(ESTADO.urlVisor); } catch (error) { /* nada */ }
      ESTADO.urlVisor = null;
    }
    if (ESTADO.urlMiniVisor) {
      try { URL.revokeObjectURL(ESTADO.urlMiniVisor); } catch (error) { /* nada */ }
      ESTADO.urlMiniVisor = null;
    }

    if (document.querySelectorAll('.modal[data-abierto="true"]').length === 0) {
      document.body.classList.remove('overflow-hidden');
    }
  }

  function abrirVisor(id) {
    if (!buscarMedio(id)) return;
    ESTADO.visorId = id;
    $('visor').classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    pintarVisor();
  }

  function pintarVisor() {
    var medio = buscarMedio(ESTADO.visorId);
    if (!medio) {
      cerrarVisor();
      return;
    }

    var token = ++ESTADO.tokenVisor;
    var lista = filtrarMedios();
    var indice = indiceEn(lista, medio.id);
    if (indice === -1 && ESTADO.medios.length) {
      lista = ESTADO.medios;
      indice = indiceEn(lista, medio.id);
    }

    $('visor-contador').textContent = (indice + 1) + ' / ' + Math.max(lista.length, 1);
    $('visor-anterior').disabled = lista.length < 2;
    $('visor-siguiente').disabled = lista.length < 2;

    $('visor-titulo').value = medio.titulo || '';
    $('visor-fecha').value = medio.fecha || '';
    $('visor-categoria').value = medio.categoria || 'foto';
    $('visor-categoria').disabled = esVideo(medio);
    $('visor-descripcion').value = medio.descripcion || '';
    $('visor-peso').textContent = formatearPeso(medio.tamano);
    $('visor-tipo').textContent = (String(medio.tipo || '').split('/')[1] || 'archivo').toUpperCase();
    $('visor-subido').textContent = F.formatearFecha(fechaLocal(medio.creado), 'corto') || '—';
    $('visor-medidas').textContent = medio.ancho ? (medio.ancho + ' × ' + medio.alto) : (medio.duracion ? formatearDuracion(medio.duracion) : '—');
    $('visor-favorito').textContent = medio.favorito ? 'Quitar de favoritos' : 'Marcar como favorito';
    $('visor-portada').classList.toggle('hidden', esVideo(medio));

    if (ESTADO.urlVisor) {
      try { URL.revokeObjectURL(ESTADO.urlVisor); } catch (error) { /* nada */ }
      ESTADO.urlVisor = null;
    }
    if (ESTADO.urlMiniVisor) {
      try { URL.revokeObjectURL(ESTADO.urlMiniVisor); } catch (error) { /* nada */ }
      ESTADO.urlMiniVisor = null;
    }

    var imagen = $('visor-imagen');
    var video = $('visor-video');

    imagen.hidden = true;
    imagen.removeAttribute('src');
    video.hidden = true;
    try { video.pause(); } catch (error) { /* nada */ }
    video.removeAttribute('src');
    video.removeAttribute('poster');
    try { video.load(); } catch (error) { /* nada */ }

    if (medio.miniatura) {
      ESTADO.urlMiniVisor = URL.createObjectURL(medio.miniatura);
    }

    if (esVideo(medio)) {
      video.hidden = false;
      if (ESTADO.urlMiniVisor) video.poster = ESTADO.urlMiniVisor;

      DB.leerArchivo(medio.id).then(function (blob) {
        if (token !== ESTADO.tokenVisor) return;
        if (!blob) {
          avisar('No encontramos el video original en este dispositivo.', 'error');
          return;
        }
        ESTADO.urlVisor = URL.createObjectURL(blob);
        video.src = ESTADO.urlVisor;
        video.load();
      }).catch(function () {
        if (token === ESTADO.tokenVisor) avisar('No se pudo abrir el video.', 'error');
      });
      return;
    }

    imagen.hidden = false;
    if (ESTADO.urlMiniVisor) imagen.src = ESTADO.urlMiniVisor;

    DB.leerArchivo(medio.id).then(function (blob) {
      if (token !== ESTADO.tokenVisor) return;
      if (!blob) {
        avisar('No encontramos la imagen original en este dispositivo.', 'error');
        return;
      }
      ESTADO.urlVisor = URL.createObjectURL(blob);
      imagen.src = ESTADO.urlVisor;
    }).catch(function () {
      if (token === ESTADO.tokenVisor) avisar('No se pudo abrir la imagen.', 'error');
    });
  }

  function moverVisor(paso) {
    var lista = filtrarMedios();
    var indice = indiceEn(lista, ESTADO.visorId);
    if (indice === -1) {
      lista = ESTADO.medios;
      indice = indiceEn(lista, ESTADO.visorId);
    }
    if (lista.length < 2 || indice === -1) return;

    var siguiente = (indice + paso + lista.length) % lista.length;
    ESTADO.visorId = lista[siguiente].id;
    pintarVisor();
  }

  function guardarCampoVisor(cambios) {
    var medio = buscarMedio(ESTADO.visorId);
    if (!medio) return;

    DB.actualizar(medio.id, cambios).then(function (actualizado) {
      if (!actualizado) return;
      for (var clave in actualizado) {
        if (Object.prototype.hasOwnProperty.call(actualizado, clave)) {
          medio[clave] = actualizado[clave];
        }
      }
      pintarGaleria();
      pintarCarrusel();
      if (ESTADO.ajustes.portadaId === medio.id) pintarPortada();
    }).catch(function () {
      avisar('No se pudo guardar el cambio.', 'error');
    });
  }

  function alternarFavoritoVisor() {
    var medio = buscarMedio(ESTADO.visorId);
    if (!medio) return;

    var nuevo = !medio.favorito;
    DB.actualizar(medio.id, { favorito: nuevo }).then(function (actualizado) {
      if (!actualizado) return;
      medio.favorito = nuevo;
      $('visor-favorito').textContent = nuevo ? 'Quitar de favoritos' : 'Marcar como favorito';
      pintarGaleria();
      pintarCarrusel();
      avisar(nuevo ? 'Guardado en momentos favoritos.' : 'Quitado de momentos favoritos.', 'ok');
    }).catch(function () {
      avisar('No se pudo actualizar el favorito.', 'error');
    });
  }

  /** Por encima de este peso no se envía el archivo al contenedor Android. */
  var LIMITE_PUENTE = 24 * 1024 * 1024;

  function puenteAndroid() {
    var puente = global.NosotrosAndroid;
    return puente && typeof puente.guardarArchivo === 'function' ? puente : null;
  }

  /**
   * Dentro del APK el WebView no descarga blob: URLs, así que el archivo se
   * entrega al contenedor nativo, que lo deja en Descargas/Nosotros.
   * Devuelve true cuando ya se atendió la descarga.
   */
  function guardarConAndroid(blob, nombre) {
    var puente = puenteAndroid();
    if (!puente) return false;

    if (blob.size > LIMITE_PUENTE) {
      avisar('Este archivo es muy grande para guardarlo fuera de la app.', 'info');
      return true;
    }

    var lector = new FileReader();
    lector.onerror = function () {
      avisar('No se pudo preparar el archivo para guardarlo.', 'error');
    };
    lector.onload = function () {
      var datos = String(lector.result || '');
      var coma = datos.indexOf(',');
      if (coma === -1) return;
      try {
        puente.guardarArchivo(datos.slice(coma + 1), nombre, blob.type || '');
      } catch (error) {
        avisar('No se pudo guardar el recuerdo.', 'error');
      }
    };
    lector.readAsDataURL(blob);
    return true;
  }

  function nombreDescarga(medio) {
    var extension = String(medio.tipo || '').split('/')[1] || (esVideo(medio) ? 'mp4' : 'jpg');
    extension = extension.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'bin';
    if (extension === 'jpeg') extension = 'jpg';

    var base = String(medio.titulo || 'recuerdo')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return (base || 'recuerdo') + '.' + extension;
  }

  function descargarMedio() {
    var medio = buscarMedio(ESTADO.visorId);
    if (!medio) return;

    DB.leerArchivo(medio.id).then(function (blob) {
      if (!blob) {
        avisar('No encontramos el archivo original.', 'error');
        return;
      }

      var nombre = nombreDescarga(medio);
      if (guardarConAndroid(blob, nombre)) return;

      var url = URL.createObjectURL(blob);
      var enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = nombre;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      global.setTimeout(function () {
        try { URL.revokeObjectURL(url); } catch (error) { /* nada */ }
      }, 5000);
    }).catch(function () {
      avisar('No se pudo descargar el recuerdo.', 'error');
    });
  }

  function eliminarMedioActual() {
    var medio = buscarMedio(ESTADO.visorId);
    if (!medio) return;

    confirmar(
      '¿Eliminar este recuerdo?',
      'Se borrará «' + (medio.titulo || 'Sin título') + '» de este dispositivo. Esta acción no se puede deshacer.',
      'Eliminar',
      function () {
        DB.eliminar(medio.id).then(function () {
          ESTADO.medios = ESTADO.medios.filter(function (m) { return m.id !== medio.id; });

          if (ESTADO.ajustes.portadaId === medio.id) {
            ESTADO.ajustes.portadaId = null;
            guardarJSON(CLAVES.ajustes, ESTADO.ajustes);
          }

          cerrarVisor();
          pintarGaleria();
          pintarCarrusel();
          pintarPortada();
          actualizarAlmacenamiento();
          avisar('Recuerdo eliminado.', 'ok');
        }).catch(function () {
          avisar('No se pudo eliminar el recuerdo.', 'error');
        });
      }
    );
  }

  /* ================================ FECHAS ================================ */

  function entradasFechas() {
    var hoy = F.hoyLocal();
    var entradas = ESTADO.fechas.map(function (fecha) {
      var proxima = F.proximaOcurrencia(fecha.fecha, fecha.anual, hoy);
      return {
        fecha: fecha,
        proxima: proxima,
        dias: proxima ? F.diasHasta(proxima, hoy) : null,
        anios: proxima ? F.aniosEntre(fecha.fecha, proxima) : 0
      };
    });

    entradas.sort(function (a, b) {
      var da = a.dias === null ? 999999 : a.dias;
      var db = b.dias === null ? 999999 : b.dias;
      if (da >= 0 && db < 0) return -1;
      if (db >= 0 && da < 0) return 1;
      if (da < 0 && db < 0) return db - da;
      return da - db;
    });

    return entradas;
  }

  function botonAccion(icono, etiqueta, accion, id, tamano) {
    var boton = crear('button', 'grid ' + (tamano || 'h-8 w-8') + ' place-items-center rounded-lg border border-slate-200 bg-white/70 text-slate-500 transition hover:border-amor-300 hover:text-amor-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:border-amor-600 dark:hover:text-amor-300');
    boton.type = 'button';
    boton.setAttribute('aria-label', etiqueta);
    boton.setAttribute('title', etiqueta);
    boton.setAttribute('data-accion', accion);
    boton.setAttribute('data-id', id);
    boton.innerHTML = ICONOS[icono] || ICONOS.foto;
    return boton;
  }

  function tarjetaFecha(entrada) {
    var fecha = entrada.fecha;
    var dias = entrada.dias;
    var tipo = TIPOS_FECHA[fecha.tipo] || TIPOS_FECHA.especial;

    var articulo = crear('article', 'fecha-tarjeta' + (dias === 0 ? ' hoy' : ''));

    var cabecera = crear('div', 'flex items-start justify-between gap-2');
    cabecera.appendChild(crear('span', 'tipo ' + tipo.clases, tipo.etiqueta));

    var acciones = crear('div', 'flex items-center gap-1');
    acciones.appendChild(botonAccion('lapiz', 'Editar ' + fecha.titulo, 'editar-fecha', fecha.id, 'h-7 w-7'));
    acciones.appendChild(botonAccion('basura', 'Eliminar ' + fecha.titulo, 'eliminar-fecha', fecha.id, 'h-7 w-7'));
    cabecera.appendChild(acciones);
    articulo.appendChild(cabecera);

    articulo.appendChild(crear(
      'p',
      'mt-3 font-serif text-2xl leading-none ' + (dias === 0 ? 'text-amor-700 dark:text-amor-200' : 'text-slate-900 dark:text-white'),
      F.textoCuenta(dias)
    ));

    articulo.appendChild(crear(
      'p',
      'mt-1.5 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400',
      F.formatearFecha(fecha.fecha, 'largo') + (fecha.anual ? ' · cada año' : '')
    ));

    articulo.appendChild(crear('h3', 'mt-2.5 font-serif text-lg leading-snug text-slate-800 dark:text-slate-100', fecha.titulo));

    if (fecha.nota) {
      articulo.appendChild(crear('p', 'mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400', fecha.nota));
    }

    if (fecha.anual && entrada.anios > 0) {
      articulo.appendChild(crear(
        'p',
        'mt-2.5 inline-flex rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-amor-700 dark:bg-white/10 dark:text-amor-200',
        'Cumplen ' + entrada.anios + (entrada.anios === 1 ? ' año' : ' años')
      ));
    }

    if (dias === 0) {
      var celebrar = crear('button', 'mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-amor-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amor-600');
      celebrar.type = 'button';
      celebrar.setAttribute('data-accion', 'celebrar');
      celebrar.setAttribute('data-id', fecha.id);
      celebrar.innerHTML = ICONOS.estrella + '<span>Celebrar hoy</span>';
      articulo.appendChild(celebrar);
    }

    return articulo;
  }

  function celebrarHoy(entradas) {
    var titulos = [];
    var ids = [];

    entradas.forEach(function (entrada) {
      if (entrada.dias === 0) {
        ids.push(entrada.fecha.id);
        titulos.push(entrada.fecha.titulo);
      }
    });

    if (!ids.length) return;

    ids.sort();
    var marca = F.aISO(F.hoyLocal()) + '|' + ids.join(',');
    if (leerJSON(CLAVES.celebrado, null) === marca) return;
    guardarJSON(CLAVES.celebrado, marca);

    global.setTimeout(function () {
      Confeti.lanzar({ cantidad: 180 });
      avisar('Hoy celebramos: ' + titulos.join(' y ') + '.', 'ok');
    }, 900);
  }

  function pintarFechas() {
    var contenedor = $('lista-fechas');
    if (!contenedor) return;

    contenedor.innerHTML = '';
    $('fechas-vacio').classList.toggle('hidden', ESTADO.fechas.length > 0);

    var entradas = entradasFechas();
    for (var i = 0; i < entradas.length; i++) {
      contenedor.appendChild(tarjetaFecha(entradas[i]));
    }

    celebrarHoy(entradas);
  }

  function abrirFormFecha(fecha) {
    var nueva = !fecha;
    $('fecha-titulo-modal').textContent = nueva ? 'Nueva fecha' : 'Editar fecha';
    $('fecha-id').value = nueva ? '' : fecha.id;
    $('fecha-titulo').value = nueva ? '' : (fecha.titulo || '');
    $('fecha-dia').value = nueva ? F.aISO(new Date()) : fecha.fecha;
    $('fecha-tipo').value = nueva ? 'aniversario' : (fecha.tipo || 'aniversario');
    $('fecha-anual').checked = nueva ? true : !!fecha.anual;
    $('fecha-nota').value = nueva ? '' : (fecha.nota || '');
    $('btn-eliminar-fecha').classList.toggle('hidden', nueva);
    abrirModal('modal-fecha');
  }

  function guardarFecha(evento) {
    evento.preventDefault();

    var id = $('fecha-id').value;
    var titulo = textoPlano($('fecha-titulo').value, 60);
    var dia = $('fecha-dia').value;
    var tipo = $('fecha-tipo').value;
    var nota = textoPlano($('fecha-nota').value, 200);
    var anual = $('fecha-anual').checked;

    if (titulo.length < 3) {
      avisar('Ponle un nombre a esta fecha.', 'error');
      $('fecha-titulo').focus();
      return;
    }
    if (!F.parsearISO(dia)) {
      avisar('Elige una fecha válida.', 'error');
      $('fecha-dia').focus();
      return;
    }

    if (id) {
      var existente = buscarEn(ESTADO.fechas, id);
      if (!existente) {
        cerrarModal('modal-fecha');
        return;
      }
      existente.titulo = titulo;
      existente.fecha = dia;
      existente.tipo = tipo;
      existente.nota = nota;
      existente.anual = anual;
    } else {
      ESTADO.fechas.push({
        id: nuevoId('f'),
        titulo: titulo,
        fecha: dia,
        tipo: tipo,
        nota: nota,
        anual: anual,
        creado: new Date().toISOString()
      });
    }

    guardarJSON(CLAVES.fechas, ESTADO.fechas);
    pintarFechas();
    cerrarModal('modal-fecha');
    avisar(id ? 'Fecha actualizada.' : 'Fecha guardada en el calendario.', 'ok');

    if (!id && F.diasHasta(F.parsearISO(dia)) === 0) {
      Confeti.lanzar({ cantidad: 160 });
    }
  }

  function eliminarFecha(id, cerrarFormulario) {
    var fecha = buscarEn(ESTADO.fechas, id);
    if (!fecha) return;

    confirmar(
      '¿Quitar esta fecha?',
      '«' + fecha.titulo + '» dejará de aparecer en el calendario.',
      'Quitar',
      function () {
        ESTADO.fechas = ESTADO.fechas.filter(function (f) { return f.id !== id; });
        guardarJSON(CLAVES.fechas, ESTADO.fechas);
        pintarFechas();
        if (cerrarFormulario) cerrarModal('modal-fecha');
        avisar('Fecha eliminada.', 'ok');
      }
    );
  }

  /* ================================= CARTAS ================================ */

  function colorElegido() {
    var opciones = document.querySelectorAll('input[name="nota-color"]');
    for (var i = 0; i < opciones.length; i++) {
      if (opciones[i].checked) return opciones[i].value;
    }
    return 'rosa';
  }

  function marcarColor(color) {
    var opciones = document.querySelectorAll('input[name="nota-color"]');
    for (var i = 0; i < opciones.length; i++) {
      opciones[i].checked = opciones[i].value === color;
    }
  }

  function fechaCarta(nota) {
    return F.formatearFecha(fechaLocal(nota.creado), 'corto') ||
      F.formatearFecha(fechaLocal(nota.actualizado), 'corto');
  }

  function tarjetaNota(nota) {
    var color = ['rosa', 'durazno', 'lavanda', 'menta'].indexOf(nota.color) >= 0 ? nota.color : 'rosa';
    var articulo = crear('article', 'nota-tarjeta ' + color);
    articulo.setAttribute('role', 'button');
    articulo.setAttribute('tabindex', '0');
    articulo.setAttribute('data-id', nota.id);
    articulo.setAttribute('aria-label', 'Leer la carta ' + (nota.titulo || ''));

    articulo.appendChild(crear('span', 'cinta'));

    articulo.appendChild(crear('p', 'relative z-10 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500/80 dark:text-slate-300/60', fechaCarta(nota)));
    articulo.appendChild(crear('h3', 'relative z-10 mt-1 font-serif text-lg leading-snug text-slate-800 dark:text-slate-100', nota.titulo || 'Sin título'));

    var resumen = textoPlano(nota.texto, 190);
    if (nota.texto && nota.texto.length > 190) resumen += '…';
    articulo.appendChild(crear('p', 'relative z-10 mt-2 whitespace-pre-line font-serif text-[13px] leading-relaxed text-slate-600/90 dark:text-slate-300/80', resumen));

    var pie = crear('p', 'relative z-10 mt-auto flex items-center gap-1 pt-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400');
    pie.innerHTML = ICONOS.lapiz;
    pie.appendChild(crear('span', '', 'Leer y editar'));
    articulo.appendChild(pie);

    return articulo;
  }

  function pintarNotas() {
    var contenedor = $('lista-notas');
    if (!contenedor) return;

    contenedor.innerHTML = '';
    $('notas-vacio').classList.toggle('hidden', ESTADO.notas.length > 0);

    var lista = ESTADO.notas.slice().sort(function (a, b) {
      return String(b.creado || '').localeCompare(String(a.creado || ''));
    });

    for (var i = 0; i < lista.length; i++) {
      contenedor.appendChild(tarjetaNota(lista[i]));
    }
  }

  function abrirNota(nota) {
    var nueva = !nota;
    $('nota-titulo-modal').textContent = nueva ? 'Nueva carta' : 'Nuestra carta';
    $('nota-id').value = nueva ? '' : nota.id;
    $('nota-titulo').value = nueva ? '' : (nota.titulo || '');
    $('nota-texto').value = nueva ? '' : (nota.texto || '');
    $('nota-contador').textContent = String($('nota-texto').value.length);
    marcarColor(nueva ? 'rosa' : (nota.color || 'rosa'));
    $('btn-eliminar-nota').classList.toggle('hidden', nueva);
    abrirModal('modal-nota');
  }

  function guardarNota(evento) {
    evento.preventDefault();

    var id = $('nota-id').value;
    var titulo = textoPlano($('nota-titulo').value, 70);
    var texto = $('nota-texto').value.replace(/\r/g, '').trim().slice(0, 4000);
    var color = colorElegido();

    if (!texto) {
      avisar('Escribe algo en tu carta.', 'error');
      $('nota-texto').focus();
      return;
    }

    if (!titulo) {
      titulo = F.formatearFecha(F.aISO(new Date()), 'largo');
    }

    if (id) {
      var existente = buscarEn(ESTADO.notas, id);
      if (!existente) {
        cerrarModal('modal-nota');
        return;
      }
      existente.titulo = titulo;
      existente.texto = texto;
      existente.color = color;
      existente.actualizado = new Date().toISOString();
    } else {
      ESTADO.notas.unshift({
        id: nuevoId('n'),
        titulo: titulo,
        texto: texto,
        color: color,
        creado: new Date().toISOString()
      });
    }

    guardarJSON(CLAVES.notas, ESTADO.notas);
    pintarNotas();
    cerrarModal('modal-nota');
    avisar(id ? 'Carta actualizada.' : 'Carta guardada con cariño.', 'ok');
  }

  function eliminarNota(id) {
    var nota = buscarEn(ESTADO.notas, id);
    if (!nota) return;

    confirmar(
      '¿Eliminar esta carta?',
      '«' + (nota.titulo || 'Sin título') + '» se borrará para siempre.',
      'Eliminar',
      function () {
        ESTADO.notas = ESTADO.notas.filter(function (n) { return n.id !== id; });
        guardarJSON(CLAVES.notas, ESTADO.notas);
        pintarNotas();
        cerrarModal('modal-nota');
        avisar('Carta eliminada.', 'ok');
      }
    );
  }

  /* ================================ DESEOS ================================ */

  function contarHechos() {
    var total = 0;
    for (var i = 0; i < ESTADO.deseos.length; i++) {
      if (ESTADO.deseos[i].hecho) total++;
    }
    return total;
  }

  function pintarDeseos() {
    var lista = $('lista-deseos');
    if (!lista) return;

    lista.innerHTML = '';
    $('deseos-vacio').classList.toggle('hidden', ESTADO.deseos.length > 0);

    for (var i = 0; i < ESTADO.deseos.length; i++) {
      var deseo = ESTADO.deseos[i];
      var elemento = crear('li', 'deseo-item');

      var etiqueta = crear('label', 'flex min-w-0 flex-1 cursor-pointer items-start gap-2.5');

      var casilla = document.createElement('input');
      casilla.type = 'checkbox';
      casilla.className = 'mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-amor-600 focus:ring-amor-500';
      casilla.checked = !!deseo.hecho;
      casilla.setAttribute('data-id', deseo.id);
      casilla.setAttribute('aria-label', 'Marcar como cumplido: ' + deseo.texto);

      var texto = crear(
        'span',
        'text-sm leading-relaxed ' + (deseo.hecho ? 'hecho text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'),
        deseo.texto
      );

      etiqueta.appendChild(casilla);
      etiqueta.appendChild(texto);

      var borrar = crear('button', 'shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300');
      borrar.type = 'button';
      borrar.setAttribute('data-accion', 'borrar-deseo');
      borrar.setAttribute('data-id', deseo.id);
      borrar.setAttribute('aria-label', 'Quitar deseo: ' + deseo.texto);
      borrar.setAttribute('title', 'Quitar deseo');
      borrar.innerHTML = ICONOS.basura;

      elemento.appendChild(etiqueta);
      elemento.appendChild(borrar);
      lista.appendChild(elemento);
    }

    var total = ESTADO.deseos.length;
    var hechos = contarHechos();
    var porcentaje = total ? Math.round((hechos / total) * 100) : 0;

    $('deseos-texto').textContent = hechos + ' de ' + total + (total === 1 ? ' deseo' : ' deseos');
    $('deseos-porcentaje').textContent = porcentaje + '%';
    $('deseos-barra').style.width = porcentaje + '%';
    $('deseos-progreso').setAttribute('aria-valuenow', String(porcentaje));
  }

  function alternarDeseo(id, hecho) {
    var deseo = buscarEn(ESTADO.deseos, id);
    if (!deseo) return;

    deseo.hecho = !!hecho;
    guardarJSON(CLAVES.deseos, ESTADO.deseos);
    pintarDeseos();

    var total = ESTADO.deseos.length;
    if (hecho && total > 0 && contarHechos() === total) {
      Confeti.lanzar({ cantidad: 190 });
      avisar('Cumplieron todos los deseos de la lista. A por más.', 'ok');
    }
  }

  function borrarDeseo(id) {
    ESTADO.deseos = ESTADO.deseos.filter(function (d) { return d.id !== id; });
    guardarJSON(CLAVES.deseos, ESTADO.deseos);
    pintarDeseos();
    avisar('Deseo quitado de la lista.', 'ok');
  }

  /* ============================== EVENTOS ============================== */

  function aplicarFiltro(filtro) {
    ESTADO.filtro = filtro;
    var botones = document.querySelectorAll('#filtros .seg-item');
    for (var i = 0; i < botones.length; i++) {
      var activo = botones[i].getAttribute('data-filtro') === filtro;
      botones[i].classList.toggle('seg-activo', activo);
      botones[i].setAttribute('aria-selected', activo ? 'true' : 'false');
    }
    pintarGaleria();
  }

  function abrirSelectorMedios() {
    $('input-medios').click();
  }

  function observarSecciones() {
    var enlaces = document.querySelectorAll('.nav-enlace, .nav-movil');
    if (!enlaces.length || !('IntersectionObserver' in global)) return;

    function marcar(id) {
      for (var i = 0; i < enlaces.length; i++) {
        enlaces[i].classList.toggle('activo', enlaces[i].getAttribute('data-destino') === id);
      }
    }

    var observador = new IntersectionObserver(function (entradas) {
      for (var i = 0; i < entradas.length; i++) {
        if (entradas[i].isIntersecting) marcar(entradas[i].target.id);
      }
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    ['inicio', 'galeria', 'fechas', 'cartas', 'deseos'].forEach(function (id) {
      var seccion = $(id);
      if (seccion) observador.observe(seccion);
    });
  }

  function enlazarArrastre() {
    var capa = $('arrastrando');
    if (!capa) return;

    var profundidad = 0;

    function tieneArchivos(evento) {
      var tipos = evento.dataTransfer && evento.dataTransfer.types;
      if (!tipos) return false;
      for (var i = 0; i < tipos.length; i++) {
        if (tipos[i] === 'Files') return true;
      }
      return false;
    }

    function mostrar() {
      capa.classList.remove('hidden');
      capa.classList.add('flex');
      document.documentElement.classList.add('arrastrando-activo');
    }

    function ocultar() {
      capa.classList.add('hidden');
      capa.classList.remove('flex');
      document.documentElement.classList.remove('arrastrando-activo');
      profundidad = 0;
    }

    document.addEventListener('dragenter', function (evento) {
      if (!tieneArchivos(evento)) return;
      evento.preventDefault();
      profundidad++;
      if (profundidad === 1) mostrar();
    });

    document.addEventListener('dragover', function (evento) {
      if (!tieneArchivos(evento)) return;
      evento.preventDefault();
      if (evento.dataTransfer) evento.dataTransfer.dropEffect = 'copy';
      if (capa.classList.contains('hidden')) mostrar();
    });

    document.addEventListener('dragleave', function () {
      if (profundidad <= 0) return;
      profundidad--;
      if (profundidad === 0) ocultar();
    });

    document.addEventListener('dragend', ocultar);

    document.addEventListener('drop', function (evento) {
      if (!tieneArchivos(evento)) return;
      evento.preventDefault();
      ocultar();
      if (evento.dataTransfer && evento.dataTransfer.files && evento.dataTransfer.files.length) {
        subirArchivos(evento.dataTransfer.files);
      }
    });
  }

  function enlazarEventos() {
    $('btn-tema').addEventListener('click', alternarTema);
    $('btn-ajustes').addEventListener('click', abrirAjustes);
    $('btn-editar-historia').addEventListener('click', abrirAjustes);
    $('form-ajustes').addEventListener('submit', guardarAjustes);

    $('btn-portada').addEventListener('click', function () {
      $('input-portada').click();
    });

    $('input-portada').addEventListener('change', function () {
      var archivo = this.files && this.files[0];
      this.value = '';
      if (archivo) subirPortada(archivo);
    });

    $('btn-subir').addEventListener('click', abrirSelectorMedios);
    $('btn-subir-cabecera').addEventListener('click', abrirSelectorMedios);

    $('input-medios').addEventListener('change', function () {
      var archivos = Array.prototype.slice.call(this.files || []);
      this.value = '';
      subirArchivos(archivos);
    });

    $('filtros').addEventListener('click', function (evento) {
      var boton = evento.target.closest('.seg-item');
      if (boton) aplicarFiltro(boton.getAttribute('data-filtro'));
    });

    $('btn-limpiar-filtro').addEventListener('click', function () {
      aplicarFiltro('todas');
    });

    $('galeria-grid').addEventListener('click', function (evento) {
      var boton = evento.target.closest('[data-id]');
      if (boton) abrirVisor(boton.getAttribute('data-id'));
    });

    $('carrusel').addEventListener('click', function (evento) {
      var boton = evento.target.closest('[data-id]');
      if (boton) abrirVisor(boton.getAttribute('data-id'));
    });

    $('carrusel-prev').addEventListener('click', function () { moverCarrusel(-1); });
    $('carrusel-next').addEventListener('click', function () { moverCarrusel(1); });

    $('btn-celebrar').addEventListener('click', function () {
      Confeti.lanzar({ cantidad: 200 });
      avisar('Confeti para celebrar lo nuestro.', 'ok');
    });

    $('visor-cerrar').addEventListener('click', cerrarVisor);
    $('visor-anterior').addEventListener('click', function () { moverVisor(-1); });
    $('visor-siguiente').addEventListener('click', function () { moverVisor(1); });
    $('visor-favorito').addEventListener('click', alternarFavoritoVisor);
    $('visor-eliminar').addEventListener('click', eliminarMedioActual);
    $('visor-descargar').addEventListener('click', descargarMedio);
    $('visor-portada').addEventListener('click', function () {
      var medio = buscarMedio(ESTADO.visorId);
      if (medio && !esVideo(medio)) aplicarPortada(medio);
    });

    $('visor-titulo').addEventListener('change', function () {
      var titulo = textoPlano(this.value, 90) || 'Sin título';
      this.value = titulo;
      guardarCampoVisor({ titulo: titulo });
    });

    $('visor-fecha').addEventListener('change', function () {
      var medio = buscarMedio(ESTADO.visorId);
      var valor = this.value;
      if (valor && !F.parsearISO(valor)) {
        avisar('Esa fecha no es válida.', 'error');
        if (medio) this.value = medio.fecha || '';
        return;
      }
      guardarCampoVisor({ fecha: valor });
    });

    $('visor-categoria').addEventListener('change', function () {
      var medio = buscarMedio(ESTADO.visorId);
      if (!medio) return;
      if (esVideo(medio)) {
        this.value = 'video';
        return;
      }
      guardarCampoVisor({ categoria: this.value });
    });

    $('visor-descripcion').addEventListener('change', function () {
      guardarCampoVisor({ descripcion: textoPlano(this.value, 500) });
    });

    (function enlazarSwipeVisor() {
      var zona = $('visor-envoltorio');
      var inicioX = 0;
      var inicioY = 0;
      var siguiendo = false;

      zona.addEventListener('touchstart', function (evento) {
        if (evento.touches.length !== 1) return;
        inicioX = evento.touches[0].clientX;
        inicioY = evento.touches[0].clientY;
        siguiendo = true;
      }, { passive: true });

      zona.addEventListener('touchend', function (evento) {
        if (!siguiendo) return;
        siguiendo = false;
        var toque = evento.changedTouches[0];
        if (!toque) return;
        var deltaX = toque.clientX - inicioX;
        var deltaY = toque.clientY - inicioY;
        if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.6) {
          moverVisor(deltaX < 0 ? 1 : -1);
        }
      }, { passive: true });
    })();

    $('btn-nueva-fecha').addEventListener('click', function () { abrirFormFecha(null); });
    $('form-fecha').addEventListener('submit', guardarFecha);

    $('btn-eliminar-fecha').addEventListener('click', function () {
      var id = $('fecha-id').value;
      if (id) eliminarFecha(id, true);
    });

    $('lista-fechas').addEventListener('click', function (evento) {
      var boton = evento.target.closest('[data-accion]');
      if (!boton) return;

      var accion = boton.getAttribute('data-accion');
      var id = boton.getAttribute('data-id');

      if (accion === 'editar-fecha') {
        var fecha = buscarEn(ESTADO.fechas, id);
        if (fecha) abrirFormFecha(fecha);
        return;
      }

      if (accion === 'eliminar-fecha') {
        eliminarFecha(id, false);
        return;
      }

      if (accion === 'celebrar') {
        Confeti.lanzar({ cantidad: 200 });
        avisar('A celebrar lo nuestro.', 'ok');
      }
    });

    $('btn-nueva-nota').addEventListener('click', function () { abrirNota(null); });
    $('form-nota').addEventListener('submit', guardarNota);

    $('nota-texto').addEventListener('input', function () {
      $('nota-contador').textContent = String(this.value.length);
    });

    $('btn-eliminar-nota').addEventListener('click', function () {
      var id = $('nota-id').value;
      if (id) eliminarNota(id);
    });

    $('lista-notas').addEventListener('click', function (evento) {
      var tarjeta = evento.target.closest('[data-id]');
      if (!tarjeta) return;
      var nota = buscarEn(ESTADO.notas, tarjeta.getAttribute('data-id'));
      if (nota) abrirNota(nota);
    });

    $('lista-notas').addEventListener('keydown', function (evento) {
      if (evento.key !== 'Enter' && evento.key !== ' ') return;
      var tarjeta = evento.target.closest('[data-id]');
      if (!tarjeta) return;
      evento.preventDefault();
      var nota = buscarEn(ESTADO.notas, tarjeta.getAttribute('data-id'));
      if (nota) abrirNota(nota);
    });

    $('form-deseo').addEventListener('submit', function (evento) {
      evento.preventDefault();
      var texto = textoPlano($('deseo-texto').value, 120);

      if (!texto) {
        avisar('Escribe qué quieren hacer juntos.', 'error');
        $('deseo-texto').focus();
        return;
      }

      var repetido = ESTADO.deseos.some(function (d) {
        return d.texto.toLowerCase() === texto.toLowerCase();
      });
      if (repetido) {
        avisar('Ese deseo ya está en la lista.', 'info');
        return;
      }

      ESTADO.deseos.push({
        id: nuevoId('d'),
        texto: texto,
        hecho: false,
        creado: new Date().toISOString()
      });

      guardarJSON(CLAVES.deseos, ESTADO.deseos);
      $('deseo-texto').value = '';
      pintarDeseos();
      avisar('Deseo añadido a la lista.', 'ok');
    });

    $('lista-deseos').addEventListener('change', function (evento) {
      var casilla = evento.target;
      if (casilla && casilla.type === 'checkbox') {
        alternarDeseo(casilla.getAttribute('data-id'), casilla.checked);
      }
    });

    $('lista-deseos').addEventListener('click', function (evento) {
      var boton = evento.target.closest('[data-accion="borrar-deseo"]');
      if (boton) borrarDeseo(boton.getAttribute('data-id'));
    });

    $('confirmar-aceptar').addEventListener('click', function () {
      var accion = ESTADO.confirmacion;
      ESTADO.confirmacion = null;
      cerrarModal('confirmar');
      if (typeof accion === 'function') global.setTimeout(accion, 0);
    });

    $('confirmar-cancelar').addEventListener('click', function () {
      ESTADO.confirmacion = null;
      cerrarModal('confirmar');
    });

    var botonesCerrar = document.querySelectorAll('[data-cerrar]');
    for (var i = 0; i < botonesCerrar.length; i++) {
      botonesCerrar[i].addEventListener('click', function () {
        cerrarModal(this.getAttribute('data-cerrar'));
      });
    }

    var modales = document.querySelectorAll('.modal');
    for (var j = 0; j < modales.length; j++) {
      modales[j].addEventListener('click', function (evento) {
        if (evento.target !== this) return;
        if (this.id === 'confirmar') ESTADO.confirmacion = null;
        cerrarModal(this);
      });
    }

    document.addEventListener('keydown', function (evento) {
      if (evento.key === 'Escape') {
        var visor = $('visor');
        if (visor && !visor.classList.contains('hidden')) {
          cerrarVisor();
          return;
        }
        var abierto = modalSuperior();
        if (abierto) {
          if (abierto.id === 'confirmar') ESTADO.confirmacion = null;
          cerrarModal(abierto);
        }
        return;
      }

      var visorAbierto = $('visor') && !$('visor').classList.contains('hidden');
      if (!visorAbierto) return;

      var etiqueta = (evento.target.tagName || '').toUpperCase();
      if (etiqueta === 'INPUT' || etiqueta === 'TEXTAREA' || etiqueta === 'SELECT') return;

      if (evento.key === 'ArrowRight') moverVisor(1);
      if (evento.key === 'ArrowLeft') moverVisor(-1);
    });

    enlazarArrastre();
  }

  /* ================================ ARRANQUE ================================ */

  function iniciar() {
    cargarAjustes();
    cargarListas();

    enlazarEventos();
    actualizarMetaTema();
    registrarServiceWorker();

    pintarAjustes();
    pintarGaleria();
    pintarCarrusel();
    pintarFechas();
    pintarNotas();
    pintarDeseos();
    actualizarAlmacenamiento();
    iniciarReloj();
    observarSecciones();

    if (ESTADO.primeraVisita) {
      global.setTimeout(function () {
        abrirAjustes();
        avisar('Cuéntanos su historia para empezar el contador.', 'info');
      }, 420);
    }

    DB.listar().then(function (lista) {
      ESTADO.medios = lista;
      pintarGaleria();
      pintarCarrusel();
      pintarPortada();
      actualizarAlmacenamiento();
    }).catch(function (error) {
      avisar('No pudimos abrir el álbum: ' + (error && error.message ? error.message : 'error desconocido'), 'error');
      $('galeria-vacia').classList.remove('hidden');
      $('almacenamiento').textContent = 'Almacenamiento no disponible';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})(window);
