/* =========================================================
    CONFIGURACIÓN
    ========================================================= */
const CONFIG = {
  API_URL: "/backend/mark_attendance.php",

  TEXTS: {
    loading: "Registrando…",
    networkError: "No se pudo conectar con el servidor. Inténtalo de nuevo.",
    internalError: "Error interno de la página. Revisa la consola (F12).",
    genericError: (status) =>
      `Error ${status}: no se pudo registrar la marcación.`,
    conditionLabel: "Condición",
    completed: "Completado",
    incomplete: "Incompleto",
  },
};

/* =========================================================
    ELEMENTOS DEL DOM (Alineados con code.php)
    ========================================================= */
const submitBtn = document.getElementById("submitBtn");
const employeeCodeInput = document.getElementById("employee_code_input");
const typeSelect = document.getElementById("type_select");

const container = document.getElementById("response-container");
const template = document.getElementById("response-template");

let pending = null;

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
    ENVÍO AL BACKEND (PHP)
    ========================================================= */
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

async function handleFormSubmit() {
  const employeeCode = employeeCodeInput?.value.trim();
  const type = typeSelect?.value;

  if (!employeeCode) {
    alert("Por favor, ingresa el código del empleado.");
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = CONFIG.TEXTS.loading;
  }

  try {
    const { res, body } = await markAttendance(employeeCode, type);
    pending = null;

    if (res.ok && body?.success) {
      showResponse({ ok: true, message: body.message, data: body.data, type });
      employeeCodeInput.value = ""; // Limpiar el input tras un éxito opcionalmente
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
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Registrar";
    }
    if (employeeCodeInput) {
      employeeCodeInput.focus();
    }
  }
}

/* =========================================================
    EVENTOS
    ========================================================= */
if (submitBtn) {
  submitBtn.addEventListener("click", handleFormSubmit);
}

// Opcional: Permitir enviar también presionando la tecla "Enter" dentro del input
if (employeeCodeInput) {
  employeeCodeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleFormSubmit();
    }
  });
}