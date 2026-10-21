/* =========================================================
   CONFIGURACIÓN: lo único que normalmente debes editar
   ========================================================= */

get_token

get('token')


const CONFIG = {
  // URL de la API para marcar
  API_URL: localStorage.getItem('bearer token'),

  // Token de acceso (sin la palabra "Bearer"). Cámbialo cuando expire.
  TOKEN: "2|KKb8Rzt7WXhVPOjdffabWiTK1Zhm4z0l27vUui7g92ca641d",

  // Zona horaria e idioma para mostrar fechas
  TIMEZONE: "America/Lima",
  LOCALE: "es-PE",

  // Textos de la interfaz
  TEXTS: {
    loading: "Registrando…",
    submit: "Registrar",
    emptyCode: "Ingresa tu código de empleado.",
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

  // ----- Salida (EXIT) -----
  // La condición de la salida viene en punctuality.status
  getCondition: (attendance) => attendance?.punctuality?.status,
  INCOMPLETE_VALUE: "incomplete",
};

/* =========================================================
   ELEMENTOS DEL DOM
   ========================================================= */
const form = document.getElementById("formulario");
const codeInput = document.getElementById("employee_code_input");
const typeSelect = document.getElementById("type_select");
const submitBtn = form.querySelector("button[type='submit'], button:not([type])");
const container = document.getElementById("response-container");
const template = document.getElementById("response-template");

/* =========================================================
   UTILIDADES
   ========================================================= */
// request_id: se reutiliza si hubo error de red (reintento seguro)
// y se renueva cuando el servidor responde o cambia el formulario.
let pendingRequestId = null;

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
        request_id: pendingRequestId,
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

/* =========================================================
   EVENTOS
   ========================================================= */
form.addEventListener("input", () => {
  pendingRequestId = null;
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const employeeCode = codeInput.value.trim();
  const type = typeSelect.value;

  if (!employeeCode) {
    showResponse({ ok: false, message: CONFIG.TEXTS.emptyCode });
    codeInput.focus();
    return;
  }

  pendingRequestId ??= uuid();
  submitBtn.disabled = true;
  submitBtn.textContent = CONFIG.TEXTS.loading;

  try {
    const { res, body } = await markAttendance(employeeCode, type);

    // El servidor respondió: el request_id ya cumplió su función
    pendingRequestId = null;

    if (res.ok && body?.success) {
      showResponse({ ok: true, message: body.message, data: body.data, type });
      codeInput.value = "";
      codeInput.focus();
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
    submitBtn.disabled = false;
    submitBtn.textContent = CONFIG.TEXTS.submit;
  }
});
