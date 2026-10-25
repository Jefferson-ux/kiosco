/* =========================================================
    CONFIGURACIÓN: lo único que normalmente debes editar
    ========================================================= */
const CONFIG = {
  // ----- API (Apunta a tu archivo PHP intermediario) -----
  API_URL: "/backend/mark_attendance.php",

  // Zona horaria e idioma para mostrar fechas
  TIMEZONE: "America/Lima",
  LOCALE: "es-PE",

  // ----- Lector QR -----
  FACING_MODE: "environment",
  SCAN_INTERVAL: 30,
  MAX_SCAN_WIDTH: 720,
  STOP_AFTER_SCAN: true,

  extractCode: (text) => text.trim() || null,
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

  TIME_FIELD: {
    ENTRY: "check_in_at",
    BREAK_START: "break_start_at",
    BREAK_END: "break_end_at",
    EXIT: "check_out_at",
  },

  PUNCTUALITY: {
    present: { label: "A tiempo", color: "#2fce8f" },
    on_time: { label: "A tiempo", color: "#2fce8f" },
    late: { label: "Tarde", color: "#ffb347" },
  },

  getCondition: (attendance) => attendance?.punctuality?.status,
  INCOMPLETE_VALUE: "incomplete",

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
async function readFrame() {
  if (nativeDetector) {
    try {
      const codes = await nativeDetector.detect(video);
      if (codes.length) return codes[0].rawValue;
    } catch (err) {
      console.warn("BarcodeDetector falló, uso jsQR:", err);
    }
  }

  if (typeof jsQR === "undefined") return null;

  const scale = Math.min(1, CONFIG.MAX_SCAN_WIDTH / video.videoWidth);
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(img.data, img.width, img.height, {
    inversionAttempts: "attemptBoth",
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
    return;
  }

  frame.classList.add("found");
  resultText.textContent = code;
  resultBox.classList.add("show");

  if (navigator.vibrate) navigator.vibrate(80);

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

    node.querySelector(".response_next_action span").textContent =
      attendance.next_action;




    if (type === "ENTRY") {
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
      const incomplete =
        CONFIG.getCondition(attendance) === CONFIG.INCOMPLETE_VALUE;
      label.textContent = CONFIG.TEXTS.conditionLabel;
      value.textContent = incomplete
        ? CONFIG.TEXTS.incomplete
        : CONFIG.TEXTS.completed;
      value.style.color = incomplete ? "#ffb347" : "#2fce8f";
      lateRow.remove();
    } else {
      punctRow.remove();
      lateRow.remove();
    }
  } else {
    details.remove();
  }

  container.replaceChildren(node);
}

/* =========================================================
    ENVÍO AL BACKEND (PHP)
    ========================================================= */
let pending = null;

function requestIdFor(code, type) {
  if (!(pending && pending.code === code && pending.type === type)) {
    pending = { code, type, id: uuid() };
  }
  return pending.id;
}

async function markAttendance(employeeCode, type) {
  let res;
  try {
    res = await fetch(CONFIG.API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        employee_code: employeeCode,
        type: type,
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

async function registerCode(code) {
  const type = typeSelect.value;

  toggleBtn.disabled = true;
  toggleBtn.textContent = CONFIG.TEXTS.loading;

  try {
    const { res, body } = await markAttendance(code, type);
    pending = null;

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

document.addEventListener("visibilitychange", () => {
  if (document.hidden && scanning) {
    stopScanner();
    toggleBtn.textContent = CONFIG.TEXTS.start;
  }
});