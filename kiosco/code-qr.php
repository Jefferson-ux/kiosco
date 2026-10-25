<?php require __DIR__ . "/../backend/auth.php"; ?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Marcación por QR</title>
    <link rel="stylesheet" href="./../styles/global.css">
      <link rel="stylesheet" href="./../styles/qr.css">
</head>
<body>
  <main class="stage">

    <!-- Lector QR -->
    <section class="qr-panel" aria-label="Lector de código QR">
      <div class="qr-view">
        <div class="qr-placeholder" id="placeholder" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="#8992b8" stroke-width="1.4" stroke-linejoin="round">
            <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z"/>
            <path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h1"/>
          </svg>
        </div>
        <video id="video" playsinline muted></video>
        <div class="qr-frame" id="frame"></div>
        <span class="qr-status" id="status" hidden>Apunta al código QR…</span>
      </div>

      <div class="qr-options">
        <label for="type_select">Tipo de marcación</label>
        <select id="type_select">
          <option value="ENTRY">Entrada</option>
          <option value="BREAK_START">Inicio de descanso</option>
          <option value="BREAK_END">Fin de descanso</option>
          <option value="EXIT">Salida</option>
        </select>
      </div>

      <button class="qr-btn" id="toggleBtn" type="button">Iniciar escáner</button>

      <div class="qr-result" id="result" role="status" aria-live="polite">
        <small>Código del empleado</small>
        <output id="resultText"></output>
      </div>
    </section>

    <!-- Reloj + respuesta -->
    <section class="clock-panel" aria-label="Fecha y hora actual">
      <div class="clock-time" id="clockTime" aria-live="off">--:-- --</div>
      <div class="clock-date" id="clockDate">&nbsp;</div>

      <div id="response-container" aria-live="polite"></div><br><br>
      <a class="form-link" href="code.php">
        ¿Problemas con la cámara? Registrar manualmente
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6"/>
        </svg>
      </a>

      <div class="brand">Control de Asistencia</div>
    </section>
  </main>

  <canvas id="canvas"></canvas>

  <template id="response-template">
    <article class="response">
      <p class="response_message"></p>
      <div class="response_details">
        <div class="response_employee"><strong>Empleado</strong> <span></span></div>
        <div class="response_datetime"><strong>Hora marcada</strong> <span></span></div>
        <div class="response_punctuality"><strong>Puntualidad</strong> <span></span></div>
        <div class="response_late"><strong>Minutos tarde</strong> <span></span></div>
        <div class="response_next_action"><strong>Siguiente Acción</strong> <span></span></div>
      </div>
    </article>
  </template>

  <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js"></script>
  <script src="./../scripts/qr.js"></script>
  <script src="./../scripts/clock.js"></script>
</body>
</html>