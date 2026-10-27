package pe.nosotros.album;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.webkit.WebViewAssetLoader;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.ArrayList;

/**
 * Contenedor nativo del álbum "Nosotros".
 *
 * La web completa (HTML + Tailwind + JavaScript) se empaqueta en assets/www y
 * se ejecuta en un WebView a pantalla completa. La clase nativa solo aporta lo
 * que la web no puede hacer sola:
 *
 *   - un origen https propio (WebViewAssetLoader) para que IndexedDB pueda
 *     guardar las fotos y los videos del álbum;
 *   - el selector de archivos del sistema para las subidas;
 *   - el botón atrás con cierre de visores y diálogos;
 *   - guardar una foto o un video en la carpeta Descargas del teléfono.
 */
public class MainActivity extends Activity {

    /** Dominio virtual que expone los assets como si fueran un sitio https. */
    private static final String DOMINIO = "appassets.androidplatform.net";
    private static final String URL_INICIO = "https://" + DOMINIO + "/assets/www/index.html";

    private static final long INTERVALO_SALIDA_MS = 2000L;
    private static final int PETICION_ARCHIVOS = 4101;

    /** Lo máximo que se acepta enviar por el puente JavaScript al guardar. */
    private static final long LIMITE_PUENTE_BYTES = 24L * 1024L * 1024L;

    private WebView visor;
    private WebViewAssetLoader cargador;
    private ValueCallback<Uri[]> seleccionPendiente;
    private long ultimoAtras = 0L;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle estadoGuardado) {
        super.onCreate(estadoGuardado);
        configurarVentana();

        cargador = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        visor = new WebView(this);
        visor.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        visor.setBackgroundColor(getColor(R.color.fondo_app));
        visor.setOverScrollMode(View.OVER_SCROLL_NEVER);

        configurarAjustes(visor.getSettings());

        // Puente mínimo: window.NosotrosAndroid.guardarArchivo(...)
        visor.addJavascriptInterface(new PuenteNativo(), "NosotrosAndroid");

        visor.setWebViewClient(new VisorCliente());
        visor.setWebChromeClient(new NavegadorCliente());

        setContentView(visor);

        if (estadoGuardado != null) {
            visor.restoreState(estadoGuardado);
        } else {
            visor.loadUrl(URL_INICIO);
        }
    }

    /** Barras del sistema con el rosa de la marca (el contenido web va debajo). */
    private void configurarVentana() {
        Window ventana = getWindow();
        ventana.setStatusBarColor(getColor(R.color.marca_700));
        ventana.setNavigationBarColor(getColor(R.color.marca_900));
    }

    private void configurarAjustes(WebSettings ajustes) {
        ajustes.setJavaScriptEnabled(true);
        ajustes.setDomStorageEnabled(true);
        ajustes.setDatabaseEnabled(true);
        ajustes.setAllowFileAccess(false);
        ajustes.setAllowContentAccess(true);
        ajustes.setLoadsImagesAutomatically(true);
        ajustes.setUseWideViewPort(true);
        ajustes.setLoadWithOverviewMode(true);
        ajustes.setSupportZoom(false);
        ajustes.setBuiltInZoomControls(false);
        ajustes.setDisplayZoomControls(false);
        ajustes.setSupportMultipleWindows(false);
        ajustes.setMediaPlaybackRequiresUserGesture(false);
        ajustes.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        ajustes.setCacheMode(WebSettings.LOAD_DEFAULT);
    }

    @Override
    protected void onSaveInstanceState(Bundle salida) {
        super.onSaveInstanceState(salida);
        if (visor != null) {
            visor.saveState(salida);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (visor != null) {
            visor.onResume();
        }
    }

    @Override
    protected void onPause() {
        if (visor != null) {
            visor.onPause();
        }
        super.onPause();
    }

    /**
     * Atrás: primero cierra el visor o el diálogo abierto dentro de la web y,
     * si no hay nada abierto, pide una segunda pulsación para salir.
     */
    @Override
    public void onBackPressed() {
        if (visor == null) {
            super.onBackPressed();
            return;
        }

        visor.evaluateJavascript(
                "(function(){" +
                "var visor=document.getElementById('visor');" +
                "if(visor&&!visor.classList.contains('hidden')){" +
                "var cerrar=document.getElementById('visor-cerrar');" +
                "if(cerrar){cerrar.click();return 'cerrado';}}" +
                "var confirmar=document.getElementById('confirmar');" +
                "if(confirmar&&!confirmar.classList.contains('hidden')){" +
                "var cancelar=document.getElementById('confirmar-cancelar');" +
                "if(cancelar){cancelar.click();return 'cerrado';}}" +
                "var modal=document.querySelector('.modal:not(.hidden)');" +
                "if(modal){var salir=modal.querySelector('[data-cerrar]');" +
                "if(salir){salir.click();return 'cerrado';}}" +
                "return 'nada';})()",
                new ValueCallback<String>() {
                    @Override
                    public void onReceiveValue(String valor) {
                        if (valor == null || valor.indexOf("cerrado") == -1) {
                            pedirSalida();
                        }
                    }
                }
        );
    }

    private void pedirSalida() {
        long ahora = System.currentTimeMillis();
        if (ahora - ultimoAtras < INTERVALO_SALIDA_MS) {
            super.onBackPressed();
            return;
        }
        ultimoAtras = ahora;
        Toast.makeText(this, R.string.pulsa_para_salir, Toast.LENGTH_SHORT).show();
    }

    @Override
    protected void onActivityResult(int codigo, int resultado, Intent datos) {
        if (codigo != PETICION_ARCHIVOS) {
            super.onActivityResult(codigo, resultado, datos);
            return;
        }

        if (seleccionPendiente == null) {
            return;
        }

        Uri[] elegidos = null;
        if (resultado == RESULT_OK && datos != null) {
            if (datos.getClipData() != null) {
                int cuantos = datos.getClipData().getItemCount();
                elegidos = new Uri[cuantos];
                for (int i = 0; i < cuantos; i++) {
                    elegidos[i] = datos.getClipData().getItemAt(i).getUri();
                }
            } else if (datos.getData() != null) {
                elegidos = new Uri[]{ datos.getData() };
            }
        }

        seleccionPendiente.onReceiveValue(elegidos);
        seleccionPendiente = null;
    }

    @Override
    protected void onDestroy() {
        if (visor != null) {
            visor.loadUrl("about:blank");
            visor.removeJavascriptInterface("NosotrosAndroid");
            visor.destroy();
            visor = null;
        }
        super.onDestroy();
    }

    /* --------------------------- Puente con la web --------------------------- */

    private void aviso(final String mensaje) {
        if (mensaje == null) {
            return;
        }
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Toast.makeText(MainActivity.this, mensaje, Toast.LENGTH_LONG).show();
            }
        });
    }

    /** Guarda bytes en Descargas y devuelve el mensaje que verá la usuaria. */
    private String guardarEnDescargas(byte[] datos, String nombre, String tipo) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues valores = new ContentValues();
                valores.put(MediaStore.Downloads.DISPLAY_NAME, nombre);
                valores.put(MediaStore.Downloads.MIME_TYPE, tipo);
                valores.put(MediaStore.Downloads.RELATIVE_PATH,
                        Environment.DIRECTORY_DOWNLOADS + "/Nosotros");
                valores.put(MediaStore.Downloads.IS_PENDING, 1);

                Uri destino = getContentResolver()
                        .insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, valores);
                if (destino == null) {
                    return getString(R.string.no_se_pudo_guardar);
                }

                OutputStream salida = null;
                try {
                    salida = getContentResolver().openOutputStream(destino);
                    if (salida == null) {
                        return getString(R.string.no_se_pudo_guardar);
                    }
                    salida.write(datos);
                    salida.flush();
                } finally {
                    if (salida != null) {
                        try {
                            salida.close();
                        } catch (Exception ignorado) {
                            // la transacción ya se cerró
                        }
                    }
                }

                valores.clear();
                valores.put(MediaStore.Downloads.IS_PENDING, 0);
                getContentResolver().update(destino, valores, null, null);

                return getString(R.string.guardado_en_descargas, nombre);
            }

            // Android 8 y 9: carpeta privada de la app, sin permisos de almacenamiento.
            File carpeta = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
            if (carpeta == null) {
                return getString(R.string.no_se_pudo_guardar);
            }
            if (!carpeta.exists() && !carpeta.mkdirs()) {
                return getString(R.string.no_se_pudo_guardar);
            }

            File archivo = new File(carpeta, nombre);
            FileOutputStream salida = new FileOutputStream(archivo);
            try {
                salida.write(datos);
                salida.flush();
            } finally {
                try {
                    salida.close();
                } catch (Exception ignorado) {
                    // nada que hacer
                }
            }

            return getString(R.string.guardado_en_carpeta, archivo.getAbsolutePath());
        } catch (Exception error) {
            return getString(R.string.no_se_pudo_guardar);
        }
    }

    /** Métodos que la web puede llamar: window.NosotrosAndroid */
    private class PuenteNativo {

        /**
         * Recibe el archivo en base64 y lo deja en Descargas/Nosotros.
         * Se usa solo cuando la web detecta que corre dentro del APK.
         */
        @JavascriptInterface
        public void guardarArchivo(String base64, String nombre, String tipo) {
            final String limpio = (nombre == null || nombre.trim().isEmpty())
                    ? "recuerdo"
                    : nombre.trim();
            final String mime = (tipo == null || tipo.trim().isEmpty())
                    ? "application/octet-stream"
                    : tipo.trim();

            byte[] datos;
            try {
                datos = Base64.decode(base64 == null ? "" : base64, Base64.DEFAULT);
            } catch (IllegalArgumentException error) {
                datos = new byte[0];
            }

            if (datos.length == 0) {
                aviso(getString(R.string.no_se_pudo_guardar));
                return;
            }
            if (datos.length > LIMITE_PUENTE_BYTES) {
                aviso(getString(R.string.archivo_muy_grande));
                return;
            }

            final byte[] contenido = datos;
            new Thread(new Runnable() {
                @Override
                public void run() {
                    aviso(guardarEnDescargas(contenido, limpio, mime));
                }
            }).start();
        }
    }

    /* ----------------------------- Clientes web ----------------------------- */

    /** Sirve los assets como un sitio https y manda fuera los enlaces externos. */
    private class VisorCliente extends WebViewClient {

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView vista, WebResourceRequest solicitud) {
            if (cargador == null || solicitud == null) {
                return null;
            }
            return cargador.shouldInterceptRequest(solicitud.getUrl());
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView vista, WebResourceRequest solicitud) {
            Uri destino = solicitud.getUrl();
            String esquema = destino.getScheme() == null ? "" : destino.getScheme();

            if (DOMINIO.equals(destino.getHost())) {
                return false;
            }
            if ("file".equals(esquema) || "about".equals(esquema) || "data".equals(esquema)) {
                return false;
            }
            if ("blob".equals(esquema)) {
                return false;
            }

            try {
                startActivity(new Intent(Intent.ACTION_VIEW, destino));
            } catch (Exception error) {
                aviso(getString(R.string.no_se_pudo_abrir));
            }
            return true;
        }
    }

    /** Habilita el selector de archivos del sistema para las subidas. */
    private class NavegadorCliente extends WebChromeClient {

        @Override
        public boolean onShowFileChooser(WebView vista,
                                         ValueCallback<Uri[]> resultado,
                                         FileChooserParams parametros) {
            if (seleccionPendiente != null) {
                seleccionPendiente.onReceiveValue(null);
                seleccionPendiente = null;
            }
            seleccionPendiente = resultado;

            Intent intento = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            intento.addCategory(Intent.CATEGORY_OPENABLE);
            intento.setType("*/*");
            intento.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
            intento.putExtra(Intent.EXTRA_LOCAL_ONLY, true);

            ArrayList<String> tipos = new ArrayList<>();
            String[] aceptados = parametros == null ? null : parametros.getAcceptTypes();
            if (aceptados != null) {
                for (String aceptado : aceptados) {
                    String limpio = aceptado == null ? "" : aceptado.trim();
                    if (!limpio.isEmpty() && !tipos.contains(limpio)) {
                        tipos.add(limpio);
                    }
                }
            }
            if (!tipos.isEmpty()) {
                intento.putExtra(Intent.EXTRA_MIME_TYPES, tipos.toArray(new String[0]));
            }

            try {
                startActivityForResult(
                        Intent.createChooser(intento, getString(R.string.elegir_archivos)),
                        PETICION_ARCHIVOS);
            } catch (Exception error) {
                seleccionPendiente = null;
                aviso(getString(R.string.no_hay_selector));
                return false;
            }
            return true;
        }
    }
}
