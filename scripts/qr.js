/* =========================================================
   CONFIGURACIÓN: lo único que normalmente debes editar
   ========================================================= */
const CONFIG = {
  // ----- API -----
  API_URL: "http://127.0.0.1:8000/api/v1/attendance/mark",

  // Token de acceso (sin la palabra "Bearer"). Cámbialo cuando expire.
  TOKEN: localStorage.getItem('bearer token'),

  // Zona horaria e idioma para mostrar fechas
  TIMEZONE: "America/Lima",
  LOCALE: "es-PE",

  // ----- Lector QR -----
  // Cámara: "environment" = trasera, "user" = frontal
  FACING_MODE: "environment",

  // Cada cuántos ms se analiza un frame (más alto = menos consumo)
  SCAN_INTERVAL: 150,

  // Ancho máximo al que se reduce el frame para analizarlo con jsQR
  MAX_SCAN_WIDTH: 720,

  // Tras leer un QR, detener la cámara automáticamente
  STOP_AFTER_SCAN: true,

  // Saca el código de empleado del contenido del QR (tal cual, sin formato fijo).
  // Devuelve null si el QR está vacío.
  extractCode: (text) => text.trim() || null,

  // Validación opcional del código. Ejemplo: /^[A-Za-z0-9-]+$/
  VALIDATE: null,

  // ----- Textos de la interfaz -----
  TEXTS: {
    start: "Iniciar escáner",
    stop: "Detener",
    scanAgain: "Escanear de nuevo",
    searching: "Apunta al código QR…",
    starting: "Abriendo cámara…",
    loading: "Registrando…",
    noCamera: "No se pudo acceder a la cámara. Revisa los permisos del navegador.",
    noLib: "No se cargó el lector de QR. Revisa tu conexión y recarga con Ctrl+F5.",
    invalid: "El QR no tiene un código válido. Intenta con otro.",
    networkError: "No se pudo conectar con el servidor. Inténtalo de nuevo.",
    internalError: "Error interno de la página. Revisa la consola (F12).",
    genericError: (status) =>
      `Error ${status}: no se pudo registrar la marcación.`,
    conditionLabel: "Condición",
    completed: "Completado",
    incomplete: "Incompleto",
  },

  // Campo de "attendance" que contiene la hora según el tipo de marcación
  TIME_FIELD: {
    ENTRY: "check_in_at",
    BREAK_START: "break_start_at",
    BREAK_END: "break_end_at",
    EXIT: "check_out_at",
  },

  // Etiquetas y colores de puntualidad (estados que devuelve la API)
  PUNCTUALITY: {
    present: { label: "A tiempo", color: "#2fce8f" },
    on_time: { label: "A tiempo", color: "#2fce8f" },
    late: { label: "Tarde", color: "#ffb347" },
  },

  // Condición de la salida (EXIT): viene en punctuality.status
  getCondition: (attendance) => attendance?.punctuality?.status,
  INCOMPLETE_VALUE: "incomplete",

  // Qué hacer al leer un código: registrar la marcación en la API
  onScan: (code) => registerCode(code),
};

/* =========================================================
   ELEMENTOS DEL DOM
   ========================================================= */
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const placeholder = document.getElementById("placeholder");
const frame = document.getElementById("frame");
const statusEl = document.getElementById("status");
const toggleBtn = document.getElementById("toggleBtn");
const resultBox = document.getElementById("result");
const resultText = document.getElementById("resultText");
const typeSelect = document.getElementById("type_select");
const container = document.getElementById("response-container");
const template = document.getElementById("response-template");

let stream = null;
let scanning = false;
let timer = null;

// El lector nativo del navegador es más preciso; jsQR es el respaldo
const nativeDetector =
  "BarcodeDetector" in window
    ? new BarcodeDetector({ formats: ["qr_code"] })
    : null;

/* =========================================================
   CÁMARA
   ========================================================= */
async function startScanner() {
  if (!nativeDetector && typeof jsQR === "undefined") {
    alert(CONFIG.TEXTS.noLib);
    return;
  }

  toggleBtn.disabled = true;
  toggleBtn.textContent = CONFIG.TEXTS.starting;
  resultBox.classList.remove("show");
  container.replaceChildren();

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: CONFIG.FACING_MODE,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
  } catch (err) {
    console.error(err);
    toggleBtn.disabled = false;
    toggleBtn.textContent = CONFIG.TEXTS.start;
    alert(CONFIG.TEXTS.noCamera);
    return;
  }

  video.srcObject = stream;
  await video.play();

  placeholder.style.display = "none";
  video.style.display = "block";
  frame.style.display = "block";
  frame.classList.remove("found");
  statusEl.hidden = false;
  statusEl.textContent = CONFIG.TEXTS.searching;

  toggleBtn.disabled = false;
  toggleBtn.textContent = CONFIG.TEXTS.stop;

  scanning = true;
  scanLoop();
}

function stopScanner() {
  scanning = false;
  clearTimeout(timer);

  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  video.srcObject = null;
  video.style.display = "none";
  frame.style.display = "none";
  statusEl.hidden = true;
  placeholder.style.display = "block";
}

/* =========================================================
   LECTURA DEL QR
   ========================================================= */
// Devuelve el texto del QR o null
async function readFrame() {
  // 1) Lector nativo (si el navegador lo trae)
  if (nativeDetector) {
    try {
      const codes = await nativeDetector.detect(video);
      if (codes.length) return codes[0].rawValue;
    } catch (err) {
      console.warn("BarcodeDetector falló, uso jsQR:", err);
    }
  }

  // 2) jsQR sobre una copia reducida del frame
  if (typeof jsQR === "undefined") return null;

  const scale = Math.min(1, CONFIG.MAX_SCAN_WIDTH / video.videoWidth);
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(img.data, img.width, img.height, {
    inversionAttempts: "attemptBoth", // lee también QR claros sobre fondo oscuro
  });
  return code?.data ?? null;
}

async function scanLoop() {
  if (!scanning) return;

  if (video.readyState >= 2 && video.videoWidth) {
    try {
      const text = (await readFrame())?.trim();
      if (text) {
        handleResult(text);
        if (!scanning) return;
      }
    } catch (err) {
      console.error("Error al leer el frame:", err);
    }
  }

  timer = setTimeout(scanLoop, CONFIG.SCAN_INTERVAL);
}

function handleResult(rawText) {
  const code = CONFIG.extractCode(rawText);

  if (!code || (CONFIG.VALIDATE && !CONFIG.VALIDATE.test(code))) {
    statusEl.textContent = CONFIG.TEXTS.invalid;
    return; // sigue escaneando
  }

  frame.classList.add("found");
  resultText.textContent = code;
  resultBox.classList.add("show");

  if (navigator.vibrate) navigator.vibrate(80);

  // Primero se detiene la cámara; después se registra
  // (así el botón no se pisa con el texto "Registrando…")
  if (CONFIG.STOP_AFTER_SCAN) {
    stopScanner();
    toggleBtn.textContent = CONFIG.TEXTS.scanAgain;
  }

  CONFIG.onScan(code);
}

/* =========================================================
   UTILIDADES
   ========================================================= */
function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(CONFIG.LOCALE, {
    timeZone: CONFIG.TIMEZONE,
    dateStyle: "short",
    timeStyle: "medium",
  });
}

/* =========================================================
   MOSTRAR RESPUESTA
   ========================================================= */
function showResponse({ ok, message, data, type }) {
  const node = template.content.cloneNode(true);
  node.querySelector(".response").classList.add(ok ? "success" : "error");
  node.querySelector(".response_message").textContent = message;

  const details = node.querySelector(".response_details");

  if (ok && data) {
    const { employee, attendance } = data;
    const punctuality = attendance.punctuality ?? {};
    const punctRow = node.querySelector(".response_punctuality");
    const lateRow = node.querySelector(".response_late");
    const label = punctRow.querySelector("strong");
    const value = punctRow.querySelector("span");

    node.querySelector(".response_employee span").textContent =
      `${employee.full_name} (${employee.employee_code})`;
    node.querySelector(".response_datetime span").textContent =
      formatDateTime(attendance[CONFIG.TIME_FIELD[type]]);

    if (type === "ENTRY") {
      // Entrada: puntualidad y minutos tarde
      const info = CONFIG.PUNCTUALITY[punctuality.status];
      value.textContent = info?.label ?? punctuality.status ?? "—";
      if (info) value.style.color = info.color;

      if (punctuality.status === "late") {
        lateRow.querySelector("span").textContent =
          `${punctuality.late_minutes} min`;
      } else {
        lateRow.remove();
      }
    } else if (type === "EXIT") {
      // Salida: condición (completado / incompleto)
      const incomplete =
        CONFIG.getCondition(attendance) === CONFIG.INCOMPLETE_VALUE;
      label.textContent = CONFIG.TEXTS.conditionLabel;
      value.textContent = incomplete
        ? CONFIG.TEXTS.incomplete
        : CONFIG.TEXTS.completed;
      value.style.color = incomplete ? "#ffb347" : "#2fce8f";
      lateRow.remove();
    } else {
      // BREAK_START y BREAK_END: sin puntualidad ni minutos tarde
      punctRow.remove();
      lateRow.remove();
    }
  } else {
    details.remove();
  }

  container.replaceChildren(node);
}

/* =========================================================
   ENVÍO A LA API
   ========================================================= */
// request_id: se reutiliza si el mismo código/tipo falló por red (reintento seguro)
let pending = null; // { code, type, id }

function requestIdFor(code, type) {
  if (!(pending && pending.code === code && pending.type === type)) {
    pending = { code, type, id: uuid() };
  }
  return pending.id;
}

// Lanza Error("NETWORK") solo si falla la conexión
async function markAttendance(employeeCode, type) {
  let res;
  try {
    res = await fetch(CONFIG.API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${CONFIG.TOKEN}`,
      },
      body: JSON.stringify({
        employee_code: employeeCode,
        type,
        request_id: requestIdFor(employeeCode, type),
      }),
    });
  } catch {
    throw new Error("NETWORK");
  }

  let body = null;
  try {
    body = await res.json();
  } catch {
    /* respuesta sin JSON */
  }
  return { res, body };
}

// Registra la marcación del código leído y muestra el resultado
async function registerCode(code) {
  const type = typeSelect.value;

  toggleBtn.disabled = true;
  toggleBtn.textContent = CONFIG.TEXTS.loading;

  try {
    const { res, body } = await markAttendance(code, type);
    pending = null; // el servidor respondió: el request_id ya cumplió su función

    if (res.ok && body?.success) {
      showResponse({ ok: true, message: body.message, data: body.data, type });
    } else {
      showResponse({
        ok: false,
        message: body?.message ?? CONFIG.TEXTS.genericError(res.status),
      });
    }
  } catch (err) {
    console.error(err);
    showResponse({
      ok: false,
      message:
        err.message === "NETWORK"
          ? CONFIG.TEXTS.networkError
          : CONFIG.TEXTS.internalError,
    });
  } finally {
    toggleBtn.disabled = false;
    toggleBtn.textContent = CONFIG.TEXTS.scanAgain;
  }
}

/* =========================================================
   EVENTOS
   ========================================================= */
toggleBtn.addEventListener("click", () => {
  if (scanning) {
    stopScanner();
    toggleBtn.textContent = CONFIG.TEXTS.start;
  } else {
    startScanner();
  }
});

// Apaga la cámara si el usuario cambia de pestaña o cierra la página
document.addEventListener("visibilitychange", () => {
  if (document.hidden && scanning) {
    stopScanner();
    toggleBtn.textContent = CONFIG.TEXTS.start;
  }
});
