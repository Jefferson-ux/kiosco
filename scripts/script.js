const CONFIG = {
  // Cambia esto por el endpoint real de tu API (por ejemplo tu
  // controlador ASP.NET MVC) que recibirá la foto capturada.
  API_ENDPOINT: "", // ej: 'https://tuservidor.com/api/Asistencia/Registrar'
  // Cuántos frames seguidos con rostro detectado antes de disparar la foto
  FRAMES_TO_CONFIRM: 6,
  // Intervalo entre análisis de frames (ms)
  DETECTION_INTERVAL: 180,
  // CDN de face-api.js (cacheado por el service worker para uso offline)
  FACEAPI_SCRIPT:
    "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js",
  MODEL_URL:
    "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights",

  TIMEZONE:
    "America/Lima",
};



/* =========================================================
   ELEMENTOS
   ========================================================= */
const startBtn = document.getElementById("startBtn");
const camPlaceholder = document.getElementById("camPlaceholder");
const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const camStatus = document.getElementById("camStatus");
const camDot = document.getElementById("camDot");
const camStatusText = document.getElementById("camStatusText");
const flash = document.getElementById("flash");
const resultCard = document.getElementById("resultCard");
const resultPhoto = document.getElementById("resultPhoto");
const resultTime = document.getElementById("resultTime");
const liveRegion = document.getElementById("liveRegion");

let stream = null;
let modelsReady = false;
let detecting = false;
let confirmedFrames = 0;
let detectionTimer = null;

function announce(msg) {
  liveRegion.textContent = msg;
}

/* =========================================================
   CARGA DE face-api.js Y MODELOS (bajo demanda)
   ========================================================= */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function ensureModels() {
  if (modelsReady) return;
  await loadScript(CONFIG.FACEAPI_SCRIPT);
  await faceapi.nets.tinyFaceDetector.loadFromUri(CONFIG.MODEL_URL);
  modelsReady = true;
}

/* =========================================================
   FLUJO PRINCIPAL
   ========================================================= */
startBtn.addEventListener("click", startSession);



async function startSession() {
  resultCard.classList.remove("show");
  startBtn.disabled = true;
  startBtn.textContent = "Preparando cámara…";

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
      audio: false,
    });
  } catch (err) {
    startBtn.disabled = false;
    startBtn.textContent = "Presiona para iniciar";
    announce("No se pudo acceder a la cámara.");
    alert("No se pudo acceder a la cámara. Revisa los permisos del navegador.");
    return;
  }

  video.srcObject = stream;
  camPlaceholder.style.display = "none";
  video.style.display = "block";
  overlay.style.display = "block";
  camStatus.classList.add("show");
  camDot.className = "dot searching";
  camStatusText.textContent = "Cargando reconocimiento facial…";

  try {
    await ensureModels();
  } catch (err) {
    camStatusText.textContent = "No se pudo cargar el modelo facial";
    stopCamera();
    startBtn.disabled = false;
    startBtn.textContent = "Presiona para iniciar";
    return;
  }

  camStatusText.textContent = "Buscando rostro…";
  startBtn.textContent = "Cancelar";
  startBtn.disabled = false;
  startBtn.onclick = cancelSession;

  confirmedFrames = 0;
  detecting = true;
  runDetectionLoop();
}

function cancelSession() {
  stopCamera();
  startBtn.textContent = "Presiona para iniciar";
  startBtn.onclick = startSession;
}

function stopCamera() {
  detecting = false;
  clearTimeout(detectionTimer);
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  video.style.display = "none";
  overlay.style.display = "none";
  camPlaceholder.style.display = "flex";
  camStatus.classList.remove("show");
}

async function runDetectionLoop() {
  if (!detecting) return;

  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 224,
    scoreThreshold: 0.5,
  });
  const detection = await faceapi.detectSingleFace(video, options);

  const ctx = overlay.getContext("2d");
  overlay.width = video.clientWidth;
  overlay.height = video.clientHeight;
  ctx.clearRect(0, 0, overlay.width, overlay.height);

  if (detection) {
    confirmedFrames++;
    camDot.className = "dot found";
    camStatusText.textContent = `Rostro detectado (${confirmedFrames}/${CONFIG.FRAMES_TO_CONFIRM})`;

    const scale = {
      x: overlay.width / video.videoWidth,
      y: overlay.height / video.videoHeight,
    };
    const b = detection.box;
    ctx.strokeStyle = "#2fce8f";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      overlay.width - (b.x + b.width) * scale.x, // espejado
      b.y * scale.y,
      b.width * scale.x,
      b.height * scale.y,
    );

    if (confirmedFrames >= CONFIG.FRAMES_TO_CONFIRM) {
      detecting = false;
      capturePhoto();
      return;
    }
  } else {
    confirmedFrames = 0;
    camDot.className = "dot searching";
    camStatusText.textContent = "Buscando rostro…";
  }

  detectionTimer = setTimeout(runDetectionLoop, CONFIG.DETECTION_INTERVAL);
}

function capturePhoto() {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  // espejar para que la foto se vea igual que en pantalla
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

  flash.classList.add("fire");
  setTimeout(() => flash.classList.remove("fire"), 350);

  stopCamera();
  showResult(dataUrl);
  sendToServer(dataUrl);
}

function showResult(dataUrl) {
  resultPhoto.src = dataUrl;
  const now = new Date();
  resultTime.textContent = `Hoy ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} · ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  resultCard.classList.add("show");
  announce("Foto capturada. Asistencia registrada.");

  startBtn.textContent = "Presiona para iniciar";
  startBtn.onclick = startSession;

  setTimeout(() => resultCard.classList.remove("show"), 4000);
}

/* =========================================================
   ENVÍO AL BACKEND (opcional — configura CONFIG.API_ENDPOINT)
   ========================================================= */
async function sendToServer(dataUrl) {
  if (!CONFIG.API_ENDPOINT) return; // no configurado aún
  try {
    await fetch(CONFIG.API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foto: dataUrl, fecha: new Date().toISOString() }),
    });
  } catch (err) {
    console.error("No se pudo enviar la asistencia al servidor:", err);
  }
}

/* =========================================================
   PWA — registro del service worker
   ========================================================= */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")
      .catch((err) => console.error("SW error:", err));
  });
}
