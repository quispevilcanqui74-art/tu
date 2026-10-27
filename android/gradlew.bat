@echo off
rem ---------------------------------------------------------------------------
rem Lanzador de Gradle para Windows (la misma idea que gradlew).
rem Usa el Gradle instalado si existe y, si no, descarga la version 8.7.
rem
rem Uso:  gradlew.bat assembleDebug
rem ---------------------------------------------------------------------------
setlocal

set VERSION=8.7
if "%GRADLE_USER_HOME%"=="" (
    set CACHE=%USERPROFILE%\.gradle
) else (
    set CACHE=%GRADLE_USER_HOME%
)
set CACHE=%CACHE%\wrapper\dists\nosotros-%VERSION%
set GRADLE_BIN=%CACHE%\gradle-%VERSION%\bin\gradle.bat
set ZIP=%CACHE%\gradle-%VERSION%-bin.zip

if exist "%GRADLE_BIN%" goto ejecutar

where gradle >nul 2>nul
if %ERRORLEVEL%==0 (
    echo Usando el Gradle instalado en el sistema.
    call gradle %*
    exit /b %ERRORLEVEL%
)

echo Descargando Gradle %VERSION% ^(solo la primera vez^)...
if not exist "%CACHE%" mkdir "%CACHE%"

powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://services.gradle.org/distributions/gradle-%VERSION%-bin.zip' -OutFile '%ZIP%'"
if errorlevel 1 (
    echo ERROR: no se pudo descargar Gradle.
    exit /b 1
)

powershell -NoProfile -Command "Expand-Archive -Path '%ZIP%' -DestinationPath '%CACHE%' -Force"
if errorlevel 1 (
    echo ERROR: no se pudo descomprimir Gradle.
    exit /b 1
)

del "%ZIP%"

:ejecutar
call "%GRADLE_BIN%" %*
exit /b %ERRORLEVEL%
