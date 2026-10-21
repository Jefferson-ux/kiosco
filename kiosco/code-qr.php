<?php require __DIR__ . "/../backend/auth.php"; ?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Marcación por QR</title>
  <style>
    :root {
      --bg-top: #0a0e21;
      --bg-bottom: #141b3d;
      --panel: #1c2544;
      --panel-edge: #2a3562;
      --ink: #f4f6fb;
      --ink-dim: #8992b8;
      --accent: #3d6bff;
      --accent-dim: #2c4fce;
      --ok: #2fce8f;
      --warn: #ff6767;
      --radius: 22px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: clamp(16px, 4vw, 40px);
      font-family: 'Segoe UI', system-ui, -apple-system, Roboto, sans-serif;
      color: var(--ink);
      background: radial-gradient(circle at 20% 15%, #1a2350 0%, var(--bg-top) 45%, var(--bg-bottom) 100%);
    }

    /* ---------- Layout ---------- */
    .stage {
      width: 100%;
      max-width: 920px;
      margin: auto;
      display: grid;
      grid-template-columns: 1.05fr 1fr;
      gap: clamp(14px, 2.5vw, 26px);
      align-items: start;
    }
    @media (max-width: 720px) {
      .stage { grid-template-columns: 1fr; }
    }

    /* ---------- Panel QR ---------- */
    .qr-panel {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: linear-gradient(160deg, var(--panel), #141a35);
      border: 1px solid var(--panel-edge);
      border-radius: var(--radius);
    }

    .qr-view {
      position: relative;
      aspect-ratio: 1;
      display: grid;
      place-items: center;
      background: radial-gradient(circle at center, #232c53 0%, #161c38 75%);
    }

    video {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: none;
    }

    canvas { display: none; }

    .qr-placeholder { width: 88px; height: 88px; opacity: .55; }

    .qr-frame {
      position: absolute;
      inset: 18%;
      border: 3px solid rgba(255, 255, 255, .85);
      border-radius: 18px;
      box-shadow: 0 0 0 999px rgba(10, 14, 33, .45);
      display: none;
      pointer-events: none;
    }
    .qr-frame.found { border-color: var(--ok); }

    .qr-status {
      position: absolute;
      top: 14px;
      left: 14px;
      padding: 6px 12px;
      font-size: .75rem;
      color: var(--ink-dim);
      background: rgba(10, 14, 33, .6);
      border-radius: 999px;
    }

    /* Tipo de marcación */
    .qr-options {
      padding: 14px 18px;
      border-top: 1px solid var(--panel-edge);
    }
    .qr-options label {
      display: block;
      margin-bottom: 8px;
      font-size: .75rem;
      letter-spacing: .06em;
      text-transform: uppercase;
      color: var(--ink-dim);
    }
    .qr-options select {
      width: 100%;
      padding: 12px 16px;
      font: inherit;
      font-size: 1rem;
      color: var(--ink);
      background: rgba(10, 14, 33, .55) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none' stroke='%238992b8' stroke-width='2'%3E%3Cpath d='M1 1l5 5 5-5'/%3E%3C/svg%3E") no-repeat right 16px center;
      border: 1px solid var(--panel-edge);
      border-radius: 14px;
      appearance: none;
      -webkit-appearance: none;
    }
    .qr-options select:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(61, 107, 255, .25);
    }
    .qr-options select option { background: var(--panel); color: var(--ink); }

    .qr-btn {
      border: none;
      width: 100%;
      padding: 18px 20px;
      font: inherit;
      font-size: 1rem;
      font-weight: 600;
      color: #fff;
      background: linear-gradient(135deg, var(--accent), var(--accent-dim));
      cursor: pointer;
      transition: filter .15s ease;
    }
    .qr-btn:hover { filter: brightness(1.08); }
    .qr-btn:disabled { filter: grayscale(.4) brightness(.75); cursor: not-allowed; }

    /* Código leído */
    .qr-result {
      display: none;
      padding: 18px 20px;
      border-top: 1px solid var(--panel-edge);
    }
    .qr-result.show { display: block; }
    .qr-result small {
      display: block;
      margin-bottom: 6px;
      font-size: .75rem;
      letter-spacing: .06em;
      text-transform: uppercase;
      color: var(--ink-dim);
    }
    .qr-result output {
      display: block;
      word-break: break-all;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--ok);
    }

    /* ---------- Panel reloj ---------- */
    .clock-panel {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 10px clamp(6px, 3vw, 18px);
      text-align: right;
    }
    @media (max-width: 720px) {
      .clock-panel { text-align: center; order: -1; padding: 4px 8px 0; }
    }

    .clock-time {
      font-size: clamp(2rem, 6vw, 3.4rem);
      font-weight: 700;
      line-height: 1;
      letter-spacing: -.01em;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
    .clock-date {
      margin-top: 10px;
      font-size: clamp(.9rem, 2vw, 1.05rem);
      color: var(--ink-dim);
    }
    .brand {
      padding-top: 28px;
      font-size: .78rem;
      color: var(--ink-dim);
      letter-spacing: .04em;
    }

    /* ---------- Respuesta de la API ---------- */
    #response-container { margin-top: 22px; text-align: left; }

    .response {
      padding: 18px 20px;
      background: linear-gradient(160deg, var(--panel), #141a35);
      border: 1px solid var(--panel-edge);
      border-left: 5px solid var(--ink-dim);
      border-radius: 16px;
      animation: aparecer .25s ease-out;
    }
    .response.success { border-left-color: var(--ok); }
    .response.error   { border-left-color: var(--warn); }

    .response_message { font-weight: 600; line-height: 1.35; }
    .response.success .response_message { color: var(--ok); }
    .response.error .response_message   { color: var(--warn); }

    .response_details {
      display: grid;
      gap: 10px;
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid var(--panel-edge);
      font-size: .95rem;
    }
    .response_details > div { display: flex; justify-content: space-between; gap: 12px; }
    .response_details strong { font-weight: 500; color: var(--ink-dim); }
    .response_details span { font-weight: 600; text-align: right; }
    .response_late span { color: #ffb347; }

    @keyframes aparecer {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: none; }
    }
  </style>
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

      <div id="response-container" aria-live="polite"></div>

      <div class="brand">MARCACIÓN DE ASISTENCIA</div>
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
      </div>
    </article>
  </template>

  <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js"></script>
  <script src="./../scripts/qr.js"></script>
  <script src="./../scripts/clock.js"></script>
</body>
</html>