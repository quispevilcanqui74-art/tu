/**
 * Nosotros · Utilidades de fechas (módulo puro, sin DOM)
 * -------------------------------------------------------------
 * Todo lo que la app necesita para el contador en vivo y para
 * los aniversarios. Se mantiene aparte de la interfaz para poder
 * probarlo con Node sin navegador.
 *
 * Uso:
 *   ParejaFechas.descomponer(ms)        -> { dias, horas, minutos, segundos }
 *   ParejaFechas.proximaOcurrencia(iso, anual, hoy) -> Date
 *   ParejaFechas.diasHasta(fecha, hoy)  -> número entero
 */
(function (global) {
  'use strict';

  var MESES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  var MESES_CORTOS = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'set', 'oct', 'nov', 'dic'
  ];
  var MS_DIA = 86400000;

  function dosDigitos(numero) {
    return numero < 10 ? '0' + numero : String(numero);
  }

  /** Convierte 'YYYY-MM-DD' en un Date a medianoche local. */
  function parsearISO(iso) {
    if (typeof iso !== 'string') return null;
    var partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!partes) return null;

    var anio = Number(partes[1]);
    var mes = Number(partes[2]) - 1;
    var dia = Number(partes[3]);
    var fecha = new Date(anio, mes, dia);

    if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes || fecha.getDate() !== dia) {
      return null;
    }
    return fecha;
  }

  /** Convierte un Date en 'YYYY-MM-DD' usando la fecha local. */
  function aISO(fecha) {
    if (!fecha || typeof fecha.getTime !== 'function' || isNaN(fecha.getTime())) return '';
    return fecha.getFullYear() + '-' + dosDigitos(fecha.getMonth() + 1) + '-' + dosDigitos(fecha.getDate());
  }

  /** Hoy a medianoche, para comparar solo días. */
  function hoyLocal() {
    var ahora = new Date();
    return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  }

  function normalizarDia(fecha) {
    if (!fecha) return hoyLocal();
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  }

  /** Descompone milisegundos en días, horas, minutos y segundos. */
  function descomponer(ms) {
    var total = Math.floor((!isFinite(ms) || ms < 0 ? 0 : ms) / 1000);
    return {
      dias: Math.floor(total / 86400),
      horas: Math.floor((total % 86400) / 3600),
      minutos: Math.floor((total % 3600) / 60),
      segundos: total % 60,
      totalSegundos: total,
      semanas: Math.floor(total / 604800)
    };
  }

  /**
   * Próxima vez que ocurre una fecha.
   * Si es anual, se traslada al año actual o al siguiente.
   */
  function proximaOcurrencia(iso, anual, hoy) {
    var base = parsearISO(iso);
    if (!base) return null;
    if (!anual) return base;

    var referencia = normalizarDia(hoy);
    var proxima = new Date(referencia.getFullYear(), base.getMonth(), base.getDate());
    if (proxima.getTime() < referencia.getTime()) {
      proxima = new Date(referencia.getFullYear() + 1, base.getMonth(), base.getDate());
    }
    return proxima;
  }

  /** Días que faltan (negativo si ya pasó). */
  function diasHasta(fecha, hoy) {
    if (!fecha) return null;
    var referencia = normalizarDia(hoy);
    var objetivo = normalizarDia(fecha);
    return Math.round((objetivo.getTime() - referencia.getTime()) / MS_DIA);
  }

  /** Años cumplidos desde la fecha original hasta la próxima ocurrencia. */
  function aniosEntre(iso, fecha) {
    var base = parsearISO(iso);
    if (!base || !fecha) return 0;
    return Math.max(0, fecha.getFullYear() - base.getFullYear());
  }

  /** Años completos transcurridos desde una fecha hasta hoy. */
  function aniosDesde(iso, hoy) {
    var base = parsearISO(iso);
    if (!base) return null;

    var referencia = normalizarDia(hoy);
    var anios = referencia.getFullYear() - base.getFullYear();
    var aunNoLlega = referencia.getMonth() < base.getMonth() ||
      (referencia.getMonth() === base.getMonth() && referencia.getDate() < base.getDate());
    if (aunNoLlega) anios -= 1;
    return Math.max(0, anios);
  }

  /** '12 de marzo de 2021' (también acepta un Date). */
  function formatearFecha(valor, formato) {
    var fecha = typeof valor === 'string' ? parsearISO(valor) : valor;
    if (!fecha || isNaN(fecha.getTime())) return '';

    var dia = fecha.getDate();
    var mes = fecha.getMonth();
    var anio = fecha.getFullYear();

    if (formato === 'corto') return dia + ' ' + MESES_CORTOS[mes] + ' ' + anio;
    if (formato === 'dia-mes') return dia + ' de ' + MESES[mes];
    if (formato === 'anio') return String(anio);
    return dia + ' de ' + MESES[mes] + ' de ' + anio;
  }

  /** Texto del contador de una fecha próxima. */
  function textoCuenta(dias) {
    if (dias === null || typeof dias === 'undefined') return '';
    if (dias === 0) return '¡Es hoy!';
    if (dias === 1) return 'Mañana';
    if (dias > 1) return 'Faltan ' + dias + ' días';
    if (dias === -1) return 'Fue ayer';
    return 'Hace ' + Math.abs(dias) + ' días';
  }

  /** Rellena con ceros para el contador en vivo. */
  function dosDigitosTexto(numero) {
    return dosDigitos(numero);
  }

  var api = {
    MESES: MESES,
    MESES_CORTOS: MESES_CORTOS,
    parsearISO: parsearISO,
    aISO: aISO,
    hoyLocal: hoyLocal,
    descomponer: descomponer,
    proximaOcurrencia: proximaOcurrencia,
    diasHasta: diasHasta,
    aniosEntre: aniosEntre,
    aniosDesde: aniosDesde,
    formatearFecha: formatearFecha,
    textoCuenta: textoCuenta,
    dosDigitos: dosDigitosTexto
  };

  global.ParejaFechas = api;

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
