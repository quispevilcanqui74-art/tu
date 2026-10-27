# Reglas de ProGuard/R8.
# La compilación de release no ofusca (minifyEnabled false), pero estas reglas
# protegen el puente JavaScript si algún día se activa la minificación.
-keepattributes JavascriptInterface
-keepclassmembers class pe.nosotros.album.MainActivity$PuenteNativo {
    public *;
}
-keep class android.webkit.JavascriptInterface
