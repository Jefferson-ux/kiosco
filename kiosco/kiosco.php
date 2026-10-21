<?php require __DIR__ . "/../backend/auth.php"; ?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1">
  <title>Control de Asistencia</title>
  <meta name="theme-color" content="#0a0f1f">
  <meta name="description" content="Sistema de control de asistencia con reconocimiento facial">
  <link rel="manifest" href="manifest.json">
  <link rel="icon" href="icon-192.png">
  <link rel="apple-touch-icon" href="icon-192.png">
  <link rel="stylesheet" href="./../styles/global.css">

</head>
<body>

<style>
  body {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Centrado seguro: si el contenido es más alto que la pantalla, se puede hacer scroll */
  .stage { margin: auto; }

  /* ---------- Contenedor de enlaces (escritorio: debajo del reloj) ---------- */
  .form-link-container-desktop {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
    margin-top: 22px;
  }

  .form-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    font-size: .9rem;
    font-weight: 600;
    text-decoration: none;
    color: var(--ink);
    background: linear-gradient(160deg, var(--panel), #141a35);
    border: 1px solid var(--panel-edge);
    border-radius: 999px;
    transition: border-color .15s ease, box-shadow .15s ease, transform .1s ease;
  }

  .form-link svg { width: 16px; height: 16px; stroke: var(--accent); transition: transform .15s ease; }
  .form-link:hover { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(61, 107, 255, .2); }
  .form-link:hover svg { transform: translateX(3px); }
  .form-link:active { transform: scale(.97); }
  .form-link:focus-visible { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(61, 107, 255, .4); }

  /* ---------- Móvil (≤720px): enlaces debajo de la cámara ---------- */
  @media (max-width: 720px) {
    body { overflow-y: auto; }

    /* El panel del reloj "se disuelve" y sus hijos se reordenan en el grid */
    .clock-panel { display: contents; }

    .clock-time { order: -2; text-align: center; }
    .clock-date { order: -1; text-align: center; }
    /* .cam-panel queda en el orden 0: la cámara */
    .form-link-container-desktop { order: 1; align-items: center; margin-top: 0; }
    .brand { order: 2; text-align: center; padding-top: 4px; }
  }
</style>

<main class="stage">

  <!----------------- CÁMARA ------------------>
  <section class="cam-panel" aria-label="Captura facial">
    <div class="cam-view" id="camView">
      <div class="cam-placeholder" id="camPlaceholder" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="#8992b8" stroke-width="1.4">
          <path d="M4 8a2 2 0 0 1 2-2h1.2l.9-1.4A1.6 1.6 0 0 1 9.5 4h5a1.6 1.6 0 0 1 1.4.6l.9 1.4H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"/>
          <circle cx="12" cy="13" r="3.4"/>
        </svg>
      </div>
      <video id="video" playsinline autoplay muted></video>
      <canvas class="overlay" id="overlay"></canvas>
      <span class="cam-status" id="camStatus"><span class="dot" id="camDot"></span><span id="camStatusText">Buscando rostro…</span></span>
      <div class="cam-flash" id="flash"></div>

      <div class="result-card" id="resultCard" role="status" aria-live="polite">
        <img id="resultPhoto" alt="Foto capturada">
        <strong id="resultTitle">Asistencia registrada</strong>
        <p id="resultTime"></p>
      </div>
    </div>
    <button class="start-btn" id="startBtn" type="button">Presiona para iniciar</button>
  </section>


  <!----------------- Hora y Fecha ------------------>
  <section class="clock-panel" aria-label="Fecha y hora actual">
    <div class="clock-time" id="clockTime" aria-live="off">--:-- --</div>
    <div class="clock-date" id="clockDate"></div>
    <div class="form-link-container-desktop">
            <a class  ="form-link" href="code-qr.php">
              Registrar mediante QR
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
            </a>
            <a class="form-link" href="code.php">
              ¿Problemas con la cámara? Registrar manualmente
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
            </a>
    </div>

  <div class="brand">Control de Asistencia</div>
  </section>



</main>

<div id="liveRegion" class="sr-only" role="status" aria-live="polite"></div>


<script src="./../scripts/script.js"></script>
<script src="./../scripts/clock.js"></script>

</body>
</html>
