/**
 * Nosotros · Confeti (sin dependencias)
 * -------------------------------------------------------------
 * Un chorro de papelitos en canvas para los días especiales.
 * Se pinta sobre toda la pantalla y se limpia solo.
 *
 * Uso:
 *   Confeti.lanzar();               // cantidad por defecto
 *   Confeti.lanzar({ cantidad: 90 });
 */
(function (global) {
  'use strict';

  var COLORES = ['#e11d48', '#f43f5e', '#fb7185', '#fda4b4', '#c3903f', '#f1dcb2', '#ffffff'];
  var lienzo = null;
  var contexto = null;
  var particulas = [];
  var animacion = null;
  var escala = 1;
  var altoActual = 0;

  function movimientoReducido() {
    return global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function preparar() {
    if (lienzo) return true;
    lienzo = document.getElementById('confeti');
    if (!lienzo) return false;
    contexto = lienzo.getContext('2d');
    return !!contexto;
  }

  function ajustarLienzo() {
    if (!lienzo) return;
    var ancho = global.innerWidth;
    var alto = global.innerHeight;
    escala = Math.min(global.devicePixelRatio || 1, 2);
    altoActual = alto;
    lienzo.width = Math.floor(ancho * escala);
    lienzo.height = Math.floor(alto * escala);
    lienzo.style.width = ancho + 'px';
    lienzo.style.height = alto + 'px';
    contexto.setTransform(escala, 0, 0, escala, 0, 0);
  }

  function alAzar(minimo, maximo) {
    return minimo + Math.random() * (maximo - minimo);
  }

  function crearParticula(ancho, alto, indice, total) {
    var desdeIzquierda = indice % 2 === 0;
    var esChorro = indice < total * 0.75;

    if (esChorro) {
      return {
        x: desdeIzquierda ? alAzar(-20, ancho * 0.12) : alAzar(ancho * 0.88, ancho + 20),
        y: alto + alAzar(0, 40),
        vx: (desdeIzquierda ? 1 : -1) * alAzar(2.5, 7),
        vy: -alAzar(10, 18),
        ancho: alAzar(5, 10),
        alto: alAzar(8, 16),
        giro: alAzar(0, Math.PI * 2),
        velocidadGiro: alAzar(-0.18, 0.18),
        color: COLORES[Math.floor(Math.random() * COLORES.length)],
        forma: Math.random() > 0.72 ? 'circulo' : 'rect'
      };
    }

    return {
      x: alAzar(0, ancho),
      y: alAzar(-alto * 0.4, -10),
      vx: alAzar(-1.2, 1.2),
      vy: alAzar(2, 5),
      ancho: alAzar(4, 9),
      alto: alAzar(7, 14),
      giro: alAzar(0, Math.PI * 2),
      velocidadGiro: alAzar(-0.12, 0.12),
      color: COLORES[Math.floor(Math.random() * COLORES.length)],
      forma: Math.random() > 0.7 ? 'circulo' : 'rect'
    };
  }

  function pintar() {
    var ancho = global.innerWidth;
    contexto.clearRect(0, 0, ancho, altoActual);

    var vivas = 0;
    for (var i = 0; i < particulas.length; i++) {
      var p = particulas[i];
      p.vy += 0.32;
      p.vx *= 0.995;
      p.x += p.vx;
      p.y += p.vy;
      p.giro += p.velocidadGiro;

      if (p.y - p.alto > altoActual + 40) continue;
      vivas++;

      contexto.save();
      contexto.translate(p.x, p.y);
      contexto.rotate(p.giro);
      contexto.fillStyle = p.color;
      contexto.globalAlpha = 0.9;

      if (p.forma === 'circulo') {
        contexto.beginPath();
        contexto.arc(0, 0, p.ancho / 2, 0, Math.PI * 2);
        contexto.fill();
      } else {
        contexto.fillRect(-p.ancho / 2, -p.alto / 2, p.ancho, p.alto);
      }
      contexto.restore();
    }

    if (vivas === 0) {
      terminar();
      return;
    }

    particulas = particulas.filter(function (p) {
      return p.y - p.alto <= altoActual + 40;
    });

    animacion = global.requestAnimationFrame(pintar);
  }

  function terminar() {
    if (animacion) {
      global.cancelAnimationFrame(animacion);
      animacion = null;
    }
    particulas = [];
    if (lienzo) {
      contexto.clearRect(0, 0, global.innerWidth, altoActual);
      lienzo.hidden = true;
      lienzo.classList.add('hidden');
    }
    global.removeEventListener('resize', ajustarLienzo);
  }

  /**
   * @param {{cantidad?: number}} [opciones]
   */
  function lanzar(opciones) {
    if (movimientoReducido() || !preparar()) return;

    var cantidad = (opciones && opciones.cantidad) || 150;
    var ancho = global.innerWidth;

    if (animacion) {
      global.cancelAnimationFrame(animacion);
      animacion = null;
    }

    ajustarLienzo();
    lienzo.hidden = false;
    lienzo.classList.remove('hidden');

    particulas = [];
    for (var i = 0; i < cantidad; i++) {
      particulas.push(crearParticula(ancho, altoActual, i, cantidad));
    }

    global.removeEventListener('resize', ajustarLienzo);
    global.addEventListener('resize', ajustarLienzo);

    animacion = global.requestAnimationFrame(pintar);
  }

  global.Confeti = {
    lanzar: lanzar
  };
})(window);
